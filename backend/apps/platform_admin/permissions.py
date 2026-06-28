from rest_framework.permissions import IsAuthenticated
from apps.core.roles import PLATFORM_ROLES, SUPERADMIN


class IsPlatformAdmin(IsAuthenticated):
    """KampanyeKit platform staff — superadmin or admin."""
    message = 'Hanya staf platform yang dapat mengakses halaman ini.'

    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view)
            and getattr(request.user, 'role', None) in PLATFORM_ROLES
        )


class IsSuperAdmin(IsAuthenticated):
    """Only the superadmin (manage staff, destructive actions)."""
    message = 'Hanya Super Admin yang dapat melakukan tindakan ini.'

    def has_permission(self, request, view):
        return bool(
            super().has_permission(request, view)
            and getattr(request.user, 'role', None) == SUPERADMIN
        )
