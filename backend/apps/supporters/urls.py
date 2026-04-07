from django.urls import path
from .views import (
    SupporterListView,
    SupporterDetailView,
    SupporterCardView,
    SupporterCardImageView,
    SupporterStatsView,
    SupporterExportView,
    PledgeWallView,
    PublicPledgeWallView,
    PublicJoinView,
)

urlpatterns = [
    path('supporters/', SupporterListView.as_view(), name='supporter-list'),
    path('supporters/stats/', SupporterStatsView.as_view(), name='supporter-stats'),
    path('supporters/export/', SupporterExportView.as_view(), name='supporter-export'),
    path('supporters/pledge-wall/', PledgeWallView.as_view(), name='pledge-wall'),
    path('supporters/<uuid:pk>/', SupporterDetailView.as_view(), name='supporter-detail'),
    path('supporters/<uuid:pk>/card/', SupporterCardView.as_view(), name='supporter-card'),
    path('supporters/<uuid:pk>/card/image/', SupporterCardImageView.as_view(), name='supporter-card-image'),
    path('supporters/<uuid:pk>/moderate/', PledgeWallView.as_view(), name='supporter-moderate'),
    path('public/<slug:slug>/join/', PublicJoinView.as_view(), name='public-join'),
    path('public/<slug:slug>/pledge-wall/', PublicPledgeWallView.as_view(), name='public-pledge-wall'),
]
