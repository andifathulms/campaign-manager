'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, Star, ClipboardList, Trophy, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function useVolunteerStats(slug: string) {
  return useQuery({
    queryKey: ['public-volunteer-stats', slug],
    queryFn: () =>
      axios.get<{ volunteer_count: number; top_volunteers: { nama: string; total_points: number; wilayah_name: string }[] }>(
        `${apiBase}/public/${slug}/volunteer-stats/`
      ).then(r => r.data),
    enabled: !!slug,
  });
}

const BENEFITS = [
  { icon: Star, title: 'Kumpulkan Poin', desc: 'Dapatkan poin dari setiap aksi yang Anda lakukan untuk kampanye.' },
  { icon: Trophy, title: 'Naik Peringkat', desc: 'Bersaing di leaderboard dan tunjukkan kontribusi Anda.' },
  { icon: ClipboardList, title: 'Ambil Tugas', desc: 'Pilih tugas kampanye yang sesuai waktu dan wilayah Anda.' },
  { icon: Users, title: 'Bangun Jaringan', desc: 'Rekrut pendukung dan perluas jangkauan kampanye.' },
];

const STEPS = [
  { num: '1', title: 'Daftar', desc: 'Isi formulir pendaftaran relawan dengan data diri Anda.' },
  { num: '2', title: 'Aktifkan Akun', desc: 'Verifikasi akun Anda dan login ke dashboard relawan.' },
  { num: '3', title: 'Mulai Berkontribusi', desc: 'Ambil tugas, bagikan konten, rekrut pendukung!' },
];

export default function RelawanHubPage() {
  const { slug } = useParams() as { slug: string };
  const { data: stats } = useVolunteerStats(slug);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Bergabung Jadi Relawan</h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Jadilah bagian dari perubahan. Dukung kandidat pilihan Anda dengan aksi nyata dan dapatkan pengakuan atas kontribusi Anda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${slug}?join=relawan`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
            >
              <UserPlus className="w-5 h-5" /> Daftar Sekarang
            </Link>
            {stats && (
              <div className="flex items-center gap-2 text-indigo-200">
                <Users className="w-5 h-5" />
                <span className="text-lg font-semibold">{stats.volunteer_count.toLocaleString('id-ID')}</span>
                <span>relawan terdaftar</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Keuntungan Menjadi Relawan</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="flex gap-4 p-5 rounded-xl bg-white shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-slate-600">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Cara Bergabung</h2>
          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-4">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex-1 text-center">
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-300 mx-auto mt-4 hidden md:block rotate-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top volunteers */}
      {stats?.top_volunteers && stats.top_volunteers.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Relawan Terbaik</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {stats.top_volunteers.map((v, i) => (
                <div key={i} className="text-center p-5 rounded-xl bg-white shadow-sm">
                  <Trophy className={`w-8 h-8 mx-auto mb-2 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : 'text-orange-600'}`} />
                  <p className="font-semibold">{v.nama}</p>
                  <p className="text-xs text-slate-500">{v.wilayah_name}</p>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{v.total_points.toLocaleString('id-ID')} poin</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Siap Bergabung?</h2>
          <p className="text-slate-600 mb-6">Daftar sekarang dan mulai berkontribusi untuk kampanye yang Anda percayai.</p>
          <Link
            href={`/${slug}?join=relawan`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" /> Daftar Jadi Relawan
          </Link>
        </div>
      </section>
    </div>
  );
}
