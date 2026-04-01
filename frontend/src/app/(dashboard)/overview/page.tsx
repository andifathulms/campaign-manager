import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Overview — KampanyeKit',
};

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Selamat datang 👋</h1>
      <p className="text-muted-foreground mb-8">
        Halo, <strong>{session?.user?.name}</strong>. Dashboard kampanye Anda siap digunakan.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendukung', value: '0', desc: 'Belum ada pendukung' },
          { label: 'Total Jangkauan Iklan', value: '0', desc: 'Hubungkan akun iklan' },
          { label: 'Total Tim', value: '0', desc: 'Belum ada anggota tim' },
          { label: 'Total Pengeluaran Iklan', value: 'Rp 0', desc: 'Tidak ada data' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
