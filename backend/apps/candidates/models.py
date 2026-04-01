from django.db import models
from apps.core.models import BaseModel
from apps.accounts.models import Tenant, User


class Candidate(BaseModel):
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='candidate')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidate')
    nama_lengkap = models.CharField(max_length=200)
    foto = models.ImageField(upload_to='candidates/photos/', null=True, blank=True)
    nomor_urut = models.IntegerField(null=True, blank=True)
    jenis_pemilihan = models.CharField(
        max_length=30,
        choices=[
            ('pileg_dpr', 'Pileg DPR'),
            ('pileg_dprd_provinsi', 'Pileg DPRD Provinsi'),
            ('pileg_dprd_kota', 'Pileg DPRD Kota/Kabupaten'),
            ('pilkada_bupati', 'Pilkada Bupati'),
            ('pilkada_walikota', 'Pilkada Walikota'),
            ('pilkada_gubernur', 'Pilkada Gubernur'),
        ],
        default='pileg_dprd_kota'
    )
    dapil = models.CharField(max_length=200, blank=True)
    partai = models.CharField(max_length=200, blank=True)
    tagline = models.CharField(max_length=300, blank=True)
    visi = models.TextField(blank=True)
    misi = models.JSONField(default=list)  # list of strings
    program_unggulan = models.JSONField(default=list)  # [{title, desc, icon}]
    sosmed = models.JSONField(default=dict)  # {instagram, tiktok, facebook, twitter, youtube}
    status = models.CharField(
        max_length=10,
        choices=[('draft', 'Draft'), ('published', 'Published'), ('paused', 'Paused')],
        default='draft'
    )
    color_primary = models.CharField(max_length=7, default='#1E40AF')
    color_secondary = models.CharField(max_length=7, default='#FFFFFF')

    def __str__(self):
        return self.nama_lengkap

    class Meta:
        db_table = 'candidates_candidate'


class CampaignPage(BaseModel):
    candidate = models.OneToOneField(Candidate, on_delete=models.CASCADE, related_name='campaign_page')
    hero_image = models.ImageField(upload_to='candidates/hero/', null=True, blank=True)
    hero_video_url = models.CharField(max_length=500, null=True, blank=True)
    sections_order = models.JSONField(default=list)
    seo_title = models.CharField(max_length=200, null=True, blank=True)
    seo_description = models.TextField(null=True, blank=True)
    og_image = models.ImageField(upload_to='candidates/og/', null=True, blank=True)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    view_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Page for {self.candidate.nama_lengkap}"

    class Meta:
        db_table = 'candidates_campaignpage'
