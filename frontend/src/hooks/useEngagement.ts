import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }
function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export interface Aspirasi {
  id: string; nama: string; phone: string; email: string;
  pesan: string; tema: string; tema_display: string;
  wilayah: string; status: string; status_display: string;
  balasan_publik: string; is_published: boolean; created_at: string;
}

export interface PollOption { id: string; teks: string; vote_count: number; pct: number; }
export interface Poll {
  id: string; pertanyaan: string; status: string; status_display: string;
  ends_at: string | null; options: PollOption[]; total_votes: number; created_at: string;
}

// ── Aspirasi ─────────────────────────────────────────────────────────────────

export function useAspirasi(filters?: { status?: string; tema?: string }) {
  const { token, loading } = useToken();
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.tema) params.set('tema', filters.tema);
  return useQuery<Aspirasi[]>({
    queryKey: ['aspirasi', token, filters],
    queryFn: () => axios.get<Aspirasi[]>(`${apiBase}/engagement/aspirasi/?${params}`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as Aspirasi[]),
    enabled: !!token && !loading,
    staleTime: 15_000,
    retry: false,
  });
}

export function useReplyAspirasi() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; balasan_publik?: string; is_published?: boolean; status?: string }) =>
      axios.patch(`${apiBase}/engagement/aspirasi/${id}/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aspirasi'] }),
  });
}

export function useDeleteAspirasi() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/engagement/aspirasi/${id}/`, { headers: auth(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aspirasi'] }),
  });
}

// ── Polls ─────────────────────────────────────────────────────────────────────

export function usePolls() {
  const { token, loading } = useToken();
  return useQuery<Poll[]>({
    queryKey: ['polls', token],
    queryFn: () => axios.get<Poll[]>(`${apiBase}/engagement/polls/`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as Poll[]),
    enabled: !!token && !loading,
    staleTime: 15_000,
    retry: false,
  });
}

export function useCreatePoll() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pertanyaan: string; ends_at?: string; options: string[] }) =>
      axios.post(`${apiBase}/engagement/polls/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useUpdatePoll() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string }) =>
      axios.patch(`${apiBase}/engagement/polls/${id}/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  });
}

export function useDeletePoll() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/engagement/polls/${id}/`, { headers: auth(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['polls'] }),
  });
}
