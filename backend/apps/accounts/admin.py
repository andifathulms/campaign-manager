from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Tenant, Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'agency', 'plan', 'is_active', 'created_at']
    list_filter = ['plan', 'is_active']
    search_fields = ['name', 'slug']
    raw_id_fields = ['agency']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'tenant', 'agency', 'is_active']
    list_filter = ['role', 'is_active']
    raw_id_fields = ['tenant', 'agency']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('KampanyeKit', {'fields': ('tenant', 'agency', 'role', 'phone', 'wilayah', 'referral_code')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('KampanyeKit', {'fields': ('tenant', 'agency', 'role', 'phone')}),
    )
