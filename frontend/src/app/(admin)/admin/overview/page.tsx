'use client';

import { Users, Megaphone, Wallet, CheckCircle2 } from 'lucide-react';
import { usePlatformOverview } from '@/hooks/usePlatformAdmin';

function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export default function AdminOverviewPage() {
  const { data, isLoading } = usePlatformOverview();

  const cards = [
    { label: 'Total Kampanye', value: data?.total_campaigns ?? 0, icon: Users, hint: `${data?.active_campaigns ?? 0} aktif` },
    { label: 'Kampanye Tayang', value: data?.published_campaigns ?? 0, icon: CheckCircle2, hint: 'status published' },
    { label: 'Total Pendukung', value: (data?.total_supporters ?? 0).toLocaleString('id-ID'), icon: Megaphone, hint: 'seluruh platform' },
    { label: 'Total Belanja Iklan', value: formatRp(data?.total_spend ?? 0), icon: Wallet, hint: 'akumulasi' },
  ];

  return (
    <div className="p-8 w-full max-w-6xl">
      <h1 className="font-display text-2xl font-bold mb-1">Overview Platform</h1>
      <p className="text-muted-foreground text-sm mb-8">Ringkasan seluruh kampanye di KampanyeKit.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="w-10 h-10 rounded-lg bg-accent text-primary flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold font-display">{isLoading ? '…' : c.value}</p>
              <p className="text-sm font-medium mt-1">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4">Sebaran Paket</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['starter', 'pro', 'premium', 'enterprise'] as const).map((p) => (
            <div key={p} className="text-center rounded-lg bg-muted/50 py-4">
              <p className="text-2xl font-bold font-display text-primary">{data?.by_plan?.[p] ?? 0}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
