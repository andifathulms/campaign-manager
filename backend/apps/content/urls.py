from django.urls import path
from .views import (
    ContentItemListCreateView,
    ContentItemDetailView,
    AdCreativeListCreateView,
    AdCreativeDetailView,
)

urlpatterns = [
    path('content/calendar/', ContentItemListCreateView.as_view(), name='content-list'),
    path('content/calendar/<uuid:pk>/', ContentItemDetailView.as_view(), name='content-detail'),
    path('content/library/', AdCreativeListCreateView.as_view(), name='creative-list'),
    path('content/library/<uuid:pk>/', AdCreativeDetailView.as_view(), name='creative-detail'),
]
