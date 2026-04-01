from django.contrib import admin
from .models import Candidate, CampaignPage


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ['nama_lengkap', 'tenant', 'partai', 'jenis_pemilihan', 'status']
    list_filter = ['status', 'jenis_pemilihan', 'partai']
    search_fields = ['nama_lengkap', 'dapil']


@admin.register(CampaignPage)
class CampaignPageAdmin(admin.ModelAdmin):
    list_display = ['candidate', 'is_published', 'view_count', 'published_at']
    list_filter = ['is_published']
