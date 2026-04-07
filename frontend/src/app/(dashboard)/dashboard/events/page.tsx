'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { CalendarDays, Plus, MapPin, Users, Edit2, Trash2, QrCode, CheckCircle, X } from 'lucide-react';
import {
  useCampaignEvents,
  useCreateCampaignEvent,
  useUpdateCampaignEvent,
  useDeleteCampaignEvent,
  useCampaignEventAttendances,
  useQRCheckIn,
  CampaignEvent,
  CampaignEventAttendance,
} from '@/hooks/useEvents';
import { useTeamMembers } from '@/hooks/useTeam';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-200',
  published: 'bg-blue-900/50 text-blue-300',
  ongoing: 'bg-green-900/50 text-green-300',
  completed: 'bg-slate-600 text-slate-300',
  cancelled: 'bg-red-900/50 text-red-300',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Dipublikasikan' },
  { value: 'ongoing', label: 'Sedang Berlangsung' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

function EventModal({ event, onClose }: { event?: CampaignEvent; onClose: () => void }) {
  const create = useCreateCampaignEvent();
  const update = useUpdateCampaignEvent();
  const [form, setForm] = useState({
    judul: event?.judul ?? '',
    deskripsi: event?.deskripsi ?? '',
    lokasi: event?.lokasi ?? '',
    tanggal_mulai: event?.tanggal_mulai ? event.tanggal_mulai.slice(0, 16) : '',
    tanggal_selesai: event?.tanggal_selesai ? event.tanggal_selesai.slice(0, 16) : '',
    status: event?.status ?? 'draft',
    target_peserta: event?.target_peserta?.toString() ?? '0',
    live_url: event?.live_url ?? '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...form,
      target_peserta: parseInt(form.target_peserta) || 0,
      tanggal_selesai: form.tanggal_selesai || null,
    };
    if (event) {
      await update.mutateAsync({ id: event.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-semibold">{event ? 'Edit Event' : 'Buat Event Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Judul Event</label>
            <input
              required
              value={form.judul}
              onChange={e => set('judul', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Nama acara kampanye"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mulai</label>
              <input
                required
                type="datetime-local"
                value={form.tanggal_mulai}
                onChange={e => set('tanggal_mulai', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Selesai (opsional)</label>
              <input
                type="datetime-local"
                value={form.tanggal_selesai}
                onChange={e => set('tanggal_selesai', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Lokasi</label>
            <input
              value={form.lokasi}
              onChange={e => set('lokasi', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="Nama tempat / alamat"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {STATUS_OPTIONS.filter(s => s.value).map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target Peserta</label>
              <input
                type="number"
                min="0"
                value={form.target_peserta}
                onChange={e => set('target_peserta', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">URL Live Stream (opsional)</label>
            <input
              value={form.live_url}
              onChange={e => set('live_url', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="https://youtube.com/live/..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deskripsi</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={e => set('deskripsi', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Detail acara..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
            >
              {isPending ? 'Menyimpan...' : event ? 'Simpan' : 'Buat Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckInModal({ event, onClose }: { event: CampaignEvent; onClose: () => void }) {
  const { data: attendances = [] } = useCampaignEventAttendances(event.id);
  const checkIn = useQRCheckIn(event.id);
  const [qrInput, setQrInput] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleCheckIn = async () => {
    if (!qrInput.trim()) return;
    try {
      const res = await checkIn.mutateAsync(qrInput.trim()) as { detail: string };
      setCheckInMsg({ ok: true, msg: res.detail });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'QR tidak valid.';
      setCheckInMsg({ ok: false, msg });
    }
    setQrInput('');
  };

  const checkedIn = attendances.filter((a: CampaignEventAttendance) => a.checked_in).length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-white font-semibold">Check-In: {event.judul}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{checkedIn} / {attendances.length} hadir</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Scan / Masukkan Kode QR</label>
            <div className="flex gap-2">
              <input
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Tempel atau ketik kode QR..."
              />
              <button
                onClick={handleCheckIn}
                disabled={checkIn.isPending || !qrInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50"
              >
                Check In
              </button>
            </div>
            {checkInMsg && (
              <p className={`mt-2 text-sm ${checkInMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                {checkInMsg.msg}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Daftar Hadir ({attendances.length})</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {attendances.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Belum ada peserta terdaftar</p>
              ) : attendances.map((a: CampaignEventAttendance) => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/50">
                  <CheckCircle className={`h-4 w-4 flex-shrink-0 ${a.checked_in ? 'text-green-400' : 'text-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{a.team_member_nama}</p>
                    <p className="text-slate-500 text-xs">{a.team_member_level} · {a.team_member_wilayah}</p>
                  </div>
                  {a.checked_in && a.checked_in_at && (
                    <span className="text-xs text-green-500 flex-shrink-0">
                      {format(new Date(a.checked_in_at), 'HH:mm')}
                    </span>
                  )}
                  <span className="text-xs text-slate-600 font-mono flex-shrink-0">{a.qr_code.slice(0, 8)}…</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: CampaignEvent }) {
  const [editing, setEditing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const deleteEvent = useDeleteCampaignEvent();

  const pct = event.target_peserta > 0
    ? Math.min(100, Math.round((event.attendee_count / event.target_peserta) * 100))
    : 0;

  return (
    <>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[event.status]}`}>
                {event.status_display}
              </span>
            </div>
            <h3 className="text-white font-semibold text-sm leading-snug">{event.judul}</h3>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setCheckingIn(true)}
              className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
              title="Check-in peserta"
            >
              <QrCode className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Hapus event ini?')) deleteEvent.mutate(event.id);
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {format(new Date(event.tanggal_mulai), 'd MMM yyyy, HH:mm', { locale: id })}
              {event.tanggal_selesai && ` — ${format(new Date(event.tanggal_selesai), 'HH:mm', { locale: id })}`}
            </span>
          </div>
          {event.lokasi && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{event.lokasi}</span>
            </div>
          )}
        </div>

        {event.target_peserta > 0 && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{event.attendee_count} hadir</span>
              </div>
              <span>{pct}% dari target {event.target_peserta}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {editing && <EventModal event={event} onClose={() => setEditing(false)} />}
      {checkingIn && <CheckInModal event={event} onClose={() => setCheckingIn(false)} />}
    </>
  );
}

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { data: events = [], isLoading } = useCampaignEvents(statusFilter || undefined);

  const upcoming = events.filter((e: CampaignEvent) => ['draft', 'published'].includes(e.status)).length;
  const ongoing = events.filter((e: CampaignEvent) => e.status === 'ongoing').length;
  const completed = events.filter((e: CampaignEvent) => e.status === 'completed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events Kampanye</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola acara kampanye dan check-in peserta via QR</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Buat Event
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Mendatang', value: upcoming, color: 'text-blue-400' },
          { label: 'Sedang Berlangsung', value: ongoing, color: 'text-green-400' },
          { label: 'Selesai', value: completed, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Belum ada event</p>
          <p className="text-sm mt-1">Buat event kampanye pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((e: CampaignEvent) => <EventCard key={e.id} event={e} />)}
        </div>
      )}

      {showCreate && <EventModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
