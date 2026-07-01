import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  titulo: string
  valor: number | string
  Icon: LucideIcon
  variant?: 'default' | 'danger' | 'warning' | 'info'
}

const VARIANTS = {
  default: { bg: 'bg-white',       icon: 'bg-cyan-50 text-cyan-600',   num: 'text-slate-800' },
  danger:  { bg: 'bg-red-50',      icon: 'bg-red-100 text-red-600',    num: 'text-red-700'   },
  warning: { bg: 'bg-amber-50',    icon: 'bg-amber-100 text-amber-600', num: 'text-amber-800' },
  info:    { bg: 'bg-sky-50',      icon: 'bg-sky-100 text-sky-600',    num: 'text-sky-800'   },
}

export default function StatCard({ titulo, valor, Icon, variant = 'default' }: StatCardProps) {
  const v = VARIANTS[variant]
  return (
    <div className={`${v.bg} rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${v.icon}`}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{titulo}</p>
        <p className={`text-3xl font-bold leading-tight mt-0.5 ${v.num}`}>{valor}</p>
      </div>
    </div>
  )
}
