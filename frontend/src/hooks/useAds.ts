import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }

function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export interface AdsAccount {
  id: string; platform: string; platform_display: string;
  account_id: string; account_name: string; is_active: boolean;
  last_synced_at: string | null; created_at: string;
}

export interface AdsCampaign {
  id: string; platform: string; platform_label: string;
  campaign_id: string; campaign_name: string; status: string;
  reach: number; impressions: number; clicks: number;
  spend: string; spend_display: string; cpm: string | null; ctr: string | null;
  snapshot_date: string;
}

export interface AdsDashboard {
  total_spend: number; total_reach: number; total_impressions: number;
  total_clicks: number; accounts_count: number;
  by_platform: Array<{ platform: string; label: string; spend: number; reach: number; impressions: number; clicks: number }>;
  recent_campaigns: AdsCampaign[];
  budget: Budget | null;
}

export interface Budget {
  id: string; total_budget: number; allocations: Record<string, number>;
  period_start: string; period_end: string; alert_threshold_pct: number;
  notes: string; total_spend: number; spend_pct: number;
}

export function useAdsDashboard() {
  const { token, loading } = useToken();
  return useQuery({
    queryKey: ['ads-dashboard', token],
    queryFn: () => axios.get<AdsDashboard>(`${apiBase}/ads/dashboard/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAdsAccounts() {
  const { token } = useToken();
  return useQuery({
    queryKey: ['ads-accounts', token],
    queryFn: () => axios.get<AdsAccount[]>(`${apiBase}/ads/accounts/`, { headers: auth(token!) }).then(r => Array.isArray(r.data) ? r.data : (r.data as any).results ?? []),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export function useConnectAdsAccount() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { platform: string; account_id: string; account_name: string; access_token: string }) =>
      axios.post(`${apiBase}/ads/accounts/connect/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads-accounts'] }); qc.invalidateQueries({ queryKey: ['ads-dashboard'] }); },
  });
}

export function useDisconnectAdsAccount() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/ads/accounts/${id}/`, { headers: auth(token!) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ads-accounts'] }); qc.invalidateQueries({ queryKey: ['ads-dashboard'] }); },
  });
}

export function useBudget() {
  const { token } = useToken();
  return useQuery({
    queryKey: ['budget', token],
    queryFn: () => axios.get<Budget>(`${apiBase}/ads/budget/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateBudget() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Budget>) => axios.put(`${apiBase}/ads/budget/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); qc.invalidateQueries({ queryKey: ['ads-dashboard'] }); },
  });
}

export function useDashboardOverview() {
  const { token } = useToken();
  return useQuery({
    queryKey: ['dashboard-overview', token],
    queryFn: () => axios.get(`${apiBase}/dashboard/overview/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });
}
