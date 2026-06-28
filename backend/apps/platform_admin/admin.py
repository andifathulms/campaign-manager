from django.contrib import admin
from .models import PlatformAuditLog


@admin.register(PlatformAuditLog)
class PlatformAuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'actor', 'target_tenant', 'created_at']
    list_filter = ['action']
    search_fields = ['actor__username', 'target_tenant__name']
    readonly_fields = ['actor', 'action', 'target_tenant', 'detail', 'created_at', 'updated_at']
