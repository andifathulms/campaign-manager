import secrets
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
    # Daily content for volunteer sharing
    is_daily_content = models.BooleanField(default=False)
    reward_per_100_views = models.IntegerField(default=0)
    reward_max_cap = models.IntegerField(default=0)

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


class ContentShare(BaseModel):
    """Tracks each volunteer's share of daily content."""
    STATUS_CHOICES = [
        ('pending', 'Menunggu Verifikasi'),
        ('approved', 'Disetujui'),
        ('rejected', 'Ditolak'),
    ]

    content = models.ForeignKey(ContentItem, on_delete=models.CASCADE, related_name='shares')
    volunteer = models.ForeignKey(
        'teams.TeamMember', on_delete=models.CASCADE, related_name='content_shares'
    )
    tracking_code = models.CharField(max_length=20, unique=True)
    proof_url = models.URLField(blank=True)
    proof_screenshot = models.ImageField(upload_to='content/proofs/', null=True, blank=True)
    view_count = models.IntegerField(default=0)
    points_earned = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    last_updated_views_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        unique_together = ('content', 'volunteer')

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = secrets.token_urlsafe(10)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.volunteer.nama} → {self.content.judul} ({self.status})"


class Article(BaseModel):
    """News / Berita published by admin for the public page."""
    CATEGORY_CHOICES = [
        ('kegiatan', 'Kegiatan'),
        ('program', 'Program'),
        ('pengumuman', 'Pengumuman'),
        ('media', 'Media'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Dipublikasikan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='articles'
    )
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300)
    body = models.TextField()
    excerpt = models.TextField(blank=True, max_length=500)
    featured_image = models.ImageField(upload_to='articles/', null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    author = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='articles'
    )
    view_count = models.IntegerField(default=0)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('tenant', 'slug')
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title
