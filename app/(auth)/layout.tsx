import Logo, { Wordmark } from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0C4A6E 0%, #0891B2 60%, #164E63 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FAF6EE] mb-4 shadow-lg">
            <Logo size={42} />
          </div>
          <Wordmark className="block text-3xl" coroColor="#FACC15" presenteColor="#60A5FA" />
          <p className="text-[#FB7185] mt-2 text-xs font-extrabold uppercase tracking-[0.22em]">Juntos nos levantamos</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/20">
          {children}
        </div>
      </div>
    </div>
  )
}
