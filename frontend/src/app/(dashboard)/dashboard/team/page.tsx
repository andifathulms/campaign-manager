export const metadata = { title: 'Tim Sukses — KampanyeKit' };

export default function TeamPage() {
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tim Sukses</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola tim, relawan, dan lacak referral.</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Segera Hadir</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Fitur <strong>Tim Sukses</strong> sedang dalam pengembangan dan akan segera tersedia.
        </p>
      </div>
    </div>
  );
}
