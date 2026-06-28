'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ShieldCheck, LogOut, UserCog } from 'lucide-react';

const items = [
  { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/candidates', label: 'Kandidat', icon: Users },
  { href: '/admin/admins', label: 'Staf Platform', icon: UserCog, superadminOnly: true },
];

export function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.superadminOnly || role === 'superadmin');

  return (
    <aside className="bg-card border-r border-border flex flex-col flex-shrink-0 w-60">
      <div className="px-3 py-4 border-b border-border flex items-center gap-2.5 min-h-[60px]">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-foreground font-display font-semibold text-sm leading-tight">KampanyeKit</p>
          <p className="text-muted-foreground text-[10px] leading-tight">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />}
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-all"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
