import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }
function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export interface ElectabilitySurvey {
  id: string;
  tanggal: string;
  elektabilitas_pct: number;
  sumber: string;
  catatan: string;
  sample_size: number | null;
  created_at: string;
}

export function useElectabilityData() {
  const { token, loading } = useToken();
  return useQuery<ElectabilitySurvey[]>({
    queryKey: ['electability', token],
    queryFn: () => axios.get<ElectabilitySurvey[]>(`${apiBase}/analytics/electability/`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as ElectabilitySurvey[]),
    enabled: !!token && !loading,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAddElectabilityEntry() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ElectabilitySurvey, 'id' | 'created_at'>) =>
      axios.post(`${apiBase}/analytics/electability/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['electability'] }),
  });
}

export function useDeleteElectabilityEntry() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/analytics/electability/${id}/`, { headers: auth(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['electability'] }),
  });
}
