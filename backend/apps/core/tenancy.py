"""Active-tenant resolution for the candidate switcher.

Resolved at the view/mixin layer (not middleware) because DRF authenticates
``request.user`` in the view, so a Django middleware would see AnonymousUser
for JWT requests.

Normal users always act on their home tenant. A consultant (a user whose
``agency`` owns several tenants) may target any tenant under their agency by
sending an ``X-Tenant-ID`` request header — validated against their agency so
one consultant can never reach another agency's data.
"""


def active_tenant(request):
    """The tenant this request should read/write. ``None`` if unauthenticated
    or the user has no tenant."""
    user = getattr(request, 'user', None)
    if user is None or not user.is_authenticated:
        return None

    requested_id = request.headers.get('X-Tenant-ID')
    if requested_id and getattr(user, 'agency_id', None):
        from apps.accounts.models import Tenant
        scoped = Tenant.objects.filter(
            id=requested_id, agency_id=user.agency_id, is_active=True
        ).first()
        if scoped is not None:
            return scoped
    return user.tenant


def switchable_tenants(user):
    """Tenants a user may switch between (their agency's active tenants), or
    just their home tenant when they have no agency."""
    if user is None or not user.is_authenticated:
        return []
    if getattr(user, 'agency_id', None):
        from apps.accounts.models import Tenant
        return list(Tenant.objects.filter(agency_id=user.agency_id, is_active=True).order_by('name'))
    return [user.tenant] if user.tenant_id else []
