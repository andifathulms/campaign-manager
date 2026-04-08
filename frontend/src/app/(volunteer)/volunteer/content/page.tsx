'use client';

import { useState } from 'react';
import { Share2, Eye, Link2, Check, ExternalLink } from 'lucide-react';
import { useVolunteerDailyContent, useShareContent, useVolunteerMyShares, useUpdateShare } from '@/hooks/useVolunteerContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function VolunteerContentPage() {
  const [tab, setTab] = useState<'daily' | 'history'>('daily');
  const { data: daily, isLoading: dailyLoading } = useVolunteerDailyContent();
  const { data: shares, isLoading: sharesLoading } = useVolunteerMyShares();
  const share = useShareContent();
  const update = useUpdateShare();
  const [editingShare, setEditingShare] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [viewCount, setViewCount] = useState('');

  const handleShare = async (contentId: string) => {
    const result = await share.mutateAsync(contentId);
    if (result?.share?.tracking_code) {
      const caption = result.caption || '';
      const trackingUrl = `${window.location.origin}${result.tracking_url}`;
      await navigator.clipboard.writeText(`${caption}\n\n${trackingUrl}`);
      alert('Caption dan link tracking telah disalin ke clipboard!');
    }
  };

  const handleUpdateProof = async (shareId: string) => {
    await update.mutateAsync({
      id: shareId,
      data: {
        ...(proofUrl && { proof_url: proofUrl }),
        ...(viewCount && { view_count: parseInt(viewCount) }),
      },
    });
    setEditingShare(null);
    setProofUrl('');
    setViewCount('');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Share2 className="w-5 h-5" /> Konten Harian
      </h1>

      <div className="flex gap-2 border-b border-border">
        {[{ key: 'daily', label: 'Konten Hari Ini' }, { key: 'history', label: 'Riwayat Saya' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'daily' | 'history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        dailyLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : !daily?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada konten hari ini.</p>
        ) : (
          <div className="space-y-3">
            {daily.map((item: any) => (
              <Card key={item.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-1">{item.judul}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.platform_display} &middot; {item.jenis_display}
                  </p>
                  {item.caption && (
                    <p className="text-xs bg-muted/50 p-2 rounded mb-3 line-clamp-3">{item.caption}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Reward: {item.reward_per_100_views} poin/100 views (maks {item.reward_max_cap} poin)
                    </span>
                    <Button size="sm" onClick={() => handleShare(item.id)} disabled={share.isPending}>
                      <Link2 className="w-3.5 h-3.5 mr-1" /> Bagikan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        sharesLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : !shares?.length ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada konten yang dibagikan.</p>
        ) : (
          <div className="space-y-3">
            {shares.map((s: any) => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{s.content_judul}</h3>
                        <Badge className={STATUS_COLORS[s.status] || ''}>{s.status_display}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{s.view_count} views</span>
                        <span>{s.points_earned} poin</span>
                        {s.proof_url && (
                          <a href={s.proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Bukti
                          </a>
                        )}
                      </div>
                    </div>
                    {s.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => { setEditingShare(s.id); setProofUrl(s.proof_url || ''); setViewCount(String(s.view_count || '')); }}>
                        Update
                      </Button>
                    )}
                  </div>

                  {editingShare === s.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <Input placeholder="URL bukti posting" value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
                      <Input type="number" placeholder="Jumlah views" value={viewCount} onChange={e => setViewCount(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateProof(s.id)} disabled={update.isPending}>
                          {update.isPending ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingShare(null)}>Batal</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
