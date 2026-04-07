import secrets
from django.db import models
from apps.core.models import BaseModel


class TeamMember(BaseModel):
    LEVEL_CHOICES = [
        (1, 'Koordinator Wilayah'),
        (2, 'Koordinator Kecamatan'),
        (3, 'Koordinator Kelurahan'),
        (4, 'Relawan'),
    ]
    WILAYAH_LEVEL_CHOICES = [
        ('provinsi', 'Provinsi'),
        ('kabupaten', 'Kabupaten/Kota'),
        ('kecamatan', 'Kecamatan'),
        ('kelurahan', 'Kelurahan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='team_members'
    )
    user = models.OneToOneField(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='team_member'
    )
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates'
    )
    level = models.IntegerField(choices=LEVEL_CHOICES, default=4)
    nama = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    wilayah_name = models.CharField(max_length=200)
    wilayah_level = models.CharField(max_length=20, choices=WILAYAH_LEVEL_CHOICES, default='kelurahan')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['level', 'nama']

    def __str__(self):
        return f"{self.nama} ({self.get_level_display()})"

    def get_referral_stats(self):
        links = self.referral_links.all()
        total_clicks = sum(l.clicks for l in links)
        return {'total_clicks': total_clicks, 'link_count': links.count()}


class ReferralLink(BaseModel):
    team_member = models.ForeignKey(
        TeamMember, on_delete=models.CASCADE, related_name='referral_links'
    )
    code = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=100, blank=True)
    clicks = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    last_clicked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-clicks']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = secrets.token_urlsafe(8)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.team_member.nama})"


class ReferralClick(BaseModel):
    referral_link = models.ForeignKey(
        ReferralLink, on_delete=models.CASCADE, related_name='click_records'
    )
    ip_hash = models.CharField(max_length=64)
    user_agent = models.TextField(blank=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-clicked_at']


class Task(BaseModel):
    PRIORITY_CHOICES = [
        ('high', 'Tinggi'),
        ('medium', 'Sedang'),
        ('low', 'Rendah'),
    ]
    STATUS_CHOICES = [
        ('assigned', 'Ditugaskan'),
        ('in_progress', 'Dikerjakan'),
        ('done', 'Selesai'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='tasks'
    )
    assigned_to = models.ForeignKey(
        TeamMember, on_delete=models.CASCADE, related_name='tasks'
    )
    assigned_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='assigned_tasks'
    )
    judul = models.CharField(max_length=300)
    deskripsi = models.TextField(blank=True)
    prioritas = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    deadline = models.DateField(null=True, blank=True)
    wilayah = models.CharField(max_length=200, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.judul} → {self.assigned_to.nama}"


class Announcement(BaseModel):
    """Internal announcement board for the tim sukses."""
    LEVEL_CHOICES = [
        (0, 'Semua'),
        (1, 'Koordinator Wilayah ke atas'),
        (2, 'Koordinator Kecamatan ke atas'),
        (3, 'Koordinator Kelurahan ke atas'),
        (4, 'Semua termasuk Relawan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='announcements'
    )
    author = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='announcements'
    )
    judul = models.CharField(max_length=300)
    isi = models.TextField()
    min_level = models.IntegerField(
        choices=LEVEL_CHOICES, default=4,
        help_text='Members at this level and above will see this announcement.'
    )
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.judul
