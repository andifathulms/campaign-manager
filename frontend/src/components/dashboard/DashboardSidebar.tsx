'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Globe,
  Megaphone,
  Users,
  Heart,
  Settings,
  LogOut,
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

  return (
    <aside className="w-60 bg-slate-950 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <Link href="/dashboard/overview" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            K
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">KampanyeKit</p>
            <p className="text-slate-500 text-[10px] leading-tight">Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800/60">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 w-full transition-all duration-150"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
