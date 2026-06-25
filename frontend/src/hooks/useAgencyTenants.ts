import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';

export interface SwitchableTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface AgencyTenantsResponse {
  active_tenant_id: string | null;
  tenants: SwitchableTenant[];
}

/** Tenants the current user can switch between (their agency's tenants).
 *  Returns a single-element list for direct candidates. */
export function useAgencyTenants() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    queryKey: ['agency-tenants'],
    queryFn: () => api.get<AgencyTenantsResponse>('/auth/agency/tenants/').then((r) => r.data),
    enabled: !!token,
    staleTime: 60_000,
  });
}
