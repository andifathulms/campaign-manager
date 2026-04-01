import { Bell } from 'lucide-react';

interface Props {
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export function DashboardTopbar({ user }: Props) {
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-end px-6 gap-3 flex-shrink-0">
      <button className="w-8 h-8 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center justify-center transition-colors relative">
        <Bell className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground leading-tight">{user?.name || 'Kandidat'}</p>
          <p className="text-xs text-muted-foreground leading-tight">{user?.email || ''}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
      </div>
    </header>
  );
}
