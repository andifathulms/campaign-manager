import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import type { Supporter, SupporterStats } from '@/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function useSupporters(search?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['supporters', token, search],
    queryFn: () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      return axios
        .get<{ results: Supporter[] } | Supporter[]>(`${apiBase}/supporters/${params}`, { headers: authHeaders(token!) })
        .then(r => Array.isArray(r.data) ? r.data : r.data.results);
    },
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export function useSupporterStats() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['supporter-stats', token],
    queryFn: () =>
      axios
        .get<SupporterStats>(`${apiBase}/supporters/stats/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}
