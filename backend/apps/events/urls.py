from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    EventAttendanceListView,
    QRCheckInView,
    PublicEventListView,
)

urlpatterns = [
    path('events/', EventListCreateView.as_view(), name='event-list'),
    path('events/<uuid:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('events/<uuid:pk>/attendances/', EventAttendanceListView.as_view(), name='event-attendances'),
    path('events/<uuid:pk>/checkin/', QRCheckInView.as_view(), name='event-checkin'),
    path('public/<slug:slug>/events/', PublicEventListView.as_view(), name='public-events'),
]
