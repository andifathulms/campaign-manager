import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PasswordLoginForm } from '@/components/auth/PasswordLoginForm';

export const metadata = { title: 'Admin Portal — Masuk' };

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary text-primary-foreground items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">Khusus staf platform KampanyeKit</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <PasswordLoginForm portal="admin" />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Kandidat?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Masuk di portal kampanye</Link>
        </p>
      </div>
    </div>
  );
}
