import Link from 'next/link';
import { Heart } from 'lucide-react';
import { OTPLoginForm } from '@/components/auth/OTPLoginForm';

export const metadata = { title: 'Portal Relawan — Masuk' };

export default function VolunteerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-primary text-primary-foreground items-center justify-center mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Portal Relawan</h1>
          <p className="text-muted-foreground text-sm mt-1">Masuk dengan nomor WhatsApp Anda</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <OTPLoginForm />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Tim kampanye?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
