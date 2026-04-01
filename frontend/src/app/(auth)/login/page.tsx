import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Masuk — KampanyeKit',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-950 p-12 text-white relative overflow-hidden">
        {/* subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-semibold text-lg tracking-tight">KampanyeKit</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Platform Kampanye Digital</p>
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Kelola kampanye Anda dengan{' '}
              <span className="text-indigo-400">cerdas</span> dan{' '}
              <span className="text-indigo-400">terukur.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              'Halaman kampanye profesional',
              'Dashboard iklan Meta & TikTok terpadu',
              'Manajemen tim sukses & relawan',
              'Pendaftaran pendukung digital',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} KampanyeKit. Platform kampanye digital Indonesia.
        </p>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-semibold text-lg">KampanyeKit</span>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
