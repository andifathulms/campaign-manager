'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export function OTPLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await axios.post(`${apiBase}/auth/otp/request/`, { phone });
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal mengirim OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${apiBase}/auth/otp/verify/`, { phone, code });
      // Use the tokens to sign in via NextAuth
      const result = await signIn('credentials-otp', {
        accessToken: data.access,
        refreshToken: data.refresh,
        redirect: false,
      });
      if (result?.error) {
        // Fallback: direct sign in with returned tokens
        // Store tokens and redirect
        setError('Login berhasil tapi sesi gagal. Coba login ulang.');
      } else {
        router.push(data.user?.role === 'relawan' ? '/volunteer' : '/dashboard/overview');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'OTP tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg mb-4">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={requestOTP} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="otp-phone" className="text-sm font-medium">Nomor WhatsApp</Label>
            <Input
              id="otp-phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className="h-11"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full h-11 font-semibold text-sm" disabled={isLoading}>
            {isLoading ? 'Mengirim OTP...' : 'Kirim OTP via WhatsApp'}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOTP} className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Kode OTP telah dikirim ke <span className="font-medium text-foreground">{phone}</span>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="otp-code" className="text-sm font-medium">Kode OTP</Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="h-11 text-center text-2xl tracking-[0.5em] font-mono"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          <Button type="submit" className="w-full h-11 font-semibold text-sm" disabled={isLoading || code.length < 6}>
            {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
          </Button>
          <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }} className="text-sm text-primary hover:underline w-full text-center">
            Ganti nomor / kirim ulang
          </button>
        </form>
      )}
    </div>
  );
}
