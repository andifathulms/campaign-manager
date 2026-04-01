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

export interface CandidateProfile {
  id: string;
  nama_lengkap: string;
  foto: string | null;
  foto_url: string | null;
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
  tenant_slug: string;
  campaign_page: {
    id: string;
    is_published: boolean;
    published_at: string | null;
    view_count: number;
    hero_image_url: string | null;
    hero_video_url: string | null;
    seo_title: string | null;
    seo_description: string | null;
  } | null;
}

export interface ReferralLink {
  id: string;
  code: string;
  label: string;
  clicks: number;
  unique_visitors: number;
  last_clicked_at: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  nama: string;
  phone: string;
  level: 1 | 2 | 3 | 4;
  level_display: string;
  wilayah_name: string;
  wilayah_level: string;
  wilayah_level_display: string;
  parent: string | null;
  is_active: boolean;
  referral_links: ReferralLink[];
  total_clicks: number;
  created_at: string;
}

export interface Supporter {
  id: string;
  nama: string;
  phone: string;
  email: string | null;
  foto_url: string | null;
  kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  referred_by_team: string | null;
  membership_id: string;
  statement: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SupporterStats {
  total: number;
  by_kecamatan: Array<{ kecamatan: string; count: number }>;
  by_kabupaten: Array<{ kabupaten_kota: string; count: number }>;
}

export interface CampaignPage {
  id: string;
  hero_image_url: string | null;
  hero_video_url: string | null;
  sections_order: string[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  view_count: number;
}
