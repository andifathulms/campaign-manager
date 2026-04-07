'use client';

import { useState } from 'react';
import { Plus, Clock, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useTasks, useTaskStats, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/hooks/useTasks';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};
const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
};

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const { data: members } = useTeamMembers();
  const createTask = useCreateTask();
  const [form, setForm] = useState({
    judul: '', deskripsi: '', prioritas: 'medium',
    deadline: '', wilayah: '', assigned_to: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask.mutateAsync({
      ...form,
      deadline: form.deadline || undefined,
    } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">Buat Tugas Baru</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Tugas</Label>
            <Input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} required placeholder="Sosialisasi di Kec. Coblong" />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.deskripsi}
              onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
              placeholder="Detail tugas..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioritas</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.prioritas} onChange={e => setForm(f => ({ ...f, prioritas: e.target.value }))}>
                <option value="high">Tinggi</option>
                <option value="medium">Sedang</option>
                <option value="low">Rendah</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ditugaskan Kepada</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} required>
                <option value="">Pilih anggota...</option>
                {(members ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.nama} ({m.level_display})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Wilayah <span className="text-muted-foreground text-xs">(opsional)</span></Label>
              <Input value={form.wilayah} onChange={e => setForm(f => ({ ...f, wilayah: e.target.value }))} placeholder="Kec. Coblong" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createTask.isPending} className="flex-1">
              {createTask.isPending ? 'Menyimpan...' : 'Buat Tugas'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const update = useUpdateTask();
  const del = useDeleteTask();

  const nextStatus = task.status === 'assigned' ? 'in_progress' : task.status === 'in_progress' ? 'done' : null;
  const nextLabel = task.status === 'assigned' ? 'Mulai' : task.status === 'in_progress' ? 'Selesai' : null;

  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm ${task.is_overdue ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.prioritas]}`}>{task.prioritas_display}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{task.status_display}</span>
            {task.is_overdue && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Terlambat</span>}
          </div>
          <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.judul}</p>
          {task.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.deskripsi}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>→ {task.assigned_to_nama}</span>
            {task.wilayah && <span>📍 {task.wilayah}</span>}
            {task.deadline && (
              <span className={`flex items-center gap-1 ${task.is_overdue ? 'text-red-500' : ''}`}>
                <Clock className="w-3 h-3" /> {task.deadline}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {nextStatus && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => update.mutate({ id: task.id, status: nextStatus })}>
              {nextLabel}
            </Button>
          )}
          {task.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          <button onClick={() => del.mutate(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: tasks, isLoading } = useTasks(statusFilter ? { status: statusFilter } : undefined);
  const { data: stats } = useTaskStats();

  return (
    <div className="p-8 w-full">
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tugas Tim</h1>
          <p className="text-muted-foreground text-sm mt-1">Tugaskan dan pantau pekerjaan tim sukses Anda.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Buat Tugas
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats?.total ?? 0, color: 'text-foreground' },
          { label: 'Ditugaskan', value: stats?.assigned ?? 0, color: 'text-slate-600' },
          { label: 'Dikerjakan', value: stats?.in_progress ?? 0, color: 'text-blue-600' },
          { label: 'Selesai', value: stats?.done ?? 0, color: 'text-emerald-600' },
          { label: 'Terlambat', value: stats?.overdue ?? 0, color: 'text-red-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Semua' },
          { value: 'assigned', label: 'Ditugaskan' },
          { value: 'in_progress', label: 'Dikerjakan' },
          { value: 'done', label: 'Selesai' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${statusFilter === f.value ? 'bg-indigo-600 text-white' : 'bg-white border border-border text-muted-foreground hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : !tasks?.length ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Belum ada tugas</p>
          <p className="text-xs text-muted-foreground mt-1">Klik "Buat Tugas" untuk mulai menugaskan pekerjaan ke tim Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}
