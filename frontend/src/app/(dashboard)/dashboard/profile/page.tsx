'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCandidate, useUpdateCandidate } from '@/hooks/useCandidate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama wajib diisi'),
  nomor_urut: z.coerce.number().nullable().optional(),
  jenis_pemilihan: z.string(),
  dapil: z.string(),
  partai: z.string(),
  tagline: z.string().max(300),
  visi: z.string(),
  color_primary: z.string(),
  sosmed_instagram: z.string().optional(),
  sosmed_tiktok: z.string().optional(),
  sosmed_facebook: z.string().optional(),
  sosmed_twitter: z.string().optional(),
  sosmed_youtube: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const JENIS_PEMILIHAN_OPTIONS = [
  { value: 'pileg_dpr', label: 'Pileg DPR' },
  { value: 'pileg_dprd_provinsi', label: 'Pileg DPRD Provinsi' },
  { value: 'pileg_dprd_kota', label: 'Pileg DPRD Kota/Kabupaten' },
  { value: 'pilkada_bupati', label: 'Pilkada Bupati' },
  { value: 'pilkada_walikota', label: 'Pilkada Walikota' },
  { value: 'pilkada_gubernur', label: 'Pilkada Gubernur' },
];

export default function ProfilePage() {
  const { data: candidate, isLoading } = useCandidate();
  const updateCandidate = useUpdateCandidate();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: candidate ? {
      nama_lengkap: candidate.nama_lengkap,
      nomor_urut: candidate.nomor_urut,
      jenis_pemilihan: candidate.jenis_pemilihan,
      dapil: candidate.dapil,
      partai: candidate.partai,
      tagline: candidate.tagline,
      visi: candidate.visi,
      color_primary: candidate.color_primary,
      sosmed_instagram: candidate.sosmed?.instagram || '',
      sosmed_tiktok: candidate.sosmed?.tiktok || '',
      sosmed_facebook: candidate.sosmed?.facebook || '',
      sosmed_twitter: candidate.sosmed?.twitter || '',
      sosmed_youtube: candidate.sosmed?.youtube || '',
    } : undefined,
  });

  const onSubmit = async (data: ProfileFormData) => {
    const payload = {
      nama_lengkap: data.nama_lengkap,
      nomor_urut: data.nomor_urut || null,
      jenis_pemilihan: data.jenis_pemilihan,
      dapil: data.dapil,
      partai: data.partai,
      tagline: data.tagline,
      visi: data.visi,
      color_primary: data.color_primary,
      sosmed: {
        instagram: data.sosmed_instagram || '',
        tiktok: data.sosmed_tiktok || '',
        facebook: data.sosmed_facebook || '',
        twitter: data.sosmed_twitter || '',
        youtube: data.sosmed_youtube || '',
      },
    };
    await updateCandidate.mutateAsync(payload as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-48" />
          <div className="h-64 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Profil Kandidat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informasi ini ditampilkan di halaman kampanye publik Anda.
          </p>
        </div>
        {candidate && (
          <Badge variant={candidate.status === 'published' ? 'success' : 'secondary'}>
            {candidate.status === 'published' ? 'Dipublikasikan' : 'Draft'}
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
                <Input id="nama_lengkap" {...register('nama_lengkap')} />
                {errors.nama_lengkap && <p className="text-sm text-destructive">{errors.nama_lengkap.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor_urut">Nomor Urut</Label>
                <Input id="nomor_urut" type="number" {...register('nomor_urut')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partai">Partai</Label>
                <Input id="partai" placeholder="Partai Maju" {...register('partai')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_pemilihan">Jenis Pemilihan</Label>
                <Select id="jenis_pemilihan" {...register('jenis_pemilihan')}>
                  {JENIS_PEMILIHAN_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dapil">Dapil / Wilayah</Label>
                <Input id="dapil" placeholder="Kota Bandung Dapil 2" {...register('dapil')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" placeholder="Bersama Membangun Kota" {...register('tagline')} maxLength={300} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visi</CardTitle>
            <CardDescription>Visi utama kampanye Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="visi"
              rows={4}
              placeholder="Tuliskan visi kampanye Anda..."
              {...register('visi')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Sosial</CardTitle>
            <CardDescription>Link profil media sosial Anda (opsional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'sosmed_instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
              { key: 'sosmed_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
              { key: 'sosmed_facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
              { key: 'sosmed_twitter', label: 'Twitter / X', placeholder: 'https://x.com/username' },
              { key: 'sosmed_youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <Label className="w-24 shrink-0">{label}</Label>
                <Input placeholder={placeholder} {...register(key as any)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warna Tema</CardTitle>
            <CardDescription>Warna utama halaman kampanye Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="color_primary">Warna Utama</Label>
              <input
                id="color_primary"
                type="color"
                className="h-10 w-20 rounded-md border cursor-pointer"
                {...register('color_primary')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={updateCandidate.isPending || !isDirty}>
            {updateCandidate.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
          {saved && <span className="text-sm text-green-600 font-medium">Tersimpan</span>}
          {updateCandidate.isError && (
            <span className="text-sm text-destructive">Gagal menyimpan. Coba lagi.</span>
          )}
        </div>
      </form>
    </div>
  );
}
