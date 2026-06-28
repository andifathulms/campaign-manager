import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { roleAllowedInPortal, portalForRole } from '@/lib/portals';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = (session as any).role;
  if (!roleAllowedInPortal(role, 'admin')) redirect(portalForRole(role));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopbar user={session.user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
