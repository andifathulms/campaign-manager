from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.candidates.models import Candidate
from apps.teams.models import TeamMember
from .models import Event, EventAttendance
from .serializers import (
    EventSerializer,
    EventCreateSerializer,
    EventAttendanceSerializer,
    QRCheckInSerializer,
)


@extend_schema(tags=['events'])
class EventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Event.objects.filter(tenant=request.user.tenant)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(EventSerializer(qs, many=True).data)

    def post(self, request):
        serializer = EventCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(tenant=request.user.tenant)
        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['events'])
class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(Event, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        event = self._get(request, pk)
        return Response(EventSerializer(event).data)

    def patch(self, request, pk):
        event = self._get(request, pk)
        serializer = EventCreateSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(EventSerializer(serializer.save()).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['events'])
class EventAttendanceListView(APIView):
    """List attendances for an event, and register team members."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk, tenant=request.user.tenant)
        qs = event.attendances.select_related('team_member')
        return Response(EventAttendanceSerializer(qs, many=True).data)

    def post(self, request, pk):
        """Register a team member for this event (generates their QR code)."""
        event = get_object_or_404(Event, pk=pk, tenant=request.user.tenant)
        member_id = request.data.get('team_member')
        member = get_object_or_404(TeamMember, pk=member_id, tenant=request.user.tenant)
        attendance, created = EventAttendance.objects.get_or_create(
            event=event, team_member=member
        )
        return Response(
            EventAttendanceSerializer(attendance).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


@extend_schema(tags=['events'])
class QRCheckInView(APIView):
    """Scan a QR code to mark a team member as checked in."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk, tenant=request.user.tenant)
        serializer = QRCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        qr_code = serializer.validated_data['qr_code']

        try:
            attendance = EventAttendance.objects.get(event=event, qr_code=qr_code)
        except EventAttendance.DoesNotExist:
            return Response({'detail': 'QR code tidak valid.'}, status=status.HTTP_400_BAD_REQUEST)

        if attendance.checked_in:
            return Response({'detail': 'Sudah check-in sebelumnya.', 'attendance': EventAttendanceSerializer(attendance).data})

        attendance.checked_in = True
        attendance.checked_in_at = timezone.now()
        attendance.save(update_fields=['checked_in', 'checked_in_at'])
        return Response({'detail': f'{attendance.team_member.nama} berhasil check-in!', 'attendance': EventAttendanceSerializer(attendance).data})


@extend_schema(tags=['public'])
class PublicEventListView(APIView):
    """Public: upcoming/ongoing events for the campaign page."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        candidate = get_object_or_404(Candidate, tenant__slug=slug)
        qs = Event.objects.filter(
            tenant=candidate.tenant,
            status__in=['published', 'ongoing'],
        ).order_by('tanggal_mulai')[:10]
        return Response(EventSerializer(qs, many=True).data)
