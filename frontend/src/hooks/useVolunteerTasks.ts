import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface PoolTask {
  id: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  kategori_display: string;
  prioritas: string;
  prioritas_display: string;
  deadline: string | null;
  wilayah: string;
  poin_reward: number;
  capacity: number;
  assignments_count: number;
  is_full: boolean;
  created_at: string;
}

export interface TaskAssignment {
  id: string;
  task: string;
  task_judul: string;
  task_deadline: string | null;
  task_poin_reward: number;
  volunteer: string;
  volunteer_nama: string;
  status: 'in_progress' | 'completed' | 'expired' | 'rejected';
  status_display: string;
  evidence_photo: string | null;
  evidence_notes: string;
  completed_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export function useTaskPool(kategori?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-task-pool', kategori],
    queryFn: () => {
      const params = kategori ? `?kategori=${kategori}` : '';
      return axios
        .get<PoolTask[]>(`${apiBase}/volunteer/tasks/pool/${params}`, { headers: authHeaders(token!) })
        .then(r => r.data);
    },
    enabled: !!token,
  });
}

export function useMyAssignments(statusFilter?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['volunteer-my-assignments', statusFilter],
    queryFn: () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      return axios
        .get<TaskAssignment[]>(`${apiBase}/volunteer/tasks/my/${params}`, { headers: authHeaders(token!) })
        .then(r => r.data);
    },
    enabled: !!token,
  });
}

export function useAssignTask() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      axios
        .post<TaskAssignment>(`${apiBase}/volunteer/tasks/${taskId}/assign/`, {}, { headers: authHeaders(token!) })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-task-pool'] });
      qc.invalidateQueries({ queryKey: ['volunteer-my-assignments'] });
    },
  });
}

export function useCompleteAssignment() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      axios
        .patch<TaskAssignment>(`${apiBase}/volunteer/tasks/assignments/${id}/complete/`, data, {
          headers: { ...authHeaders(token!), 'Content-Type': 'multipart/form-data' },
        })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-my-assignments'] });
      qc.invalidateQueries({ queryKey: ['volunteer-points'] });
    },
  });
}

export function useApproveAssignment() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      axios
        .patch<TaskAssignment>(`${apiBase}/teams/tasks/assignments/${id}/approve/`, { action }, { headers: authHeaders(token!) })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-my-assignments'] });
    },
  });
}
