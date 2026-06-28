'use client';

import { useSession, signOut } from 'next-auth/react';
import { Eye } from 'lucide-react';

export function ImpersonationBanner() {
  const { data: session } = useSession();
  const impersonatedBy = (session as any)?.impersonatedBy as string | null | undefined;
  if (!impersonatedBy) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-gold text-gold-foreground text-sm font-medium px-4 py-2">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>
        Mode admin — Anda melihat sebagai <strong>{(session?.user?.name) || 'kandidat'}</strong>
      </span>
      <button
        onClick={() => signOut({ callbackUrl: '/admin/login' })}
        className="ml-2 rounded-full bg-gold-foreground/10 hover:bg-gold-foreground/20 px-3 py-0.5 text-xs font-semibold transition-colors"
      >
        Kembali ke Admin
      </button>
    </div>
  );
}
