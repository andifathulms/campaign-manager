'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProvisionCandidate } from '@/hooks/usePlatformAdmin';

const schema = z.object({
  nama_lengkap: z.string().min(2, 'Wajib diisi'),
  username: z.string().min(3, 'Min. 3 karakter').regex(/^[a-zA-Z0-9_]+$/, 'Huruf, angka, underscore'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  tenant_name: z.string().min(2, 'Wajib diisi'),
  tenant_slug: z.string().min(2, 'Wajib diisi').regex(/^[a-z0-9-]+$/, 'Huruf kecil, angka, strip'),
  plan: z.enum(['starter', 'pro', 'premium', 'enterprise']),
  partai: z.string().optional(),
  dapil: z.string().optional(),
  jenis_pemilihan: z.enum(['pileg_dpr', 'pileg_dprd_provinsi', 'pileg_dprd_kota', 'pilkada_bupati', 'pilkada_walikota', 'pilkada_gubernur']),
});

type FormData = z.infer<typeof schema>;

export default function ProvisionCandidatePage() {
  const provision = useProvisionCandidate();
  const [result, setResult] = useState<{ slug: string; username: string; temp_password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plan: 'starter', jenis_pemilihan: 'pileg_dprd_kota' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const res = await provision.mutateAsync(data);
      setResult(res);
    } catch (e: any) {
      const d = e?.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Gagal membuat kandidat.');
    }
  };

  if (result) {
    return (
      <div className="p-8 w-full max-w-lg">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-6 h-6" /></div>
          <h1 className="font-display text-xl font-bold mb-2">Kandidat berhasil dibuat</h1>
          <p className="text-sm text-muted-foreground mb-6">Bagikan kredensial berikut. Password hanya ditampilkan sekali.</p>
          <div className="rounded-lg bg-muted/50 p-4 text-left text-sm space-y-1 font-mono">
            <p>Login: <strong>/login</strong></p>
            <p>Username: <strong>{result.username}</strong></p>
            <p>Password: <strong>{result.temp_password}</strong></p>
            <p>Halaman: <strong>/{result.slug}</strong></p>
          </div>
          <div className="flex gap-2 justify-center mt-6">
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`Username: ${result.username}\nPassword: ${result.temp_password}`); setCopied(true); }}>
              <Copy className="w-4 h-4" /> {copied ? 'Tersalin' : 'Salin kredensial'}
            </Button>
            <Button asChild><Link href="/admin/candidates">Selesai</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-2xl">
      <Link href="/admin/candidates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>
      <h1 className="font-display text-2xl font-bold mb-1">Tambah Kandidat</h1>
      <p className="text-muted-foreground text-sm mb-8">Buat kampanye + akun login kandidat baru.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-border bg-card p-6">
        {error && <div className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg p-3">{error}</div>}

        <Field label="Nama Lengkap Kandidat" error={errors.nama_lengkap?.message}>
          <Input {...register('nama_lengkap')} placeholder="H. Budi Santoso" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username Login" error={errors.username?.message}><Input {...register('username')} placeholder="budisantoso" /></Field>
          <Field label="Email (opsional)" error={errors.email?.message}><Input {...register('email')} placeholder="budi@email.com" /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama Kampanye" error={errors.tenant_name?.message}><Input {...register('tenant_name')} placeholder="Kampanye Budi Santoso" /></Field>
          <Field label="Slug (subdomain)" error={errors.tenant_slug?.message}><Input {...register('tenant_slug')} placeholder="budisantoso" /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Paket" error={errors.plan?.message}>
            <select {...register('plan')} className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="starter">Starter</option><option value="pro">Pro</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <Field label="Jenis Pemilihan" error={errors.jenis_pemilihan?.message}>
            <select {...register('jenis_pemilihan')} className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="pileg_dpr">Caleg DPR RI</option>
              <option value="pileg_dprd_provinsi">Caleg DPRD Provinsi</option>
              <option value="pileg_dprd_kota">Caleg DPRD Kota/Kab.</option>
              <option value="pilkada_bupati">Calon Bupati</option>
              <option value="pilkada_walikota">Calon Walikota</option>
              <option value="pilkada_gubernur">Calon Gubernur</option>
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Partai (opsional)"><Input {...register('partai')} placeholder="Partai Maju" /></Field>
          <Field label="Dapil (opsional)"><Input {...register('dapil')} placeholder="Jawa Barat 2" /></Field>
        </div>

        <Button type="submit" className="w-full" disabled={provision.isPending}>
          {provision.isPending ? 'Membuat…' : 'Buat Kandidat'}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
