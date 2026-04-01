from django.urls import path
from .views import (
    SupporterListView,
    SupporterDetailView,
    SupporterCardView,
    SupporterStatsView,
    SupporterExportView,
    PublicJoinView,
)

urlpatterns = [
    path('supporters/', SupporterListView.as_view(), name='supporter-list'),
    path('supporters/stats/', SupporterStatsView.as_view(), name='supporter-stats'),
    path('supporters/export/', SupporterExportView.as_view(), name='supporter-export'),
    path('supporters/<uuid:pk>/', SupporterDetailView.as_view(), name='supporter-detail'),
    path('supporters/<uuid:pk>/card/', SupporterCardView.as_view(), name='supporter-card'),
    path('public/<slug:slug>/join/', PublicJoinView.as_view(), name='public-join'),
]
