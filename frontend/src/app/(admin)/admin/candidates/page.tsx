'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { Search, Plus, LogIn, Ban, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlatformTenants, useUpdateTenant, useImpersonate, type TenantStats } from '@/hooks/usePlatformAdmin';

function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary'> = {
  published: 'success', paused: 'warning', draft: 'secondary',
};

export default function AdminCandidatesPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const { data, isLoading } = usePlatformTenants({ search: search || undefined });
  const updateTenant = useUpdateTenant();
  const impersonate = useImpersonate();
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = data?.results ?? [];

  const handleImpersonate = async (t: TenantStats) => {
    setBusyId(t.id);
    try {
      const tokens = await impersonate.mutateAsync(t.id);
      await signIn('credentials-otp', {
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        impersonatedBy: (session as any)?.user?.name || 'Admin',
        redirect: false,
      });
      window.location.href = '/dashboard/overview';
    } catch {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 w-full max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Kandidat</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.count ?? 0} kampanye terdaftar.</p>
        </div>
        <Button asChild><Link href="/admin/candidates/new"><Plus className="w-4 h-4" /> Tambah Kandidat</Link></Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau kampanye…"
          className="w-full rounded-lg border border-input bg-card pl-9 pr-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Kandidat</th>
                <th className="text-left font-semibold px-4 py-3">Paket</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Pendukung</th>
                <th className="text-right font-semibold px-4 py-3">Belanja Iklan</th>
                <th className="text-right font-semibold px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Memuat…</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Tidak ada kandidat.</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/candidates/${t.id}`} className="font-medium hover:text-primary">{t.nama_lengkap || t.name}</Link>
                    <p className="text-xs text-muted-foreground">{t.partai || '—'} · /{t.slug}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{t.plan}</td>
                  <td className="px-4 py-3">
                    {!t.is_active
                      ? <Badge variant="destructive">Suspended</Badge>
                      : <Badge variant={STATUS_VARIANT[t.candidate_status || 'draft']}>{t.candidate_status || 'draft'}</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">{t.supporter_count.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">{formatRp(t.ads_spend)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/candidates/${t.id}`} title="Detail" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Eye className="w-4 h-4" /></Link>
                      <button
                        title={t.is_active ? 'Suspend' : 'Aktifkan'}
                        onClick={() => updateTenant.mutate({ id: t.id, is_active: !t.is_active })}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        {t.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <Button size="sm" variant="outline" disabled={busyId === t.id} onClick={() => handleImpersonate(t)}>
                        <LogIn className="w-3.5 h-3.5" /> {busyId === t.id ? '…' : 'Masuk'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
