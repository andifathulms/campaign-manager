'use client';

import { useState } from 'react';
import { ClipboardList, Clock, MapPin, Star, Check, Upload } from 'lucide-react';
import { useTaskPool, useMyAssignments, useAssignTask, useCompleteAssignment } from '@/hooks/useVolunteerTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PoolTask, TaskAssignment } from '@/hooks/useVolunteerTasks';

const KATEGORI_COLORS: Record<string, string> = {
  sosialisasi: 'bg-blue-100 text-blue-700',
  pembagian_materi: 'bg-orange-100 text-orange-700',
  pendataan: 'bg-emerald-100 text-emerald-700',
  event: 'bg-violet-100 text-violet-700',
  digital: 'bg-pink-100 text-pink-700',
};

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
};

function CompleteModal({ assignment, onClose }: { assignment: TaskAssignment; onClose: () => void }) {
  const complete = useCompleteAssignment();
  const [notes, setNotes] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('evidence_notes', notes);
    await complete.mutateAsync({ id: assignment.id, data: fd });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Selesaikan Tugas</h2>
        <p className="text-sm text-muted-foreground mb-4">{assignment.task_judul}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan / Bukti</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Jelaskan hasil kerja Anda..."
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={complete.isPending} className="flex-1">
              {complete.isPending ? 'Mengirim...' : 'Tandai Selesai'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VolunteerTasksPage() {
  const [tab, setTab] = useState<'pool' | 'my'>('pool');
  const [kategori, setKategori] = useState('');
  const { data: pool, isLoading: poolLoading } = useTaskPool(kategori || undefined);
  const { data: my, isLoading: myLoading } = useMyAssignments();
  const assign = useAssignTask();
  const [completing, setCompleting] = useState<TaskAssignment | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <ClipboardList className="w-5 h-5" /> Tugas
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[{ key: 'pool', label: 'Pool Tugas' }, { key: 'my', label: 'Tugas Saya' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'pool' | 'my')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pool' && (
        <>
          <select
            value={kategori}
            onChange={e => setKategori(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input text-sm bg-white"
          >
            <option value="">Semua Kategori</option>
            <option value="sosialisasi">Sosialisasi</option>
            <option value="pembagian_materi">Pembagian Materi</option>
            <option value="pendataan">Pendataan</option>
            <option value="event">Event</option>
            <option value="digital">Digital</option>
          </select>

          {poolLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : !pool?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada tugas tersedia.</p>
          ) : (
            <div className="space-y-3">
              {pool.map((t: PoolTask) => (
                <Card key={t.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold">{t.judul}</h3>
                          {t.kategori && <Badge className={KATEGORI_COLORS[t.kategori] || 'bg-slate-100'}>{t.kategori_display}</Badge>}
                        </div>
                        {t.deskripsi && <p className="text-xs text-muted-foreground line-clamp-2">{t.deskripsi}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {t.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.deadline}</span>}
                          {t.wilayah && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.wilayah}</span>}
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{t.poin_reward} poin</span>
                          <span>{t.assignments_count}/{t.capacity} peserta</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={t.is_full || assign.isPending}
                        onClick={() => assign.mutate(t.id)}
                      >
                        Ambil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'my' && (
        myLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : !my?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Anda belum mengambil tugas.</p>
        ) : (
          <div className="space-y-3">
            {my.map((a: TaskAssignment) => (
              <Card key={a.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{a.task_judul}</h3>
                        <Badge className={STATUS_COLORS[a.status] || 'bg-slate-100'}>{a.status_display}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {a.task_deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.task_deadline}</span>}
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{a.task_poin_reward} poin</span>
                      </div>
                    </div>
                    {a.status === 'in_progress' && (
                      <Button size="sm" variant="outline" onClick={() => setCompleting(a)}>
                        <Check className="w-3.5 h-3.5 mr-1" /> Selesai
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {completing && <CompleteModal assignment={completing} onClose={() => setCompleting(null)} />}
    </div>
  );
}
