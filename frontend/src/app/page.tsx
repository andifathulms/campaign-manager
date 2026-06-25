import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Globe2,
  BarChart3,
  Users,
  Heart,
  Wallet,
  FileText,
} from 'lucide-react';

export const metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital Indonesia',
  description: 'Kelola kampanye politik Anda dengan cerdas dan terukur. Landing page, tim sukses, iklan digital, dan pendukung dalam satu platform.',
};

const features = [
  {
    icon: Globe2,
    title: 'Halaman Kampanye',
    desc: 'Landing page profesional dengan subdomain sendiri. Mobile-first, SEO-ready.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Iklan Terpadu',
    desc: 'Pantau Meta Ads & TikTok Ads side-by-side. Satu layar, semua data.',
  },
  {
    icon: Users,
    title: 'Tim Sukses Digital',
    desc: 'Manajemen relawan, referral link unik, dan leaderboard performa tim.',
  },
  {
    icon: Heart,
    title: 'Pendaftaran Pendukung',
    desc: 'Form registrasi digital, kartu anggota otomatis, data by kelurahan.',
  },
  {
    icon: Wallet,
    title: 'Budget Tracker',
    desc: 'Alokasi anggaran per platform, alert saat 80% terpakai.',
  },
  {
    icon: FileText,
    title: 'Laporan Mingguan',
    desc: 'PDF laporan otomatis setiap Senin, langsung ke email kandidat.',
  },
];

const stats = [
  { value: '100+', label: 'Kandidat terbantu' },
  { value: 'Rp 5M+', label: 'Ad spend dikelola' },
  { value: '50rb+', label: 'Pendukung terdata' },
  { value: '< 2 dtk', label: 'Load halaman di 4G' },
];

export default function HomePage() {
  return (
    <main className="dark min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">K</div>
            <span className="font-display font-semibold text-sm">KampanyeKit</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">
              Masuk
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[300px] bg-gold/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Platform Kampanye Digital · Indonesia
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 text-balance">
            Kampanye yang
            <br />
            <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
              lebih cerdas.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
            Dari halaman kampanye, tim sukses, iklan digital, hingga pendaftaran pendukung —
            semua dalam satu platform yang terukur.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href="/login">
                Mulai sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="gold" size="xl">
              <Link href="/login">Lihat demo</Link>
            </Button>
          </div>

          {/* Stats band */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-border bg-border">
            {stats.map((s) => (
              <div key={s.label} className="bg-card px-4 py-6">
                <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest text-center mb-12">
            Semua yang Anda butuhkan dalam satu platform
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:bg-accent/40 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} KampanyeKit — Platform Kampanye Digital Indonesia
        </p>
      </footer>
    </main>
  );
}
