import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import type { CandidateProfile } from '@/types';

// Direct axios instance that uses the session token inline —
// avoids the race condition between AuthSync useEffect and query firing.
const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function useCandidate() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['candidate', token],
    queryFn: () =>
      axios
        .get<CandidateProfile>(`${apiBase}/candidates/me/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateCandidate() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | Partial<CandidateProfile>) => {
      const isFormData = data instanceof FormData;
      return axios
        .put<CandidateProfile>(`${apiBase}/candidates/me/`, data, {
          headers: {
            ...authHeaders(token!),
            ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
          },
        })
        .then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });
}
