'use client';

import { PasswordLoginForm } from './PasswordLoginForm';

export function LoginForm() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Masuk ke akun Anda</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kandidat, tim sukses, relawan, dan admin masuk dari sini.
        </p>
      </div>

      <PasswordLoginForm />

      <div className="mt-6 rounded-lg bg-muted/50 border border-border p-3.5 text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <span className="text-foreground font-medium">Hubungi admin</span> untuk dibuatkan akun.
        </p>
      </div>
    </div>
  );
}
