from apps.core.tenancy import active_tenant


class TenantQuerysetMixin:
    """Scope a viewset's queryset to the request's active tenant.

    Uses ``active_tenant`` (which honours a consultant's tenant switch via the
    ``X-Tenant-ID`` header) and falls back to the user's home tenant.
    """
    def get_queryset(self):
        return super().get_queryset().filter(tenant=active_tenant(self.request))
