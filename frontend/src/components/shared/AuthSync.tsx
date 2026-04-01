'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setAuthToken } from '@/lib/api';

export function AuthSync() {
  const { data: session } = useSession();
  useEffect(() => {
    setAuthToken((session as any)?.accessToken ?? null);
  }, [session]);
  return null;
}
