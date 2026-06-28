import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import type { TeamMember } from '@/types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function useTeamMembers() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['team-members', token],
    queryFn: () =>
      axios
        .get<{ results: TeamMember[] } | TeamMember[]>(`${apiBase}/teams/members/`, { headers: authHeaders(token!) })
        .then(r => Array.isArray(r.data) ? r.data : r.data.results),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export interface RelawanRequest {
  id: string;
  nama: string;
  phone: string;
  email: string | null;
  wilayah_name: string;
  kecamatan: string;
  kabupaten_kota: string;
  alasan_bergabung: string;
  referred_by_nama: string | null;
  status: string;
  source: string;
  created_at: string;
}

export function useRelawanRequests() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  return useQuery({
    queryKey: ['relawan-requests', token],
    queryFn: () =>
      axios.get<RelawanRequest[]>(`${apiBase}/teams/relawan/requests/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
    staleTime: 15_000,
    retry: false,
  });
}

export function useApproveRelawan() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axios.post(`${apiBase}/teams/relawan/requests/${id}/approve/`, {}, { headers: authHeaders(token!) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relawan-requests'] });
      qc.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}

export function useRejectRelawan() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      axios.post(`${apiBase}/teams/relawan/requests/${vars.id}/reject/`,
        { rejection_reason: vars.reason }, { headers: authHeaders(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relawan-requests'] }),
  });
}

export function useLeaderboard() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['team-leaderboard', token],
    queryFn: () =>
      axios
        .get<{ results: TeamMember[] } | TeamMember[]>(`${apiBase}/teams/leaderboard/`, { headers: authHeaders(token!) })
        .then(r => Array.isArray(r.data) ? r.data : r.data.results),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateTeamMember() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TeamMember>) =>
      axios
        .post<TeamMember>(`${apiBase}/teams/members/`, data, { headers: authHeaders(token!) })
        .then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-leaderboard'] });
    },
  });
}

export function useSetMemberPassword() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; password?: string }) =>
      axios
        .post<{ username: string; phone: string; password: string }>(
          `${apiBase}/teams/members/${vars.id}/set-password/`,
          vars.password ? { password: vars.password } : {},
          { headers: authHeaders(token!) },
        )
        .then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });
}

export function useDeleteTeamMember() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      axios.delete(`${apiBase}/teams/members/${id}/`, { headers: authHeaders(token!) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
  });
}
