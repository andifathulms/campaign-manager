'use client';

import { useState } from 'react';
import { Share2, Eye, Check, X, ExternalLink, Award } from 'lucide-react';
import { useAdminContentShares, useVerifyShare, type ContentShare } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
};

const TABS = [
  { key: '', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'rejected', label: 'Ditolak' },
];

function ShareRow({ s }: { s: ContentShare }) {
  const verify = useVerifyShare();
  const st = STATUS[s.status] || { label: s.status_display, cls: 'bg-slate-100 text-slate-700' };
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-sm">{s.volunteer_nama}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.content_judul}</p>
      </td>
      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{s.view_count.toLocaleString('id-ID')}</span>
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold">
        <span className="inline-flex items-center gap-1"><Award className="w-3.5 h-3.5 text-indigo-500" />{s.points_earned}</span>
      </td>
      <td className="px-4 py-3 text-center">
        {s.proof_url ? (
          <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1 text-xs">
            <ExternalLink className="w-3.5 h-3.5" /> Bukti
          </a>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {s.status === 'pending' ? (
          <div className="flex gap-1.5 justify-end">
            <Button size="sm" className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700" disabled={verify.isPending}
              onClick={() => verify.mutate({ id: s.id, action: 'approve' })}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50" disabled={verify.isPending}
              onClick={() => verify.mutate({ id: s.id, action: 'reject' })}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </td>
    </tr>
  );
}

export default function ContentPerformancePage() {
  const [tab, setTab] = useState('');
  const { data: shares, isLoading } = useAdminContentShares(tab || undefined);

  return (
    <div className="p-8 w-full max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Performa Konten</h1>
          <p className="text-muted-foreground text-sm">Konten yang dibagikan relawan — verifikasi untuk memberi poin.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-secondary rounded animate-pulse" />)}</div>
        ) : !shares?.length ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Belum ada konten yang dibagikan relawan.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-border text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Relawan / Konten</th>
                <th className="text-right px-4 py-3 font-semibold">Views</th>
                <th className="text-right px-4 py-3 font-semibold">Poin</th>
                <th className="text-center px-4 py-3 font-semibold">Bukti</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shares.map(s => <ShareRow key={s.id} s={s} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
