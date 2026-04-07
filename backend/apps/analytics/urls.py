from django.urls import path
from .views import ElectabilityListCreateView, ElectabilityDetailView

urlpatterns = [
    path('analytics/electability/', ElectabilityListCreateView.as_view(), name='electability-list'),
    path('analytics/electability/<uuid:pk>/', ElectabilityDetailView.as_view(), name='electability-detail'),
]
