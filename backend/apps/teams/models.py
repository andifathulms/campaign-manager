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
