'use client';

import { useState } from 'react';
import { Plus, TrendingUp, Trash2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart,
} from 'recharts';
import { useElectabilityData, useAddElectabilityEntry, useDeleteElectabilityEntry } from '@/hooks/useAnalytics';
import { useAdsDailySpend } from '@/hooks/useAds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ElectabilitySurvey } from '@/hooks/useAnalytics';

function AddEntryModal({ onClose }: { onClose: () => void }) {
  const add = useAddElectabilityEntry();
  const [form, setForm] = useState({ tanggal: '', elektabilitas_pct: '', sumber: '', catatan: '', sample_size: '' });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await add.mutateAsync({
      tanggal: form.tanggal,
      elektabilitas_pct: parseFloat(form.elektabilitas_pct),
      sumber: form.sumber,
      catatan: form.catatan,
      sample_size: form.sample_size ? parseInt(form.sample_size) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Tambah Data Survei</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Elektabilitas (%)</Label>
              <Input type="number" step="0.01" min="0" max="100" placeholder="12.50" value={form.elektabilitas_pct} onChange={e => setForm(f => ({ ...f, elektabilitas_pct: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sumber Survei</Label>
            <Input placeholder="LSI, Internal, dll." value={form.sumber} onChange={e => setForm(f => ({ ...f, sumber: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Ukuran Sampel <span className="text-muted-foreground text-xs">(opsional)</span></Label>
            <Input type="number" placeholder="1000" value={form.sample_size} onChange={e => setForm(f => ({ ...f, sample_size: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Catatan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
            <Input placeholder="Konteks survei..." value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={add.isPending} className="flex-1">
              {add.isPending ? 'Menyimpan...' : 'Tambah Data'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}{p.dataKey === 'elektabilitas_pct' ? '%' : ''}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: surveys, isLoading } = useElectabilityData();
  const { data: dailySpend } = useAdsDailySpend(60);
  const del = useDeleteElectabilityEntry();

  const latest = surveys?.length ? surveys[surveys.length - 1] : null;
  const first = surveys?.length ? surveys[0] : null;
  const trend = latest && first && surveys!.length > 1
    ? (latest.elektabilitas_pct as number) - (first.elektabilitas_pct as number)
    : null;

  // Align ads spend with survey dates for overlay
  const spendByDate = Object.fromEntries((dailySpend ?? []).map(d => [d.date, d.total]));

  const chartData = (surveys ?? []).map(s => ({
    date: s.tanggal,
    elektabilitas_pct: parseFloat(String(s.elektabilitas_pct)),
    spend: spendByDate[s.tanggal] ?? null,
  }));

  return (
    <div className="p-8 w-full">
      {showAdd && <AddEntryModal onClose={() => setShowAdd(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tren Elektabilitas</h1>
          <p className="text-muted-foreground text-sm mt-1">Pantau perkembangan elektabilitas berdasarkan hasil survei.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Input Data Survei
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Elektabilitas Terkini</p>
            <p className="text-3xl font-bold text-indigo-600">
              {latest ? `${parseFloat(String(latest.elektabilitas_pct)).toFixed(1)}%` : '–'}
            </p>
            {latest && <p className="text-xs text-muted-foreground mt-1">{latest.sumber}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Tren (dari awal)</p>
            <p className={`text-3xl font-bold ${trend === null ? 'text-foreground' : trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend === null ? '–' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{surveys?.length ?? 0} data survei</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Survei Pertama</p>
            <p className="text-xl font-bold text-foreground">
              {first ? `${parseFloat(String(first.elektabilitas_pct)).toFixed(1)}%` : '–'}
            </p>
            {first && <p className="text-xs text-muted-foreground mt-1">{first.tanggal}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Grafik Elektabilitas</CardTitle>
          <CardDescription>Perkembangan elektabilitas dari waktu ke waktu</CardDescription>
        </CardHeader>
        <CardContent>
          {!surveys?.length ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Belum ada data. Tambahkan hasil survei pertama Anda.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="electGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="elektabilitas_pct" name="Elektabilitas" stroke="#6366F1" fill="url(#electGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#6366F1' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Data table */}
      {(surveys ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Survei</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Elektabilitas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Sumber</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Sampel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Catatan</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...(surveys ?? [])].reverse().map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.tanggal}</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600">{parseFloat(String(s.elektabilitas_pct)).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.sumber}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{s.sample_size ?? '–'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{s.catatan || '–'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => del.mutate(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
