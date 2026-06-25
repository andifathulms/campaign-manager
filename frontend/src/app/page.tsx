import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Globe2, BarChart3, Users, Heart, Wallet,
  ShieldCheck, Lock, MapPin, ScrollText, Check, X, Star,
  Zap, ChevronDown, Quote, Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital Indonesia',
  description: 'Satu command center untuk seluruh kampanye Anda: halaman kampanye, tim sukses, iklan digital terpadu, dan data pendukung yang terukur.',
};

const features = [
  { icon: BarChart3, title: 'Dashboard Iklan Terpadu', desc: 'Meta & TikTok Ads berdampingan dalam satu layar — reach, spend, dan CTR real-time dengan kontrol penuh pause/resume & edit budget.', span: 'lg:col-span-4', chart: true },
  { icon: Users, title: 'Tim Sukses Digital', desc: 'Relawan berjenjang, referral link unik, leaderboard performa.', span: 'lg:col-span-2' },
  { icon: Globe2, title: 'Halaman Kampanye', desc: 'Website profesional ber-subdomain. Mobile-first, SEO-ready, tampil dalam menit.', span: 'lg:col-span-2' },
  { icon: Heart, title: 'Pendukung Terdata', desc: 'Registrasi digital, kartu anggota otomatis, rapi hingga level kelurahan.', span: 'lg:col-span-2', stat: true },
  { icon: Wallet, title: 'Budget Tracker', desc: 'Alokasi per platform + alert otomatis saat 80% anggaran terpakai.', span: 'lg:col-span-2' },
];

const steps = [
  { n: '01', title: 'Daftar & atur profil', desc: 'Lengkapi profil kandidat, visi-misi, dan program unggulan dalam satu form.' },
  { n: '02', title: 'Hubungkan & undang tim', desc: 'Sambungkan akun iklan, undang koordinator & relawan per wilayah.' },
  { n: '03', title: 'Jalankan & ukur', desc: 'Pantau iklan, pertumbuhan pendukung, dan aktivitas tim dari satu layar.' },
];

const oldWay = ['Excel berserakan & data hilang', 'Koordinasi via grup WhatsApp tanpa jejak', 'Baliho mahal tanpa data viewership', 'Iklan Meta & TikTok dipantau terpisah', 'Tidak tahu relawan mana yang aktif'];
const newWay = ['Semua data tersentral & aman', 'Tugas & relawan terlacak otomatis', 'Setiap rupiah iklan terukur ROI-nya', 'Satu dashboard iklan terpadu', 'Leaderboard performa real-time'];

const trust = [
  { icon: Lock, title: 'Enkripsi AES-256', desc: 'Token iklan & data sensitif dienkripsi at-rest.' },
  { icon: MapPin, title: 'Data di Indonesia', desc: 'Disimpan di GCP Jakarta, patuh UU PDP.' },
  { icon: ScrollText, title: 'Audit Log', desc: 'Setiap perubahan tercatat, tak bisa dimanipulasi.' },
  { icon: ShieldCheck, title: 'Isolasi Tenant', desc: 'Data tiap kandidat terpisah penuh & aman.' },
];

const testimonials = [
  { quote: 'Pertama kalinya saya bisa lihat ke mana setiap rupiah iklan pergi. Keputusan budget jadi berbasis data, bukan firasat.', name: 'Konsultan Politik', role: 'Mengelola 6 kandidat' },
  { quote: 'Koordinasi 300+ relawan yang tadinya kacau di grup WA sekarang rapi. Leaderboard bikin mereka berlomba.', name: 'Koordinator Utama', role: 'Tim Kampanye Cabup' },
  { quote: 'Halaman kampanye jadi dalam satu sore, dan pendukung yang daftar langsung terdata per kelurahan.', name: 'Tim Digital', role: 'Kampanye DPRD Provinsi' },
];

const faqs = [
  { q: 'Apakah data kampanye saya aman?', a: 'Ya. Token iklan dienkripsi AES-256, data disimpan di server Indonesia (GCP Jakarta) sesuai UU PDP, dan setiap perubahan tercatat di audit log. Data tiap kandidat terisolasi penuh.' },
  { q: 'Berapa lama setup sampai bisa dipakai?', a: 'Halaman kampanye bisa tayang dalam hitungan menit. Menghubungkan akun iklan dan mengundang tim hanya butuh beberapa langkah lagi — siap pakai di hari yang sama.' },
  { q: 'Platform iklan apa saja yang didukung?', a: 'Meta (Facebook & Instagram) tersedia penuh dengan kontrol pause/resume dan edit budget. TikTok Ads dan Google Ads menyusul sebagai fast-follow.' },
  { q: 'Apakah cocok untuk konsultan yang mengelola banyak kandidat?', a: 'Sangat. Satu akun Agency bisa memegang banyak kandidat dengan candidate-switcher — kelola seluruh roster dari satu login, data tetap terpisah.' },
  { q: 'Apakah perlu kartu kredit untuk mencoba?', a: 'Tidak. Anda bisa mulai tanpa kartu kredit dan menjajal platform sebelum berkomitmen.' },
];

