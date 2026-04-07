'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import api from '@/lib/api';
import { Megaphone, Pin, Plus, Edit2, Trash2, X } from 'lucide-react';

interface Announcement {
  id: string;
  judul: string;
  isi: string;
  min_level: number;
  is_pinned: boolean;
  author_nama: string;
  created_at: string;
}

const LEVEL_OPTIONS = [
  { value: 0, label: 'Semua Anggota' },
  { value: 1, label: 'Koordinator Wilayah ke atas' },
  { value: 2, label: 'Koordinator Kecamatan ke atas' },
  { value: 3, label: 'Koordinator Kelurahan ke atas' },
  { value: 4, label: 'Semua termasuk Relawan' },
];

function useToken() {
  const { data: session } = useSession();
  return (session as any)?.accessToken as string | undefined;
}

function useAnnouncements() {
  const token = useToken();
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () =>
      api.get<Announcement[]>('/teams/announcements/', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as Announcement[]),
    enabled: !!token,
  });
}

function useCreateAnnouncement() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation<Announcement, Error, Partial<Announcement>>({
    mutationFn: (data: Partial<Announcement>) =>
      api.post('/teams/announcements/', data, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

function useUpdateAnnouncement() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) =>
      api.patch(`/teams/announcements/${id}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

function useDeleteAnnouncement() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/teams/announcements/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

function AnnouncementModal({ ann, onClose }: { ann?: Announcement; onClose: () => void }) {
  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement();
  const [form, setForm] = useState({
    judul: ann?.judul ?? '',
    isi: ann?.isi ?? '',
    min_level: ann?.min_level ?? 4,
    is_pinned: ann?.is_pinned ?? false,
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isPending = create.isPending || update.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ann) {
      await update.mutateAsync({ id: ann.id, data: form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-semibold">{ann ? 'Edit Pengumuman' : 'Buat Pengumuman'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Judul</label>
            <input
              required
              value={form.judul}
              onChange={e => set('judul', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Judul pengumuman..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Isi Pengumuman</label>
            <textarea
              required
              rows={5}
              value={form.isi}
              onChange={e => set('isi', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Tulis isi pengumuman di sini..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Target Penerima</label>
            <select
              value={form.min_level}
              onChange={e => set('min_level', parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {LEVEL_OPTIONS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_pinned}
              onChange={e => set('is_pinned', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-indigo-600"
            />
            <span className="text-sm text-slate-300">Pin pengumuman ini di atas</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : ann ? 'Simpan' : 'Kirim Pengumuman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const { data: announcements = [], isLoading } = useAnnouncements();
  const deleteAnn = useDeleteAnnouncement();
  const updateAnn = useUpdateAnnouncement();

  const pinned = announcements.filter(a => a.is_pinned);
  const regular = announcements.filter(a => !a.is_pinned);

  const getLevelLabel = (level: number) =>
    LEVEL_OPTIONS.find(l => l.value === level)?.label ?? 'Semua';

  const AnnCard = ({ ann }: { ann: Announcement }) => (
    <div className={`bg-slate-800/50 border rounded-xl p-4 ${ann.is_pinned ? 'border-indigo-700/60' : 'border-slate-700'}`}>
      <div className="flex items-start gap-3">
        {ann.is_pinned && <Pin className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-white font-semibold text-sm leading-snug">{ann.judul}</h3>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => updateAnn.mutate({ id: ann.id, data: { is_pinned: !ann.is_pinned } })}
                title={ann.is_pinned ? 'Unpin' : 'Pin'}
                className={`p-1.5 rounded-lg transition-colors ${ann.is_pinned ? 'text-indigo-400 hover:text-slate-400' : 'text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/30'}`}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditing(ann)}
                className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Hapus pengumuman ini?')) deleteAnn.mutate(ann.id);
                }}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{ann.isi}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
            <span>{ann.author_nama}</span>
            <span>·</span>
            <span>{format(new Date(ann.created_at), 'd MMM yyyy, HH:mm', { locale: id })}</span>
            <span>·</span>
            <span className="text-slate-600">{getLevelLabel(ann.min_level)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Papan Pengumuman</h1>
          <p className="text-slate-400 text-sm mt-1">Broadcast informasi ke seluruh tim sukses</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Buat Pengumuman
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 border border-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Belum ada pengumuman</p>
          <p className="text-sm mt-1">Buat pengumuman pertama untuk tim sukses Anda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Disematkan</h2>
              {pinned.map(a => <AnnCard key={a.id} ann={a} />)}
            </div>
          )}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 pt-2">Terbaru</h2>
              )}
              {regular.map(a => <AnnCard key={a.id} ann={a} />)}
            </div>
          )}
        </div>
      )}

      {showCreate && <AnnouncementModal onClose={() => setShowCreate(false)} />}
      {editing && <AnnouncementModal ann={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
