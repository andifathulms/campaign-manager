'use client';

import { useState } from 'react';
import { Plus, Search, Copy, Trash2, Image, Video, FileText } from 'lucide-react';
import { useAdCreatives, useCreateAdCreative, useDeleteAdCreative } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AdCreative } from '@/hooks/useContent';

const TEMA_COLORS: Record<string, string> = {
  infrastruktur: 'bg-orange-100 text-orange-700', kesehatan: 'bg-red-100 text-red-700',
  pendidikan: 'bg-blue-100 text-blue-700', ekonomi: 'bg-emerald-100 text-emerald-700',
  lingkungan: 'bg-green-100 text-green-700', profil: 'bg-indigo-100 text-indigo-700',
  event: 'bg-violet-100 text-violet-700', lainnya: 'bg-slate-100 text-slate-700',
};
const MEDIA_ICONS: Record<string, React.ElementType> = {
  image: Image, video: Video, caption: FileText,
};

function UploadModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAdCreative();
  const [form, setForm] = useState({ judul: '', media_type: 'caption', tema: 'lainnya', caption: '', platform_tags: [] as string[] });
  const [file, setFile] = useState<File | null>(null);

  const togglePlatform = (p: string) => {
    setForm(f => ({
      ...f,
      platform_tags: f.platform_tags.includes(p) ? f.platform_tags.filter(x => x !== p) : [...f.platform_tags, p],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('judul', form.judul);
    fd.append('media_type', form.media_type);
    fd.append('tema', form.tema);
    fd.append('caption', form.caption);
    form.platform_tags.forEach(p => fd.append('platform_tags', p));
    if (file) fd.append('file', file);
    await create.mutateAsync(fd);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold mb-4">Tambah ke Library</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} required placeholder="Iklan Program Kesehatan v1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Media</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.media_type} onChange={e => setForm(f => ({ ...f, media_type: e.target.value }))}>
                <option value="image">Gambar</option>
                <option value="video">Video</option>
                <option value="caption">Caption Saja</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.tema} onChange={e => setForm(f => ({ ...f, tema: e.target.value }))}>
                {['infrastruktur','kesehatan','pendidikan','ekonomi','lingkungan','profil','event','lainnya'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          {(form.media_type === 'image' || form.media_type === 'video') && (
            <div className="space-y-2">
              <Label>File</Label>
              <Input type="file" accept={form.media_type === 'image' ? 'image/*' : 'video/*'} onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Caption / Teks</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Teks caption untuk digunakan di post..."
            />
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="flex gap-2 flex-wrap">
              {['meta', 'tiktok', 'google', 'instagram', 'facebook'].map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                    ${form.platform_tags.includes(p) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border text-muted-foreground'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={create.isPending} className="flex-1">
              {create.isPending ? 'Mengunggah...' : 'Simpan ke Library'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreativeLibraryPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [temaFilter, setTemaFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { data: creatives, isLoading } = useAdCreatives({ search: search || undefined, tema: temaFilter || undefined, media_type: typeFilter || undefined });
  const del = useDeleteAdCreative();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCaption = (id: string, caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 w-full">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Library Kreatif</h1>
          <p className="text-muted-foreground text-sm mt-1">Simpan dan kelola gambar, video, dan caption iklan.</p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Tambah Aset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cari aset..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="text-sm border border-border rounded-lg px-3 py-2 bg-white" value={temaFilter} onChange={e => setTemaFilter(e.target.value)}>
          <option value="">Semua Tema</option>
          {['infrastruktur','kesehatan','pendidikan','ekonomi','lingkungan','profil','event','lainnya'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select className="text-sm border border-border rounded-lg px-3 py-2 bg-white" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Semua Tipe</option>
          <option value="image">Gambar</option>
          <option value="video">Video</option>
          <option value="caption">Caption</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : !creatives?.length ? (
        <div className="bg-white rounded-xl border border-border p-16 text-center">
          <Image className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Library kosong</p>
          <p className="text-xs text-muted-foreground mt-1">Tambahkan gambar, video, atau caption untuk digunakan ulang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creatives.map(c => {
            const Icon = MEDIA_ICONS[c.media_type] ?? FileText;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                {/* Thumbnail */}
                <div className="h-36 bg-slate-50 flex items-center justify-center relative">
                  {c.file_url && c.media_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.file_url} alt={c.judul} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-12 h-12 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate mb-1">{c.judul}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${TEMA_COLORS[c.tema]}`}>{c.tema_display}</span>
                    {c.platform_tags.map((p: string) => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{p}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.caption && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1 gap-1"
                        onClick={() => copyCaption(c.id, c.caption)}
                      >
                        <Copy className="w-3 h-3" />
                        {copied === c.id ? 'Disalin!' : 'Salin Caption'}
                      </Button>
                    )}
                    <button onClick={() => del.mutate(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
