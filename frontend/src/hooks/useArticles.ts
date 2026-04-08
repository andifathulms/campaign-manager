import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_url: string | null;
  category: string;
  category_display: string;
  status: 'draft' | 'published';
  status_display: string;
  author: string | null;
  author_nama: string;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export interface PublicArticleList {
  results: Article[];
  total: number;
  page: number;
  pages: number;
}

// Admin hooks
export function useArticles(category?: string, statusFilter?: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['articles', category, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (statusFilter) params.set('status', statusFilter);
      const qs = params.toString();
      return axios
        .get<Article[]>(`${apiBase}/content/articles/${qs ? `?${qs}` : ''}`, { headers: authHeaders(token!) })
        .then(r => r.data);
    },
    enabled: !!token,
  });
}

export function useArticle(id: string) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['article', id],
    queryFn: () =>
      axios.get<Article>(`${apiBase}/content/articles/${id}/`, { headers: authHeaders(token!) }).then(r => r.data),
    enabled: !!token && !!id,
  });
}

export function useCreateArticle() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) =>
      axios.post<Article>(`${apiBase}/content/articles/`, data, {
        headers: { ...authHeaders(token!), 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

export function useUpdateArticle() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      axios.patch<Article>(`${apiBase}/content/articles/${id}/`, data, {
        headers: { ...authHeaders(token!), 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article'] });
    },
  });
}

export function useDeleteArticle() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      axios.delete(`${apiBase}/content/articles/${id}/`, { headers: authHeaders(token!) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['articles'] }),
  });
}

// Public hooks
export function usePublicArticles(slug: string, page = 1, category?: string, search?: string) {
  return useQuery({
    queryKey: ['public-articles', slug, page, category, search],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      return axios
        .get<PublicArticleList>(`${apiBase}/public/${slug}/berita/?${params}`)
        .then(r => r.data);
    },
    enabled: !!slug,
  });
}

export function usePublicArticle(slug: string, articleSlug: string) {
  return useQuery({
    queryKey: ['public-article', slug, articleSlug],
    queryFn: () =>
      axios.get<Article>(`${apiBase}/public/${slug}/berita/${articleSlug}/`).then(r => r.data),
    enabled: !!slug && !!articleSlug,
  });
}
