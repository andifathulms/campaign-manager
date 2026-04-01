import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// NEXTAUTH_BACKEND_URL is for server-side (container-to-container).
// NEXT_PUBLIC_API_URL is browser-only — cannot be used inside authorize().
const API_URL = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/v1';

export const authOptions: NextAuthOptions = {
  providers: [
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
          return {
            id: data.user.id,
            name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
            email: data.user.email,
            accessToken: data.access,
            refreshToken: data.refresh,
            role: data.user.role,
            tenant: data.user.tenant,
          };
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
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).role = token.role;
      (session as any).tenant = token.tenant;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
