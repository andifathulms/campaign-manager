'use client';

import { useSession } from 'next-auth/react';
import { Star, ClipboardList, Users, Share2, Trophy, Megaphone, Pin } from 'lucide-react';
import { useVolunteerOverview } from '@/hooks/useVolunteerOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VolunteerDashboardPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useVolunteerOverview();
  const userName = session?.user?.name || 'Relawan';

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const widgets = [
    { label: 'Poin Saya', value: data?.total_points ?? 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Tugas Aktif', value: data?.active_tasks ?? 0, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pendukung Bulan Ini', value: data?.supporters_this_month ?? 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Konten Dibagikan', value: data?.shares_this_month ?? 0, icon: Share2, color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Halo, {userName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Selamat datang di dashboard relawan.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {widgets.map(w => (
          <Card key={w.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${w.bg} flex items-center justify-center mb-3`}>
                <w.icon className={`w-4.5 h-4.5 ${w.color}`} />
              </div>
              <p className="text-2xl font-bold">{w.value.toLocaleString('id-ID')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{w.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard rank */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Peringkat Leaderboard</p>
            <p className="text-2xl font-bold">#{data?.leaderboard_rank ?? '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      {data?.announcements && data.announcements.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Pengumuman
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.map(a => (
              <div key={a.id} className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {a.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                  <p className="text-sm font-semibold">{a.judul}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.isi}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
