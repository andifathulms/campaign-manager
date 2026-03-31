class TenantQuerysetMixin:
    def get_queryset(self):
        return super().get_queryset().filter(tenant=self.request.user.tenant)
