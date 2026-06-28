// Canonical 4-role model + role -> portal mapping. Kept in sync with the
// backend apps/core/roles.py. One portal per role.
export type Role = 'superadmin' | 'admin' | 'candidate' | 'coordinator' | 'volunteer';
export type Portal = 'admin' | 'dashboard' | 'volunteer';

export const PLATFORM_ROLES: Role[] = ['superadmin', 'admin'];

/** Landing path for a role after login. */
export function portalForRole(role?: string | null): string {
  switch (role) {
    case 'superadmin':
    case 'admin':
      return '/admin/overview';
    case 'volunteer':
      return '/volunteer';
    case 'candidate':
    case 'coordinator':
    default:
      return '/dashboard/overview';
  }
}

/** Which roles may enter a given portal. */
export function rolesForPortal(portal: Portal): Role[] {
  if (portal === 'admin') return ['superadmin', 'admin'];
  if (portal === 'volunteer') return ['volunteer'];
  return ['candidate', 'coordinator'];
}

/** Unified login page — one smart form for every portal. */
export function loginPathForPortal(_portal: Portal): string {
  return '/login';
}

/** Map a path prefix to the portal that owns it (for middleware gating). */
export function portalForPath(pathname: string): Portal | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/volunteer')) return 'volunteer';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  return null;
}

export function roleAllowedInPortal(role: string | null | undefined, portal: Portal): boolean {
  return !!role && (rolesForPortal(portal) as string[]).includes(role);
}
