"""Canonical 4-role model and role -> portal mapping.

Kept in sync with the frontend `src/lib/portals.ts`. One role per portal:
  superadmin / admin -> Admin Portal
  candidate          -> Candidate Portal (incl. consultants via Agency)
  volunteer          -> Volunteer Portal
"""

SUPERADMIN = 'superadmin'
ADMIN = 'admin'
CANDIDATE = 'candidate'
COORDINATOR = 'coordinator'  # campaign staff with candidate-portal access (not the owner)
VOLUNTEER = 'volunteer'

ALL_ROLES = (SUPERADMIN, ADMIN, CANDIDATE, COORDINATOR, VOLUNTEER)

# Platform (KampanyeKit staff) roles — allowed into the Admin Portal + /platform API.
PLATFORM_ROLES = {SUPERADMIN, ADMIN}

# Roles that use the candidate command-center (/dashboard).
CANDIDATE_PORTAL_ROLES = {CANDIDATE, COORDINATOR}

ROLE_PORTAL = {
    SUPERADMIN: 'admin',
    ADMIN: 'admin',
    CANDIDATE: 'dashboard',
    COORDINATOR: 'dashboard',
    VOLUNTEER: 'volunteer',
}


def portal_for_role(role: str) -> str:
    return ROLE_PORTAL.get(role, 'dashboard')


def is_platform_staff(user) -> bool:
    return bool(getattr(user, 'is_authenticated', False) and getattr(user, 'role', None) in PLATFORM_ROLES)
