'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Newspaper, Plus, Eye, Trash2, Edit2 } from 'lucide-react';
import { useArticles, useDeleteArticle } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Article } from '@/hooks/useArticles';

const CATEGORY_COLORS: Record<string, string> = {
  kegiatan: 'bg-blue-100 text-blue-700',
  program: 'bg-emerald-100 text-emerald-700',
  pengumuman: 'bg-amber-100 text-amber-700',
  media: 'bg-violet-100 text-violet-700',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-100 text-emerald-700',
};

export default function BeritaPage() {
  const [category, setCategory] = useState('');
  const { data: articles, isLoading } = useArticles(category || undefined);
  const deleteArticle = useDeleteArticle();

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Newspaper className="w-5 h-5" /> Berita & Artikel
        </h1>
        <Link href="/dashboard/berita/new">
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Tulis Artikel</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {[{ value: '', label: 'Semua' }, { value: 'kegiatan', label: 'Kegiatan' }, { value: 'program', label: 'Program' }, { value: 'pengumuman', label: 'Pengumuman' }, { value: 'media', label: 'Media' }].map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              category === c.value ? 'bg-indigo-100 text-indigo-700' : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : !articles?.length ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada artikel.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((a: Article) => (
            <Card key={a.id} className="border-0 shadow-sm overflow-hidden">
              {a.featured_image_url && (
                <div className="h-40 bg-muted">
                  <img src={a.featured_image_url} alt={a.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={CATEGORY_COLORS[a.category] || 'bg-slate-100'}>{a.category_display}</Badge>
                  <Badge className={STATUS_COLORS[a.status] || ''}>{a.status_display}</Badge>
                </div>
                <h3 className="text-sm font-semibold mb-1 line-clamp-2">{a.title}</h3>
                {a.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{a.excerpt}</p>}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.view_count} views</span>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/berita/${a.id}`}>
                      <Button size="sm" variant="ghost"><Edit2 className="w-3.5 h-3.5" /></Button>
                    </Link>
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => { if (confirm('Hapus artikel ini?')) deleteArticle.mutate(a.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
