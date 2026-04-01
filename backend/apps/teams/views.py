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
from .models import TeamMember, ReferralLink, ReferralClick
from .serializers import (
    TeamMemberSerializer,
    TeamMemberCreateSerializer,
    ReferralLinkSerializer,
    LeaderboardSerializer,
    PublicReferralClickSerializer,
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
