import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }

function useToken() {
  const { data: session, status } = useSession();
  return { token: (session as any)?.accessToken as string | undefined, loading: status === 'loading' };
}

export interface Task {
  id: string;
  judul: string;
  deskripsi: string;
  prioritas: 'high' | 'medium' | 'low';
  prioritas_display: string;
  status: 'assigned' | 'in_progress' | 'done';
  status_display: string;
  deadline: string | null;
  wilayah: string;
  assigned_to: string;
  assigned_to_nama: string;
  assigned_by_nama: string;
  is_overdue: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TaskStats {
  total: number;
  assigned: number;
  in_progress: number;
  done: number;
  overdue: number;
}

export function useTasks(filters?: { status?: string; assigned_to?: string; prioritas?: string }) {
  const { token, loading } = useToken();
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to);
  if (filters?.prioritas) params.set('prioritas', filters.prioritas);
  return useQuery<Task[]>({
    queryKey: ['tasks', token, filters],
    queryFn: () => axios.get<Task[]>(`${apiBase}/teams/tasks/?${params}`, { headers: auth(token!) }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as Task[]),
    enabled: !!token && !loading,
    staleTime: 15_000,
    retry: false,
  });
}

export function useTaskStats() {
  const { token } = useToken();
  return useQuery<TaskStats>({
    queryKey: ['task-stats', token],
    queryFn: () => axios.get<TaskStats>(`${apiBase}/teams/tasks/stats/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 15_000,
    retry: false,
  });
}

export function useCreateTask() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => axios.post(`${apiBase}/teams/tasks/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task-stats'] }); },
  });
}

export function useUpdateTask() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      axios.patch(`${apiBase}/teams/tasks/${id}/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task-stats'] }); },
  });
}

export function useDeleteTask() {
  const { token } = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axios.delete(`${apiBase}/teams/tasks/${id}/`, { headers: auth(token!) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task-stats'] }); },
  });
}
