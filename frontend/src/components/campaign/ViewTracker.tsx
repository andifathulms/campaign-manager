'use client';

import { useEffect } from 'react';

interface Props {
  slug: string;
}

export function ViewTracker({ slug }: Props) {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/public/${slug}/view/`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  return null;
}
