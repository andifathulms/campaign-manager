from rest_framework import serializers
from .models import Event, EventAttendance


class EventAttendanceSerializer(serializers.ModelSerializer):
    team_member_nama = serializers.CharField(source='team_member.nama', read_only=True)
    team_member_level = serializers.CharField(source='team_member.get_level_display', read_only=True)
    team_member_wilayah = serializers.CharField(source='team_member.wilayah_name', read_only=True)

    class Meta:
        model = EventAttendance
        fields = [
            'id', 'team_member', 'team_member_nama', 'team_member_level',
            'team_member_wilayah', 'qr_code', 'checked_in', 'checked_in_at', 'created_at',
        ]
        read_only_fields = ['id', 'qr_code', 'checked_in_at', 'created_at']


class EventSerializer(serializers.ModelSerializer):
    attendee_count = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'judul', 'deskripsi', 'lokasi', 'tanggal_mulai', 'tanggal_selesai',
            'status', 'status_display', 'target_peserta', 'live_url',
            'attendee_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'attendee_count']


class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['judul', 'deskripsi', 'lokasi', 'tanggal_mulai', 'tanggal_selesai',
                  'status', 'target_peserta', 'live_url']


class QRCheckInSerializer(serializers.Serializer):
    qr_code = serializers.CharField()
