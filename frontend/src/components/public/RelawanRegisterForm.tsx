'use client';

import { useState } from 'react';
import { Turnstile } from '@/components/shared/Turnstile';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface Props {
  slug: string;
  refCode?: string;
}

const FIELDS = [
  { name: 'nama', label: 'Nama Lengkap', required: true },
  { name: 'phone', label: 'Nomor HP (WhatsApp)', required: true, type: 'tel', placeholder: '0812xxxxxxxx' },
  { name: 'email', label: 'Email', required: false, type: 'email' },
  { name: 'kelurahan', label: 'Kelurahan / Desa', required: true },
  { name: 'kecamatan', label: 'Kecamatan', required: true },
  { name: 'kabupaten_kota', label: 'Kabupaten / Kota', required: false },
] as const;

export function RelawanRegisterForm({ slug, refCode }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [alasan, setAlasan] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API}/public/${slug}/relawan/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          alasan_bergabung: alasan,
          referral_code: refCode || '',
          captcha_token: captchaToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.detail || 'Gagal mendaftar. Periksa data Anda.');
        setStatus('error');
        return;
      }
      setMessage(data.detail || 'Pendaftaran berhasil!');
      setStatus('done');
    } catch {
      setMessage('Terjadi kesalahan jaringan. Coba lagi.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center text-white text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900">{message}</h3>
        <p className="text-sm text-slate-500 mt-2">Tim kampanye akan menghubungi Anda via WhatsApp.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <div className="grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.name === 'nama' ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={(f as any).type || 'text'}
              required={f.required}
              placeholder={(f as any).placeholder}
              value={form[f.name] || ''}
              onChange={(e) => set(f.name, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Bergabung (opsional)</label>
        <textarea
          maxLength={200}
          rows={3}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Mengapa Anda ingin bergabung?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Turnstile onToken={setCaptchaToken} />

      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg py-3 bg-primary text-white font-semibold hover:bg-primary transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? 'Mengirim...' : 'Daftar Jadi Relawan'}
      </button>
    </form>
  );
}
