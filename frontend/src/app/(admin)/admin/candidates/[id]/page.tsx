'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, UsersRound, Wallet, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlatformTenant, useUpdateTenant } from '@/hooks/usePlatformAdmin';

function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export default function AdminCandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: t, isLoading } = usePlatformTenant(id);
  const updateTenant = useUpdateTenant();

  if (isLoading || !t) {
    return <div className="p-8 text-muted-foreground">Memuat…</div>;
  }

  const stats = [
    { label: 'Pendukung', value: t.supporter_count.toLocaleString('id-ID'), icon: Users },
    { label: 'Tim Sukses', value: t.team_count.toLocaleString('id-ID'), icon: UsersRound },
    { label: 'Belanja Iklan', value: formatRp(t.ads_spend), icon: Wallet },
    { label: 'Kunjungan Halaman', value: t.page_views.toLocaleString('id-ID'), icon: Eye },
  ];

  return (
    <div className="p-8 w-full max-w-4xl">
      <Link href="/admin/candidates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">{t.nama_lengkap || t.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.partai || '—'} · /{t.slug} · paket {t.plan}</p>
          <div className="flex items-center gap-2 mt-3">
            {!t.is_active
              ? <Badge variant="destructive">Suspended</Badge>
              : <Badge variant={t.candidate_status === 'published' ? 'success' : t.candidate_status === 'paused' ? 'warning' : 'secondary'}>{t.candidate_status || 'draft'}</Badge>}
            {t.agency_name && <span className="text-xs text-muted-foreground">Agency: {t.agency_name}</span>}
          </div>
        </div>
        <a href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/${t.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm"><Eye className="w-4 h-4" /> Lihat Halaman</Button>
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <div className="w-9 h-9 rounded-lg bg-accent text-primary flex items-center justify-center mb-3"><Icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold font-display">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="font-semibold">Tindakan Admin</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status Akun</p>
            <p className="text-xs text-muted-foreground">Suspend memblokir login & menyembunyikan kampanye.</p>
          </div>
          <Button
            variant={t.is_active ? 'destructive' : 'default'}
            size="sm"
            disabled={updateTenant.isPending}
            onClick={() => updateTenant.mutate({ id: t.id, is_active: !t.is_active })}
          >
            {t.is_active ? 'Suspend' : 'Aktifkan'}
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-5">
          <div>
            <p className="text-sm font-medium">Status Halaman Publik</p>
            <p className="text-xs text-muted-foreground">Publish menayangkan, pause menampilkan "dalam pemeliharaan".</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={updateTenant.isPending || t.candidate_status === 'published'}
              onClick={() => updateTenant.mutate({ id: t.id, candidate_status: 'published' })}>Publish</Button>
            <Button variant="outline" size="sm" disabled={updateTenant.isPending || t.candidate_status === 'paused'}
              onClick={() => updateTenant.mutate({ id: t.id, candidate_status: 'paused' })}>Pause</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
