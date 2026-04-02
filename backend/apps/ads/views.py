from datetime import date
from decimal import Decimal

from django.db.models import Sum, Max
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.mixins import TenantQuerysetMixin
from .models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation
from .serializers import (
    AdsAccountSerializer,
    ConnectAdsAccountSerializer,
    AdsCampaignSnapshotSerializer,
    BudgetAllocationSerializer,
    AdsDashboardSerializer,
)


@extend_schema(tags=['ads'])
class AdsAccountListView(TenantQuerysetMixin, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AdsAccountSerializer

    def get_queryset(self):
        return AdsAccount.objects.filter(tenant=self.request.user.tenant, is_active=True)


@extend_schema(tags=['ads'])
class ConnectAdsAccountView(APIView):
    """
    Connect a Meta or TikTok ads account.
    In production this would complete an OAuth flow; here we accept
    the credentials directly (useful for manual/API-key connections).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConnectAdsAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        account, created = AdsAccount.objects.update_or_create(
            tenant=request.user.tenant,
            platform=d['platform'],
            account_id=d['account_id'],
            defaults={
                'account_name': d['account_name'],
                'access_token': d.get('access_token', ''),
                'refresh_token': d.get('refresh_token', ''),
                'is_active': True,
            },
        )
        return Response(
            AdsAccountSerializer(account).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


@extend_schema(tags=['ads'])
class DisconnectAdsAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            account = AdsAccount.objects.get(pk=pk, tenant=request.user.tenant)
            account.is_active = False
            account.save(update_fields=['is_active'])
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AdsAccount.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


@extend_schema(tags=['ads'])
class AdsCampaignListView(TenantQuerysetMixin, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AdsCampaignSnapshotSerializer

    def get_queryset(self):
        qs = AdsCampaignSnapshot.objects.filter(tenant=self.request.user.tenant)
        platform = self.request.query_params.get('platform')
        if platform:
            qs = qs.filter(platform=platform)
        # Latest snapshot per campaign
        latest = qs.values('campaign_id').annotate(latest=Max('snapshot_date'))
        latest_dates = {r['campaign_id']: r['latest'] for r in latest}
        result = []
        seen = set()
        for snap in qs:
            key = snap.campaign_id
            if key not in seen and latest_dates.get(key) == snap.snapshot_date:
                result.append(snap)
                seen.add(key)
        return result


@extend_schema(tags=['ads'])
class AdsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        today = date.today()

        snapshots = AdsCampaignSnapshot.objects.filter(tenant=tenant)
        agg = snapshots.aggregate(
            total_spend=Sum('spend'),
            total_reach=Sum('reach'),
            total_impressions=Sum('impressions'),
            total_clicks=Sum('clicks'),
        )

        # Per-platform breakdown
        by_platform = []
        for platform in ['meta', 'tiktok', 'google']:
            p_agg = snapshots.filter(platform=platform).aggregate(
                spend=Sum('spend'),
                reach=Sum('reach'),
                impressions=Sum('impressions'),
                clicks=Sum('clicks'),
            )
            if any(v for v in p_agg.values() if v):
                labels = {'meta': 'Meta', 'tiktok': 'TikTok', 'google': 'Google'}
                by_platform.append({
                    'platform': platform,
                    'label': labels[platform],
                    'spend': float(p_agg['spend'] or 0),
                    'reach': p_agg['reach'] or 0,
                    'impressions': p_agg['impressions'] or 0,
                    'clicks': p_agg['clicks'] or 0,
                })

        recent_campaigns = snapshots.order_by('-snapshot_date', '-spend')[:10]
        accounts_count = AdsAccount.objects.filter(tenant=tenant, is_active=True).count()

        # Active budget
        budget = BudgetAllocation.objects.filter(
            tenant=tenant,
            period_start__lte=today,
            period_end__gte=today,
        ).first()

        return Response({
            'total_spend': agg['total_spend'] or Decimal('0'),
            'total_reach': agg['total_reach'] or 0,
            'total_impressions': agg['total_impressions'] or 0,
            'total_clicks': agg['total_clicks'] or 0,
            'accounts_count': accounts_count,
            'by_platform': by_platform,
            'recent_campaigns': AdsCampaignSnapshotSerializer(recent_campaigns, many=True).data,
            'budget': BudgetAllocationSerializer(budget).data if budget else None,
        })


@extend_schema(tags=['ads'])
class BudgetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        budget = BudgetAllocation.objects.filter(
            tenant=request.user.tenant,
            period_start__lte=today,
            period_end__gte=today,
        ).first()
        if not budget:
            budget = BudgetAllocation.objects.filter(
                tenant=request.user.tenant
            ).first()
        if not budget:
            return Response(None)
        return Response(BudgetAllocationSerializer(budget, context={'request': request}).data)

    def put(self, request):
        today = date.today()
        budget = BudgetAllocation.objects.filter(
            tenant=request.user.tenant,
            period_start__lte=today,
            period_end__gte=today,
        ).first()

        serializer = BudgetAllocationSerializer(
            budget, data=request.data, partial=True if budget else False
        )
        serializer.is_valid(raise_exception=True)

        if budget:
            serializer.save()
        else:
            serializer.save(tenant=request.user.tenant)

        return Response(serializer.data)
