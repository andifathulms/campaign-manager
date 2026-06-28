from django.urls import path
from .views import (
    PlatformOverviewView,
    PlatformTenantListView,
    PlatformTenantDetailView,
    PlatformProvisionView,
    PlatformImpersonateView,
    PlatformStaffListView,
)

urlpatterns = [
    path('platform/overview/', PlatformOverviewView.as_view(), name='platform-overview'),
    path('platform/tenants/', PlatformTenantListView.as_view(), name='platform-tenants'),
    path('platform/tenants/<uuid:pk>/', PlatformTenantDetailView.as_view(), name='platform-tenant-detail'),
    path('platform/tenants/<uuid:pk>/impersonate/', PlatformImpersonateView.as_view(), name='platform-impersonate'),
    path('platform/candidates/', PlatformProvisionView.as_view(), name='platform-provision'),
    path('platform/admins/', PlatformStaffListView.as_view(), name='platform-admins'),
]
