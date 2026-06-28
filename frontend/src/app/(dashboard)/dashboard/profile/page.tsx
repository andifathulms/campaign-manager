'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileDown, Plus, Trash2, ImageIcon } from 'lucide-react';
import { useCandidate, useUpdateCandidate } from '@/hooks/useCandidate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const profileSchema = z.object({
  nama_lengkap: z.string().min(1, 'Nama wajib diisi'),
  nomor_urut: z.coerce.number().nullable().optional(),
  tanggal_pemilihan: z.string().optional(),
  jenis_pemilihan: z.string(),
  dapil: z.string(),
  partai: z.string(),
  tagline: z.string().max(300),
  visi: z.string(),
  color_primary: z.string(),
  foto_external: z.string().optional(),
  foto_sampul_external: z.string().optional(),
  galeri: z.array(z.object({
    url: z.string().min(1, 'URL wajib diisi'),
    caption: z.string().optional(),
  })).optional(),
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
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  const downloadPressKit = async () => {
    if (!token) return;
    const res = await fetch(`${apiBase}/candidates/me/press-kit/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'press-kit.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const { register, handleSubmit, control, watch, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: candidate ? {
      nama_lengkap: candidate.nama_lengkap,
      nomor_urut: candidate.nomor_urut,
      tanggal_pemilihan: candidate.tanggal_pemilihan || '',
      jenis_pemilihan: candidate.jenis_pemilihan,
      dapil: candidate.dapil,
      partai: candidate.partai,
      tagline: candidate.tagline,
      visi: candidate.visi,
      color_primary: candidate.color_primary,
      foto_external: candidate.foto_external || '',
      foto_sampul_external: candidate.foto_sampul_external || '',
      galeri: candidate.galeri || [],
      sosmed_instagram: candidate.sosmed?.instagram || '',
      sosmed_tiktok: candidate.sosmed?.tiktok || '',
      sosmed_facebook: candidate.sosmed?.facebook || '',
      sosmed_twitter: candidate.sosmed?.twitter || '',
      sosmed_youtube: candidate.sosmed?.youtube || '',
    } : undefined,
  });

  const { fields: galeriFields, append: appendGaleri, remove: removeGaleri } = useFieldArray({
    control,
    name: 'galeri',
  });
  const fotoPreview = watch('foto_external');
  const coverPreview = watch('foto_sampul_external');

  const onSubmit = async (data: ProfileFormData) => {
    const payload = {
      nama_lengkap: data.nama_lengkap,
      nomor_urut: data.nomor_urut || null,
      tanggal_pemilihan: data.tanggal_pemilihan || null,
      jenis_pemilihan: data.jenis_pemilihan,
      dapil: data.dapil,
      partai: data.partai,
      tagline: data.tagline,
      visi: data.visi,
      color_primary: data.color_primary,
      foto_external: data.foto_external || '',
      foto_sampul_external: data.foto_sampul_external || '',
      galeri: (data.galeri || []).filter((g) => g.url?.trim()),
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
          <h1 className="font-display text-2xl font-bold">Profil Kandidat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Informasi ini ditampilkan di halaman kampanye publik Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {candidate && (
            <Badge variant={candidate.status === 'published' ? 'success' : 'secondary'}>
              {candidate.status === 'published' ? 'Dipublikasikan' : 'Draft'}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={downloadPressKit} className="gap-2">
            <FileDown className="w-4 h-4" /> Press Kit
          </Button>
        </div>
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
              <div className="space-y-2">
                <Label htmlFor="tanggal_pemilihan">Tanggal Pemungutan Suara</Label>
                <Input id="tanggal_pemilihan" type="date" {...register('tanggal_pemilihan')} />
                <p className="text-[11px] text-muted-foreground">Menampilkan hitung mundur di halaman publik.</p>
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
            <CardTitle>Foto Kandidat</CardTitle>
            <CardDescription>Foto profil & sampul yang tampil di halaman kampanye. Tempel URL gambar (mis. dari Unsplash) atau hosting Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary border flex items-center justify-center flex-shrink-0">
                {fotoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="foto_external">Foto Profil (headshot)</Label>
                <Input id="foto_external" placeholder="https://...jpg" {...register('foto_external')} />
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-secondary border flex items-center justify-center flex-shrink-0">
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="foto_sampul_external">Foto Sampul (banner)</Label>
                <Input id="foto_sampul_external" placeholder="https://...jpg" {...register('foto_sampul_external')} />
                <p className="text-[11px] text-muted-foreground">Tampil sebagai latar di bagian atas halaman.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Galeri Kegiatan</CardTitle>
                <CardDescription>Dokumentasi bersama warga — bukti nyata yang membangun kepercayaan.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => appendGaleri({ url: '', caption: '' })}>
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {galeriFields.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">Belum ada foto. Klik &ldquo;Tambah&rdquo; untuk menambahkan dokumentasi kegiatan.</p>
            )}
            {galeriFields.map((field, i) => {
              const url = watch(`galeri.${i}.url`);
              return (
                <div key={field.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary border flex items-center justify-center flex-shrink-0">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <Input placeholder="https://...jpg" {...register(`galeri.${i}.url` as const)} />
                    <Input placeholder="Keterangan foto (opsional)" {...register(`galeri.${i}.caption` as const)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeGaleri(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
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
