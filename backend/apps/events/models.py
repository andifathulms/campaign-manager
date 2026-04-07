import secrets
from django.db import models
from apps.core.models import BaseModel


class Event(BaseModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Dipublikasikan'),
        ('ongoing', 'Sedang Berlangsung'),
        ('completed', 'Selesai'),
        ('cancelled', 'Dibatalkan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='events'
    )
    judul = models.CharField(max_length=300)
    deskripsi = models.TextField(blank=True)
    lokasi = models.CharField(max_length=300, blank=True)
    tanggal_mulai = models.DateTimeField()
    tanggal_selesai = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    target_peserta = models.IntegerField(default=0)
    live_url = models.CharField(max_length=500, blank=True)  # YouTube/TikTok live embed

    class Meta:
        ordering = ['-tanggal_mulai']

    def __str__(self):
        return self.judul

    @property
    def attendee_count(self):
        return self.attendances.filter(checked_in=True).count()


class EventAttendance(BaseModel):
    """QR check-in record for a team member at an event."""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendances')
    team_member = models.ForeignKey(
        'teams.TeamMember', on_delete=models.CASCADE, related_name='event_attendances'
    )
    qr_code = models.CharField(max_length=64, unique=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [('event', 'team_member')]
        ordering = ['-checked_in_at']

    def save(self, *args, **kwargs):
        if not self.qr_code:
            self.qr_code = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
