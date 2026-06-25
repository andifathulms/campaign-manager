'use client';

import { useState } from 'react';
import { Turnstile } from '@/components/shared/Turnstile';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const TEMA = [
  { value: 'infrastruktur', label: 'Infrastruktur' },
  { value: 'kesehatan', label: 'Kesehatan' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'ekonomi', label: 'Ekonomi' },
  { value: 'lingkungan', label: 'Lingkungan' },
  { value: 'sosial', label: 'Sosial' },
  { value: 'lainnya', label: 'Lainnya' },
];

interface Props {
  slug: string;
  primary?: string;
}

export function AspirasiForm({ slug, primary = '#4F46E5' }: Props) {
  const [form, setForm] = useState({ nama: '', phone: '', email: '', wilayah: '', tema: 'infrastruktur', pesan: '' });
  const [captchaToken, setCaptchaToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${API}/public/${slug}/aspirasi/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, captcha_token: captchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.detail || 'Gagal mengirim aspirasi. Coba lagi.');
        setStatus('error');
        return;
      }
      setMessage(data.detail || 'Aspirasi Anda telah terkirim. Terima kasih!');
      setStatus('done');
    } catch {
      setMessage('Terjadi kesalahan jaringan. Coba lagi.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-3xl" style={{ background: primary }}>
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900">{message}</h3>
      </div>
    );
  }

  const ring = { ['--tw-ring-color' as any]: primary };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
        <input required value={form.nama} onChange={(e) => set('nama', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2" style={ring} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP (opsional)</label>
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2" style={ring} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah <span className="text-red-500">*</span></label>
          <input required value={form.wilayah} onChange={(e) => set('wilayah', e.target.value)} placeholder="Kelurahan / Kecamatan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2" style={ring} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tema Aspirasi <span className="text-red-500">*</span></label>
        <select value={form.tema} onChange={(e) => set('tema', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2" style={ring}>
          {TEMA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Isi Aspirasi <span className="text-red-500">*</span></label>
        <textarea required maxLength={1000} rows={5} value={form.pesan} onChange={(e) => set('pesan', e.target.value)}
          placeholder="Sampaikan aspirasi, pertanyaan, atau masukan Anda..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2" style={ring} />
      </div>

      <Turnstile onToken={setCaptchaToken} />

      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

      <button type="submit" disabled={status === 'loading'}
        className="w-full rounded-lg py-3 text-white font-semibold transition-opacity disabled:opacity-60" style={{ background: primary }}>
        {status === 'loading' ? 'Mengirim...' : 'Kirim Aspirasi'}
      </button>
    </form>
  );
}
