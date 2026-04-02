from decimal import Decimal

from django.urls import path
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count


def health_check(request):
    return JsonResponse({'status': 'ok', 'service': 'kampanyekit-api'})


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant

        from apps.supporters.models import Supporter
        from apps.teams.models import TeamMember
        from apps.ads.models import AdsAccount, AdsCampaignSnapshot

        supporter_count = Supporter.objects.filter(tenant=tenant, is_active=True).count()
        team_count = TeamMember.objects.filter(tenant=tenant, is_active=True).count()
        ads_accounts = AdsAccount.objects.filter(tenant=tenant, is_active=True).count()

        spend_agg = AdsCampaignSnapshot.objects.filter(tenant=tenant).aggregate(
            total=Sum('spend')
        )
        total_spend = float(spend_agg['total'] or 0)

        reach_agg = AdsCampaignSnapshot.objects.filter(tenant=tenant).aggregate(
            total=Sum('reach')
        )
        total_reach = reach_agg['total'] or 0

        return Response({
            'supporter_count': supporter_count,
            'team_count': team_count,
            'ads_accounts': ads_accounts,
            'total_spend': total_spend,
            'total_reach': total_reach,
        })


class WeeklyReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return latest report metadata (task ID, generated_at)."""
        # In a full implementation this would query a Report model.
        # For now return a simple status response.
        return Response({'status': 'Report is generated every Monday at 07:00 WIB.'})

    def post(self, request):
        """Manually trigger report generation for the current tenant."""
        from apps.core.tasks import generate_weekly_report
        tenant = request.user.tenant
        if not tenant:
            return Response({'detail': 'No tenant found.'}, status=400)
        task = generate_weekly_report.delay(str(tenant.id))
        return Response({'status': 'queued', 'task_id': task.id}, status=202)


urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('dashboard/report/weekly/', WeeklyReportView.as_view(), name='weekly-report'),
    path('dashboard/report/generate/', WeeklyReportView.as_view(), name='weekly-report-generate'),
]
