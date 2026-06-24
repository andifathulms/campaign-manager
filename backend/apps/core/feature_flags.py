"""Feature-flag enforcement.

Phase 2+ surfaces are OFF by default and must be explicitly enabled per
tenant via ``Tenant.feature_flags`` (a JSON dict like ``{"events": true}``).
This keeps the v1 spine focused while leaving Phase 2 code in the repo, ready
to switch on per tenant without a deployment.
"""
from rest_framework.permissions import BasePermission

# Phase-2 features: default OFF until a tenant opts in.
# Keys here map to `feature_flag` on gated views and to the nav `flag` on the
# frontend sidebar — keep the two in sync.
PHASE2_FEATURES = {
    'events',         # campaign events + QR check-in
    'polls',          # mini surveys / quick polls
    'pledge_wall',    # public supporter statements wall
    'announcements',  # internal team announcement board
    'electability',   # electability survey tracking
}


def feature_enabled(tenant, key):
    """Is ``key`` enabled for ``tenant``? Phase-2 keys default OFF; any other
    (v1) key defaults ON so we never accidentally gate the spine."""
    if tenant is None:
        return False
    flags = tenant.feature_flags or {}
    default = False if key in PHASE2_FEATURES else True
    return bool(flags.get(key, default))


def enabled_features(tenant):
    """Map of every known Phase-2 flag -> bool, for the frontend to gate nav."""
    return {key: feature_enabled(tenant, key) for key in sorted(PHASE2_FEATURES)}


def _resolve_tenant(request, view):
    """Find the tenant a request pertains to: the authenticated user's tenant,
    else the tenant named by a public ``<slug>`` URL kwarg."""
    user = getattr(request, 'user', None)
    if user is not None and user.is_authenticated and getattr(user, 'tenant_id', None):
        return user.tenant
    slug = getattr(view, 'kwargs', {}).get('slug')
    if slug:
        from apps.accounts.models import Tenant
        return Tenant.objects.filter(slug=slug, is_active=True).first()
    return None


class FeatureFlagRequired(BasePermission):
    """Deny access (403) when the view's ``feature_flag`` is off for the tenant.

    Views opt in by setting a ``feature_flag`` attribute. Combine with
    ``FeatureGatedMixin`` to append this permission without disturbing a view's
    existing ``permission_classes``.
    """
    message = 'Fitur ini belum aktif untuk akun Anda.'

    def has_permission(self, request, view):
        flag = getattr(view, 'feature_flag', None)
        if not flag:
            return True
        return feature_enabled(_resolve_tenant(request, view), flag)


class FeatureGatedMixin:
    """Mixin for APIViews: appends ``FeatureFlagRequired`` to the view's
    permissions so the existing ``permission_classes`` line stays untouched.
    Set ``feature_flag`` on the view."""
    feature_flag = None

    def get_permissions(self):
        return super().get_permissions() + [FeatureFlagRequired()]
