'use client';

import { useState } from 'react';
import { ExternalLink, Globe, Eye, CheckCircle2, Clock, Copy, Check, Zap } from 'lucide-react';
import { useCandidate, useUpdateCandidate } from '@/hooks/useCandidate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Disalin!' : 'Salin URL'}
    </button>
  );
}

export default function CampaignPageBuilderPage() {
  const { data: candidate, isLoading } = useCandidate();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const slug = (candidate as any)?.tenant_slug || '';
  const publicUrl = slug ? `${appUrl}/${slug}` : '';
  const isPublished = candidate?.status === 'published';

  const handlePublish = async () => {
    if (!token) return;
    setPublishing(true);
    try {
      await axios.post(`${apiBase}/candidates/me/publish/`, {}, { headers: authHeaders(token) });
      setPublishMsg('Halaman berhasil dipublikasikan!');
      setTimeout(() => setPublishMsg(''), 4000);
      // Invalidate candidate cache by reloading
      window.location.reload();
    } catch {
      setPublishMsg('Gagal mempublikasikan. Coba lagi.');
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48" />
          <div className="h-48 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'hero', label: 'Hero & Foto Profil', done: !!candidate?.nama_lengkap, desc: 'Nama, foto, nomor urut, tagline' },
    { key: 'visi', label: 'Visi Kandidat', done: !!candidate?.visi, desc: 'Pernyataan visi utama kampanye' },
    { key: 'misi', label: 'Misi Kandidat', done: Array.isArray(candidate?.misi) && candidate.misi.length > 0, desc: 'Daftar misi kampanye' },
    { key: 'program', label: 'Program Unggulan', done: Array.isArray(candidate?.program_unggulan) && candidate.program_unggulan.length > 0, desc: 'Program-program andalan' },
    { key: 'sosmed', label: 'Media Sosial', done: Object.values(candidate?.sosmed || {}).some(v => !!v), desc: 'Link Instagram, TikTok, YouTube, dll.' },
  ];

  const completedSections = sections.filter(s => s.done).length;
  const completionPct = Math.round((completedSections / sections.length) * 100);

  return (
    <div className="p-8 w-full max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Halaman Kampanye</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola konten dan publikasi halaman kampanye publik Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPublished ? (
            <Badge variant="success" className="gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Dipublikasikan
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Clock className="w-3 h-3" /> Draft
            </Badge>
          )}
        </div>
      </div>

      {/* Public URL card */}
      <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Globe className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">URL Halaman Kampanye Publik</p>
              {slug ? (
                <p className="font-mono text-sm text-foreground font-medium truncate">{publicUrl}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Slug belum tersedia</p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {slug && <CopyUrl url={publicUrl} />}
              {slug && (
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                    <ExternalLink className="w-3.5 h-3.5" /> Buka
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion checklist */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Kelengkapan Konten</CardTitle>
                <span className="text-sm font-semibold text-indigo-600">{completionPct}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <CardDescription>
                {completedSections} dari {sections.length} seksi terisi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {sections.map(s => (
                  <div key={s.key} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${s.done ? 'bg-green-100 text-green-600' : 'bg-secondary text-muted-foreground'}`}>
                      {s.done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${s.done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    {!s.done && (
                      <a href="/dashboard/profile" className="text-xs text-indigo-600 hover:underline flex-shrink-0">
                        Isi →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Publish card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Publikasi
              </CardTitle>
              <CardDescription>
                {isPublished
                  ? 'Halaman Anda sudah live dan dapat diakses publik.'
                  : 'Halaman masih draft. Publikasikan agar bisa dilihat publik.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPublished ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Halaman Anda sudah live!
                  </div>
                  {slug && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full gap-2">
                        <Eye className="w-4 h-4" /> Lihat Halaman Publik
                      </Button>
                    </a>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Pastikan profil kandidat sudah lengkap sebelum dipublikasikan.
                  </p>
                  <Button
                    className="w-full gap-2"
                    onClick={handlePublish}
                    disabled={publishing || completionPct < 40}
                  >
                    <Globe className="w-4 h-4" />
                    {publishing ? 'Mempublikasikan...' : 'Publikasikan Sekarang'}
                  </Button>
                  {completionPct < 40 && (
                    <p className="text-xs text-amber-600">Lengkapi minimal 2 seksi konten dahulu.</p>
                  )}
                </>
              )}
              {publishMsg && (
                <p className={`text-sm ${publishMsg.includes('Gagal') ? 'text-destructive' : 'text-green-600'}`}>
                  {publishMsg}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-500" /> Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-sky-600">
                  {(candidate as any)?.campaign_page?.view_count ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">total kunjungan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
