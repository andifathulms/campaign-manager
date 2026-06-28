import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface TenantStats {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'premium' | 'enterprise';
  is_active: boolean;
  created_at: string;
  agency_name: string | null;
  nama_lengkap: string | null;
  partai: string | null;
  jenis_pemilihan: string | null;
  candidate_status: 'draft' | 'published' | 'paused' | null;
  supporter_count: number;
  team_count: number;
  ads_spend: number;
  page_views: number;
}

export interface PlatformOverview {
  total_campaigns: number;
  active_campaigns: number;
  published_campaigns: number;
  total_supporters: number;
  total_spend: number;
  by_plan: Record<string, number>;
}

function useToken() {
  const { data: session } = useSession();
  return (session as any)?.accessToken as string | undefined;
}

export function usePlatformOverview() {
  const token = useToken();
  return useQuery({
    queryKey: ['platform-overview', token],
    queryFn: () => axios.get<PlatformOverview>(`${apiBase}/platform/overview/`, { headers: authHeaders(token) }).then(r => r.data),
    enabled: !!token,
  });
}

export function usePlatformTenants(params: { search?: string; plan?: string; is_active?: string } = {}) {
  const token = useToken();
  return useQuery({
    queryKey: ['platform-tenants', token, params],
    queryFn: () =>
      axios.get(`${apiBase}/platform/tenants/`, { headers: authHeaders(token), params })
        .then(r => r.data as { count: number; results: TenantStats[] }),
    enabled: !!token,
  });
}

export function usePlatformTenant(id: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['platform-tenant', id, token],
    queryFn: () => axios.get<TenantStats>(`${apiBase}/platform/tenants/${id}/`, { headers: authHeaders(token) }).then(r => r.data),
    enabled: !!token && !!id,
  });
}

export function useUpdateTenant() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; is_active?: boolean; candidate_status?: string }) =>
      axios.patch<TenantStats>(`${apiBase}/platform/tenants/${id}/`, body, { headers: authHeaders(token) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-tenants'] });
      qc.invalidateQueries({ queryKey: ['platform-tenant'] });
      qc.invalidateQueries({ queryKey: ['platform-overview'] });
    },
  });
}

export interface ProvisionInput {
  nama_lengkap: string;
  username: string;
  email?: string;
  tenant_name: string;
  tenant_slug: string;
  plan: string;
  partai?: string;
  dapil?: string;
  jenis_pemilihan: string;
}

export function useProvisionCandidate() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProvisionInput) =>
      axios.post(`${apiBase}/platform/candidates/`, data, { headers: authHeaders(token) })
        .then(r => r.data as { tenant_id: string; slug: string; username: string; temp_password: string }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-tenants'] });
      qc.invalidateQueries({ queryKey: ['platform-overview'] });
    },
  });
}

export function useImpersonate() {
  const token = useToken();
  return useMutation({
    mutationFn: (tenantId: string) =>
      axios.post(`${apiBase}/platform/tenants/${tenantId}/impersonate/`, {}, { headers: authHeaders(token) })
        .then(r => r.data as { access: string; refresh: string; user: { id: string; username: string } }),
  });
}

export interface StaffUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  temp_password?: string;
}

export function usePlatformAdmins() {
  const token = useToken();
  return useQuery({
    queryKey: ['platform-admins', token],
    queryFn: () => axios.get(`${apiBase}/platform/admins/`, { headers: authHeaders(token) }).then(r => r.data as { results: StaffUser[] } | StaffUser[]),
    enabled: !!token,
  });
}

export function useCreateAdmin() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; email?: string; first_name?: string; last_name?: string; role: string; password?: string }) =>
      axios.post(`${apiBase}/platform/admins/`, data, { headers: authHeaders(token) }).then(r => r.data as StaffUser),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-admins'] }),
  });
}
