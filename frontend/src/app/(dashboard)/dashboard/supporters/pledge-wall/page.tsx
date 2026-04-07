'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Shield, CheckCircle2, Clock, Search, Filter, ExternalLink } from 'lucide-react';

interface Supporter {
  id: string;
  nama: string;
  phone: string;
  kelurahan: string;
  kecamatan: string;
  statement: string | null;
  is_verified: boolean;
  referral_code: string;
  created_at: string;
}

function useToken() {
  const { data: session } = useSession();
  return (session as any)?.accessToken as string | undefined;
}

function usePledgeWall(verified?: boolean) {
  const token = useToken();
  return useQuery<Supporter[]>({
    queryKey: ['pledge-wall', verified],
    queryFn: () => {
      const params = verified !== undefined ? `?verified=${verified}` : '';
      return api.get<Supporter[]>(`/supporters/pledge-wall/${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => (Array.isArray(r.data) ? r.data : (r.data as any).results ?? []) as Supporter[]);
    },
    enabled: !!token,
  });
}

function useModerate() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_verified }: { id: string; is_verified: boolean }) =>
      api.patch(`/supporters/${id}/moderate/`, { is_verified }, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pledge-wall'] });
    },
  });
}

export default function PledgeWallPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [search, setSearch] = useState('');

  const verifiedParam = filter === 'verified' ? true : filter === 'pending' ? false : undefined;
  const { data: supporters = [], isLoading } = usePledgeWall(verifiedParam);
  const moderate = useModerate();

  const filtered = supporters.filter(s => {
    if (!s.statement) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return s.nama.toLowerCase().includes(q) || (s.statement ?? '').toLowerCase().includes(q) || s.kecamatan.toLowerCase().includes(q);
  });

  const pendingCount = supporters.filter(s => s.statement && !s.is_verified).length;
  const verifiedCount = supporters.filter(s => s.statement && s.is_verified).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pledge Wall</h1>
          <p className="text-slate-400 text-sm mt-1">Moderasi pernyataan dukungan publik dari pendukung</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{supporters.filter(s => s.statement).length}</p>
          <p className="text-slate-400 text-xs mt-1">Total Pernyataan</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-slate-400 text-xs mt-1">Menunggu Review</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{verifiedCount}</p>
          <p className="text-slate-400 text-xs mt-1">Ditampilkan Publik</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(['all', 'pending', 'verified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'pending' ? 'Menunggu' : 'Disetujui'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, pernyataan, atau kecamatan..."
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800/50 border border-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Belum ada pernyataan</p>
          <p className="text-sm mt-1">Pernyataan akan muncul setelah pendukung mengisi saat mendaftar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className={`bg-slate-800/50 border rounded-xl p-4 transition-colors ${
                s.is_verified ? 'border-green-800/50' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm">{s.nama}</p>
                    <span className="text-slate-500 text-xs">·</span>
                    <p className="text-slate-400 text-xs">{s.kecamatan}, {s.kelurahan}</p>
                    {s.is_verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Ditampilkan
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        Menunggu
                      </span>
                    )}
                  </div>
                  <blockquote className="text-slate-300 text-sm italic leading-relaxed border-l-2 border-slate-600 pl-3">
                    "{s.statement}"
                  </blockquote>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {s.is_verified ? (
                    <button
                      onClick={() => moderate.mutate({ id: s.id, is_verified: false })}
                      disabled={moderate.isPending}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-800 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      Sembunyikan
                    </button>
                  ) : (
                    <button
                      onClick={() => moderate.mutate({ id: s.id, is_verified: true })}
                      disabled={moderate.isPending}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-700 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                    >
                      Setujui
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Public preview note */}
      {verifiedCount > 0 && (
        <div className="bg-indigo-900/20 border border-indigo-800/50 rounded-xl p-4 flex items-center gap-3">
          <ExternalLink className="h-5 w-5 text-indigo-400 flex-shrink-0" />
          <p className="text-slate-300 text-sm">
            <strong className="text-indigo-300">{verifiedCount} pernyataan</strong> saat ini ditampilkan di halaman kampanye publik Anda di bagian Pledge Wall.
          </p>
        </div>
      )}
    </div>
  );
}
