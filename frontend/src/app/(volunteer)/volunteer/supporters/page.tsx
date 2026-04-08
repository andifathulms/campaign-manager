'use client';

import { useState } from 'react';
import { UserPlus, Users, MapPin, Star, AlertTriangle } from 'lucide-react';
import { useVolunteerSupporterSummary, useCreateVolunteerSupporter } from '@/hooks/useVolunteerSupporters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VolunteerSupportersPage() {
  const { data: summary, isLoading } = useVolunteerSupporterSummary();
  const create = useCreateVolunteerSupporter();
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    nama: '', phone: '', email: '', kelurahan: '', kecamatan: '',
    kabupaten_kota: '', provinsi: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarning('');
    setSuccess('');
    try {
      const result = await create.mutateAsync(form);
      if (result.warning) setWarning(result.warning);
      setSuccess(`Pendukung ${form.nama} berhasil didaftarkan! (ID: ${result.membership_id})`);
      setForm({ nama: '', phone: '', email: '', kelurahan: '', kecamatan: '', kabupaten_kota: '', provinsi: '' });
    } catch {
      setWarning('Gagal mendaftarkan pendukung.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <UserPlus className="w-5 h-5" /> Cari Pendukung
      </h1>

      {/* Summary cards */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-xs text-muted-foreground">Total Rekrutan</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Hari Ini</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary.today}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Poin dari Pendukung</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary.points_from_supporters}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-500" />
                <span className="text-xs text-muted-foreground">Kecamatan</span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary.by_kecamatan?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Registration form */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Daftarkan Pendukung Baru</CardTitle>
        </CardHeader>
        <CardContent>
          {warning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm mb-4">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {warning}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm mb-4">{success}</div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={form.nama} onChange={e => set('nama', e.target.value)} required placeholder="Nama pendukung" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nomor HP *</Label>
                <Input value={form.phone} onChange={e => set('phone', e.target.value)} required placeholder="08xxxxxxxxxx" type="tel" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@..." type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kelurahan *</Label>
                <Input value={form.kelurahan} onChange={e => set('kelurahan', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Kecamatan *</Label>
                <Input value={form.kecamatan} onChange={e => set('kecamatan', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kabupaten/Kota *</Label>
                <Input value={form.kabupaten_kota} onChange={e => set('kabupaten_kota', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Provinsi *</Label>
                <Input value={form.provinsi} onChange={e => set('provinsi', e.target.value)} required />
              </div>
            </div>
            <Button type="submit" disabled={create.isPending} className="w-full">
              {create.isPending ? 'Mendaftarkan...' : 'Daftarkan Pendukung'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
