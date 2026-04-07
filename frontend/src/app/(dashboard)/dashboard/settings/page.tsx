'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, Lock, Building2, Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', pro: 'Pro', premium: 'Premium', enterprise: 'Enterprise',
};
const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-slate-100 text-slate-700',
  pro: 'bg-indigo-100 text-indigo-700',
  premium: 'bg-violet-100 text-violet-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

type Tab = 'profile' | 'security' | 'tenant' | 'integrations';

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium
      ${type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {msg}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile form state ───────────────────────────────
  const { data: me } = useQuery({
    queryKey: ['auth-me', token],
    queryFn: () => axios.get(`${apiBase}/auth/me/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });

  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [profileInit, setProfileInit] = useState(false);
  if (me && !profileInit) {
    setProfile({ first_name: me.first_name || '', last_name: me.last_name || '', email: me.email || '', phone: me.phone || '' });
    setProfileInit(true);
  }

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const updateProfile = useMutation({
    mutationFn: (data: typeof profile) => axios.patch(`${apiBase}/auth/me/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['auth-me'] }); setProfileMsg({ type: 'success', text: 'Profil berhasil disimpan.' }); },
    onError: () => setProfileMsg({ type: 'error', text: 'Gagal menyimpan profil.' }),
  });

  // ── Password form ────────────────────────────────────
  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const changePwd = useMutation({
    mutationFn: (data: { old_password: string; new_password: string }) =>
      axios.post(`${apiBase}/auth/me/change-password/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { setPwd({ old_password: '', new_password: '', confirm: '' }); setPwdMsg({ type: 'success', text: 'Password berhasil diubah.' }); },
    onError: (e: any) => setPwdMsg({ type: 'error', text: e?.response?.data?.detail || 'Gagal mengubah password.' }),
  });

  // ── Tenant form ──────────────────────────────────────
  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings', token],
    queryFn: () => axios.get(`${apiBase}/auth/tenant/`, { headers: auth(token!) }).then(r => r.data),
    enabled: !!token,
    staleTime: 30_000,
    retry: false,
  });

  const [tenantForm, setTenantForm] = useState({ name: '', custom_domain: '' });
  const [tenantInit, setTenantInit] = useState(false);
  if (tenant && !tenantInit) {
    setTenantForm({ name: tenant.name || '', custom_domain: tenant.custom_domain || '' });
    setTenantInit(true);
  }
  const [tenantMsg, setTenantMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const updateTenant = useMutation({
    mutationFn: (data: typeof tenantForm) => axios.patch(`${apiBase}/auth/tenant/`, data, { headers: auth(token!) }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-settings'] }); setTenantMsg({ type: 'success', text: 'Pengaturan tenant disimpan.' }); },
    onError: () => setTenantMsg({ type: 'error', text: 'Gagal menyimpan pengaturan tenant.' }),
  });

  // ── Integrations ─────────────────────────────────────
  const { data: adsAccounts } = useQuery({
    queryKey: ['ads-accounts', token],
    queryFn: () => axios.get(`${apiBase}/ads/accounts/`, { headers: auth(token!) }).then(r => Array.isArray(r.data) ? r.data : (r.data as any).results ?? []),
    enabled: !!token && activeTab === 'integrations',
    staleTime: 30_000,
    retry: false,
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profil Akun', icon: User },
    { id: 'security', label: 'Keamanan', icon: Lock },
    { id: 'tenant', label: 'Kampanye', icon: Building2 },
    { id: 'integrations', label: 'Integrasi', icon: Link2 },
  ];

  return (
    <div className="p-8 w-full max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola akun, keamanan, dan integrasi platform.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left
                  ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profil Akun</CardTitle>
                <CardDescription>Nama, email, dan nomor telepon yang terhubung ke akun Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileMsg && <Alert type={profileMsg.type} msg={profileMsg.text} />}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Depan</Label>
                    <Input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Belakang</Label>
                    <Input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input type="tel" placeholder="081234567890" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={me?.username || ''} disabled className="bg-secondary/60" />
                  <p className="text-xs text-muted-foreground">Username tidak dapat diubah.</p>
                </div>
                <Button
                  onClick={() => { setProfileMsg(null); updateProfile.mutate(profile); }}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Security tab ── */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Ubah Password</CardTitle>
                <CardDescription>Gunakan password yang kuat dan unik untuk keamanan akun Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pwdMsg && <Alert type={pwdMsg.type} msg={pwdMsg.text} />}
                <div className="space-y-2">
                  <Label>Password Saat Ini</Label>
                  <Input type="password" value={pwd.old_password} onChange={e => setPwd(p => ({ ...p, old_password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input type="password" value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password Baru</Label>
                  <Input type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <Button
                  onClick={() => {
                    setPwdMsg(null);
                    if (pwd.new_password !== pwd.confirm) {
                      setPwdMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
                      return;
                    }
                    changePwd.mutate({ old_password: pwd.old_password, new_password: pwd.new_password });
                  }}
                  disabled={changePwd.isPending}
                >
                  {changePwd.isPending ? 'Mengubah...' : 'Ubah Password'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Tenant tab ── */}
          {activeTab === 'tenant' && (
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Kampanye</CardTitle>
                <CardDescription>Informasi tenant dan paket langganan Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenantMsg && <Alert type={tenantMsg.type} msg={tenantMsg.text} />}

                <div className="flex items-center gap-3 p-4 bg-secondary/40 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Paket Aktif</p>
                    <Badge className={PLAN_COLORS[tenant?.plan] ?? 'bg-slate-100 text-slate-700'}>
                      {PLAN_LABELS[tenant?.plan] ?? tenant?.plan ?? '–'}
                    </Badge>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground mb-1">Slug URL</p>
                    <code className="text-sm font-mono bg-white border border-border px-2 py-0.5 rounded">
                      {tenant?.slug ?? '–'}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nama Kampanye</Label>
                  <Input value={tenantForm.name} onChange={e => setTenantForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input placeholder="kampanye.andifathul.id" value={tenantForm.custom_domain} onChange={e => setTenantForm(f => ({ ...f, custom_domain: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Domain kustom memerlukan konfigurasi DNS dan tersedia di paket Pro ke atas.</p>
                </div>
                <Button
                  onClick={() => { setTenantMsg(null); updateTenant.mutate(tenantForm); }}
                  disabled={updateTenant.isPending}
                >
                  {updateTenant.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── Integrations tab ── */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Akun Iklan Terhubung</CardTitle>
                  <CardDescription>Status koneksi platform iklan digital Anda.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!adsAccounts ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => <div key={i} className="h-14 bg-secondary/40 rounded-lg animate-pulse" />)}
                    </div>
                  ) : adsAccounts.length === 0 ? (
                    <div className="text-center py-8">
                      <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">Belum ada akun iklan</p>
                      <p className="text-sm text-muted-foreground mb-4">Hubungkan Meta Ads atau TikTok Ads di halaman Dashboard Iklan.</p>
                      <Button variant="outline" asChild>
                        <a href="/dashboard/ads">Ke Dashboard Iklan</a>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adsAccounts.map((acc: any) => (
                        <div key={acc.id} className="flex items-center gap-3 p-4 border border-border rounded-xl">
                          <div className={`w-2 h-2 rounded-full ${acc.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{acc.account_name}</p>
                            <p className="text-xs text-muted-foreground">{acc.account_id} · {acc.platform_display}</p>
                          </div>
                          <Badge variant="outline" className={acc.is_active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}>
                            {acc.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground pt-2">
                        Kelola koneksi di <a href="/dashboard/ads" className="text-indigo-600 underline">Dashboard Iklan</a>.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Code</CardTitle>
                  <CardDescription>Kode unik untuk mengajak tim bergabung.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-secondary/60 border border-border rounded-lg px-4 py-3 text-sm font-mono tracking-wider">
                      {me?.referral_code ?? '–'}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(me?.referral_code ?? '')}
                    >
                      Salin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
