'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, ClipboardList, PlusCircle, BookOpen,
  Settings, Users, Search, LogOut, UserCircle,
} from 'lucide-react'
import Logo, { Wordmark } from '@/components/ui/Logo'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Inicio',              Icon: Home },
  { href: '/casos',        label: 'Todos los casos',     Icon: ClipboardList },
  { href: '/casos/nuevo',  label: 'Nuevo registro',      Icon: PlusCircle },
  { href: '/perfil',       label: 'Mi perfil',           Icon: UserCircle },
  { href: '/aprendizaje',  label: 'Centro de aprendizaje', Icon: BookOpen },
]

const ADMIN_ITEMS = [
  { href: '/admin',             label: 'Panel coordinadores', Icon: Settings },
  { href: '/admin/voluntarios', label: 'Gestión de voluntarios', Icon: Users },
]

interface SidebarProps {
  esAdmin: boolean
  nombreVoluntario?: string
  onClose?: () => void
  pendientesCount?: number
  perfilCompletitud?: number
}

export default function Sidebar({ esAdmin, onClose, pendientesCount = 0, perfilCompletitud = 100 }: SidebarProps) {
  const pathname = usePathname()

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
      pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        ? 'bg-cyan-700/60 text-white'
        : 'text-cyan-200 hover:bg-cyan-700/40 hover:text-white'
    )

  return (
    <aside className="w-64 flex flex-col h-full shrink-0 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0C4A6E 0%, #083344 100%)' }}>

      {/* Botón cerrar — solo móvil */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute right-3 top-3 p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-800/60 transition-all duration-150"
          aria-label="Cerrar menú"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="16" y2="16"/><line x1="16" y1="2" x2="2" y2="16"/>
          </svg>
        </button>
      )}

      {/* Logo */}
      <div className="px-5 py-5 border-b border-cyan-800/50 pr-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm">
            <Logo size={26} />
          </div>
          <div>
            <Wordmark className="text-base leading-tight" coroColor="#FACC15" presenteColor="#60A5FA" />
            <p className="text-[#FB7185] text-[9px] leading-tight mt-1 font-bold uppercase tracking-[0.1em] whitespace-nowrap">Juntos nos levantamos</p>
          </div>
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} onClick={onClose} className={linkClass(href)}>
            <Icon size={16} strokeWidth={1.75} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {href === '/perfil' && perfilCompletitud < 100 && (
              <span
                className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                title={`Perfil ${perfilCompletitud}% completo`}
              />
            )}
          </Link>
        ))}

        {esAdmin && (
          <>
            <div className="pt-5 pb-1.5 px-3">
              <span className="text-[10px] text-cyan-500 uppercase tracking-widest font-semibold">
                Coordinación
              </span>
            </div>
            {ADMIN_ITEMS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} onClick={onClose} className={linkClass(href)}>
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {href === '/admin/voluntarios' && pendientesCount > 0 && (
                  <span className="badge-pulse bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none inline-block">
                    {pendientesCount}
                  </span>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-cyan-800/50 space-y-0.5">
        <Link
          href="/buscar"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-cyan-300 hover:bg-cyan-700/40 hover:text-white transition-all duration-150"
        >
          <Search size={16} strokeWidth={1.75} className="shrink-0" />
          Portal público
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-cyan-300 hover:bg-red-700/30 hover:text-red-300 transition-all duration-150"
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
