import { TIPO_CONTACTO_LABELS } from '@/lib/utils'
import { Phone, MapPin, MessageCircle, Package, Settings2, ArrowRight, type LucideIcon } from 'lucide-react'

const TIPO_ICON: Record<string, LucideIcon> = {
  visita: MapPin,
  llamada: Phone,
  whatsapp: MessageCircle,
  entrega: Package,
  gestion: Settings2,
}

const TIPO_COLOR: Record<string, string> = {
  visita: 'text-cyan-600 bg-cyan-50',
  llamada: 'text-indigo-600 bg-indigo-50',
  whatsapp: 'text-green-600 bg-green-50',
  entrega: 'text-orange-600 bg-orange-50',
  gestion: 'text-gray-600 bg-gray-100',
}

export default function BitacoraSeguimiento({ seguimientos }: { seguimientos: any[] }) {
  if (!seguimientos || seguimientos.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-4">
        Aún no hay seguimientos. Registra el primer contacto con este caso.
      </p>
    )
  }

  const ordenados = [...seguimientos].sort((a, b) => {
    const fa = a.fecha ?? a.created_at.slice(0, 10)
    const fb = b.fecha ?? b.created_at.slice(0, 10)
    return fb.localeCompare(fa)
  })

  return (
    <div className="space-y-3">
      {ordenados.map((s: any) => {
        const Icon = TIPO_ICON[s.tipo_contacto] ?? Settings2
        const color = TIPO_COLOR[s.tipo_contacto] ?? 'text-gray-600 bg-gray-100'
        return (
          <div key={s.id} className="flex gap-3">
            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400">
                <span className="font-semibold text-gray-700">
                  {TIPO_CONTACTO_LABELS[s.tipo_contacto] ?? s.tipo_contacto}
                </span>
                <span>·</span>
                <span>
                  {new Date((s.fecha ? s.fecha + 'T12:00:00' : s.created_at)).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: '2-digit' })}
                </span>
                {s.voluntario?.nombre_completo && (
                  <>
                    <span>·</span>
                    <span>{s.voluntario.nombre_completo}</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{s.descripcion}</p>
              {s.proximos_pasos && (
                <p className="text-sm text-cyan-700 mt-1.5 flex items-start gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><span className="font-medium">Próximo paso:</span> {s.proximos_pasos}</span>
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
