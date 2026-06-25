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
  ShieldCheck,
  Lock,
  MapPin,
  ScrollText,
  Check,
  Star,
} from 'lucide-react';

export const metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital Indonesia',
  description: 'Kelola seluruh kampanye politik Anda dari satu tempat: halaman kampanye, tim sukses, iklan digital terpadu, dan data pendukung yang terukur.',
};

const features = [
  { icon: Globe2, title: 'Halaman Kampanye', desc: 'Website profesional dengan subdomain sendiri. Mobile-first, SEO-ready, tampil dalam hitungan menit.' },
  { icon: BarChart3, title: 'Dashboard Iklan Terpadu', desc: 'Pantau Meta & TikTok Ads berdampingan. Satu layar, semua metrik, kontrol penuh.' },
  { icon: Users, title: 'Tim Sukses Digital', desc: 'Kelola relawan berjenjang, referral link unik, dan leaderboard performa secara real-time.' },
  { icon: Heart, title: 'Pendaftaran Pendukung', desc: 'Form registrasi digital, kartu anggota otomatis, terdata rapi hingga level kelurahan.' },
  { icon: Wallet, title: 'Budget Tracker', desc: 'Alokasi anggaran per platform dengan peringatan otomatis saat 80% terpakai.' },
  { icon: FileText, title: 'Laporan Mingguan', desc: 'Laporan PDF otomatis setiap Senin, langsung ke email kandidat dan koordinator.' },
];

const steps = [
  { n: '01', title: 'Daftar & atur profil', desc: 'Lengkapi profil kandidat, visi-misi, dan program unggulan dalam satu form sederhana.' },
  { n: '02', title: 'Hubungkan & undang tim', desc: 'Sambungkan akun iklan, undang koordinator dan relawan sesuai wilayah masing-masing.' },
  { n: '03', title: 'Jalankan & ukur', desc: 'Pantau iklan, pertumbuhan pendukung, dan aktivitas tim dari satu command center.' },
];

const trust = [
  { icon: Lock, title: 'Enkripsi AES-256', desc: 'Token iklan & data sensitif dienkripsi at-rest.' },
  { icon: MapPin, title: 'Data di Indonesia', desc: 'Disimpan di GCP Jakarta, patuh UU PDP.' },
  { icon: ScrollText, title: 'Audit Log', desc: 'Setiap perubahan tercatat, tak bisa dimanipulasi.' },
  { icon: ShieldCheck, title: 'Isolasi Tenant', desc: 'Data tiap kandidat terpisah penuh & aman.' },
];

const stats = [
  { value: '100+', label: 'Kandidat terbantu' },
  { value: 'Rp 5M+', label: 'Ad spend dikelola' },
  { value: '50rb+', label: 'Pendukung terdata' },
  { value: '< 2 dtk', label: 'Load di jaringan 4G' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
            <span className="font-display font-bold text-base tracking-tight">KampanyeKit</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#fitur" className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-foreground transition-colors">Cara Kerja</a>
            <a href="#keamanan" className="hover:text-foreground transition-colors">Keamanan</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Coba Gratis<ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* soft canvas accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'linear-gradient(to bottom, black, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-card border border-border shadow-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Platform Kampanye Digital · Indonesia
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5 text-balance">
              Menangkan kampanye dengan data, <span className="text-primary">bukan tebakan.</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
              Halaman kampanye, tim sukses, iklan digital, dan data pendukung —
              terukur rapi dalam satu command center yang dipercaya tim profesional.
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3 mb-6">
              <Button asChild size="xl">
                <Link href="/login">Mulai sekarang<ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href="#fitur">Lihat fitur</a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {['Tanpa kartu kredit', 'Siap pakai dalam menit', 'Dukungan lokal'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Product preview mock */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 h-9 border-b border-border bg-muted/40">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-gold/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/50" />
                <span className="ml-3 text-[11px] text-muted-foreground font-mono">app.kampanyekit.id/timses</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { k: 'Pendukung', v: '12.480', c: 'text-primary' },
                    { k: 'Jangkauan', v: '1,2 jt', c: 'text-foreground' },
                    { k: 'Relawan aktif', v: '348', c: 'text-success' },
                  ].map((m) => (
                    <div key={m.k} className="rounded-xl border border-border p-3">
                      <p className="text-[10px] text-muted-foreground">{m.k}</p>
                      <p className={`font-display font-bold text-lg ${m.c}`}>{m.v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold">Belanja iklan vs anggaran</p>
                    <span className="text-[10px] text-success font-semibold">72% terpakai</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[40, 55, 48, 70, 62, 85, 78, 92, 80, 96].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h}%`, opacity: 0.4 + (i / 18) }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl border border-border p-3">
                    <div className="h-2 w-16 rounded bg-muted mb-2" />
                    <div className="h-2 w-24 rounded bg-muted" />
                  </div>
                  <div className="rounded-xl bg-primary text-primary-foreground px-4 flex items-center text-xs font-semibold">Laporan</div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card shadow-lg px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Data terenkripsi</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof / stats ─────────────────────────────── */}
      <section className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
            Dipercaya tim kampanye profesional di seluruh Indonesia
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="fitur" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Fitur</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 mb-4">
            Semua yang Anda butuhkan, dalam satu platform
          </h2>
          <p className="text-muted-foreground">
            Berhenti melompat antar Excel, grup WhatsApp, dan dashboard iklan terpisah.
            KampanyeKit menyatukan semuanya.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="cara-kerja" className="border-y border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Cara Kerja</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">
              Siap jalan dalam tiga langkah
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-5xl font-extrabold text-primary/15">{s.n}</span>
                <h3 className="font-display font-bold text-lg mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / trust ─────────────────────────────────── */}
      <section id="keamanan" className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-10 sm:p-14 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full mb-4">
                <ShieldCheck className="w-4 h-4" /> Keamanan & Kepatuhan
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">
                Data kampanye Anda dijaga dengan standar tertinggi
              </h2>
              <p className="text-primary-foreground/80 leading-relaxed">
                Keputusan kampanye bergantung pada data yang akurat dan aman. Kami membangun
                KampanyeKit dengan praktik keamanan tingkat enterprise dan kepatuhan UU PDP sejak awal.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {trust.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.title} className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-5">
                    <Icon className="w-6 h-6 mb-3" />
                    <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
                    <p className="text-xs text-primary-foreground/70 leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-1 text-gold mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold" />)}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">
            Mulai kampanye yang terukur hari ini
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Bergabung dengan tim kampanye yang sudah meninggalkan cara lama.
            Tanpa kartu kredit, langsung coba.
          </p>
          <Button asChild size="xl">
            <Link href="/login">Mulai sekarang<ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">K</div>
            <span className="font-display font-semibold text-sm">KampanyeKit</span>
          </div>
          <p className="text-muted-foreground text-xs text-center">
            © {new Date().getFullYear()} KampanyeKit — Platform Kampanye Digital Indonesia
          </p>
        </div>
      </footer>
    </main>
  );
}
