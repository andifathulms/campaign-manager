export interface User {
  id: string;
  username: string;
  email: string;
  role: 'platform_admin' | 'candidate' | 'koordinator_wilayah' | 'koordinator_kecamatan' | 'koordinator_kelurahan' | 'relawan';
  tenant_id: string | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'premium' | 'enterprise';
  is_active: boolean;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  tenant_name: string;
  tenant_slug: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface Candidate {
  id: string;
  nama_lengkap: string;
  foto: string | null;
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
  status: 'draft' | 'published' | 'paused';
  color_primary: string;
  color_secondary: string;
}
