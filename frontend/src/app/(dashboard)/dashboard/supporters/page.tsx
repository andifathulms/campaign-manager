export const metadata = { title: 'Pendukung — KampanyeKit' };

export default function SupportersPage() {
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pendukung</h1>
        <p className="text-muted-foreground text-sm mt-1">Daftar pendukung dan statistik per wilayah.</p>
      </div>
      <div className="bg-white rounded-xl border border-border p-16 text-center shadow-sm">
        <div className="text-5xl mb-4">❤️</div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Segera Hadir</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Fitur <strong>Pendukung</strong> sedang dalam pengembangan dan akan segera tersedia.
        </p>
      </div>
    </div>
  );
}
