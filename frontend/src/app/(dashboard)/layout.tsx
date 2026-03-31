export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar and nav will be implemented in Step 2 */}
      <main>{children}</main>
    </div>
  );
}
