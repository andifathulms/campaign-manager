'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Download, Heart, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { useSupporters, useSupporterStats } from '@/hooks/useSupporters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Supporter } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function SupporterCard({ supporter, token }: { supporter: Supporter; token?: string }) {
  const downloadCard = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/supporters/${supporter.id}/card/image/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kartu-${supporter.membership_id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
          {supporter.nama.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm truncate">{supporter.nama}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {supporter.membership_id}
              </code>
              <button
                onClick={downloadCard}
                title="Unduh Kartu Anggota"
                className="text-muted-foreground hover:text-indigo-600 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-1.5 space-y-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {supporter.kelurahan}, {supporter.kecamatan}, {supporter.kabupaten_kota}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> {supporter.phone}
            </p>
            {supporter.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> {supporter.email}
              </p>
            )}
          </div>
          {supporter.statement && (
            <p className="mt-2 text-xs italic text-foreground border-l-2 border-indigo-300 pl-2">
              "{supporter.statement}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupportersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const { data: supporters, isLoading } = useSupporters(debouncedSearch || undefined);
  const { data: stats } = useSupporterStats();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._supporterSearchTimer);
    (window as any)._supporterSearchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleExport = () => {
    window.open(`${API_URL}/supporters/export/`, '_blank');
  };

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pendukung</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar pendukung yang telah mendaftar melalui halaman kampanye.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Total Pendukung</p>
          <p className="text-3xl font-bold text-violet-600">{stats?.total ?? 0}</p>
        </div>
        {stats?.by_kecamatan?.slice(0, 3).map((item, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1 truncate">{item.kecamatan}</p>
            <p className="text-2xl font-bold text-indigo-600">{item.count}</p>
            <p className="text-xs text-muted-foreground">pendukung</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supporter list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama pendukung..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : !supporters || supporters.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-16 text-center">
              <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                {debouncedSearch ? 'Tidak ada hasil' : 'Belum ada pendukung'}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {debouncedSearch
                  ? `Tidak ada pendukung dengan nama "${debouncedSearch}"`
                  : 'Pendukung akan muncul di sini setelah mendaftar melalui halaman kampanye publik Anda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {supporters.map(s => (
                <SupporterCard key={s.id} supporter={s} token={token} />
              ))}
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Kecamatan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!stats?.by_kecamatan?.length ? (
                <p className="px-4 pb-4 text-xs text-muted-foreground">Belum ada data.</p>
              ) : (
                <ol className="divide-y divide-border">
                  {stats.by_kecamatan.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <p className="text-sm truncate">{item.kecamatan}</p>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Top Kabupaten/Kota</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!stats?.by_kabupaten?.length ? (
                <p className="px-4 pb-4 text-xs text-muted-foreground">Belum ada data.</p>
              ) : (
                <ol className="divide-y divide-border">
                  {stats.by_kabupaten.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <p className="text-sm truncate">{item.kabupaten_kota}</p>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
