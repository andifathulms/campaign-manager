import Link from 'next/link';

export const metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital Indonesia',
  description: 'Kelola kampanye politik Anda dengan cerdas dan terukur. Landing page, tim sukses, iklan digital, dan pendukung dalam satu platform.',
};

const features = [
  {
    icon: '🏛️',
    title: 'Halaman Kampanye',
    desc: 'Landing page profesional dengan subdomain sendiri. Mobile-first, SEO-ready.',
  },
  {
    icon: '📊',
    title: 'Dashboard Iklan Terpadu',
    desc: 'Pantau Meta Ads & TikTok Ads side-by-side. Satu layar, semua data.',
  },
  {
    icon: '👥',
    title: 'Tim Sukses Digital',
    desc: 'Manajemen relawan, referral link unik, dan leaderboard performa tim.',
  },
  {
    icon: '❤️',
    title: 'Pendaftaran Pendukung',
    desc: 'Form registrasi digital, kartu anggota otomatis, data by kelurahan.',
  },
  {
    icon: '💰',
    title: 'Budget Tracker',
    desc: 'Alokasi anggaran per platform, alert saat 80% terpakai.',
  },
  {
    icon: '📄',
    title: 'Laporan Mingguan',
    desc: 'PDF laporan otomatis setiap Senin, langsung ke email kandidat.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">K</div>
            <span className="font-semibold text-sm">KampanyeKit</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Masuk →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Platform Kampanye Digital · Indonesia
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6 text-balance">
            Kampanye yang
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              lebih cerdas.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Dari halaman kampanye, tim sukses, iklan digital, hingga pendaftaran pendukung —
            semua dalam satu platform yang terukur.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-900/40"
            >
              Mulai sekarang
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/60 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest text-center mb-12">
            Semua yang Anda butuhkan dalam satu platform
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group"
              >
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-8 text-center">
        <p className="text-slate-600 text-sm">
          © {new Date().getFullYear()} KampanyeKit — Platform Kampanye Digital Indonesia
        </p>
      </footer>
    </main>
  );
}
