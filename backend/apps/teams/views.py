import hashlib
from datetime import date

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.mixins import TenantQuerysetMixin
from .models import TeamMember, ReferralLink, ReferralClick, Task, Announcement
from .serializers import (
    TeamMemberSerializer,
    TeamMemberCreateSerializer,
    ReferralLinkSerializer,
    LeaderboardSerializer,
    PublicReferralClickSerializer,
    TaskSerializer,
    TaskCreateSerializer,
    TaskUpdateSerializer,
    AnnouncementSerializer,
)


@extend_schema(tags=['teams'])
class TeamMemberViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TeamMember.objects.filter(
            tenant=self.request.user.tenant
        ).prefetch_related('referral_links')

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
        members = (
            TeamMember.objects
            .filter(tenant=self.request.user.tenant, is_active=True)
            .prefetch_related('referral_links')
        )
        return sorted(
            members,
            key=lambda m: sum(l.clicks for l in m.referral_links.all()),
            reverse=True
        )[:20]


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
class AnnouncementListCreateView(APIView):
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
class AnnouncementDetailView(APIView):
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
