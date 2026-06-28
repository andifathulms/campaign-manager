'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface Props {
  name: string;
  nomorUrut?: number | null;
  /** 'header' = translucent pill on the colored hero header; 'ghost' = bordered on light. */
  variant?: 'header' | 'ghost';
  primary?: string;
  label?: string;
}

/**
 * One-tap share. Prefers the native share sheet (mobile), falls back to a
 * WhatsApp deep link — the dominant sharing channel for Indonesian campaigns.
 * The message reinforces the ballot number ("Coblos Nomor X").
 */
export function ShareButton({ name, nomorUrut, variant = 'header', primary = '#0A1A3F', label }: Props) {
  const [done, setDone] = useState(false);

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Dukung ${name}${nomorUrut ? `, Coblos Nomor ${nomorUrut}` : ''}! Lihat halaman kampanyenya:`;
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;

    if (nav?.share) {
      try {
        await nav.share({ title: name, text, url });
        return;
      } catch {
        /* user cancelled — fall through to WhatsApp */
      }
    }
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  if (variant === 'ghost') {
    return (
      <button
        onClick={onShare}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-semibold transition-all hover:scale-[1.03]"
        style={{ borderColor: `${primary}33`, color: primary }}
      >
        {done ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {label ?? 'Bagikan'}
      </button>
    );
  }

  return (
    <button
      onClick={onShare}
      aria-label="Bagikan halaman"
      className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white px-3 py-1.5 transition-colors"
    >
      {done ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
