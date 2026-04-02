from django.urls import path
from .views import (
    AdsAccountListView,
    ConnectAdsAccountView,
    DisconnectAdsAccountView,
    AdsCampaignListView,
    AdsDashboardView,
    BudgetView,
)

urlpatterns = [
    path('ads/accounts/', AdsAccountListView.as_view(), name='ads-accounts'),
    path('ads/accounts/connect/', ConnectAdsAccountView.as_view(), name='ads-connect'),
    path('ads/accounts/<uuid:pk>/', DisconnectAdsAccountView.as_view(), name='ads-disconnect'),
    path('ads/campaigns/', AdsCampaignListView.as_view(), name='ads-campaigns'),
    path('ads/dashboard/', AdsDashboardView.as_view(), name='ads-dashboard'),
    path('ads/budget/', BudgetView.as_view(), name='ads-budget'),
]
