import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface VolunteerOverview {
  total_points: number;
  active_tasks: number;
  supporters_this_month: number;
  shares_this_month: number;
  leaderboard_rank: number;
  announcements: {
    id: string;
    judul: string;
    isi: string;
    is_pinned: boolean;
    created_at: string;
  }[];
}

export function useVolunteerOverview() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-overview'],
    queryFn: () =>
      axios
        .get<VolunteerOverview>(`${apiBase}/volunteer/overview/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(r => r.data),
    enabled: !!token,
    refetchInterval: 60_000,
  });
}
