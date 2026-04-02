'use client';

import { useState } from 'react';
import { TrendingUp, Wallet, Eye, MousePointer, Plus, Trash2, Link2, AlertTriangle } from 'lucide-react';
import { useAdsDashboard, useAdsAccounts, useConnectAdsAccount, useDisconnectAdsAccount } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-blue-100 text-blue-700',
  tiktok: 'bg-pink-100 text-pink-700',
  google: 'bg-green-100 text-green-700',
};

const PLATFORM_BAR: Record<string, string> = {
  meta: 'bg-blue-500',
  tiktok: 'bg-pink-500',
  google: 'bg-green-500',
};

function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID');
}

function ConnectModal({ onClose }: { onClose: () => void }) {
  const connect = useConnectAdsAccount();
  const [form, setForm] = useState({ platform: 'meta', account_id: '', account_name: '', access_token: '' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await connect.mutateAsync(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Hubungkan Akun Iklan</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Platform</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.platform}
              onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
            >
              <option value="meta">Meta (Facebook / Instagram)</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="google">Google Ads</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Account ID</Label>
            <Input placeholder="act_123456789" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Nama Akun</Label>
            <Input placeholder="Kampanye Andi Fathul" value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input placeholder="EAAxxxxxx..." value={form.access_token} onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={connect.isPending} className="flex-1">
              {connect.isPending ? 'Menghubungkan...' : 'Hubungkan'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const { data: dashboard, isLoading } = useAdsDashboard();
  const { data: accounts } = useAdsAccounts();
  const disconnect = useDisconnectAdsAccount();
  const [showConnect, setShowConnect] = useState(false);

  const budget = dashboard?.budget;
  const spendPct = budget?.spend_pct ?? 0;
  const overBudget = spendPct >= (budget?.alert_threshold_pct ?? 80);

  const statCards = [
    {
      label: 'Total Belanja Iklan', value: formatRp(dashboard?.total_spend ?? 0),
      icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
    },
    {
      label: 'Total Jangkauan', value: formatNum(dashboard?.total_reach ?? 0),
      icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100',
    },
    {
      label: 'Total Impresi', value: formatNum(dashboard?.total_impressions ?? 0),
      icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
    },
    {
      label: 'Total Klik', value: formatNum(dashboard?.total_clicks ?? 0),
      icon: MousePointer, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100',
    },
  ];

  return (
    <div className="p-8 w-full">
      {showConnect && <ConnectModal onClose={() => setShowConnect(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Iklan</h1>
          <p className="text-muted-foreground text-sm mt-1">Pantau performa Meta & TikTok Ads dalam satu tempat.</p>
        </div>
        <Button onClick={() => setShowConnect(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Hubungkan Akun
        </Button>
      </div>

      {/* Connected accounts */}
      {accounts && accounts.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {accounts.map((acc: import("@/hooks/useAds").AdsAccount) => (
            <div key={acc.id} className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2 shadow-sm">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLATFORM_COLORS[acc.platform]}`}>
                {acc.platform_display}
              </span>
              <span className="text-sm font-medium">{acc.account_name}</span>
              <button
                onClick={() => disconnect.mutate(acc.id)}
                className="text-muted-foreground hover:text-destructive ml-2 transition-colors"
                title="Putus koneksi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No accounts */}
      {accounts && accounts.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start gap-3">
          <Link2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Belum ada akun iklan terhubung</p>
            <p className="text-sm text-amber-700 mt-0.5">Hubungkan akun Meta Ads atau TikTok Ads untuk melihat data performa iklan Anda.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>
                {isLoading ? <span className="inline-block w-20 h-6 bg-secondary rounded animate-pulse" /> : card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Performa Kampanye</CardTitle>
              <CardDescription>Data terbaru per kampanye aktif</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-secondary rounded animate-pulse" />)}
                </div>
              ) : !dashboard?.recent_campaigns?.length ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Belum ada data kampanye.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Kampanye</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Jangkauan</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Klik</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Belanja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dashboard.recent_campaigns.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${PLATFORM_COLORS[c.platform]}`}>
                                {c.platform_label}
                              </span>
                              <span className="font-medium truncate max-w-[180px]">{c.campaign_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatNum(c.reach)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatNum(c.clicks)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{c.spend_display}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: platform breakdown + budget */}
        <div className="space-y-6">
          {/* Platform breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Per Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!dashboard?.by_platform?.length ? (
                <p className="text-sm text-muted-foreground">Belum ada data.</p>
              ) : (
                dashboard.by_platform.map(p => {
                  const total = dashboard.by_platform.reduce((s, x) => s + x.spend, 0);
                  const pct = total > 0 ? Math.round((p.spend / total) * 100) : 0;
                  return (
                    <div key={p.platform}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLATFORM_COLORS[p.platform]}`}>{p.label}</span>
                        <span className="font-semibold text-foreground">{formatRp(p.spend)}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${PLATFORM_BAR[p.platform]}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatNum(p.reach)} jangkauan</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Budget card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Anggaran Iklan
                {overBudget && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              </CardTitle>
              {budget && (
                <CardDescription>{budget.period_start} – {budget.period_end}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!budget ? (
                <p className="text-sm text-muted-foreground">Belum ada anggaran. Set di halaman Budget.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className={`font-bold ${overBudget ? 'text-amber-600' : 'text-foreground'}`}>
                      {formatRp(budget.total_spend)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${overBudget ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(spendPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{spendPct.toFixed(1)}% dari {formatRp(budget.total_budget)}</span>
                    <span>Sisa: {formatRp(Math.max(0, budget.total_budget - budget.total_spend))}</span>
                  </div>
                  {overBudget && (
                    <p className="text-xs text-amber-600 font-medium">
                      Melebihi {budget.alert_threshold_pct}% batas peringatan!
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
