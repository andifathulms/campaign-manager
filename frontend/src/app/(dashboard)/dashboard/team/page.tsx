'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Plus, Trophy, Copy, Check, Trash2, ChevronDown } from 'lucide-react';
import { useTeamMembers, useLeaderboard, useCreateTeamMember, useDeleteTeamMember } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@/types';

const LEVEL_OPTIONS = [
  { value: 1, label: 'Koordinator Wilayah' },
  { value: 2, label: 'Koordinator Kecamatan' },
  { value: 3, label: 'Koordinator Kelurahan' },
  { value: 4, label: 'Relawan' },
];

const WILAYAH_OPTIONS = [
  { value: 'provinsi', label: 'Provinsi' },
  { value: 'kabupaten', label: 'Kabupaten/Kota' },
  { value: 'kecamatan', label: 'Kecamatan' },
  { value: 'kelurahan', label: 'Kelurahan' },
];

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-violet-100 text-violet-700',
  2: 'bg-indigo-100 text-indigo-700',
  3: 'bg-sky-100 text-sky-700',
  4: 'bg-emerald-100 text-emerald-700',
};

const memberSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().min(8, 'Nomor HP tidak valid'),
  level: z.coerce.number().int().min(1).max(4),
  wilayah_name: z.string().min(1, 'Wilayah wajib diisi'),
  wilayah_level: z.string().min(1),
});

type MemberForm = z.infer<typeof memberSchema>;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Salin kode referral"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function MemberRow({ member, onDelete }: { member: TeamMember; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
            {member.nama.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{member.nama}</p>
            <p className="text-xs text-muted-foreground">{member.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[member.level]}`}>
            {member.level_display}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:block">{member.wilayah_name}</span>
          <span className="text-xs font-semibold text-indigo-600">{member.total_clicks} klik</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-slate-50 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Link Referral</p>
            <button
              onClick={() => onDelete(member.id)}
              className="text-xs text-destructive hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Hapus anggota
            </button>
          </div>
          {member.referral_links.length === 0 ? (
            <p className="text-xs text-muted-foreground">Tidak ada link referral.</p>
          ) : (
            <div className="space-y-1">
              {member.referral_links.map(link => {
                const url = `${appUrl}/ref/${link.code}`;
                return (
                  <div key={link.id} className="flex items-center gap-2 text-xs">
                    <code className="bg-white border border-border rounded px-2 py-1 font-mono flex-1 truncate">
                      {url}
                    </code>
                    <CopyButton text={url} />
                    <span className="text-muted-foreground whitespace-nowrap">{link.clicks} klik</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { data: members, isLoading } = useTeamMembers();
  const { data: leaderboard } = useLeaderboard();
  const createMember = useCreateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { level: 4, wilayah_level: 'kelurahan' },
  });

  const onSubmit = async (data: MemberForm) => {
    await createMember.mutateAsync(data as any);
    reset();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus anggota ini?')) {
      await deleteMember.mutateAsync(id);
    }
  };

  const totalMembers = members?.length ?? 0;
  const totalClicks = members?.reduce((s, m) => s + m.total_clicks, 0) ?? 0;

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tim Sukses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola anggota tim dan pantau performa referral.
          </p>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Anggota
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Anggota', value: totalMembers, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Total Klik Referral', value: totalClicks, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Koordinator', value: members?.filter(m => m.level <= 3).length ?? 0, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Relawan', value: members?.filter(m => m.level === 4).length ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Add member form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tambah Anggota Baru</CardTitle>
            <CardDescription>Link referral akan dibuat otomatis setelah anggota ditambahkan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input placeholder="Budi Santoso" {...register('nama')} />
                {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nomor HP *</Label>
                <Input placeholder="08XXXXXXXXXX" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Jabatan</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('level')}
                >
                  {LEVEL_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Wilayah</Label>
                <Input placeholder="Kec. Cimahi Tengah" {...register('wilayah_name')} />
                {errors.wilayah_name && <p className="text-xs text-destructive">{errors.wilayah_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Tingkat Wilayah</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('wilayah_level')}
                >
                  {WILAYAH_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={createMember.isPending}>
                  {createMember.isPending ? 'Menyimpan...' : 'Simpan Anggota'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { reset(); setShowForm(false); }}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Daftar Anggota
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
              ))}
            </div>
          ) : !members || members.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Belum ada anggota</p>
              <p className="text-xs text-muted-foreground">Tambahkan koordinator atau relawan pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <MemberRow key={m.id} member={m} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard Referral
          </h2>
          <Card>
            <CardContent className="p-0">
              {!leaderboard || leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Belum ada data klik referral.
                </div>
              ) : (
                <ol className="divide-y divide-border">
                  {leaderboard.slice(0, 10).map((m, i) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.nama}</p>
                        <p className="text-xs text-muted-foreground">{m.level_display}</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{m.total_clicks}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
