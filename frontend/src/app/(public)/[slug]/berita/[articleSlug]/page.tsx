'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, ArrowLeft, Share2, Copy } from 'lucide-react';
import { usePublicArticle } from '@/hooks/useArticles';

export default function PublicArticleDetailPage() {
  const { slug, articleSlug } = useParams() as { slug: string; articleSlug: string };
  const { data: article, isLoading } = usePublicArticle(slug, articleSlug);

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/${slug}/berita/${articleSlug}`;
    const text = `${article?.title}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Link berhasil disalin!');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-slate-100 animate-pulse rounded mb-4" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-xl mb-6" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-slate-100 animate-pulse rounded" />)}
        </div>
      </div>
    );
  }

  if (!article) return <div className="max-w-3xl mx-auto px-4 py-16 text-center">Artikel tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/${slug}/berita`} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Semua Berita
        </Link>

        {/* Category + date */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">{article.category_display}</span>
          {article.published_at && (
            <span className="text-xs text-slate-500">
              {new Date(article.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1"><Eye className="w-3 h-3" />{article.view_count}</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">{article.title}</h1>

        {article.featured_image_url && (
          <img src={article.featured_image_url} alt={article.title} className="w-full rounded-xl mb-6 max-h-96 object-cover" />
        )}

        {/* Article body */}
        <div
          className="prose prose-slate max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Share buttons */}
        <div className="flex items-center gap-3 pt-6 border-t">
          <span className="text-sm text-slate-500">Bagikan:</span>
          <button onClick={shareWhatsApp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm hover:bg-emerald-200 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </button>
          <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition-colors">
            <Copy className="w-3.5 h-3.5" /> Salin Link
          </button>
        </div>
      </div>
    </div>
  );
}
