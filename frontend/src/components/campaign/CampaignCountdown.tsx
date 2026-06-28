'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** ISO date string (YYYY-MM-DD) for voting day. */
  date: string;
  /** 'dark' = light text on a dark/colored band; 'light' = dark text on light. */
  tone?: 'dark' | 'light';
}

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  return {
    done: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}

/**
 * Live countdown to voting day — manufactures urgency and keeps the page
 * feeling current. Renders nothing on the server to avoid hydration drift;
 * fills in on mount.
 */
export function CampaignCountdown({ date, tone = 'dark' }: Props) {
  // Target noon local time so the day count reads naturally.
  const target = new Date(`${date}T12:00:00`).getTime();
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;

  const isDark = tone === 'dark';
  const cellBg = isDark ? 'bg-white/10 border-white/15' : 'bg-black/[0.04] border-black/10';
  const numCls = isDark ? 'text-white' : 'text-gray-900';
  const lblCls = isDark ? 'text-white/55' : 'text-gray-500';

  const tanggalLabel = new Date(`${date}T12:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (t?.done) {
    return (
      <p className={`font-display text-xl font-bold ${numCls}`}>
        Hari ini hari pemungutan suara — gunakan hak pilih Anda!
      </p>
    );
  }

  const cells = [
    { v: t?.days, l: 'Hari' },
    { v: t?.hours, l: 'Jam' },
    { v: t?.minutes, l: 'Menit' },
    { v: t?.seconds, l: 'Detik' },
  ];

  return (
    <div>
      <div className="flex items-stretch justify-center gap-2.5 sm:gap-3">
        {cells.map((c) => (
          <div key={c.l} className={`rounded-2xl border ${cellBg} backdrop-blur-sm px-3 sm:px-5 py-3 min-w-[64px] sm:min-w-[80px]`}>
            <div className={`font-display text-3xl sm:text-5xl font-extrabold tabular-nums leading-none ${numCls}`}>
              {t == null ? '··' : String(c.v).padStart(2, '0')}
            </div>
            <div className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-1.5 ${lblCls}`}>{c.l}</div>
          </div>
        ))}
      </div>
      <p className={`text-xs mt-3 ${lblCls}`}>Pemungutan suara · {tanggalLabel}</p>
    </div>
  );
}
