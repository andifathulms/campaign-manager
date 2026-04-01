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
