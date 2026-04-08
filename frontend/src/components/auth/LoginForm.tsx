'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTPLoginForm } from './OTPLoginForm';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Username atau password salah.');
      } else {
        router.push('/dashboard/overview');
        router.refresh();
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Selamat datang kembali</h1>
        <p className="text-muted-foreground text-sm mt-1">Masuk ke dashboard kampanye Anda</p>
      </div>

      {/* Login method tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod('password')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            loginMethod === 'password' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          Username
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('otp')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            loginMethod === 'otp' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          WhatsApp OTP
        </button>
      </div>

      {loginMethod === 'otp' ? (
        <OTPLoginForm />
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm font-medium">Username</Label>
          <Input
            id="username"
            placeholder="Masukkan username"
            autoComplete="username"
            className="h-11"
            {...register('username')}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-11"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11 font-semibold text-sm" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Memproses...
            </span>
          ) : 'Masuk'}
        </Button>

        <p className="text-sm text-muted-foreground text-center pt-1">
          Belum punya akun?{' '}
          <a href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Hubungi kami
          </a>
        </p>
      </form>
      )}
    </div>
  );
}
