import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Types
export interface PointRule {
  id: string;
  action_type: string;
  action_type_display: string;
  points: number;
  is_active: boolean;
}

export interface PointTransaction {
  id: string;
  team_member: string;
  team_member_nama: string;
  action_type: string;
  points: number;
  description: string;
  reference_id: string | null;
  reference_type: string;
  created_at: string;
}

export interface VolunteerPointsData {
  total_points: number;
  transactions: PointTransaction[];
}

// Admin hooks
export function usePointRules() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['point-rules'],
    queryFn: () =>
      axios
        .get<PointRule[]>(`${apiBase}/teams/points/rules/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
  });
}

export function useUpdatePointRule() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ actionType, data }: { actionType: string; data: Partial<PointRule> }) =>
      axios
        .put(`${apiBase}/teams/points/rules/${actionType}/`, data, { headers: authHeaders(token!) })
        .then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['point-rules'] }),
  });
}

export function usePointTransactions(teamMemberId?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['point-transactions', teamMemberId],
    queryFn: () => {
      const params = teamMemberId ? `?team_member=${teamMemberId}` : '';
      return axios
        .get<PointTransaction[]>(`${apiBase}/teams/points/transactions/${params}`, { headers: authHeaders(token!) })
        .then(r => r.data);
    },
    enabled: !!token,
  });
}

// Volunteer hook
export function useVolunteerPoints() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-points'],
    queryFn: () =>
      axios
        .get<VolunteerPointsData>(`${apiBase}/volunteer/points/my/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
  });
}
