'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useCandidate } from '@/hooks/useCandidate';
import {
  LayoutDashboard,
  User,
  Globe,
  Megaphone,
  Users,
  Heart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profil Kandidat', icon: User },
  { href: '/dashboard/page', label: 'Halaman Kampanye', icon: Globe },
  { href: '/dashboard/ads', label: 'Iklan', icon: Megaphone },
  { href: '/dashboard/team', label: 'Tim Sukses', icon: Users },
  { href: '/dashboard/supporters', label: 'Pendukung', icon: Heart },
  { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();
  const { data: candidate } = useCandidate();
  const tenantSlug = (candidate as any)?.tenant_slug as string | undefined;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const publicUrl = tenantSlug ? `${appUrl}/${tenantSlug}` : null;

  return (
    <aside
      className={cn(
        'bg-slate-950 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out relative',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="px-3 py-4 border-b border-slate-800/60 flex items-center justify-between min-h-[60px]">
        <Link href="/dashboard/overview" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            K
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm leading-tight whitespace-nowrap">KampanyeKit</p>
              <p className="text-slate-500 text-[10px] leading-tight">Dashboard</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-800/60 space-y-0.5">
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'Lihat Halaman Publik' : undefined}
            className={cn(
              'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 w-full transition-all duration-150',
              collapsed ? 'justify-center' : ''
            )}
          >
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Lihat Halaman Publik</span>}
          </a>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Keluar' : undefined}
          className={cn(
            'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 w-full transition-all duration-150',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-[22px] w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10 shadow-md"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>
    </aside>
  );
}
