'use client';

import { useEffect } from 'react';
import { setActiveTenant } from '@/lib/api';
import { useTenantStore } from '@/stores/tenantStore';

/** Mirrors the persisted active-tenant id into the axios client so every
 *  request carries the X-Tenant-ID header for consultant tenant switching. */
export function TenantSync() {
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  useEffect(() => {
    setActiveTenant(activeTenantId);
  }, [activeTenantId]);
  return null;
}
