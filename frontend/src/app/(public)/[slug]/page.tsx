import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ViewTracker } from '@/components/campaign/ViewTracker';

interface Props {
  params: { slug: string };
}

interface PublicCandidate {
  id: string;
  nama_lengkap: string;
  foto_url: string | null;
  nomor_urut: number | null;
  jenis_pemilihan: string;
  dapil: string;
  partai: string;
  tagline: string;
  visi: string;
  misi: string[];
  program_unggulan: Array<{ title: string; desc: string; icon: string }>;
  sosmed: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  color_primary: string;
  color_secondary: string;
  tenant_slug: string;
  campaign_page: {
    hero_image_url: string | null;
    hero_video_url: string | null;
    seo_title: string | null;
    seo_description: string | null;
    view_count: number;
  } | null;
}

const API_BASE = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/v1';

async function getCandidate(slug: string): Promise<PublicCandidate | null> {
  try {
    const res = await fetch(`${API_BASE}/public/${slug}/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const candidate = await getCandidate(params.slug);
  if (!candidate) return { title: 'Halaman tidak ditemukan' };
  const title = candidate.campaign_page?.seo_title || `${candidate.nama_lengkap} — Kampanye Digital`;
  const description = candidate.campaign_page?.seo_description || candidate.tagline;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

const JENIS_LABEL: Record<string, string> = {
  pileg_dpr: 'Caleg DPR RI',
  pileg_dprd_provinsi: 'Caleg DPRD Provinsi',
  pileg_dprd_kota: 'Caleg DPRD Kota/Kab.',
  pilkada_bupati: 'Calon Bupati',
  pilkada_walikota: 'Calon Walikota',
  pilkada_gubernur: 'Calon Gubernur',
};

const SOSMED_CONFIG = [
  { key: 'instagram', label: 'Instagram', icon: 'IG' },
  { key: 'tiktok', label: 'TikTok', icon: 'TT' },
  { key: 'youtube', label: 'YouTube', icon: 'YT' },
  { key: 'facebook', label: 'Facebook', icon: 'FB' },
  { key: 'twitter', label: 'X / Twitter', icon: 'X' },
];

export default async function CampaignPage({ params }: Props) {
  const candidate = await getCandidate(params.slug);
  if (!candidate) notFound();

  const primary = candidate.color_primary || '#4F46E5';
  const hasMisi = candidate.misi?.length > 0;
  const hasProgram = candidate.program_unggulan?.length > 0;
  const hasSosmed = Object.values(candidate.sosmed || {}).some(v => !!v);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <ViewTracker slug={params.slug} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}ee 0%, ${primary}99 60%, #0f0c29 100%)` }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl" style={{ background: primary }} />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: primary }} />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto py-24">
          {/* Photo */}
          {candidate.foto_url ? (
            <div className="w-40 h-40 mx-auto mb-8 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl ring-4 ring-white/10">
              <img src={candidate.foto_url} alt={candidate.nama_lengkap} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="w-40 h-40 mx-auto mb-8 rounded-full border-4 border-white/30 flex items-center justify-center text-6xl font-bold shadow-2xl ring-4 ring-white/10"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}
            >
              {candidate.nama_lengkap.charAt(0)}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {candidate.nomor_urut && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/30">
                No. Urut {candidate.nomor_urut}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-1.5 rounded-full border border-white/20">
              {JENIS_LABEL[candidate.jenis_pemilihan] || candidate.jenis_pemilihan}
            </span>
            {candidate.dapil && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-sm px-4 py-1.5 rounded-full border border-white/20">
                {candidate.dapil}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            {candidate.nama_lengkap}
          </h1>

          {/* Partai */}
          {candidate.partai && (
            <p className="text-white/70 text-lg mb-8 font-medium">{candidate.partai}</p>
          )}

          {/* Tagline */}
          {candidate.tagline && (
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-4">
              <p className="text-2xl md:text-3xl font-light text-white/95 italic leading-relaxed">
                &ldquo;{candidate.tagline}&rdquo;
              </p>
            </div>
          )}

          {/* Scroll hint */}
          <div className="mt-16 flex flex-col items-center gap-2 text-white/50 text-xs">
            <span>Gulir untuk selengkapnya</span>
            <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── VISI ─────────────────────────────────────────────────────────── */}
      {candidate.visi && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-sm font-bold tracking-widest uppercase mb-3 px-4 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Visi
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900">Arah Perubahan</h2>
            </div>
            <div
              className="relative rounded-3xl p-8 md:p-12"
              style={{ background: `linear-gradient(135deg, ${primary}08, ${primary}15)`, border: `1.5px solid ${primary}25` }}
            >
              <div className="absolute top-6 left-8 text-8xl leading-none opacity-20 font-serif" style={{ color: primary }}>"</div>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium relative z-10 pt-6">
                {candidate.visi}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── MISI ─────────────────────────────────────────────────────────── */}
      {hasMisi && (
        <section className="py-24 px-6" style={{ background: `${primary}06` }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-sm font-bold tracking-widest uppercase mb-3 px-4 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Misi
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900">Langkah Nyata</h2>
            </div>
            <ol className="space-y-4">
              {candidate.misi.map((item, i) => (
                <li key={i} className="flex gap-5 items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <span
                    className="flex-shrink-0 w-10 h-10 rounded-xl text-white text-base font-bold flex items-center justify-center shadow-sm"
                    style={{ background: primary }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed text-lg pt-1.5">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── PROGRAM UNGGULAN ─────────────────────────────────────────────── */}
      {hasProgram && (
        <section className="py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-sm font-bold tracking-widest uppercase mb-3 px-4 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Program Unggulan
              </span>
              <h2 className="text-4xl font-extrabold text-gray-900">Untuk Masyarakat</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidate.program_unggulan.map((p, i) => (
                <div
                  key={i}
                  className="group rounded-2xl p-6 border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {p.icon && (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm"
                      style={{ background: `${primary}12` }}
                    >
                      {p.icon}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SOSMED ───────────────────────────────────────────────────────── */}
      {hasSosmed && (
        <section className="py-20 px-6" style={{ background: `linear-gradient(135deg, ${primary}ee, ${primary}bb)` }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white mb-3">Ikuti Perjalanan Kami</h2>
            <p className="text-white/70 mb-10">Dapatkan update terbaru kampanye di media sosial</p>
            <div className="flex flex-wrap justify-center gap-4">
              {SOSMED_CONFIG.map(({ key, label, icon }) => {
                const url = candidate.sosmed[key as keyof typeof candidate.sosmed];
                if (!url) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <span className="text-xs font-black bg-white/20 rounded px-1.5 py-0.5">{icon}</span>
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-gray-950 text-center">
        <p className="text-gray-400 text-sm mb-2">
          Halaman kampanye resmi <span className="text-white font-semibold">{candidate.nama_lengkap}</span>
        </p>
        <p className="text-gray-600 text-xs">
          Dibuat dengan{' '}
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            KampanyeKit
          </Link>
          {' '}— Platform Kampanye Digital Indonesia
        </p>
      </footer>
    </div>
  );
}
