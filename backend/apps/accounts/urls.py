from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, RegisterView, MeView, ChangePasswordView, TenantSettingsView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('me/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('tenant/', TenantSettingsView.as_view(), name='auth-tenant'),
]
