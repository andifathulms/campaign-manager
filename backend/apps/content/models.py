from django.db import models
from apps.core.models import BaseModel


class ContentItem(BaseModel):
    """Content Calendar item — a planned or published post/ad/story."""
    PLATFORM_CHOICES = [
        ('instagram', 'Instagram'),
        ('tiktok', 'TikTok'),
        ('facebook', 'Facebook'),
        ('youtube', 'YouTube'),
        ('twitter', 'Twitter/X'),
        ('meta_ads', 'Meta Ads'),
        ('tiktok_ads', 'TikTok Ads'),
    ]
    JENIS_CHOICES = [
        ('post', 'Post'),
        ('story', 'Story'),
        ('reel', 'Reel / Short'),
        ('ads', 'Iklan'),
        ('live', 'Live'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Terjadwal'),
        ('published', 'Tayang'),
        ('cancelled', 'Dibatalkan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='content_items'
    )
    judul = models.CharField(max_length=300)
    caption = models.TextField(blank=True)
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    jenis = models.CharField(max_length=10, choices=JENIS_CHOICES, default='post')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    tags = models.JSONField(default=list)  # ['pendidikan', 'kesehatan', ...]
    notes = models.TextField(blank=True)
    creative = models.ForeignKey(
        'AdCreative', on_delete=models.SET_NULL, null=True, blank=True, related_name='content_items'
    )

    class Meta:
        ordering = ['scheduled_at', '-created_at']

    def __str__(self):
        return f"{self.judul} ({self.platform})"


class AdCreative(BaseModel):
    """Ad Creative Library — reusable images, videos, and captions."""
    MEDIA_TYPE_CHOICES = [
        ('image', 'Gambar'),
        ('video', 'Video'),
        ('caption', 'Caption Saja'),
    ]
    TEMA_CHOICES = [
        ('infrastruktur', 'Infrastruktur'),
        ('kesehatan', 'Kesehatan'),
        ('pendidikan', 'Pendidikan'),
        ('ekonomi', 'Ekonomi'),
        ('lingkungan', 'Lingkungan'),
        ('profil', 'Profil Kandidat'),
        ('event', 'Event'),
        ('lainnya', 'Lainnya'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='ad_creatives'
    )
    judul = models.CharField(max_length=300)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES)
    file = models.FileField(upload_to='creatives/', null=True, blank=True)
    caption = models.TextField(blank=True)
    tema = models.CharField(max_length=20, choices=TEMA_CHOICES, default='lainnya')
    platform_tags = models.JSONField(default=list)  # ['meta', 'tiktok']
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.judul} ({self.get_media_type_display()})"
