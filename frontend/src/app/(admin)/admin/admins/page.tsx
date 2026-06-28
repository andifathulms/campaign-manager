'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePlatformAdmins, useCreateAdmin, type StaffUser } from '@/hooks/usePlatformAdmin';

export default function AdminStaffPage() {
  const { data } = usePlatformAdmins();
  const createAdmin = useCreateAdmin();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<StaffUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<{ username: string; first_name: string; email: string; role: string }>({
    defaultValues: { role: 'admin' },
  });

  const list = Array.isArray(data) ? data : data?.results ?? [];

  const onSubmit = async (form: any) => {
    setError(null);
    try {
      const res = await createAdmin.mutateAsync(form);
      setCreated(res);
      reset({ role: 'admin' });
      setOpen(false);
    } catch (e: any) {
      const d = e?.response?.data;
      setError(d ? Object.values(d).flat().join(' ') : 'Gagal membuat staf.');
    }
  };

  return (
    <div className="p-8 w-full max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Staf Platform</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola akun superadmin & admin.</p>
        </div>
        <Button onClick={() => { setOpen(!open); setCreated(null); }}><Plus className="w-4 h-4" /> Tambah Staf</Button>
      </div>

      {created && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-4 mb-4 text-sm">
          Staf <strong>{created.username}</strong> dibuat. Password sementara: <strong className="font-mono">{created.temp_password}</strong>
        </div>
      )}

      {open && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Username</Label><Input {...register('username', { required: true })} placeholder="operator1" /></div>
            <div className="space-y-1.5"><Label>Nama</Label><Input {...register('first_name')} placeholder="Operator Satu" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input {...register('email')} placeholder="ops@kampanyekit.id" /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select {...register('role')} className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
          <Button type="submit" disabled={createAdmin.isPending}>{createAdmin.isPending ? 'Membuat…' : 'Buat Staf'}</Button>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground">
            <tr><th className="text-left font-semibold px-4 py-3">Username</th><th className="text-left font-semibold px-4 py-3">Nama</th><th className="text-left font-semibold px-4 py-3">Role</th><th className="text-left font-semibold px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{`${u.first_name} ${u.last_name}`.trim() || '—'}</td>
                <td className="px-4 py-3"><Badge variant={u.role === 'superadmin' ? 'default' : 'secondary'}>{u.role}</Badge></td>
                <td className="px-4 py-3">{u.is_active ? <Badge variant="success">aktif</Badge> : <Badge variant="destructive">nonaktif</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
