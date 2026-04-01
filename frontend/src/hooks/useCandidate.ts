import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import type { CandidateProfile } from '@/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function useCandidate() {
  const { data: session, status: sessionStatus } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const query = useQuery({
    queryKey: ['candidate', token],
    queryFn: () =>
      axios
        .get<CandidateProfile>(`${apiBase}/candidates/me/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
    // Low staleTime so stale cache doesn't persist across serializer changes
    staleTime: 10_000,
    retry: false,
  });

  // While session is still initialising, token is undefined and the query is
  // disabled — but isLoading would be false, causing pages to render with
  // candidate=undefined. Override isLoading to cover that window.
  const isLoading = sessionStatus === 'loading' || query.isLoading;

  return { ...query, isLoading };
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
