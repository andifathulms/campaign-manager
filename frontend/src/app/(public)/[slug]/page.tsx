import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Instagram, Youtube, Facebook, Twitter, Music2,
  Heart, MessageSquare, UserPlus, MapPin, ArrowRight, ChevronDown,
  Newspaper, CheckCircle2, Award,
} from 'lucide-react';
import { ViewTracker } from '@/components/campaign/ViewTracker';
import { ShareButton } from '@/components/campaign/ShareButton';
import { MobileActionBar } from '@/components/campaign/MobileActionBar';
import { CampaignCountdown } from '@/components/campaign/CampaignCountdown';

interface Props {
  params: { slug: string };
}

interface PublicCandidate {
  id: string;
  nama_lengkap: string;
  foto_url: string | null;
  foto_sampul_url: string | null;
  galeri: Array<{ url: string; caption?: string }>;
  tanggal_pemilihan: string | null;
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
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'tiktok', label: 'TikTok', Icon: Music2 },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'twitter', label: 'X / Twitter', Icon: Twitter },
] as const;

export default async function CampaignPage({ params }: Props) {
  const candidate = await getCandidate(params.slug);
  if (!candidate) notFound();

  const primary = candidate.color_primary || '#0A1A3F';
  const hasMisi = candidate.misi?.length > 0;
  const hasProgram = candidate.program_unggulan?.length > 0;
  const hasSosmed = Object.values(candidate.sosmed || {}).some(v => !!v);
  const jenisLabel = JENIS_LABEL[candidate.jenis_pemilihan] || candidate.jenis_pemilihan;
  const views = candidate.campaign_page?.view_count ?? 0;
  const galeri = (candidate.galeri || []).filter(g => g?.url);
  const hasGaleri = galeri.length > 0;
  const cover = candidate.foto_sampul_url;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <ViewTracker slug={params.slug} />

      {/* ── Sticky header ────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md" style={{ background: `${primary}f2` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5 min-w-0">
            {candidate.foto_url && (
              <img src={candidate.foto_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/40 flex-shrink-0" />
            )}
            <span className="font-display font-bold text-white text-sm truncate">{candidate.nama_lengkap}</span>
            {candidate.nomor_urut && (
              <span className="flex-shrink-0 text-[11px] font-bold text-white bg-white/20 rounded-md px-1.5 py-0.5">#{candidate.nomor_urut}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShareButton name={candidate.nama_lengkap} nomorUrut={candidate.nomor_urut} />
            <Link
              href={`/${candidate.tenant_slug}/dukung`}
              className="text-sm font-semibold rounded-full bg-white px-4 py-1.5 hover:shadow-lg transition-shadow"
              style={{ color: primary }}
            >
              Dukung
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(900px 500px at 85% -10%, ${primary}cc, transparent 60%),
            radial-gradient(700px 500px at 0% 110%, ${primary}66, transparent 55%),
            linear-gradient(160deg, ${primary} 0%, ${primary}d9 45%, #14181F 130%)`,
        }}
      >
        {/* cover photo — atmospheric backdrop, blended under the brand gradient */}
        {cover && (
          <div className="absolute inset-0 pointer-events-none">
            <img src={cover} alt="" className="w-full h-full object-cover opacity-25 mix-blend-luminosity" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${primary}e6 0%, ${primary}cc 45%, #14181Fee 130%)` }} />
          </div>
        )}
        {/* dotted texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="text-center md:text-left order-2 md:order-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/25">
                {jenisLabel}
              </span>
              {candidate.dapil && (
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/90 text-xs px-3 py-1 rounded-full border border-white/20">
                  <MapPin className="w-3 h-3" /> {candidate.dapil}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-4">
              {candidate.nama_lengkap}
            </h1>

            {candidate.partai && (
              <p className="text-white/75 text-base md:text-lg font-medium mb-6">{candidate.partai}</p>
            )}

            {candidate.tagline && (
              <p className="text-lg md:text-xl text-white/95 font-light italic leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
                &ldquo;{candidate.tagline}&rdquo;
              </p>
            )}

            {candidate.nomor_urut != null && (
              <div className="inline-flex items-center gap-3 mb-8 rounded-2xl bg-white pl-3 pr-5 py-2 shadow-xl">
                <span className="font-display text-3xl md:text-4xl font-extrabold leading-none w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: primary }}>
                  {candidate.nomor_urut}
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Coblos Nomor Urut</span>
                  <span className="block font-display font-extrabold text-lg" style={{ color: primary }}>Nomor {candidate.nomor_urut}</span>
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href={`/${candidate.tenant_slug}/dukung`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white font-semibold shadow-xl hover:scale-[1.03] transition-transform"
                style={{ color: primary }}
              >
                <Heart className="w-4 h-4" /> Daftar Jadi Pendukung
              </Link>
              <Link
                href={`/${candidate.tenant_slug}/aspirasi`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-white/25 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Kirim Aspirasi
              </Link>
            </div>
          </div>

          {/* Photo */}
          <div className="relative flex justify-center order-1 md:order-2">
            <div className="relative">
              {/* glow ring */}
              <div className="absolute -inset-4 rounded-full bg-white/10 blur-2xl" />
              {candidate.nomor_urut && (
                <div className="absolute -top-2 -right-2 z-20 w-16 h-16 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center rotate-6">
                  <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: primary }}>No. Urut</span>
                  <span className="font-display text-2xl font-extrabold leading-none" style={{ color: primary }}>{candidate.nomor_urut}</span>
                </div>
              )}
              {candidate.foto_url ? (
                <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl ring-8 ring-white/10">
                  <img src={candidate.foto_url} alt={candidate.nama_lengkap} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-56 h-56 md:w-72 md:h-72 rounded-full border-4 border-white/40 flex items-center justify-center text-7xl font-bold text-white shadow-2xl ring-8 ring-white/10"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                  {candidate.nama_lengkap.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="relative flex justify-center pb-6 text-white/50">
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </div>
      </section>

      {/* ── Stat strip ───────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Nomor Urut', value: candidate.nomor_urut != null ? String(candidate.nomor_urut) : '—', emphasize: true },
            { label: 'Maju Sebagai', value: jenisLabel },
            { label: 'Daerah Pemilihan', value: candidate.dapil || '—' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-6 text-center">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{s.label}</p>
              <p
                className={`font-display font-extrabold flex items-center justify-center gap-1.5 leading-tight ${s.emphasize ? 'text-2xl md:text-3xl' : 'text-sm md:text-lg text-gray-900'}`}
                style={s.emphasize ? { color: primary } : undefined}
              >
                <span className="truncate">{s.value}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VISI ─────────────────────────────────────────────── */}
      {candidate.visi && (
        <section className="py-20 md:py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Visi
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900">Arah Perubahan</h2>
            </div>
            <div className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${primary}0a, ${primary}1a)`, border: `1.5px solid ${primary}25` }}>
              <div className="absolute -top-4 left-6 text-9xl leading-none opacity-[0.12] font-serif select-none" style={{ color: primary }}>&ldquo;</div>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium relative z-10 pt-8">
                {candidate.visi}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── MISI ─────────────────────────────────────────────── */}
      {hasMisi && (
        <section className="py-20 md:py-24 px-6" style={{ background: `${primary}06` }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Misi
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900">Langkah Nyata</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {candidate.misi.map((item, i) => (
                <div key={i} className="flex gap-4 items-start bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl text-white text-base font-bold flex items-center justify-center shadow-sm"
                    style={{ background: primary }}>
                    {i + 1}
                  </span>
                  <p className="text-gray-700 leading-relaxed pt-1.5">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROGRAM UNGGULAN ─────────────────────────────────── */}
      {hasProgram && (
        <section className="py-20 md:py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Program Unggulan
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900">Untuk Masyarakat</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidate.program_unggulan.map((p, i) => (
                <div key={i}
                  className="group relative rounded-2xl p-6 border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: primary }} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
                      style={{ background: `${primary}12` }}>
                      {p.icon || '✦'}
                    </div>
                    <span className="font-display text-3xl font-extrabold opacity-10" style={{ color: primary }}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{p.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALERI KEGIATAN ──────────────────────────────────── */}
      {hasGaleri && (
        <section className="py-20 md:py-24 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                Galeri Kegiatan
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900">Bersama Masyarakat</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">Dokumentasi langkah nyata di tengah warga — bukan sekadar janji.</p>
            </div>
            {/* masonry-ish grid: first photo spans larger */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {galeri.map((g, i) => (
                <figure
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl bg-gray-100 ${i === 0 ? 'col-span-2 row-span-2 aspect-square lg:aspect-auto' : 'aspect-square'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.url}
                    alt={g.caption || candidate.nama_lengkap}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {g.caption && (
                    <>
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <figcaption className="absolute inset-x-0 bottom-0 p-3 md:p-4 text-white text-xs md:text-sm font-medium translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                        {g.caption}
                      </figcaption>
                    </>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MARI BERGABUNG (engagement) ──────────────────────── */}
      <section className="py-20 md:py-24 px-6" style={{ background: `${primary}06` }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full" style={{ background: `${primary}15`, color: primary }}>
              Mari Bergabung
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900">Jadilah Bagian dari Perubahan</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Heart, title: 'Jadi Pendukung', desc: 'Daftar sebagai pendukung dan dapatkan kartu anggota digital.', href: `/${candidate.tenant_slug}/dukung`, cta: 'Daftar Sekarang' },
              { Icon: UserPlus, title: 'Jadi Relawan', desc: 'Bergabung dengan tim sukses dan bantu menangkan kampanye.', href: `/${candidate.tenant_slug}/relawan`, cta: 'Gabung Relawan' },
              { Icon: MessageSquare, title: 'Kirim Aspirasi', desc: 'Sampaikan harapan dan masukan Anda langsung ke kandidat.', href: `/${candidate.tenant_slug}/aspirasi`, cta: 'Sampaikan' },
              { Icon: Newspaper, title: 'Kabar Terbaru', desc: 'Ikuti berita, agenda, dan kegiatan kampanye terkini.', href: `/${candidate.tenant_slug}/berita`, cta: 'Baca Berita' },
            ].map(({ Icon, title, desc, href, cta }) => (
              <Link key={title} href={href}
                className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white shadow-sm" style={{ background: primary }}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-lg mb-1.5">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all" style={{ color: primary }}>
                  {cta} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BALLOT REMINDER (climax) ─────────────────────────── */}
      <section
        className="relative overflow-hidden px-6 py-20 md:py-28"
        style={{
          background: `radial-gradient(800px 400px at 50% -20%, ${primary}, transparent 60%), linear-gradient(180deg, #0E1116, #14181F)`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-white/70 mb-5 px-3 py-1 rounded-full border border-white/20 bg-white/5">
            <Award className="w-3.5 h-3.5" /> Hari Penentuan
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 text-balance">
            Satu suara Anda menentukan masa depan {candidate.dapil ? candidate.dapil.replace(/\s*dapil.*$/i, '').trim() || 'kita' : 'kita'}.
          </h2>
          <p className="text-white/60 max-w-xl mx-auto mb-10">
            Di hari pemungutan suara, pastikan pilihan Anda tepat. Dukung perubahan nyata bersama {candidate.nama_lengkap}.
          </p>

          {candidate.tanggal_pemilihan && (
            <div className="mb-12">
              <CampaignCountdown date={candidate.tanggal_pemilihan} tone="dark" />
            </div>
          )}

          {candidate.nomor_urut != null && (
            <div className="inline-flex items-stretch rounded-3xl overflow-hidden shadow-2xl mb-10 border border-white/10">
              {candidate.foto_url && (
                <div className="hidden sm:block w-28 bg-white/5">
                  <img src={candidate.foto_url} alt={candidate.nama_lengkap} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="bg-white px-7 py-6 text-left flex items-center gap-5">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Coblos</span>
                  <span className="block font-display text-lg font-bold text-gray-900 leading-none">Nomor Urut</span>
                </div>
                <span className="font-display text-6xl md:text-7xl font-extrabold leading-none" style={{ color: primary }}>
                  {candidate.nomor_urut}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${candidate.tenant_slug}/dukung`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white font-semibold shadow-xl hover:scale-[1.03] transition-transform"
              style={{ color: primary }}
            >
              <Heart className="w-4 h-4" /> Daftar Jadi Pendukung
            </Link>
            <ShareButton
              name={candidate.nama_lengkap}
              nomorUrut={candidate.nomor_urut}
              variant="header"
              label="Ajak Teman"
            />
          </div>
        </div>
      </section>

      {/* ── SOSMED ───────────────────────────────────────────── */}
      {hasSosmed && (
        <section className="py-16 md:py-20 px-6" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white mb-3">Ikuti Perjalanan Kami</h2>
            <p className="text-white/75 mb-10">Dapatkan update terbaru kampanye di media sosial</p>
            <div className="flex flex-wrap justify-center gap-3">
              {SOSMED_CONFIG.map(({ key, label, Icon }) => {
                const url = candidate.sosmed[key as keyof typeof candidate.sosmed];
                if (!url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white font-medium px-5 py-3 rounded-xl transition-all duration-200 hover:scale-105">
                    <Icon className="w-5 h-5" />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-6 bg-gray-950 text-center">
        <p className="text-gray-400 text-sm mb-2">
          Halaman kampanye resmi <span className="text-white font-semibold">{candidate.nama_lengkap}</span>
        </p>
        {views > 0 && (
          <p className="inline-flex items-center gap-1.5 text-gray-500 text-xs mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Telah dilihat {views.toLocaleString('id-ID')} kali
          </p>
        )}
        <p className="text-gray-600 text-xs">
          Dibuat dengan{' '}
          <Link href="/" className="font-display font-semibold text-[#C9A24B] hover:text-[#E3C77E] transition-colors">KampanyeKit</Link>
          {' '}— Platform Kampanye Digital Indonesia
        </p>
      </footer>

      {/* spacer so the sticky mobile bar never covers footer content */}
      <div className="h-20 md:hidden" />
      <MobileActionBar slug={candidate.tenant_slug} primary={primary} nomorUrut={candidate.nomor_urut} />
    </div>
  );
}
