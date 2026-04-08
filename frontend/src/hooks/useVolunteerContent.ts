import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface ContentShareItem {
  id: string;
  content: string;
  content_judul: string;
  content_caption: string;
  volunteer: string;
  volunteer_nama: string;
  tracking_code: string;
  proof_url: string;
  proof_screenshot: string | null;
  view_count: number;
  points_earned: number;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  expires_at: string;
  last_updated_views_at: string | null;
  created_at: string;
}

export function useVolunteerDailyContent() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-daily-content'],
    queryFn: () =>
      axios.get(`${apiBase}/volunteer/content/daily/`, { headers: authHeaders(token!) }).then(r => r.data),
    enabled: !!token,
  });
}

export function useShareContent() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) =>
      axios.post(`${apiBase}/volunteer/content/${contentId}/share/`, {}, { headers: authHeaders(token!) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-my-shares'] });
    },
  });
}

export function useUpdateShare() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) =>
      axios.patch<ContentShareItem>(`${apiBase}/volunteer/content/shares/${id}/`, data, {
        headers: authHeaders(token!),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-my-shares'] });
    },
  });
}

export function useVolunteerMyShares() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-my-shares'],
    queryFn: () =>
      axios.get<ContentShareItem[]>(`${apiBase}/volunteer/content/shares/my/`, { headers: authHeaders(token!) }).then(r => r.data),
    enabled: !!token,
  });
}

// Admin hooks
export function useAdminContentShares(statusFilter?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['admin-content-shares', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return axios.get<ContentShareItem[]>(`${apiBase}/content/shares/${params}`, { headers: authHeaders(token!) }).then(r => r.data);
    },
    enabled: !!token,
  });
}

export function useVerifyShare() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      axios.patch<ContentShareItem>(`${apiBase}/content/shares/${id}/verify/`, { action }, { headers: authHeaders(token!) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-content-shares'] });
    },
  });
}