export default function HomePage() {
  return (
    <main className="dark min-h-screen bg-[#080B14] text-white overflow-x-hidden">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B14]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2456E6] to-[#22D3EE] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#2456E6]/30">K</div>
            <span className="font-display font-bold text-base tracking-tight">KampanyeKit</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-white transition-colors">Cara Kerja</a>
            <a href="#testimoni" className="hover:text-white transition-colors">Testimoni</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-[#2456E6] to-[#22D3EE] text-white border-0 shadow-lg shadow-[#2456E6]/30 hover:opacity-90">
              <Link href="/login">Coba Gratis<ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative">
        {/* gradient mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[#2456E6]/25 blur-[140px] rounded-full" />
          <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-[#22D3EE]/15 blur-[120px] rounded-full" />
          <div className="absolute top-[30%] left-[0%] w-[400px] h-[400px] bg-[#F5A524]/10 blur-[120px] rounded-full" />
        </div>
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)', backgroundSize: '52px 52px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black, transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 backdrop-blur-sm text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#F5A524]" />
            Command center kampanye digital · Indonesia
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.03] tracking-tight mb-6 text-balance">
            Menangkan kampanye dengan
            <br className="hidden sm:block" />{' '}
            <span className="animate-gradient-x bg-gradient-to-r from-[#60A5FA] via-white to-[#22D3EE] bg-clip-text text-transparent">
              data, bukan tebakan.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            Halaman kampanye, tim sukses, iklan digital, dan data pendukung —
            terukur rapi dalam satu platform yang dipercaya tim profesional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
            <Button asChild size="xl" className="bg-gradient-to-r from-[#2456E6] to-[#22D3EE] text-white border-0 shadow-xl shadow-[#2456E6]/40 hover:opacity-90">
              <Link href="/login">Mulai sekarang<ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <a href="#fitur">Lihat fitur</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            {['Tanpa kartu kredit', 'Siap pakai dalam menit', 'Dukungan lokal'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#22D3EE]" /> {t}
              </span>
            ))}
          </div>

          {/* Product preview */}
          <div className="relative mt-16 max-w-3xl mx-auto animate-float">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#2456E6]/40 to-[#22D3EE]/40 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0C1120]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/10 bg-white/[0.03]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5A524]/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                <span className="ml-3 text-[11px] text-white/40 font-mono">app.kampanyekit.id/timses</span>
              </div>
              <div className="p-5 space-y-4 text-left">
                <div className="grid grid-cols-3 gap-3">
                  {[{ k: 'Pendukung', v: '12.480', c: 'text-[#22D3EE]' }, { k: 'Jangkauan', v: '1,2 jt', c: 'text-white' }, { k: 'Relawan aktif', v: '348', c: 'text-emerald-400' }].map((m) => (
                    <div key={m.k} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] text-white/40">{m.k}</p>
                      <p className={`font-display font-bold text-lg ${m.c}`}>{m.v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-white/80">Belanja iklan vs anggaran</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">72% terpakai</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-24">
                    {[40, 55, 48, 70, 62, 85, 78, 92, 80, 96].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#2456E6] to-[#22D3EE]" style={{ height: `${h}%`, opacity: 0.45 + i / 20 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/40 mb-8">
            Dipercaya tim kampanye profesional di seluruh Indonesia
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[{ value: '100+', label: 'Kandidat terbantu' }, { value: 'Rp 5M+', label: 'Ad spend dikelola' }, { value: '50rb+', label: 'Pendukung terdata' }, { value: '< 2 dtk', label: 'Load di jaringan 4G' }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white to-[#22D3EE] bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento features ───────────────────────────────────── */}
      <section id="fitur" className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">Fitur</span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mt-3 mb-4 text-balance">
            Satu platform, seluruh kampanye
          </h2>
          <p className="text-white/55">Berhenti melompat antar Excel, grup WhatsApp, dan dashboard iklan terpisah.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`group relative rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#22D3EE]/30 transition-all p-7 overflow-hidden ${f.span}`}>
                <div className="absolute -right-16 -top-16 w-40 h-40 bg-[#2456E6]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2456E6]/30 to-[#22D3EE]/20 border border-white/10 text-[#22D3EE] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-1.5">{f.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed max-w-md">{f.desc}</p>

                  {f.chart && (
                    <div className="mt-6 flex items-end gap-1.5 h-20">
                      {[30, 45, 38, 60, 52, 72, 65, 84, 70, 90, 78, 95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#2456E6] to-[#22D3EE]" style={{ height: `${h}%`, opacity: 0.35 + i / 22 }} />
                      ))}
                    </div>
                  )}
                  {f.stat && (
                    <p className="mt-5 font-display text-3xl font-extrabold bg-gradient-to-r from-white to-[#22D3EE] bg-clip-text text-transparent">12.480 <span className="text-sm font-medium text-white/40">terdaftar</span></p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="cara-kerja" className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">Cara Kerja</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Siap jalan dalam tiga langkah</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                <span className="font-display text-5xl font-extrabold bg-gradient-to-br from-[#2456E6] to-[#22D3EE] bg-clip-text text-transparent">{s.n}</span>
                <h3 className="font-display font-bold text-lg mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">Sebelum & Sesudah</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Tinggalkan cara lama</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <p className="font-display font-bold text-white/50 mb-6">Cara Lama</p>
            <ul className="space-y-4">
              {oldWay.map((t) => (
                <li key={t} className="flex items-start gap-3 text-white/55">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-red-400" /></span>
                  <span className="text-sm leading-relaxed line-through decoration-white/20">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative rounded-3xl border border-[#22D3EE]/30 bg-gradient-to-br from-[#2456E6]/15 to-[#22D3EE]/5 p-8 overflow-hidden">
            <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#22D3EE]/15 blur-3xl rounded-full" />
            <p className="font-display font-bold mb-6 inline-flex items-center gap-2"><Zap className="w-4 h-4 text-[#F5A524]" /> Dengan KampanyeKit</p>
            <ul className="space-y-4">
              {newWay.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#22D3EE]/20 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-[#22D3EE]" /></span>
                  <span className="text-sm leading-relaxed text-white/90">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#2456E6]/15 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full mb-4"><ShieldCheck className="w-4 h-4 text-[#22D3EE]" /> Keamanan & Kepatuhan</span>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-balance">Data kampanye dijaga dengan standar tertinggi</h2>
              <p className="text-white/55 leading-relaxed">Keputusan kampanye bergantung pada data yang akurat dan aman. Kami membangun KampanyeKit dengan keamanan tingkat enterprise dan kepatuhan UU PDP sejak awal.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {trust.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.title} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                    <Icon className="w-6 h-6 mb-3 text-[#22D3EE]" />
                    <h3 className="font-semibold text-sm mb-1">{t.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{t.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section id="testimoni" className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">Testimoni</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Dikatakan oleh tim di lapangan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 flex flex-col">
                <Quote className="w-8 h-8 text-[#2456E6] mb-4" />
                <p className="text-white/80 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2456E6] to-[#22D3EE] flex items-center justify-center text-xs font-bold">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/45">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <span className="text-[#22D3EE] text-xs font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Pertanyaan yang sering diajukan</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] open:bg-white/[0.05] transition-colors">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5">
                <span className="font-semibold text-sm sm:text-base">{f.q}</span>
                <ChevronDown className="w-5 h-5 text-white/50 flex-shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-6 -mt-1 text-sm text-white/55 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto relative rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-br from-[#2456E6] via-[#2456E6] to-[#0B1B6B] p-12 sm:p-16 text-center">
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-[#22D3EE]/30 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#F5A524] text-[#F5A524]" />)}
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 text-balance">Mulai kampanye yang terukur hari ini</h2>
            <p className="text-white/75 mb-8 max-w-xl mx-auto">Bergabung dengan tim kampanye yang sudah meninggalkan cara lama. Tanpa kartu kredit, langsung coba.</p>
            <Button asChild size="xl" className="bg-white text-[#2456E6] hover:bg-white/90 border-0 shadow-xl">
              <Link href="/login">Mulai sekarang<ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2456E6] to-[#22D3EE] flex items-center justify-center text-white font-bold text-xs">K</div>
            <span className="font-display font-semibold text-sm">KampanyeKit</span>
          </div>
          <p className="text-white/40 text-xs text-center">© {new Date().getFullYear()} KampanyeKit — Platform Kampanye Digital Indonesia</p>
        </div>
      </footer>
    </main>
  );
}
