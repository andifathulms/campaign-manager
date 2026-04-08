'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicArticles } from '@/hooks/useArticles';

const CATEGORY_COLORS: Record<string, string> = {
  kegiatan: 'bg-blue-100 text-blue-700',
  program: 'bg-emerald-100 text-emerald-700',
  pengumuman: 'bg-amber-100 text-amber-700',
  media: 'bg-violet-100 text-violet-700',
};

export default function PublicBeritaPage() {
  const { slug } = useParams() as { slug: string };
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePublicArticles(slug, page, category || undefined, search || undefined);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/${slug}`} className="text-sm text-indigo-600 hover:underline">&larr; Kembali ke halaman kandidat</Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Berita & Update</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Cari artikel..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border text-sm flex-1 min-w-[200px]"
          />
          <div className="flex gap-1.5">
            {[{ value: '', label: 'Semua' }, { value: 'kegiatan', label: 'Kegiatan' }, { value: 'program', label: 'Program' }, { value: 'pengumuman', label: 'Pengumuman' }, { value: 'media', label: 'Media' }].map(c => (
              <button
                key={c.value}
                onClick={() => { setCategory(c.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  category === c.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : !data?.results?.length ? (
          <p className="text-center text-slate-500 py-12">Belum ada artikel.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.results.map((a: any) => (
                <Link key={a.id} href={`/${slug}/berita/${a.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
                    {a.featured_image_url ? (
                      <div className="h-44 bg-slate-100">
                        <img src={a.featured_image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-indigo-300 text-4xl font-bold">
                        {a.title[0]}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category] || 'bg-slate-100'}`}>{a.category_display}</span>
                        <span className="text-xs text-slate-400">{a.published_at ? new Date(a.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-indigo-600 transition-colors">{a.title}</h3>
                      {a.excerpt && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.excerpt}</p>}
                      <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                        <Eye className="w-3 h-3" />{a.view_count} dibaca
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">Halaman {data.page} dari {data.pages}</span>
                <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
