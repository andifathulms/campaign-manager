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
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <Link href="/dashboard/overview">
          <h1 className="text-xl font-bold text-primary">KampanyeKit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Dashboard Kampanye</p>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
