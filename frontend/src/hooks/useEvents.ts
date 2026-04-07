'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface CampaignEvent {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  status_display: string;
  target_peserta: number;
  live_url: string;
  attendee_count: number;
  created_at: string;
}

export interface CampaignEventAttendance {
  id: string;
  team_member: string;
  team_member_nama: string;
  team_member_level: string;
  team_member_wilayah: string;
  qr_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
}

function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export function useCampaignEvents(statusFilter?: string) {
  const { token, loading } = useToken();
  return useQuery<CampaignEvent[]>({
    queryKey: ['events', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return api.get<CampaignEvent[]>(`/events/${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as CampaignEvent[]);
    },
    enabled: !!token && !loading,
    staleTime: 30_000,
  });
}

export function useCreateCampaignEvent() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CampaignEvent>) =>
      api.post<CampaignEvent>('/events/', data, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateCampaignEvent() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignEvent> }) =>
      api.patch<CampaignEvent>(`/events/${id}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteCampaignEvent() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/events/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useCampaignEventAttendances(eventId: string) {
  const { token, loading } = useToken();
  return useQuery<CampaignEventAttendance[]>({
    queryKey: ['event-attendances', eventId],
    queryFn: () =>
      api.get<CampaignEventAttendance[]>(`/events/${eventId}/attendances/`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as CampaignEventAttendance[]),
    enabled: !!token && !loading && !!eventId,
  });
}

export function useQRCheckIn(eventId: string) {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (qr_code: string) =>
      api.post(`/events/${eventId}/checkin/`, { qr_code }, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-attendances', eventId] }),
  });
}
