from django.db import models
from apps.core.models import BaseModel


class Aspirasi(BaseModel):
    """Voter aspiration/message submitted from the public campaign page."""
    TEMA_CHOICES = [
        ('infrastruktur', 'Infrastruktur'),
        ('kesehatan', 'Kesehatan'),
        ('pendidikan', 'Pendidikan'),
        ('ekonomi', 'Ekonomi'),
        ('lingkungan', 'Lingkungan'),
        ('sosial', 'Sosial'),
        ('lainnya', 'Lainnya'),
    ]
    STATUS_CHOICES = [
        ('unread', 'Belum Dibaca'),
        ('read', 'Sudah Dibaca'),
        ('replied', 'Sudah Dibalas'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='aspirasi_list'
    )
    nama = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True)
    email = models.CharField(max_length=254, blank=True)
    pesan = models.TextField()
    tema = models.CharField(max_length=20, choices=TEMA_CHOICES, default='lainnya')
    wilayah = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unread')
    balasan_publik = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    is_archived = models.BooleanField(default=False)
    ip_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nama}: {self.pesan[:50]}"


class Poll(BaseModel):
    """Mini survey / quick poll."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Aktif'),
        ('closed', 'Ditutup'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='polls'
    )
    pertanyaan = models.CharField(max_length=500)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    ends_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.pertanyaan


class PollOption(BaseModel):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='options')
    teks = models.CharField(max_length=300)
    vote_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return self.teks


class PollResponse(BaseModel):
    """One voter response — de-duplicated by IP hash."""
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name='responses')
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name='responses')
    ip_hash = models.CharField(max_length=64)

    class Meta:
        unique_together = [('poll', 'ip_hash')]
