from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.candidates.urls')),
    path('api/v1/', include('apps.teams.urls')),
    path('api/v1/', include('apps.supporters.urls')),
    path('api/v1/', include('apps.ads.urls')),
    path('api/v1/', include('apps.events.urls')),
    path('api/v1/', include('apps.engagement.urls')),
    path('api/v1/', include('apps.content.urls')),
    path('api/v1/', include('apps.analytics.urls')),
    path('api/v1/', include('apps.core.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
