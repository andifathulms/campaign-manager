'use client';

import { useSession } from 'next-auth/react';
import { User, Star, History, TrendingUp, TrendingDown } from 'lucide-react';
import { useVolunteerPoints } from '@/hooks/usePoints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ACTION_LABELS: Record<string, string> = {
  register: 'Registrasi',
  task_complete: 'Selesai Tugas',
  share_content: 'Bagikan Konten',
  manual_supporter: 'Input Pendukung',
  link_supporter: 'Pendukung via Link',
  event_checkin: 'Checkin Event',
};

export default function VolunteerProfilePage() {
  const { data: session } = useSession();
  const { data, isLoading } = useVolunteerPoints();

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <User className="w-5 h-5" /> Profil Saya
      </h1>

      {/* Profile card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {session?.user?.name
              ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold">{session?.user?.name || 'Relawan'}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email || ''}</p>
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{data?.total_points?.toLocaleString('id-ID') ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Poin</p>
          </div>
        </CardContent>
      </Card>

      {/* Point history */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" /> Riwayat Poin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : !data?.transactions?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada transaksi poin.</p>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    t.points > 0 ? 'bg-emerald-50' : 'bg-red-50'
                  }`}>
                    {t.points > 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                      : <TrendingDown className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ACTION_LABELS[t.action_type] || t.action_type}</p>
                    {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${t.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.points > 0 ? '+' : ''}{t.points}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
