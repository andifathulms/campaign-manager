import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { SupporterJoinForm } from '@/components/public/SupporterJoinForm';

const API_BASE = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/v1';

async function getCandidate(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/public/${slug}/`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCandidate(params.slug);
  return { title: c ? `Daftar Pendukung — ${c.nama_lengkap}` : 'Tidak ditemukan' };
}

export default async function DukungPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const candidate = await getCandidate(params.slug);
  if (!candidate) notFound();
  const primary = candidate.color_primary || '#0A1A3F';

  return (
    <main className="min-h-screen py-12 px-4" style={{ background: `${primary}0a` }}>
      <div className="max-w-lg mx-auto">
        <Link href={`/${params.slug}`} className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
          ← Kembali ke halaman {candidate.nama_lengkap}
        </Link>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-gray-900">Jadi Pendukung</h1>
            <p className="text-gray-500 text-sm mt-1">
              Dukung {candidate.nama_lengkap} dan dapatkan kartu keanggotaan digital.
            </p>
          </div>
          <SupporterJoinForm slug={params.slug} refCode={searchParams.ref} primary={primary} />
        </div>
      </div>
    </main>
  );
}
