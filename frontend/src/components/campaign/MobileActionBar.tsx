'use client';

import Link from 'next/link';
import { Heart, MessageSquare } from 'lucide-react';

interface Props {
  slug: string;
  primary: string;
  nomorUrut?: number | null;
}

/**
 * Sticky bottom action bar for mobile — the single biggest conversion lever on
 * a phone-first campaign page. Keeps "Dukung" one thumb-tap away while scrolling
 * and keeps the ballot number on screen at all times.
 */
export function MobileActionBar({ slug, primary, nomorUrut }: Props) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-black/5 bg-white/95 backdrop-blur px-3 py-2.5 flex items-center gap-2 shadow-[0_-6px_24px_rgba(0,0,0,0.10)]">
      {nomorUrut != null && (
        <div className="flex flex-col items-center justify-center px-2.5 flex-shrink-0">
          <span className="text-[8px] font-bold uppercase tracking-wide leading-none" style={{ color: primary }}>Coblos</span>
          <span className="font-display text-2xl font-extrabold leading-none" style={{ color: primary }}>{nomorUrut}</span>
        </div>
      )}
      <Link
        href={`/${slug}/dukung`}
        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl text-white font-semibold py-3 text-sm shadow-sm active:scale-[0.98] transition-transform"
        style={{ background: primary }}
      >
        <Heart className="w-4 h-4" /> Dukung
      </Link>
      <Link
        href={`/${slug}/aspirasi`}
        aria-label="Kirim aspirasi"
        className="flex-shrink-0 inline-flex items-center justify-center rounded-xl border-2 font-semibold w-12 h-12 active:scale-[0.98] transition-transform"
        style={{ borderColor: `${primary}33`, color: primary }}
      >
        <MessageSquare className="w-5 h-5" />
      </Link>
    </div>
  );
}
