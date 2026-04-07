'use client';

import { useState } from 'react';
import { Plus, Calendar, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useContentCalendar, useCreateContentItem, useUpdateContentItem, useDeleteContentItem } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { ContentItem } from '@/hooks/useContent';

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-100 text-pink-700', tiktok: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700', youtube: 'bg-red-100 text-red-700',
  twitter: 'bg-sky-100 text-sky-700', meta_ads: 'bg-blue-100 text-blue-700',
  tiktok_ads: 'bg-pink-100 text-pink-700',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600', scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function CreateItemModal({ onClose, defaultDate }: { onClose: () => void; defaultDate?: string }) {
  const create = useCreateContentItem();
  const [form, setForm] = useState({
    judul: '', platform: 'instagram', jenis: 'post', status: 'draft',
    scheduled_at: defaultDate ? `${defaultDate}T09:00` : '', caption: '', notes: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ ...form, scheduled_at: form.scheduled_at || undefined } as any);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">Tambah Konten</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} required placeholder="Postingan program pendidikan" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="youtube">YouTube</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="tiktok_ads">TikTok Ads</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jenis</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.jenis} onChange={e => setForm(f => ({ ...f, jenis: e.target.value }))}>
                <option value="post">Post</option>
                <option value="story">Story</option>
                <option value="reel">Reel / Short</option>
                <option value="ads">Iklan</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Terjadwal</option>
                <option value="published">Tayang</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Jadwal</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Caption <span className="text-muted-foreground text-xs">(opsional)</span></Label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Teks caption untuk postingan ini..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Menyimpan...' : 'Tambah'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContentCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const { data: items, isLoading } = useContentCalendar({ month: monthStr });
  const del = useDeleteContentItem();
  const update = useUpdateContentItem();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const itemsByDate: Record<string, ContentItem[]> = {};
  (items ?? []).forEach(item => {
    if (!item.scheduled_at) return;
    const d = item.scheduled_at.split('T')[0];
    if (!itemsByDate[d]) itemsByDate[d] = [];
    itemsByDate[d].push(item);
  });

  return (
    <div className="p-8 w-full">
      {showCreate && <CreateItemModal onClose={() => setShowCreate(false)} defaultDate={createDate} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kalender Konten</h1>
          <p className="text-muted-foreground text-sm mt-1">Rencanakan dan jadwalkan konten di semua platform.</p>
        </div>
        <Button onClick={() => { setCreateDate(undefined); setShowCreate(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Konten
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg border border-border bg-white hover:bg-secondary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="p-2 rounded-lg border border-border bg-white hover:bg-secondary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>
        {/* Weeks */}
        {Array.from({ length: cells.length / 7 }, (_, week) => (
          <div key={week} className="grid grid-cols-7 border-b border-border last:border-0">
            {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const dayItems = dateStr ? (itemsByDate[dateStr] ?? []) : [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div
                  key={i}
                  className={`min-h-[100px] p-2 border-r border-border last:border-0 ${!day ? 'bg-secondary/30' : 'cursor-pointer hover:bg-indigo-50/30'}`}
                  onClick={() => { if (day) { setCreateDate(dateStr); setShowCreate(true); } }}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                        ${isToday ? 'bg-indigo-600 text-white' : 'text-foreground'}`}>
                        {day}
                      </span>
                      <div className="space-y-0.5">
                        {dayItems.slice(0, 3).map(item => (
                          <div
                            key={item.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${PLATFORM_COLORS[item.platform] ?? 'bg-slate-100 text-slate-700'}`}
                            onClick={e => e.stopPropagation()}
                            title={item.judul}
                          >
                            {item.judul}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-muted-foreground pl-1">+{dayItems.length - 3} lagi</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* List below calendar */}
      {(items ?? []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Semua Konten Bulan Ini ({items?.length})</h3>
          <div className="space-y-2">
            {(items ?? []).map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-border px-4 py-3 flex items-center gap-3 shadow-sm">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${PLATFORM_COLORS[item.platform] ?? 'bg-slate-100 text-slate-700'}`}>{item.platform_display}</span>
                <span className="text-sm font-medium flex-1 truncate">{item.judul}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>{item.status_display}</span>
                {item.scheduled_at && (
                  <span className="text-xs text-muted-foreground">{new Date(item.scheduled_at).toLocaleDateString('id-ID')}</span>
                )}
                <select
                  className="text-xs border border-border rounded px-2 py-1 bg-white"
                  value={item.status}
                  onChange={e => update.mutate({ id: item.id, status: e.target.value })}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Terjadwal</option>
                  <option value="published">Tayang</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
                <button onClick={() => del.mutate(item.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
