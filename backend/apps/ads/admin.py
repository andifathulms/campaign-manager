from django.contrib import admin
from .models import AdsAuditLog


@admin.register(AdsAuditLog)
class AdsAuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'tenant', 'user', 'action', 'target_type', 'target_id', 'success']
    list_filter = ['action', 'success', 'target_type']
    search_fields = ['target_id']
    readonly_fields = ['tenant', 'user', 'ads_account', 'action', 'target_type',
                       'target_id', 'detail', 'success', 'created_at', 'updated_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
