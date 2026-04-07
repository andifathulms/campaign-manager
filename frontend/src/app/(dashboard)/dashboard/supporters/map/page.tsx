'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { MapPin, TrendingUp, Users } from 'lucide-react';

interface SupporterStats {
  total: number;
  by_kelurahan: { kelurahan: string; kecamatan: string; kabupaten_kota: string; provinsi: string; count: number }[];
  by_kecamatan: { kecamatan: string; count: number }[];
  by_kabupaten: { kabupaten_kota: string; count: number }[];
  by_provinsi: { provinsi: string; count: number }[];
}

type GroupBy = 'kelurahan' | 'kecamatan' | 'kabupaten' | 'provinsi';

function useToken() {
  const { data: session } = useSession();
  return (session as any)?.accessToken as string | undefined;
}

function useSupporterStats() {
  const token = useToken();
  return useQuery({
    queryKey: ['supporter-stats'],
    queryFn: () =>
      api.get<SupporterStats>('/supporters/stats/', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    enabled: !!token,
  });
}

function HeatBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct > 75 ? 'bg-indigo-500' :
    pct > 50 ? 'bg-indigo-400' :
    pct > 25 ? 'bg-indigo-300' :
    'bg-slate-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{value}</span>
    </div>
  );
}

export default function SupporterMapPage() {
  const { data: stats, isLoading } = useSupporterStats();
  const [groupBy, setGroupBy] = useState<GroupBy>('kecamatan');

  const groups: Record<GroupBy, { name: string; count: number }[]> = {
    kelurahan: (stats?.by_kelurahan ?? []).map(r => ({ name: r.kelurahan, count: r.count })),
    kecamatan: (stats?.by_kecamatan ?? []).map(r => ({ name: r.kecamatan, count: r.count })),
    kabupaten: (stats?.by_kabupaten ?? []).map(r => ({ name: r.kabupaten_kota, count: r.count })),
    provinsi: (stats?.by_provinsi ?? []).map(r => ({ name: r.provinsi, count: r.count })),
  };

  const sorted = groups[groupBy];
  const max = sorted[0]?.count ?? 1;
  const total = stats?.total ?? 0;
  const top5 = sorted.slice(0, 5);

  const GROUP_LABELS: Record<GroupBy, string> = {
    kelurahan: 'Kelurahan',
    kecamatan: 'Kecamatan',
    kabupaten: 'Kab/Kota',
    provinsi: 'Provinsi',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Peta Sebaran Pendukung</h1>
        <p className="text-slate-400 text-sm mt-1">Distribusi pendukung berdasarkan wilayah</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{total.toLocaleString('id-ID')}</p>
          <p className="text-slate-400 text-xs mt-1">Total Pendukung</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{sorted.length}</p>
          <p className="text-slate-400 text-xs mt-1">{GROUP_LABELS[groupBy]} Terjangkau</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {sorted.length > 0 ? Math.round(total / sorted.length) : 0}
          </p>
          <p className="text-slate-400 text-xs mt-1">Rata-rata per Wilayah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Sebaran per Wilayah</h2>
            <div className="flex gap-1 flex-wrap justify-end">
              {(Object.keys(GROUP_LABELS) as GroupBy[]).map(k => (
                <button
                  key={k}
                  onClick={() => setGroupBy(k)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    groupBy === k
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {GROUP_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-700/50 rounded animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada data pendukung</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {sorted.map((row, i) => (
                <div key={row.name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-5 text-right flex-shrink-0">{i + 1}</span>
                  <span className="text-slate-300 text-sm w-36 truncate flex-shrink-0">{row.name}</span>
                  <div className="flex-1">
                    <HeatBar value={row.count} max={max} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 + breakdown */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              Top 5 {GROUP_LABELS[groupBy]}
            </h2>
            {top5.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {top5.map((row, i) => {
                  const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={row.name} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-amber-500 text-amber-900' :
                        i === 1 ? 'bg-slate-400 text-slate-900' :
                        i === 2 ? 'bg-amber-700 text-amber-100' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{row.name}</p>
                        <p className="text-slate-500 text-xs">{pct}% dari total</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-semibold text-sm">{row.count.toLocaleString('id-ID')}</p>
                        <p className="text-slate-500 text-xs">pendukung</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-200 text-sm font-medium">Cakupan Wilayah</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Pendukung tersebar di <strong className="text-indigo-300">{sorted.length} {GROUP_LABELS[groupBy].toLowerCase()}</strong>.
                  {sorted.length > 0 && ` Terbanyak di ${sorted[0].name} (${sorted[0].count} orang).`}
                </p>
              </div>
            </div>
          </div>

          {sorted.length > 5 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-medium text-slate-300">Wilayah Lainnya</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 max-h-40 overflow-y-auto">
                {sorted.slice(5).map(row => (
                  <div key={row.name} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 truncate mr-2">{row.name}</span>
                    <span className="text-slate-300 font-medium flex-shrink-0">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
