"""Role taxonomy + RBAC helpers for the Web Timses command center.

Role groups
-----------
* FULL_ACCESS  — see all of a tenant's data (candidate, koordinator utama,
  consultant, platform admin, staf admin).
* WILAYAH_SCOPED — coordinators who only see their assigned wilayah.
* ADS_MANAGER  — roles permitted to view AND control ads (write-control is
  gated to these per consolidated PRD §18.1).

Wilayah scoping
---------------
``wilayah_filter`` provides a conservative default: a scoped coordinator sees
rows whose any geo field equals their assigned ``user.wilayah``. TRUE subtree
semantics (a kecamatan coordinator also seeing their kelurahan) require a
normalized wilayah tree + the product decisions in the PRD open questions
(who sees/creates what). Until then this exact-match default fails safe
(narrower, never broader) and full-access roles are unaffected.
"""
from django.db.models import Q
from rest_framework.permissions import BasePermission

# Role model collapsed to 4 roles (one per portal). Candidate-portal users
# (`candidate`) have full access to their own tenant; platform staff
# (`superadmin`/`admin`) are full-access too. Wilayah-scoped coordinator roles
# were removed in the role collapse, so WILAYAH_SCOPED_ROLES is now empty and
# `wilayah_filter` is a no-op (kept for call-site compatibility).
FULL_ACCESS_ROLES = {'superadmin', 'admin', 'candidate'}
WILAYAH_SCOPED_ROLES: set[str] = set()
ADS_MANAGER_ROLES = {'superadmin', 'admin', 'candidate'}
TIMSES_ROLES = {'superadmin', 'admin', 'candidate'}

def _role(user):
    return getattr(user, 'role', None)


def is_full_access(user):
    return _role(user) in FULL_ACCESS_ROLES


def is_wilayah_scoped(user):
    return _role(user) in WILAYAH_SCOPED_ROLES


def wilayah_filter(user, fields):
    """A ``Q`` narrowing a queryset to a scoped coordinator's wilayah.

    ``fields`` MUST be the geo field names that exist on the target model
    (e.g. ``('kelurahan', 'kecamatan')`` for Supporter, ``('wilayah_name',)``
    for TeamMember) — passing fields a model lacks raises FieldError, which is
    intentionally loud rather than a silent scoping failure.

    Returns an empty ``Q()`` (no narrowing) for full-access roles or when the
    user has no assigned wilayah, so callers can always ``.filter(q)`` safely.
    """
    if not is_wilayah_scoped(user) or not getattr(user, 'wilayah', None):
        return Q()
    q = Q()
    for field in fields:
        q |= Q(**{f'{field}__iexact': user.wilayah})
    return q


class IsTimsesStaff(BasePermission):
    """Authenticated tenant staff (any Timses role; excludes public + bare relawan)."""
    message = 'Anda tidak memiliki akses ke dashboard tim sukses.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) in TIMSES_ROLES)


class IsAdsManager(BasePermission):
    """Roles permitted to view and control ads (write-control guardrail)."""
    message = 'Hanya Koordinator Utama atau Staf Ads yang dapat mengelola iklan.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) in ADS_MANAGER_ROLES)
