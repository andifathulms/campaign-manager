'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Share2, UserPlus, Trophy, User, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/volunteer', label: 'Beranda', icon: Home },
  { href: '/volunteer/tasks', label: 'Tugas', icon: ClipboardList },
  { href: '/volunteer/content', label: 'Konten Harian', icon: Share2 },
  { href: '/volunteer/supporters', label: 'Cari Pendukung', icon: UserPlus },
  { href: '/volunteer/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/volunteer/profile', label: 'Profil', icon: User },
];

export function VolunteerSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-border bg-white flex-shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <span className="text-lg font-bold text-indigo-600">KampanyeKit</span>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/volunteer' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.slice(0, 5).map(item => {
          const active = pathname === item.href || (item.href !== '/volunteer' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-xs transition-colors ${
                active ? 'text-indigo-600' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
