'use client'
import { useState, useEffect, useRef } from 'react'
import { Users2, OctagonAlert, ClipboardList, UserX, X, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS } from '@/lib/utils'

type Filtro = 'total' | 'criticos' | 'necesidades' | 'sin_tutor'

interface Caso {
  id: string
  nombre_caso: string
  estado: string
  sector_coro?: string | null
  tutor?: { nombre_completo: string } | null
}

interface CardDef {
  filtro: Filtro
  titulo: string
  valor: number
  Icon: React.ElementType
  bg: string
  iconCls: string
  numCls: string
  panelTitulo: string
}

interface Props {
  totalCasos: number
  casosCriticos: number
  necesidadesPendientes: number
  casosSinTutor: number
}

export default function EstadoOperativo({ totalCasos, casosCriticos, necesidadesPendientes, casosSinTutor }: Props) {
  const [filtroActivo, setFiltroActivo] = useState<Filtro | null>(null)
  const [casos, setCasos] = useState<Caso[]>([])
  const [cargando, setCargando] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const cards: CardDef[] = [
    { filtro: 'total',       titulo: 'Total de casos',     valor: totalCasos,            Icon: Users2,       bg: 'bg-white',      iconCls: 'bg-cyan-50 text-cyan-600',    numCls: 'text-slate-800', panelTitulo: 'Todos los casos activos' },
    { filtro: 'criticos',    titulo: 'Críticos',           valor: casosCriticos,         Icon: OctagonAlert, bg: 'bg-red-50',     iconCls: 'bg-red-100 text-red-600',     numCls: 'text-red-700',   panelTitulo: 'Casos críticos' },
    { filtro: 'necesidades', titulo: 'Necesidades pend.',  valor: necesidadesPendientes, Icon: ClipboardList, bg: 'bg-amber-50',  iconCls: 'bg-amber-100 text-amber-600', numCls: 'text-amber-800', panelTitulo: 'Casos con necesidades pendientes' },
    { filtro: 'sin_tutor',   titulo: 'Sin tutor',          valor: casosSinTutor,         Icon: UserX,        bg: 'bg-sky-50',     iconCls: 'bg-sky-100 text-sky-600',     numCls: 'text-sky-800',   panelTitulo: 'Casos sin tutor asignado' },
  ]

  useEffect(() => {
    if (!filtroActivo) return
    setCargando(true)
    setCasos([])
    fetch(`/api/dashboard/casos-filtro?filtro=${filtroActivo}`)
      .then(r => r.json())
      .then(data => setCasos(Array.isArray(data) ? data : []))
      .finally(() => setCargando(false))
  }, [filtroActivo])

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setFiltroActivo(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const cardActiva = cards.find(c => c.filtro === filtroActivo)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ filtro, titulo, valor, Icon, bg, iconCls, numCls }) => (
          <button
            key={filtro}
            onClick={() => setFiltroActivo(f => f === filtro ? null : filtro)}
            className={`${bg} rounded-xl p-5 shadow-sm border text-left flex items-center gap-4 transition hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${filtroActivo === filtro ? 'ring-2 ring-cyan-500 border-cyan-300' : 'border-gray-100'}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconCls}`}>
              <Icon size={22} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">{titulo}</p>
              <p className={`text-3xl font-bold leading-tight mt-0.5 ${numCls}`}>{valor}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Panel lateral */}
      {filtroActivo && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setFiltroActivo(null)}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

          {/* Panel */}
          <div
            ref={panelRef}
            onClick={e => e.stopPropagation()}
            className="relative z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">{cardActiva?.panelTitulo}</h3>
                {!cargando && <p className="text-xs text-gray-400 mt-0.5">{casos.length} caso{casos.length !== 1 ? 's' : ''}</p>}
              </div>
              <button onClick={() => setFiltroActivo(null)} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cargando ? (
                <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando casos...</span>
                </div>
              ) : casos.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">No hay casos en esta categoría.</div>
              ) : (
                casos.map(caso => (
                  <Link
                    key={caso.id}
                    href={`/casos/${caso.id}`}
                    onClick={() => setFiltroActivo(null)}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{caso.nombre_caso}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                          {ESTADO_CASO_LABELS[caso.estado]}
                        </span>
                        {caso.sector_coro && <span className="text-[11px] text-gray-400 truncate">{caso.sector_coro}</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {caso.tutor?.nombre_completo ?? <span className="text-amber-500">Sin tutor</span>}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-cyan-500 transition shrink-0 ml-2" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
