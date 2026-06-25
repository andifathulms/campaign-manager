'use client';

import { useState } from 'react';
import { UserCheck, Check, X, MapPin, Phone, Clock } from 'lucide-react';
import { useRelawanRequests, useApproveRelawan, useRejectRelawan, type RelawanRequest } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';

function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function RequestCard({ req }: { req: RelawanRequest }) {
  const approve = useApproveRelawan();
  const reject = useRejectRelawan();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{req.nama}</h3>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{req.phone}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{req.wilayah_name}, {req.kecamatan}</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(req.created_at)}</span>
          </div>
          {req.alasan_bergabung && (
            <p className="mt-2 text-sm text-slate-600 italic">&ldquo;{req.alasan_bergabung}&rdquo;</p>
          )}
          {req.referred_by_nama && (
            <p className="mt-1 text-xs text-muted-foreground">Direferensikan oleh: <span className="font-medium">{req.referred_by_nama}</span></p>
          )}
        </div>
        {!rejecting && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" onClick={() => approve.mutate(req.id)} disabled={busy} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <Check className="w-4 h-4" /> Setujui
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRejecting(true)} disabled={busy} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
              <X className="w-4 h-4" /> Tolak
            </Button>
          </div>
        )}
      </div>

      {rejecting && (
        <div className="mt-4 border-t border-border pt-4 space-y-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan penolakan (opsional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { reject.mutate({ id: req.id, reason }); }} disabled={busy}
              className="text-red-600 border-red-200 hover:bg-red-50">
              Konfirmasi Tolak
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>Batal</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RelawanRequestsPage() {
  const { data: requests, isLoading } = useRelawanRequests();

  return (
    <div className="p-8 w-full max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Permintaan Relawan</h1>
          <p className="text-muted-foreground text-sm">Setujui atau tolak relawan yang mendaftar lewat halaman publik.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div>
      ) : !requests?.length ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-muted-foreground">Tidak ada permintaan relawan yang menunggu persetujuan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{requests.length} permintaan menunggu</p>
          {requests.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}
