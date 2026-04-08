import csv
import io

from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

FONT_PATHS = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
]
FONT_REGULAR_PATHS = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/TTF/DejaVuSans.ttf',
]


def _load_font(paths, size):
    from PIL import ImageFont
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default(size=size)

from apps.candidates.models import Candidate
from apps.core.mixins import TenantQuerysetMixin
from apps.core.permissions import IsVolunteer
from .models import Supporter
from .serializers import (
    SupporterSerializer,
    PublicJoinSerializer,
    MembershipCardSerializer,
    SupporterStatsSerializer,
    VolunteerSupporterCreateSerializer,
)


@extend_schema(tags=['supporters'])
class SupporterListView(TenantQuerysetMixin, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupporterSerializer

    def get_queryset(self):
        qs = Supporter.objects.filter(
            tenant=self.request.user.tenant, is_active=True
        )
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nama__icontains=search)
        kecamatan = self.request.query_params.get('kecamatan')
        if kecamatan:
            qs = qs.filter(kecamatan__icontains=kecamatan)
        return qs


@extend_schema(tags=['supporters'])
class SupporterDetailView(TenantQuerysetMixin, generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupporterSerializer

    def get_queryset(self):
        return Supporter.objects.filter(tenant=self.request.user.tenant)


@extend_schema(tags=['supporters'])
class SupporterCardView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MembershipCardSerializer

    def get_queryset(self):
        return Supporter.objects.filter(tenant=self.request.user.tenant)


@extend_schema(tags=['supporters'])
class SupporterCardImageView(APIView):
    """Return a PNG membership card for a supporter."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        supporter = get_object_or_404(Supporter, pk=pk, tenant=request.user.tenant)
        img_bytes = self._generate_card(supporter)
        response = HttpResponse(img_bytes, content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="kartu-{supporter.membership_id}.png"'
        return response

    def _generate_card(self, supporter):
        from PIL import Image, ImageDraw
        import io as _io

        W, H = 860, 540

        try:
            candidate = supporter.tenant.candidate
            color_hex = (candidate.color_primary or '#4F46E5').lstrip('#')
            partai = candidate.partai or ''
            candidate_name = candidate.nama_lengkap or ''
        except Exception:
            color_hex = '4F46E5'
            partai = ''
            candidate_name = ''

        def hex_to_rgb(h):
            return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

        pr, pg, pb = hex_to_rgb(color_hex)

        img = Image.new('RGB', (W, H), (pr, pg, pb))
        draw = ImageDraw.Draw(img)

        # Gradient background (dark bottom)
        for y in range(H):
            t = y / H
            rr = int(pr * (1 - t * 0.35))
            gg = int(pg * (1 - t * 0.35))
            bb = int(pb * (1 - t * 0.35))
            draw.line([(0, y), (W, y)], fill=(rr, gg, bb))

        # Decorative circles (top-right and bottom-left)
        light = (min(255, pr + 60), min(255, pg + 60), min(255, pb + 60))
        draw.ellipse([(W - 220, -140), (W + 100, 180)], fill=light)
        draw.ellipse([(W - 160, -80), (W + 40, 120)], fill=(min(255, pr+90), min(255, pg+90), min(255, pb+90)))
        draw.ellipse([(-100, H - 160), (160, H + 80)], fill=light)

        # Fonts
        f_large = _load_font(FONT_PATHS, 48)
        f_med = _load_font(FONT_REGULAR_PATHS, 26)
        f_small = _load_font(FONT_REGULAR_PATHS, 20)
        f_tiny = _load_font(FONT_REGULAR_PATHS, 16)

        white = (255, 255, 255)
        silver = (200, 210, 225)

        # Header label
        draw.text((50, 38), 'KARTU ANGGOTA PENDUKUNG', font=f_tiny, fill=silver)
        draw.text((50, 60), partai.upper() or 'KAMPANYEKIT', font=f_med, fill=white)

        # Thin divider
        draw.line([(50, 110), (W - 50, 110)], fill=(255, 255, 255), width=1)

        # "Mendukung" label + candidate name
        draw.text((50, 124), 'Mendukung:', font=f_tiny, fill=silver)
        draw.text((50, 144), candidate_name, font=f_small, fill=white)

        # Supporter name — big
        # Truncate if too long
        nama = supporter.nama if len(supporter.nama) <= 26 else supporter.nama[:24] + '…'
        draw.text((50, 220), nama, font=f_large, fill=white)

        # Location
        loc = f'{supporter.kelurahan}, {supporter.kecamatan}'
        draw.text((50, 288), loc, font=f_med, fill=silver)

        # Bottom bar
        draw.rectangle([(0, H - 100), (W, H)], fill=(0, 0, 0))

        draw.text((50, H - 88), 'ID ANGGOTA', font=f_tiny, fill=(130, 140, 155))
        draw.text((50, H - 66), supporter.membership_id, font=f_med, fill=white)

        joined = supporter.created_at.strftime('%d %b %Y')
        draw.text((W - 220, H - 88), 'TERDAFTAR', font=f_tiny, fill=(130, 140, 155))
        draw.text((W - 220, H - 66), joined, font=f_med, fill=white)

        # Watermark
        draw.text((W - 160, 40), 'KampanyeKit', font=f_tiny, fill=light)

        buf = _io.BytesIO()
        img.save(buf, 'PNG', optimize=True)
        buf.seek(0)
        return buf.getvalue()


@extend_schema(tags=['supporters'])
class SupporterStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        qs = Supporter.objects.filter(tenant=tenant, is_active=True)
        total = qs.count()
        by_kelurahan = list(
            qs.values('kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi')
            .annotate(count=Count('id')).order_by('-count')
        )
        by_kecamatan = list(
            qs.values('kecamatan').annotate(count=Count('id')).order_by('-count')
        )
        by_kabupaten = list(
            qs.values('kabupaten_kota').annotate(count=Count('id')).order_by('-count')
        )
        by_provinsi = list(
            qs.values('provinsi').annotate(count=Count('id')).order_by('-count')
        )
        return Response({
            'total': total,
            'by_kelurahan': by_kelurahan,
            'by_kecamatan': by_kecamatan,
            'by_kabupaten': by_kabupaten,
            'by_provinsi': by_provinsi,
        })


@extend_schema(tags=['supporters'])
class SupporterExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Supporter.objects.filter(
            tenant=request.user.tenant, is_active=True
        ).select_related('referred_by_team')

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Nama', 'Phone', 'Email', 'Kelurahan', 'Kecamatan',
            'Kabupaten/Kota', 'Provinsi', 'Membership ID',
            'Direferensikan Oleh', 'Tanggal Daftar',
        ])
        for s in qs:
            writer.writerow([
                s.nama, s.phone, s.email or '',
                s.kelurahan, s.kecamatan, s.kabupaten_kota, s.provinsi,
                s.membership_id,
                s.referred_by_team.nama if s.referred_by_team else '',
                s.created_at.strftime('%Y-%m-%d'),
            ])

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pendukung.csv"'
        return response


@extend_schema(tags=['supporters'])
class PledgeWallView(APIView):
    """Admin: list supporters with statements pending/approved moderation."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        verified = request.query_params.get('verified')
        qs = Supporter.objects.filter(
            tenant=request.user.tenant, is_active=True
        ).exclude(statement__isnull=True).exclude(statement='')
        if verified == 'true':
            qs = qs.filter(is_verified=True)
        elif verified == 'false':
            qs = qs.filter(is_verified=False)
        from .serializers import SupporterSerializer
        return Response(SupporterSerializer(qs, many=True, context={'request': request}).data)

    def patch(self, request, pk):
        """Approve or reject a supporter's statement."""
        supporter = get_object_or_404(
            Supporter, pk=pk, tenant=request.user.tenant
        )
        is_verified = request.data.get('is_verified')
        if is_verified is not None:
            supporter.is_verified = bool(is_verified)
            supporter.save(update_fields=['is_verified'])
        from .serializers import SupporterSerializer
        return Response(SupporterSerializer(supporter, context={'request': request}).data)


@extend_schema(tags=['public'])
class PublicPledgeWallView(APIView):
    """Public: approved supporter statements for the campaign page."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        candidate = get_object_or_404(Candidate, tenant__slug=slug)
        qs = Supporter.objects.filter(
            tenant=candidate.tenant, is_active=True, is_verified=True
        ).exclude(statement__isnull=True).exclude(statement='').order_by('-created_at')[:50]
        data = [
            {
                'nama': s.nama,
                'kecamatan': s.kecamatan,
                'kabupaten_kota': s.kabupaten_kota,
                'statement': s.statement,
                'created_at': s.created_at,
            }
            for s in qs
        ]
        return Response(data)


@extend_schema(tags=['public'])
class PublicJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        candidate = get_object_or_404(Candidate, tenant__slug=slug)
        tenant = candidate.tenant
        serializer = PublicJoinSerializer(
            data=request.data,
            context={'tenant': tenant, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        supporter = serializer.save()
        return Response(
            MembershipCardSerializer(supporter).data,
            status=status.HTTP_201_CREATED,
        )


# --------------- Volunteer Field Recruitment ---------------

@extend_schema(tags=['volunteer-supporters'])
class VolunteerSupporterCreateView(APIView):
    """Volunteer: manually register a supporter found in the field."""
    permission_classes = [IsVolunteer]

    def post(self, request):
        member = request.user.team_member
        serializer = VolunteerSupporterCreateSerializer(
            data=request.data,
            context={'tenant': request.user.tenant, 'volunteer': member},
        )
        serializer.is_valid(raise_exception=True)
        supporter = serializer.save()
        data = MembershipCardSerializer(supporter).data
        if getattr(supporter, '_is_duplicate', False):
            data['warning'] = 'Nomor HP sudah terdaftar sebelumnya. Data tetap disimpan.'
        return Response(data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['volunteer-supporters'])
class VolunteerSupporterSummaryView(APIView):
    """Volunteer: summary of own recruitment stats."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        from django.db.models import Count
        from django.utils import timezone
        member = request.user.team_member
        qs = Supporter.objects.filter(
            tenant=request.user.tenant, referred_by_team=member, is_active=True
        )
        today = timezone.now().date()
        total = qs.count()
        today_count = qs.filter(created_at__date=today).count()
        by_kecamatan = list(
            qs.values('kecamatan').annotate(count=Count('id')).order_by('-count')[:10]
        )
        # Points from supporter recruitment
        from django.db.models import Sum as DjSum
        from apps.teams.models import PointTransaction
        pts = PointTransaction.objects.filter(
            team_member=member,
            action_type__in=['manual_supporter', 'link_supporter'],
        ).aggregate(total=DjSum('points'))['total'] or 0

        return Response({
            'total': total,
            'today': today_count,
            'by_kecamatan': by_kecamatan,
            'points_from_supporters': pts,
        })
