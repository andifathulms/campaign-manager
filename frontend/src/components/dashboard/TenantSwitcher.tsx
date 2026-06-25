'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgencyTenants } from '@/hooks/useAgencyTenants';
import { useTenantStore } from '@/stores/tenantStore';

/** Candidate switcher for consultants. Renders nothing for a direct candidate
 *  (a single tenant). Selecting a tenant sets the active id and refetches all
 *  server state so the dashboard reflects the chosen campaign. */
export function TenantSwitcher() {
  const { data } = useAgencyTenants();
  const { activeTenantId, setActiveTenantId } = useTenantStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const tenants = data?.tenants ?? [];
  if (tenants.length <= 1) return null; // direct candidate — no switcher

  const current =
    tenants.find((t) => t.id === activeTenantId) ??
    tenants.find((t) => t.id === data?.active_tenant_id) ??
    tenants[0];

  const choose = (id: string) => {
    setActiveTenantId(id);
    setOpen(false);
    // Refetch everything under the new tenant context.
    queryClient.invalidateQueries();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-white hover:bg-secondary text-sm font-medium transition-colors"
      >
        <Building2 className="w-4 h-4 text-indigo-600" />
        <span className="max-w-[160px] truncate">{current?.name}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 z-20 rounded-lg border border-border bg-white shadow-lg py-1 max-h-80 overflow-y-auto">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Pilih Kandidat
            </p>
            {tenants.map((t) => (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-secondary text-left"
              >
                <span className="truncate">
                  {t.name}
                  <span className="ml-1 text-xs text-muted-foreground">/{t.slug}</span>
                </span>
                {current?.id === t.id && <Check className={cn('w-4 h-4 text-indigo-600 flex-shrink-0')} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
