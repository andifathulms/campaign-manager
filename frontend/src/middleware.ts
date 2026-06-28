import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { portalForPath, roleAllowedInPortal, loginPathForPortal, portalForRole } from '@/lib/portals';

const LOGIN_PATHS = new Set(['/login', '/admin/login', '/volunteer/login']);

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    // Login pages are public even though they sit under guarded prefixes.
    if (LOGIN_PATHS.has(pathname)) return NextResponse.next();

    const portal = portalForPath(pathname);
    if (!portal) return NextResponse.next();

    const token = req.nextauth.token as any;
    const role = token?.role as string | undefined;

    // Not logged in → that portal's login page.
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = loginPathForPortal(portal);
      url.search = '';
      return NextResponse.redirect(url);
    }

    // Logged in but wrong portal → bounce to their own portal home.
    if (!roleAllowedInPortal(role, portal)) {
      const url = req.nextUrl.clone();
      url.pathname = portalForRole(role);
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    // All gating happens in the function above; this just injects the token.
    callbacks: { authorized: () => true },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/volunteer/:path*', '/admin/:path*'],
};
