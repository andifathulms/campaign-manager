import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { VolunteerSidebar } from '@/components/volunteer/VolunteerSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <VolunteerSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopbar user={session.user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
