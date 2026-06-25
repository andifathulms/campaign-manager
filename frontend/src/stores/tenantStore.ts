import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantStore {
  // Active tenant a consultant is operating on. null = use home tenant.
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      activeTenantId: null,
      setActiveTenantId: (id) => set({ activeTenantId: id }),
    }),
    { name: 'active-tenant' }
  )
);
