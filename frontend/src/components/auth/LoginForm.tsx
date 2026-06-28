'use client';

import Link from 'next/link';
import { PasswordLoginForm } from './PasswordLoginForm';

export function LoginForm() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Selamat datang kembali</h1>
        <p className="text-muted-foreground text-sm mt-1">Masuk ke dashboard kampanye Anda</p>
      </div>

      <PasswordLoginForm portal="dashboard" />

      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Seorang relawan?{' '}
          <Link href="/volunteer/login" className="text-primary hover:text-primary/80 font-semibold">
            Masuk via WhatsApp
          </Link>
        </p>
        <p>
          Belum punya akun?{' '}
          <a href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Hubungi kami
          </a>
        </p>
      </div>
    </div>
  );
}
