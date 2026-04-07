'use client';

import { useState } from 'react';
import { Plus, BarChart3, Trash2, Play, Square } from 'lucide-react';
import { usePolls, useCreatePoll, useUpdatePoll, useDeletePoll } from '@/hooks/useEngagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Poll } from '@/hooks/useEngagement';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-red-100 text-red-700',
};

function CreatePollModal({ onClose }: { onClose: () => void }) {
  const create = useCreatePoll();
  const [pertanyaan, setPertanyaan] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endsAt, setEndsAt] = useState('');

  const addOption = () => { if (options.length < 5) setOptions(o => [...o, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i)); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = options.filter(o => o.trim());
    if (filtered.length < 2) return;
    await create.mutateAsync({ pertanyaan, options: filtered, ends_at: endsAt || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">Buat Poll Baru</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pertanyaan</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={pertanyaan}
              onChange={e => setPertanyaan(e.target.value)}
              placeholder="Program mana yang paling Anda butuhkan?"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilihan Jawaban (2–5)</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Pilihan ${i + 1}`}
                    value={opt}
                    onChange={e => setOptions(o => o.map((x, idx) => idx === i ? e.target.value : x))}
                    required
                  />
                  {i >= 2 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <button type="button" onClick={addOption} className="text-indigo-600 text-xs font-medium hover:underline">
                  + Tambah pilihan
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Batas Waktu <span className="text-muted-foreground text-xs">(opsional)</span></label>
            <Input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Menyimpan...' : 'Buat Poll'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const update = useUpdatePoll();
  const del = useDeletePoll();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{poll.pertanyaan}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[poll.status]}`}>{poll.status_display}</span>
            {poll.status === 'draft' && (
              <button title="Aktifkan" onClick={() => update.mutate({ id: poll.id, status: 'active' })} className="text-emerald-600 hover:text-emerald-700">
                <Play className="w-4 h-4" />
              </button>
            )}
            {poll.status === 'active' && (
              <button title="Tutup" onClick={() => update.mutate({ id: poll.id, status: 'closed' })} className="text-red-500 hover:text-red-600">
                <Square className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => del.mutate(poll.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <CardDescription>{poll.total_votes} suara · {new Date(poll.created_at).toLocaleDateString('id-ID')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {poll.options.map(opt => (
          <div key={opt.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{opt.teks}</span>
              <span className="font-semibold text-xs">{opt.vote_count} ({opt.pct}%)</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${opt.pct}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function PollsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: polls, isLoading } = usePolls();

  return (
    <div className="p-8 w-full">
      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Survey & Poll</h1>
          <p className="text-muted-foreground text-sm mt-1">Buat survei singkat untuk mengetahui preferensi pemilih.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Buat Poll
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-48 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : !polls?.length ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Belum ada poll</p>
          <p className="text-xs text-muted-foreground mt-1">Buat poll untuk mengetahui isu apa yang paling diperhatikan pemilih Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {polls.map(p => <PollCard key={p.id} poll={p} />)}
        </div>
      )}
    </div>
  );
}
