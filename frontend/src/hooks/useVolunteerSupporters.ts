import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface VolunteerSupporterSummary {
  total: number;
  today: number;
  by_kecamatan: { kecamatan: string; count: number }[];
  points_from_supporters: number;
}

export function useVolunteerSupporterSummary() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-supporter-summary'],
    queryFn: () =>
      axios
        .get<VolunteerSupporterSummary>(`${apiBase}/volunteer/supporters/summary/`, { headers: authHeaders(token!) })
        .then(r => r.data),
    enabled: !!token,
  });
}

export function useCreateVolunteerSupporter() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      nama: string;
      phone: string;
      email?: string;
      kelurahan: string;
      kecamatan: string;
      kabupaten_kota: string;
      provinsi: string;
    }) =>
      axios
        .post(`${apiBase}/volunteer/supporters/`, data, { headers: authHeaders(token!) })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-supporter-summary'] });
      qc.invalidateQueries({ queryKey: ['volunteer-points'] });
    },
  });
}
