import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// NEXTAUTH_BACKEND_URL is for server-side (container-to-container).
// NEXT_PUBLIC_API_URL is browser-only — cannot be used inside authorize().
const API_URL = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/v1';

function userFromPayload(user: any, access: string, refresh: string, extra: Record<string, any> = {}) {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`.trim() || user.username,
    email: user.email,
    accessToken: access,
    refreshToken: refresh,
    role: user.role,
    tenant: user.tenant,
    ...extra,
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Username + password — candidate & admin portals.
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return userFromPayload(data.user, data.access, data.refresh);
        } catch {
          return null;
        }
      },
    }),
    // Token-based — used by WhatsApp-OTP login AND admin impersonation.
    // Accepts pre-issued JWTs and resolves the user via /auth/me.
    CredentialsProvider({
      id: 'credentials-otp',
      name: 'token',
      credentials: {
        accessToken: { label: 'accessToken', type: 'text' },
        refreshToken: { label: 'refreshToken', type: 'text' },
        impersonatedBy: { label: 'impersonatedBy', type: 'text' },
      },
      async authorize(credentials) {
        const access = credentials?.accessToken;
        const refresh = credentials?.refreshToken;
        if (!access || !refresh) return null;
        try {
          const res = await fetch(`${API_URL}/auth/me/`, {
            headers: { Authorization: `Bearer ${access}` },
          });
          if (!res.ok) return null;
          const user = await res.json();
          return userFromPayload(user, access, refresh, {
            impersonatedBy: credentials?.impersonatedBy || null,
          });
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.tenant = (user as any).tenant;
        token.impersonatedBy = (user as any).impersonatedBy ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).role = token.role;
      (session as any).tenant = token.tenant;
      (session as any).impersonatedBy = token.impersonatedBy ?? null;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
