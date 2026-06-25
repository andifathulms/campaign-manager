'use client';

import { useState } from 'react';
import { Turnstile } from '@/components/shared/Turnstile';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface Props {
  slug: string;
  refCode?: string;
  primary?: string;
}

const FIELDS = [
  { name: 'nama', label: 'Nama Lengkap', required: true },
  { name: 'phone', label: 'Nomor HP (WhatsApp)', required: true, type: 'tel', placeholder: '0812xxxxxxxx' },
  { name: 'email', label: 'Email', required: false, type: 'email' },
  { name: 'provinsi', label: 'Provinsi', required: true },
  { name: 'kabupaten_kota', label: 'Kabupaten / Kota', required: true },
  { name: 'kecamatan', label: 'Kecamatan', required: true },
  { name: 'kelurahan', label: 'Kelurahan / Desa', required: true },
] as const;

export function SupporterJoinForm({ slug, refCode, primary = '#2456E6' }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [statement, setStatement] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ membership_id?: string; message?: string }>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API}/public/${slug}/join/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, statement, ref_code: refCode || '', captcha_token: captchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ message: data.detail || 'Gagal mendaftar. Periksa data Anda.' });
        setStatus('error');
        return;
      }
      setResult({ membership_id: data.membership_id, message: 'Terima kasih! Anda resmi terdaftar sebagai pendukung.' });
      setStatus('done');
    } catch {
      setResult({ message: 'Terjadi kesalahan jaringan. Coba lagi.' });
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl"
          style={{ background: primary }}
        >
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900">{result.message}</h3>
        {result.membership_id && (
          <p className="mt-2 text-gray-600">
            Nomor keanggotaan Anda: <span className="font-mono font-semibold">{result.membership_id}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {f.label} {f.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={(f as any).type || 'text'}
            required={f.required}
            placeholder={(f as any).placeholder}
            value={form[f.name] || ''}
            onChange={(e) => set(f.name, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: primary }}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Dukungan (opsional)</label>
        <input
          maxLength={100}
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Maju terus untuk perubahan!"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ ['--tw-ring-color' as any]: primary }}
        />
      </div>

      <Turnstile onToken={setCaptchaToken} />

      {status === 'error' && <p className="text-sm text-red-600">{result.message}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg py-3 text-white font-semibold transition-opacity disabled:opacity-60"
        style={{ background: primary }}
      >
        {status === 'loading' ? 'Mengirim...' : 'Daftar Jadi Pendukung'}
      </button>
    </form>
  );
}
