import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Users, TrendingUp, Megaphone, Wallet } from 'lucide-react';

export const metadata = { title: 'Overview — KampanyeKit' };

const API_BASE = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/v1';

async function getOverview(accessToken: string) {
  try {
    const res = await fetch(`${API_BASE}/dashboard/overview/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatRp(n: number) {
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('id-ID');
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || 'Kandidat';
  const token = (session as any)?.accessToken as string | undefined;

  const stats = token ? await getOverview(token) : null;

  const statCards = [
    {
      label: 'Total Pendukung',
      value: stats ? String(stats.supporter_count) : '—',
      desc: stats?.supporter_count > 0 ? `${stats.supporter_count} pendukung terdaftar` : 'Mulai daftarkan pendukung',
      icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100',
    },
    {
      label: 'Jangkauan Iklan',
      value: stats ? formatNum(stats.total_reach) : '—',
      desc: stats?.total_reach > 0 ? 'Total jangkauan iklan' : 'Hubungkan akun iklan',
      icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100',
    },
    {
      label: 'Anggota Tim',
      value: stats ? String(stats.team_count) : '—',
      desc: stats?.team_count > 0 ? `${stats.team_count} anggota aktif` : 'Tambahkan tim sukses',
      icon: Megaphone, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100',
    },
    {
      label: 'Total Belanja Iklan',
      value: stats ? formatRp(stats.total_spend) : '—',
      desc: stats?.total_spend > 0 ? 'Dari semua platform' : 'Tidak ada data',
      icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
    },
  ];

  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Selamat datang, <span className="text-indigo-600">{name}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Berikut ringkasan kampanye Anda hari ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} strokeWidth={2} />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{card.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">Mulai dari sini</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Lengkapi profil kandidat', href: '/dashboard/profile', cta: 'Isi profil →' },
            { label: 'Hubungkan iklan digital', href: '/dashboard/ads', cta: 'Sambungkan →' },
            { label: 'Tambahkan tim sukses', href: '/dashboard/team', cta: 'Tambah tim →' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all group"
            >
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                {action.cta}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
