import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }
function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export interface AdCreative {
  id: string; judul: string; media_type: string; media_type_display: string;
  file_url: string | null; caption: string; tema: string; tema_display: string;
  platform_tags: string[]; is_active: boolean; created_at: string;
}

export interface ContentShare {
  id: string; content: string; content_judul: string; content_caption: string;
  volunteer: string; volunteer_nama: string; tracking_code: string;
  proof_url: string | null; view_count: number; points_earned: number;
  status: string; status_display: string; created_at: string;
}

export function useAdminContentShares(statusFilter?: string) {
  const { token } = useToken();
  const params = statusFilter ? `?status=${statusFilter}` : '';
  return useQuery({
    queryKey: ['admin-content-shares', token, statusFilter],
    queryFn: () => axios.get<ContentShare[]>(`${apiBase}/content/shares/${params}`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 15_000,
    retry: false,
  });
}

export function useVerifyShare() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; action: 'approve' | 'reject' }) =>
      axios.patch(`${apiBase}/content/shares/${vars.id}/verify/`, { action: vars.action }, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-content-shares'] }),
  });
}

export interface ContentItem {
  id: string; judul: string; caption: string;
  platform: string; platform_display: string;
  jenis: string; jenis_display: string;
  status: string; status_display: string;
  scheduled_at: string | null; published_at: string | null;
  tags: string[]; notes: string;
  creative: string | null; creative_detail: AdCreative | null;
  created_at: string;
  is_daily_content?: boolean;
  reward_per_100_views?: number;
  reward_max_cap?: number;
}

// ── Content Calendar ──────────────────────────────────────────────────────────

export function useContentCalendar(filters?: { platform?: string; status?: string; month?: string }) {
  const { token, loading } = useToken();
  const params = new URLSearchParams();
  if (filters?.platform) params.set('platform', filters.platform);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.month) params.set('month', filters.month);
  return useQuery<ContentItem[]>({
    queryKey: ['content-calendar', token, filters],
    queryFn: () => axios.get<ContentItem[]>(`${apiBase}/content/calendar/?${params}`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as ContentItem[]),
    enabled: !!token && !loading,
    staleTime: 15_000,
    retry: false,
  });
}

export function useCreateContentItem() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContentItem>) => axios.post(`${apiBase}/content/calendar/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-calendar'] }),
  });
}

export function useUpdateContentItem() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<ContentItem> & { id: string }) =>
      axios.patch(`${apiBase}/content/calendar/${id}/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-calendar'] }),
  });
}

export function useDeleteContentItem() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/content/calendar/${id}/`, { headers: auth(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content-calendar'] }),
  });
}

// ── Ad Creative Library ───────────────────────────────────────────────────────

export function useAdCreatives(filters?: { tema?: string; media_type?: string; search?: string }) {
  const { token, loading } = useToken();
  const params = new URLSearchParams();
  if (filters?.tema) params.set('tema', filters.tema);
  if (filters?.media_type) params.set('media_type', filters.media_type);
  if (filters?.search) params.set('search', filters.search);
  return useQuery<AdCreative[]>({
    queryKey: ['ad-creatives', token, filters],
    queryFn: () => axios.get<AdCreative[]>(`${apiBase}/content/library/?${params}`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as AdCreative[]),
    enabled: !!token && !loading,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateAdCreative() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      axios.post(`${apiBase}/content/library/`, formData, {
        headers: { ...auth(token!), 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-creatives'] }),
  });
}

export function useDeleteAdCreative() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/content/library/${id}/`, { headers: auth(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-creatives'] }),
  });
}
