'use client';

import { Trophy, Medal, Star } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useTeam';
import { Card, CardContent } from '@/components/ui/card';

const RANK_COLORS = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

export default function VolunteerLeaderboardPage() {
  const { data: members, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-3 max-w-2xl">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
      </h1>

      {/* Top 3 highlight */}
      {members && members.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {members.slice(0, 3).map((m: any, i: number) => (
            <Card key={m.id} className="border-0 shadow-sm text-center">
              <CardContent className="p-4">
                <Medal className={`w-8 h-8 mx-auto mb-2 ${RANK_COLORS[i]}`} />
                <p className="text-sm font-semibold truncate">{m.nama}</p>
                <p className="text-xs text-muted-foreground">{m.wilayah_name}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-sm font-bold">{m.total_points?.toLocaleString('id-ID') || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {members?.map((m: any, i: number) => (
          <Card key={m.id} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.nama}</p>
                <p className="text-xs text-muted-foreground">{m.level_display} &middot; {m.wilayah_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold">{m.total_points?.toLocaleString('id-ID') || 0}</p>
                <p className="text-xs text-muted-foreground">poin</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!members || members.length === 0) && (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada data leaderboard.</p>
      )}
    </div>
  );
}
