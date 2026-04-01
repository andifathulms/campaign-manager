import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ViewTracker } from '@/components/campaign/ViewTracker';
import { SosmedLinks } from '@/components/campaign/SosmedLinks';

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

// Server component: use internal Docker URL (NEXTAUTH_BACKEND_URL), not the
// browser-facing NEXT_PUBLIC_API_URL which resolves to localhost on the host.
const API_BASE = process.env.NEXTAUTH_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000/api/v1';

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
  const description = candidate.campaign_page?.seo_description || candidate.tagline || `Dukung ${candidate.nama_lengkap}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: candidate.campaign_page?.hero_image_url ? [candidate.campaign_page.hero_image_url] : [],
    },
  };
}

export default async function CampaignPage({ params }: Props) {
  const candidate = await getCandidate(params.slug);
  if (!candidate) notFound();

  const primaryColor = candidate.color_primary || '#1E40AF';

  const JENIS_LABEL: Record<string, string> = {
    pileg_dpr: 'Caleg DPR RI',
    pileg_dprd_provinsi: 'Caleg DPRD Provinsi',
    pileg_dprd_kota: 'Caleg DPRD Kota/Kab.',
    pilkada_bupati: 'Calon Bupati',
    pilkada_walikota: 'Calon Walikota',
    pilkada_gubernur: 'Calon Gubernur',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ViewTracker slug={params.slug} />

      {/* Hero Section */}
      <section
        className="relative py-20 px-4 text-white text-center overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {candidate.campaign_page?.hero_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${candidate.campaign_page.hero_image_url})` }}
          />
        )}
        <div className="relative z-10 max-w-2xl mx-auto">
          {candidate.foto_url ? (
            <div className="w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
              <img
                src={candidate.foto_url}
                alt={candidate.nama_lengkap}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-36 h-36 mx-auto mb-6 rounded-full border-4 border-white/30 bg-white/20 flex items-center justify-center text-5xl font-bold shadow-2xl">
              {candidate.nama_lengkap.charAt(0)}
            </div>
          )}

          {candidate.nomor_urut && (
            <div className="inline-block bg-white/20 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              No. Urut {candidate.nomor_urut}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-3">{candidate.nama_lengkap}</h1>

          <p className="text-white/80 text-lg mb-2">
            {JENIS_LABEL[candidate.jenis_pemilihan] || candidate.jenis_pemilihan}
            {candidate.dapil && ` • ${candidate.dapil}`}
          </p>

          {candidate.partai && (
            <p className="text-white/70 text-base mb-6">{candidate.partai}</p>
          )}

          {candidate.tagline && (
            <p className="text-2xl md:text-3xl font-light italic text-white/90">
              &ldquo;{candidate.tagline}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Visi Section */}
      {candidate.visi && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl font-bold mb-6 text-center"
              style={{ color: primaryColor }}
            >
              Visi
            </h2>
            <div className="bg-gray-50 rounded-2xl p-8 border-l-4" style={{ borderColor: primaryColor }}>
              <p className="text-gray-700 text-lg leading-relaxed">{candidate.visi}</p>
            </div>
          </div>
        </section>
      )}

      {/* Misi Section */}
      {candidate.misi && candidate.misi.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl font-bold mb-8 text-center"
              style={{ color: primaryColor }}
            >
              Misi
            </h2>
            <ol className="space-y-4">
              {candidate.misi.map((item, i) => (
                <li key={i} className="flex gap-4 items-start bg-white rounded-xl p-5 shadow-sm">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed pt-1">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Program Unggulan Section */}
      {candidate.program_unggulan && candidate.program_unggulan.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl font-bold mb-8 text-center"
              style={{ color: primaryColor }}
            >
              Program Unggulan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidate.program_unggulan.map((program, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border hover:shadow-md transition-shadow">
                  {program.icon && (
                    <div className="text-3xl mb-3">{program.icon}</div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{program.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{program.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sosmed Section */}
      <SosmedLinks sosmed={candidate.sosmed} primaryColor={primaryColor} />

      {/* Footer */}
      <footer className="py-8 px-4 text-center bg-gray-900 text-gray-400 text-sm">
        <p className="mb-1">
          Halaman kampanye resmi <strong className="text-white">{candidate.nama_lengkap}</strong>
        </p>
        <p>
          Dikelola menggunakan{' '}
          <a href="/" className="text-blue-400 hover:underline">KampanyeKit</a>
          {' '}— Platform Kampanye Digital Indonesia
        </p>
      </footer>
    </div>
  );
}
