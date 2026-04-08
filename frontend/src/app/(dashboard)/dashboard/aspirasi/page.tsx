'use client';

import { useState } from 'react';
import { MessageSquare, Reply, Trash2, Filter, Archive, ArchiveRestore, Tag, X } from 'lucide-react';
import { useAspirasi, useReplyAspirasi, useDeleteAspirasi } from '@/hooks/useEngagement';
import { Button } from '@/components/ui/button';
import type { Aspirasi } from '@/hooks/useEngagement';

const TEMA_LABELS: Record<string, string> = {
  infrastruktur: 'Infrastruktur', kesehatan: 'Kesehatan', pendidikan: 'Pendidikan',
  ekonomi: 'Ekonomi', lingkungan: 'Lingkungan', sosial: 'Sosial', lainnya: 'Lainnya',
};
const TEMA_COLORS: Record<string, string> = {
  infrastruktur: 'bg-orange-100 text-orange-700', kesehatan: 'bg-red-100 text-red-700',
  pendidikan: 'bg-blue-100 text-blue-700', ekonomi: 'bg-emerald-100 text-emerald-700',
  lingkungan: 'bg-green-100 text-green-700', sosial: 'bg-violet-100 text-violet-700',
  lainnya: 'bg-slate-100 text-slate-700',
};
const STATUS_COLORS: Record<string, string> = {
  unread: 'bg-amber-100 text-amber-700',
  read: 'bg-slate-100 text-slate-600',
  replied: 'bg-emerald-100 text-emerald-700',
};

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}>
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Tambah tag, tekan Enter"
          className="flex-1 text-xs border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button type="button" onClick={add} className="text-xs text-indigo-600 hover:underline">
          Tambah
        </button>
      </div>
    </div>
  );
}

function ReplyModal({ aspirasi, onClose }: { aspirasi: Aspirasi; onClose: () => void }) {
  const reply = useReplyAspirasi();
  const [balasan, setBalasan] = useState(aspirasi.balasan_publik || '');
  const [isPublished, setIsPublished] = useState(aspirasi.is_published);
  const [tags, setTags] = useState<string[]>(aspirasi.tags || []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await reply.mutateAsync({
      id: aspirasi.id,
      balasan_publik: balasan,
      is_published: isPublished,
      status: 'replied',
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Balas Aspirasi</h2>
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">{aspirasi.nama} · {aspirasi.wilayah}</p>
          <p className="text-sm">{aspirasi.pesan}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Balasan Publik</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={balasan}
              onChange={(e) => setBalasan(e.target.value)}
              placeholder="Tulis balasan yang akan ditampilkan di halaman kampanye..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tag
            </label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            Tampilkan balasan ini di halaman kampanye publik
          </label>
          <div className="flex gap-3">
            <Button type="submit" disabled={reply.isPending} className="flex-1">
              {reply.isPending ? 'Menyimpan...' : 'Simpan Balasan'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AspirasiPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [temaFilter, setTemaFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Aspirasi | null>(null);
  const { data: aspirasi, isLoading } = useAspirasi({
    status: statusFilter || undefined,
    tema: temaFilter || undefined,
    archived: showArchived || undefined,
  });
  const patchAspirasi = useReplyAspirasi();
  const del = useDeleteAspirasi();

  const unreadCount = aspirasi?.filter((a) => a.status === 'unread').length ?? 0;

  const toggleArchive = (a: Aspirasi) => {
    patchAspirasi.mutate({ id: a.id, is_archived: !a.is_archived } as any);
  };

  return (
    <div className="p-8 w-full">
      {replyTarget && <ReplyModal aspirasi={replyTarget} onClose={() => setReplyTarget(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            Aspirasi Masuk
            {unreadCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pesan dan aspirasi dari pemilih melalui halaman kampanye.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
        </div>
        {[
          { value: '', label: 'Semua' },
          { value: 'unread', label: 'Belum Dibaca' },
          { value: 'read', label: 'Dibaca' },
          { value: 'replied', label: 'Dibalas' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          className="text-xs border border-border rounded-lg px-3 py-1.5 bg-white ml-2"
          value={temaFilter}
          onChange={(e) => setTemaFilter(e.target.value)}
        >
          <option value="">Semua Tema</option>
          {Object.entries(TEMA_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showArchived
              ? 'bg-slate-600 text-white border-slate-600'
              : 'bg-white border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          {showArchived ? 'Sembunyikan Arsip' : 'Lihat Arsip'}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !aspirasi?.length ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Belum ada aspirasi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aspirasi akan masuk saat pemilih mengisi form di halaman kampanye publik Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {aspirasi.map((a) => (
            <div
              key={a.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-opacity ${
                a.is_archived ? 'opacity-60' : ''
              } ${a.status === 'unread' ? 'border-indigo-200 bg-indigo-50/30' : 'border-border'}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                  {a.nama.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{a.nama}</span>
                    {a.wilayah && <span className="text-xs text-muted-foreground">· {a.wilayah}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TEMA_COLORS[a.tema]}`}>
                      {a.tema_display}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[a.status]}`}>
                      {a.status_display}
                    </span>
                    {a.is_archived && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Diarsipkan
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{a.pesan}</p>

                  {/* Tags */}
                  {a.tags && a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {a.balasan_publik && (
                    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                        <Reply className="w-3 h-3" /> Balasan {a.is_published ? '(Publik)' : '(Tersimpan)'}
                      </p>
                      <p className="text-xs text-emerald-800">{a.balasan_publik}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(a.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setReplyTarget(a)}
                  >
                    <Reply className="w-3 h-3" /> Balas
                  </Button>
                  <button
                    title={a.is_archived ? 'Batalkan Arsip' : 'Arsipkan'}
                    onClick={() => toggleArchive(a)}
                    className="text-muted-foreground hover:text-slate-700 transition-colors"
                  >
                    {a.is_archived ? (
                      <ArchiveRestore className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => del.mutate(a.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
