from django.urls import path
from .views import (
    AdsAccountListView,
    ConnectAdsAccountView,
    DisconnectAdsAccountView,
    AdsCampaignListView,
    AdsDashboardView,
    BudgetView,
    AdsDailySpendView,
    MetaOAuthStartView,
    MetaConnectView,
    AdsSyncView,
    AdsCampaignControlView,
)

urlpatterns = [
    path('ads/accounts/', AdsAccountListView.as_view(), name='ads-accounts'),
    path('ads/accounts/connect/', ConnectAdsAccountView.as_view(), name='ads-connect'),
    path('ads/accounts/<uuid:pk>/', DisconnectAdsAccountView.as_view(), name='ads-disconnect'),
    path('ads/campaigns/', AdsCampaignListView.as_view(), name='ads-campaigns'),
    path('ads/dashboard/', AdsDashboardView.as_view(), name='ads-dashboard'),
    path('ads/daily-spend/', AdsDailySpendView.as_view(), name='ads-daily-spend'),
    path('ads/budget/', BudgetView.as_view(), name='ads-budget'),
    # Meta integration
    path('ads/meta/oauth/start/', MetaOAuthStartView.as_view(), name='ads-meta-oauth-start'),
    path('ads/meta/connect/', MetaConnectView.as_view(), name='ads-meta-connect'),
    path('ads/sync/', AdsSyncView.as_view(), name='ads-sync'),
    path('ads/campaigns/<str:campaign_id>/control/', AdsCampaignControlView.as_view(), name='ads-campaign-control'),
]
