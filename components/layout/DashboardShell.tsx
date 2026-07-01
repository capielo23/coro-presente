'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import Logo, { Wordmark } from '@/components/ui/Logo'

interface Props {
  children: React.ReactNode
  voluntario: { nombre_completo: string; rol: string }
  pendientesCount?: number
  perfilCompletitud?: number
}

export default function DashboardShell({ children, voluntario, pendientesCount = 0, perfilCompletitud = 100 }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Overlay oscuro en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 transition-transform duration-200
        lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          esAdmin={voluntario.rol === 'admin'}
          nombreVoluntario={voluntario.nombre_completo}
          onClose={() => setSidebarOpen(false)}
          pendientesCount={pendientesCount}
          perfilCompletitud={perfilCompletitud}
        />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior */}
        <div className="sticky top-0 z-10 px-4 py-3 bg-white border-b border-[var(--color-border)] flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo pequeño en móvil */}
          <div className="lg:hidden flex items-center gap-1.5">
            <Logo size={24} />
            <Wordmark className="text-sm" coroColor="#CA8A04" presenteColor="#1E40AF" />
          </div>

          <span className="hidden sm:block text-sm text-gray-500 flex-1 truncate">
            Bienvenido, <span className="font-medium text-gray-900">{voluntario.nombre_completo}</span>
          </span>

          <div className="ml-auto">
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${
              voluntario.rol === 'admin'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-cyan-100 text-cyan-700'
            }`}>
              {voluntario.rol === 'admin' ? 'Admin' : 'Voluntario'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
