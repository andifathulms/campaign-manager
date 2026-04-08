'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MessageCircle, Tag } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const TEMA_LABELS: Record<string, string> = {
  infrastruktur: 'Infrastruktur',
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan',
  ekonomi: 'Ekonomi',
  lingkungan: 'Lingkungan',
  sosial: 'Sosial',
  lainnya: 'Lainnya',
};

const TEMA_COLORS: Record<string, string> = {
  infrastruktur: 'bg-blue-100 text-blue-700',
  kesehatan: 'bg-rose-100 text-rose-700',
  pendidikan: 'bg-indigo-100 text-indigo-700',
  ekonomi: 'bg-amber-100 text-amber-700',
  lingkungan: 'bg-emerald-100 text-emerald-700',
  sosial: 'bg-purple-100 text-purple-700',
  lainnya: 'bg-gray-100 text-gray-700',
};

interface PublicReply {
  nama: string;
  wilayah: string;
  tema: string;
  pesan: string;
  balasan: string;
  created_at: string;
  tags?: string[];
}

function usePublicReplies(slug: string, tema?: string) {
  return useQuery<PublicReply[]>({
    queryKey: ['public-replies', slug, tema],
    queryFn: () =>
      axios
        .get(`${apiBase}/public/${slug}/aspirasi/replies/`)
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Kemarin';
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

export default function TanggapanPage() {
  const { slug } = useParams() as { slug: string };
  const [selectedTema, setSelectedTema] = useState('');
  const { data: replies, isLoading } = usePublicReplies(slug);

  const filtered = (replies || []).filter((r) =>
    selectedTema ? r.tema === selectedTema : true
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/${slug}`} className="text-sm text-indigo-600 hover:underline">
            &larr; Kembali ke halaman kandidat
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tanggapan Aspirasi</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Aspirasi warga yang telah mendapat tanggapan resmi dari kandidat.
          </p>
        </div>

        {/* Tema filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedTema('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !selectedTema
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            Semua
          </button>
          {Object.entries(TEMA_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedTema(key === selectedTema ? '' : key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedTema === key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada tanggapan untuk ditampilkan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((reply, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Aspirasi */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{reply.nama}</p>
                      {reply.wilayah && (
                        <p className="text-xs text-gray-400">{reply.wilayah}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          TEMA_COLORS[reply.tema] || TEMA_COLORS.lainnya
                        }`}
                      >
                        {TEMA_LABELS[reply.tema] || reply.tema}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(reply.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{reply.pesan}</p>

                  {reply.tags && reply.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reply.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Candidate reply */}
                <div className="bg-indigo-50 border-t border-indigo-100 px-5 py-4">
                  <p className="text-xs font-semibold text-indigo-600 mb-1.5 uppercase tracking-wide">
                    Tanggapan Kandidat
                  </p>
                  <p className="text-sm text-indigo-900 leading-relaxed">{reply.balasan}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Count */}
        {!isLoading && filtered.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Menampilkan {filtered.length} tanggapan
          </p>
        )}
      </div>
    </div>
  );
}
