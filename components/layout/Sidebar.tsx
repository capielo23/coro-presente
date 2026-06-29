'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠' },
  { href: '/casos', label: 'Todos los casos', icon: '📋' },
  { href: '/casos/nuevo', label: 'Nuevo registro', icon: '➕' },
]

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Panel Admin', icon: '⚙️' },
  { href: '/admin/voluntarios', label: 'Voluntarios', icon: '👥' },
]

interface SidebarProps {
  esAdmin: boolean
  nombreVoluntario?: string
}

export default function Sidebar({ esAdmin, nombreVoluntario }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen shrink-0">
      <div className="px-6 py-5 border-b border-blue-800">
        <h1 className="text-xl font-bold">CoroAyuda</h1>
        <p className="text-blue-300 text-xs mt-0.5">Coro presente. Falcón solidario.</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
              pathname === item.href
                ? 'bg-blue-700 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {esAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs text-blue-400 uppercase tracking-wider font-medium">
              Administración
            </div>
            {ADMIN_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  pathname === item.href
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-blue-800 space-y-1">
        <Link
          href="/buscar"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition"
        >
          <span>🔍</span> Portal público
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
