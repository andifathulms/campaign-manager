import Link from 'next/link';

export const metadata = {
  title: 'KampanyeKit — Platform Kampanye Digital Indonesia',
  description: 'Kelola kampanye politik Anda dengan cerdas dan terukur. Landing page, tim sukses, iklan digital, dan pendukung dalam satu platform.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white">
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-white/10 text-white/80 text-sm px-4 py-2 rounded-full mb-6">
          Platform Kampanye Digital untuk Indonesia 🇮🇩
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          KampanyeKit
        </h1>
        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
          Dari halaman kampanye, tim sukses, iklan digital, hingga pendaftaran pendukung —
          semua dalam satu platform yang terukur.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-white text-blue-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg"
          >
            Masuk ke Dashboard
          </Link>
        </div>
        <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: '🏛️', title: 'Halaman Kampanye', desc: 'Landing page profesional dengan subdomain sendiri' },
            { icon: '📊', title: 'Dashboard Iklan', desc: 'Pantau Meta & TikTok Ads dalam satu tempat' },
            { icon: '👥', title: 'Tim Sukses', desc: 'Kelola tim dan lacak performa relawan' },
          ].map(f => (
            <div key={f.title} className="bg-white/10 rounded-2xl p-6">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
