'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useArticle, useUpdateArticle } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: article, isLoading } = useArticle(id);
  const update = useUpdateArticle();
  const [form, setForm] = useState({ title: '', slug: '', body: '', excerpt: '', category: '', status: '' });
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title, slug: article.slug, body: article.body,
        excerpt: article.excerpt || '', category: article.category, status: article.status,
      });
    }
  }, [article]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append('featured_image', image);
    await update.mutateAsync({ id, data: fd });
    router.push('/dashboard/berita');
  };

  if (isLoading) return <div className="p-6"><div className="h-96 bg-muted animate-pulse rounded-xl" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-muted-foreground flex items-center gap-1 mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </button>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle>Edit Artikel</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm">
                  <option value="kegiatan">Kegiatan</option>
                  <option value="program">Program</option>
                  <option value="pengumuman">Pengumuman</option>
                  <option value="media">Media</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Publikasikan</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gambar Utama</Label>
              {article?.featured_image_url && <img src={article.featured_image_url} alt="" className="h-32 rounded-lg object-cover mb-2" />}
              <Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Ringkasan</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={form.excerpt} onChange={e => set('excerpt', e.target.value)} maxLength={500} />
            </div>
            <div className="space-y-2">
              <Label>Isi Artikel *</Label>
              <textarea className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono" value={form.body} onChange={e => set('body', e.target.value)} required />
            </div>
            <Button type="submit" disabled={update.isPending} className="w-full">
              {update.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
