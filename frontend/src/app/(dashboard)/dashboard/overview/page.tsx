import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Users, TrendingUp, Megaphone, Wallet } from 'lucide-react';

export const metadata = {
  title: 'Overview — KampanyeKit',
};

const statCards = [
  {
    label: 'Total Pendukung',
    value: '0',
    desc: 'Mulai daftarkan pendukung',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    label: 'Jangkauan Iklan',
    value: '0',
    desc: 'Hubungkan akun iklan',
    icon: TrendingUp,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    label: 'Anggota Tim',
    value: '0',
    desc: 'Tambahkan tim sukses',
    icon: Megaphone,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    label: 'Total Belanja Iklan',
    value: 'Rp 0',
    desc: 'Tidak ada data',
    icon: Wallet,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
];

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || 'Kandidat';

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Selamat datang, <span className="text-indigo-600">{name}</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Berikut ringkasan kampanye Anda hari ini.
        </p>
      </div>

      {/* Stat cards */}
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

      {/* Quick actions */}
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
