import hashlib
from datetime import date

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.accounts.models import Tenant, User
from apps.accounts.whatsapp import normalize_phone, notify, notify_tenant_admins
from apps.core.feature_flags import FeatureGatedMixin
from apps.core.mixins import TenantQuerysetMixin
from apps.core.permissions import IsVolunteer
from apps.core.public_guard import client_ip, make_ip_hash, throttle, verify_captcha
from apps.core.rbac import wilayah_filter, IsTimsesStaff
from apps.core.tenancy import active_tenant
from .models import TeamMember, ReferralLink, ReferralClick, Task, TaskAssignment, Announcement, PointRule, PointTransaction
from .points import award_points
from .serializers import (
    TeamMemberSerializer,
    TeamMemberCreateSerializer,
    ReferralLinkSerializer,
    LeaderboardSerializer,
    PublicReferralClickSerializer,
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    TaskPoolSerializer,
    TaskAssignmentSerializer,
    AnnouncementSerializer,
    PointRuleSerializer,
    PointTransactionSerializer,
    RelawanRegisterSerializer,
    RelawanRequestSerializer,
)


# ── Relawan onboarding + approval queue ───────────────────────────────────────

@extend_schema(tags=['public'])
class PublicRelawanRegisterView(APIView):
    """Public: self-register as a relawan on a candidate's web profile.

    Creates the relawan's User (role=relawan, scoped to the tenant) and a
    level-4 TeamMember. Honours the tenant's relawan_auto_approve setting —
    pending (default) or active. Rate-limited + CAPTCHA-guarded.
    """
    permission_classes = [AllowAny]

    def post(self, request, slug):
        tenant = get_object_or_404(Tenant, slug=slug, is_active=True)

        ip = client_ip(request)
        if throttle('relawan-register', f"{tenant.id}:{make_ip_hash(ip)}", limit=5, window_seconds=3600):
            return Response({'detail': 'Terlalu banyak pendaftaran. Coba lagi dalam 1 jam.'},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)
        if not verify_captcha(request.data.get('captcha_token', ''), ip):
            return Response({'detail': 'Verifikasi CAPTCHA gagal.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RelawanRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        phone = normalize_phone(d['phone'])

        if TeamMember.objects.filter(tenant=tenant, phone=phone).exists():
            return Response(
                {'detail': 'Nomor HP sudah terdaftar. Silakan login atau hubungi tim kampanye.'},
                status=status.HTTP_409_CONFLICT,
            )

        auto = tenant.relawan_auto_approve
        username = f'relawan_{tenant.slug}_{phone}'[:150]
        user = User.objects.filter(username=username).first()
        if user is None:
            import secrets
            user = User.objects.create_user(
                username=username, phone=phone, role='volunteer',
                tenant=tenant, agency=tenant.agency,
                is_active=auto, password=secrets.token_urlsafe(16),
            )

        member = TeamMember.objects.create(
            tenant=tenant, user=user, level=4, nama=d['nama'], phone=phone,
            email=d.get('email', ''), wilayah_name=d['kelurahan'], wilayah_level='kelurahan',
            kecamatan=d['kecamatan'], kabupaten_kota=d.get('kabupaten_kota', ''),
            alasan_bergabung=d.get('alasan_bergabung', ''),
            referred_by_code=d.get('referral_code', ''),
            source='self_registration',
            status='active' if auto else 'pending', is_active=auto,
        )
        if auto:
            award_points(member, 'register', description='Registrasi relawan')

        notify_tenant_admins(
            tenant,
            f"Relawan baru: {member.nama} dari {member.kecamatan or member.wilayah_name}"
            + ("" if auto else " menunggu persetujuan."),
        )
        msg = ('Pendaftaran berhasil! Akun Anda telah aktif.' if auto
               else 'Pendaftaran berhasil! Menunggu persetujuan tim kampanye.')
        return Response({'detail': msg, 'status': member.status}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['teams'])
class RelawanRequestListView(APIView):
    """Admin: list pending relawan registrations (wilayah-scoped)."""
    permission_classes = [IsAuthenticated, IsTimsesStaff]

    def get(self, request):
        tenant = active_tenant(request)
        qs = TeamMember.objects.filter(tenant=tenant, status='pending').filter(
            wilayah_filter(request.user, fields=('wilayah_name', 'kecamatan', 'kabupaten_kota'))
        )
        return Response(RelawanRequestSerializer(qs, many=True).data)


@extend_schema(tags=['teams'])
class RelawanRequestApproveView(APIView):
    """Admin: approve a pending relawan → active + login enabled + points."""
    permission_classes = [IsAuthenticated, IsTimsesStaff]

    def post(self, request, pk):
        tenant = active_tenant(request)
        member = get_object_or_404(TeamMember, pk=pk, tenant=tenant)
        member.status = 'active'
        member.is_active = True
        member.save(update_fields=['status', 'is_active'])
        if member.user:
            member.user.is_active = True
            member.user.save(update_fields=['is_active'])
        award_points(member, 'register', description='Registrasi relawan (disetujui)')
        notify(member.phone, f"Selamat {member.nama}! Pendaftaran relawan Anda disetujui. Silakan login.")
        return Response(RelawanRequestSerializer(member).data)


@extend_schema(tags=['teams'])
class RelawanRequestRejectView(APIView):
    """Admin: reject a pending relawan registration."""
    permission_classes = [IsAuthenticated, IsTimsesStaff]

    def post(self, request, pk):
        tenant = active_tenant(request)
        member = get_object_or_404(TeamMember, pk=pk, tenant=tenant)
        member.status = 'rejected'
        member.is_active = False
        member.rejection_reason = request.data.get('rejection_reason', '')
        member.save(update_fields=['status', 'is_active', 'rejection_reason'])
        if member.user:
            member.user.is_active = False
            member.user.save(update_fields=['is_active'])
        reason = member.rejection_reason or ''
        notify(member.phone, f"Mohon maaf, pendaftaran relawan Anda belum dapat diproses. {reason}".strip())
        return Response(RelawanRequestSerializer(member).data)


@extend_schema(tags=['teams'])
class TeamMemberViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TeamMember.objects.filter(
            tenant=active_tenant(self.request)
        ).filter(wilayah_filter(
            self.request.user, fields=('wilayah_name',)
        )).prefetch_related('referral_links')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TeamMemberCreateSerializer
        return TeamMemberSerializer

    def perform_create(self, serializer):
        serializer.save()

    @extend_schema(summary='Get referral links for a team member')
    @action(detail=True, methods=['get', 'post'], url_path='referrals')
    def referrals(self, request, pk=None):
        member = self.get_object()
        if request.method == 'POST':
            label = request.data.get('label', '')
            link = ReferralLink.objects.create(team_member=member, label=label)
            return Response(ReferralLinkSerializer(link).data, status=status.HTTP_201_CREATED)
        links = member.referral_links.all()
        return Response(ReferralLinkSerializer(links, many=True).data)

    @extend_schema(summary="Set/reset a relawan's login password (admin-issued, replaces OTP)")
    @action(detail=True, methods=['post'], url_path='set-password')
    def set_password(self, request, pk=None):
        if request.user.role not in ('candidate', 'admin', 'superadmin'):
            return Response({'detail': 'Tidak diizinkan.'}, status=status.HTTP_403_FORBIDDEN)
        import secrets
        from apps.accounts.models import User

        member = self.get_object()
        tenant = active_tenant(request)
        password = (request.data.get('password') or '').strip() or secrets.token_urlsafe(6)

        user = member.user
        if user is None:
            username = f'relawan_{tenant.slug}_{member.phone}'[:150]
            user = User.objects.filter(username=username).first()
            if user is None:
                user = User.objects.create_user(
                    username=username, phone=member.phone, role='volunteer',
                    tenant=tenant, agency=tenant.agency, is_active=True,
                )
            member.user = user
            member.status = 'active'
            member.is_active = True
            member.save(update_fields=['user', 'status', 'is_active'])

        user.set_password(password)
        user.is_active = True
        user.role = 'volunteer'
        user.save()
        # Returned once so the admin/candidate can hand the credentials over.
        return Response({'username': user.username, 'phone': member.phone, 'password': password})


@extend_schema(tags=['teams'])
class ReferralListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReferralLinkSerializer

    def get_queryset(self):
        return ReferralLink.objects.filter(
            team_member__tenant=self.request.user.tenant
        ).select_related('team_member')


@extend_schema(tags=['teams'])
class LeaderboardView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LeaderboardSerializer

    def get_queryset(self):
        return (
            TeamMember.objects
            .filter(tenant=self.request.user.tenant, is_active=True)
            .prefetch_related('referral_links')
            .order_by('-total_points')[:20]
        )


@extend_schema(tags=['public'])
class PublicReferralClickView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, code):
        link = get_object_or_404(ReferralLink, code=code)
        serializer = PublicReferralClickSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Hash the IP for privacy (UU PDP compliance)
        ip = request.META.get('REMOTE_ADDR', '')
        ip_hash = hashlib.sha256(
            f"{ip}{date.today().isoformat()}".encode()
        ).hexdigest()

        # Check for duplicate in today's session
        already_clicked = ReferralClick.objects.filter(
            referral_link=link,
            ip_hash=ip_hash,
        ).exists()

        ReferralClick.objects.create(
            referral_link=link,
            ip_hash=ip_hash,
            user_agent=serializer.validated_data.get('user_agent', ''),
        )

        link.clicks += 1
        if not already_clicked:
            link.unique_visitors += 1
        link.last_clicked_at = timezone.now()
        link.save(update_fields=['clicks', 'unique_visitors', 'last_clicked_at'])

        return Response({'status': 'recorded'}, status=status.HTTP_200_OK)


@extend_schema(tags=['tasks'])
class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Task.objects.filter(tenant=request.user.tenant).select_related('assigned_to', 'assigned_by')
        status_filter = request.query_params.get('status')
        assigned_to = request.query_params.get('assigned_to')
        prioritas = request.query_params.get('prioritas')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if assigned_to:
            qs = qs.filter(assigned_to=assigned_to)
        if prioritas:
            qs = qs.filter(prioritas=prioritas)
        return Response(TaskSerializer(qs, many=True).data)

    def post(self, request):
        serializer = TaskCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['tasks'])
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_task(self, request, pk):
        return get_object_or_404(Task, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        return Response(TaskSerializer(self._get_task(request, pk)).data)

    def patch(self, request, pk):
        task = self._get_task(request, pk)
        serializer = TaskUpdateSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        self._get_task(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['tasks'])
class TaskStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count
        from django.utils import timezone
        tenant = request.user.tenant
        qs = Task.objects.filter(tenant=tenant)
        today = timezone.now().date()
        return Response({
            'total': qs.count(),
            'assigned': qs.filter(status='assigned').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'done': qs.filter(status='done').count(),
            'overdue': qs.filter(status__in=['assigned', 'in_progress'], deadline__lt=today).count(),
        })


@extend_schema(tags=['announcements'])
class AnnouncementListCreateView(FeatureGatedMixin, APIView):
    feature_flag = 'announcements'
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Announcement.objects.filter(tenant=request.user.tenant)
        return Response(AnnouncementSerializer(qs, many=True).data)

    def post(self, request):
        serializer = AnnouncementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ann = serializer.save(tenant=request.user.tenant, author=request.user)
        return Response(AnnouncementSerializer(ann).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['announcements'])
class AnnouncementDetailView(FeatureGatedMixin, APIView):
    feature_flag = 'announcements'
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(Announcement, pk=pk, tenant=request.user.tenant)

    def patch(self, request, pk):
        ann = self._get(request, pk)
        serializer = AnnouncementSerializer(ann, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(AnnouncementSerializer(serializer.save()).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------- Points & Rewards ---------------

@extend_schema(tags=['points'])
class PointRuleListView(APIView):
    """Admin: list and bulk-update point rules for the tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .points import seed_default_rules
        # Auto-seed if tenant has no rules yet
        if not PointRule.objects.filter(tenant=request.user.tenant).exists():
            seed_default_rules(request.user.tenant)
        rules = PointRule.objects.filter(tenant=request.user.tenant)
        return Response(PointRuleSerializer(rules, many=True).data)


@extend_schema(tags=['points'])
class PointRuleUpdateView(APIView):
    """Admin: update a single point rule by action_type."""
    permission_classes = [IsAuthenticated]

    def put(self, request, action_type):
        rule = get_object_or_404(PointRule, tenant=request.user.tenant, action_type=action_type)
        serializer = PointRuleSerializer(rule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@extend_schema(tags=['points'])
class PointTransactionListView(APIView):
    """Admin: list all point transactions for the tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PointTransaction.objects.filter(
            tenant=request.user.tenant
        ).select_related('team_member')
        member_id = request.query_params.get('team_member')
        if member_id:
            qs = qs.filter(team_member_id=member_id)
        return Response(PointTransactionSerializer(qs[:100], many=True).data)


@extend_schema(tags=['points'])
class VolunteerPointsView(APIView):
    """Volunteer: view own point history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        member = getattr(request.user, 'team_member', None)
        if not member:
            return Response({'detail': 'Not a team member.'}, status=status.HTTP_403_FORBIDDEN)
        txns = PointTransaction.objects.filter(team_member=member).order_by('-created_at')[:50]
        return Response({
            'total_points': member.total_points,
            'transactions': PointTransactionSerializer(txns, many=True).data,
        })


# --------------- Volunteer Task Pool ---------------

@extend_schema(tags=['volunteer-tasks'])
class VolunteerTaskPoolView(APIView):
    """Browse available pool tasks (not full, not past deadline)."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        today = timezone.now().date()
        qs = Task.objects.filter(
            tenant=request.user.tenant, is_pool=True,
        ).exclude(deadline__lt=today)
        kategori = request.query_params.get('kategori')
        if kategori:
            qs = qs.filter(kategori=kategori)
        wilayah = request.query_params.get('wilayah')
        if wilayah:
            qs = qs.filter(Q(wilayah='') | Q(wilayah__icontains=wilayah))
        tasks = [t for t in qs.order_by('deadline', '-created_at') if not t.is_full]
        return Response(TaskPoolSerializer(tasks, many=True).data)


@extend_schema(tags=['volunteer-tasks'])
class VolunteerTaskAssignView(APIView):
    """Volunteer self-assigns to a pool task."""
    permission_classes = [IsVolunteer]

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk, tenant=request.user.tenant, is_pool=True)
        member = request.user.team_member

        if task.is_full:
            return Response({'detail': 'Tugas sudah penuh.'}, status=status.HTTP_400_BAD_REQUEST)
        if task.deadline and task.deadline < timezone.now().date():
            return Response({'detail': 'Deadline sudah lewat.'}, status=status.HTTP_400_BAD_REQUEST)
        if TaskAssignment.objects.filter(task=task, volunteer=member).exists():
            return Response({'detail': 'Anda sudah mengambil tugas ini.'}, status=status.HTTP_400_BAD_REQUEST)

        assignment = TaskAssignment.objects.create(task=task, volunteer=member)
        return Response(TaskAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['volunteer-tasks'])
class VolunteerMyAssignmentsView(APIView):
    """Volunteer views own task assignments."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        qs = TaskAssignment.objects.filter(
            volunteer=request.user.team_member
        ).select_related('task')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(TaskAssignmentSerializer(qs, many=True).data)


@extend_schema(tags=['volunteer-tasks'])
class VolunteerTaskCompleteView(APIView):
    """Volunteer submits evidence to complete a task assignment."""
    permission_classes = [IsVolunteer]

    def patch(self, request, pk):
        assignment = get_object_or_404(
            TaskAssignment, pk=pk, volunteer=request.user.team_member
        )
        if assignment.status != 'in_progress':
            return Response({'detail': 'Tugas tidak dalam status dikerjakan.'}, status=status.HTTP_400_BAD_REQUEST)

        assignment.evidence_notes = request.data.get('evidence_notes', '')
        if 'evidence_photo' in request.FILES:
            assignment.evidence_photo = request.FILES['evidence_photo']
        assignment.status = 'completed'
        assignment.completed_at = timezone.now()
        assignment.save()
        return Response(TaskAssignmentSerializer(assignment).data)


@extend_schema(tags=['volunteer-tasks'])
class AdminTaskAssignmentApproveView(APIView):
    """Admin approves a completed task assignment, awarding points."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        assignment = get_object_or_404(
            TaskAssignment, pk=pk, task__tenant=request.user.tenant
        )
        if assignment.status != 'completed':
            return Response({'detail': 'Tugas belum diselesaikan oleh relawan.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action', 'approve')
        if action == 'reject':
            assignment.status = 'rejected'
            assignment.save(update_fields=['status'])
            notify(assignment.volunteer.phone,
                   f"Tugas \"{assignment.task.judul}\" belum dapat diverifikasi. Silakan ulangi.")
            return Response(TaskAssignmentSerializer(assignment).data)

        assignment.approved_by = request.user
        assignment.approved_at = timezone.now()
        assignment.save(update_fields=['approved_by', 'approved_at'])

        # Award points
        from .points import award_points
        if assignment.task.poin_reward > 0:
            from .points import award_custom_points
            award_custom_points(
                assignment.volunteer,
                assignment.task.poin_reward,
                'task_complete',
                description=f'Selesai tugas: {assignment.task.judul}',
                reference_id=assignment.task.pk,
                reference_type='task',
            )
        else:
            award_points(
                assignment.volunteer,
                'task_complete',
                description=f'Selesai tugas: {assignment.task.judul}',
                reference_id=assignment.task.pk,
                reference_type='task',
            )

        notify(assignment.volunteer.phone,
               f"Tugas \"{assignment.task.judul}\" Anda telah diverifikasi! "
               f"+{assignment.task.poin_reward or 'beberapa'} poin ditambahkan.")
        return Response(TaskAssignmentSerializer(assignment).data)


# --------------- Volunteer Overview ---------------

@extend_schema(tags=['volunteer'])
class VolunteerOverviewView(APIView):
    """Volunteer dashboard: aggregated widget data in a single call."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        member = request.user.team_member

        total_points = member.total_points

        active_tasks = TaskAssignment.objects.filter(
            volunteer=member, status='in_progress'
        ).count()

        from apps.supporters.models import Supporter
        now = timezone.now()
        supporters_this_month = Supporter.objects.filter(
            referred_by_team=member,
            created_at__year=now.year, created_at__month=now.month,
        ).count()

        from apps.content.models import ContentShare
        shares_this_month = ContentShare.objects.filter(
            volunteer=member,
            created_at__year=now.year, created_at__month=now.month,
        ).count()

        rank = TeamMember.objects.filter(
            tenant=request.user.tenant, is_active=True,
            total_points__gt=member.total_points,
        ).count() + 1

        announcements = Announcement.objects.filter(
            tenant=request.user.tenant,
            min_level__gte=member.level,
        )[:5]

        return Response({
            'total_points': total_points,
            'active_tasks': active_tasks,
            'supporters_this_month': supporters_this_month,
            'shares_this_month': shares_this_month,
            'leaderboard_rank': rank,
            'announcements': AnnouncementSerializer(announcements, many=True).data,
        })


@extend_schema(tags=['public'])
class PublicVolunteerStatsView(APIView):
    """Public: volunteer count and top volunteers for a candidate."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from apps.accounts.models import Tenant
        tenant = get_object_or_404(Tenant, slug=slug)
        volunteer_count = TeamMember.objects.filter(
            tenant=tenant, is_active=True, level=4
        ).count()
        top_volunteers = list(
            TeamMember.objects.filter(tenant=tenant, is_active=True, level=4)
            .order_by('-total_points')[:3]
            .values('nama', 'total_points', 'wilayah_name')
        )
        return Response({
            'volunteer_count': volunteer_count,
            'top_volunteers': top_volunteers,
        })
