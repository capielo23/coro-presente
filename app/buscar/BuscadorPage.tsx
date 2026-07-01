'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, User, Clock, ChevronRight, Globe } from 'lucide-react'
import Logo, { Wordmark } from '@/components/ui/Logo'

const ESTADO_LABELS: Record<string, string> = {
  activo: 'Siendo atendido/a',
  estable: 'Estable — necesidades cubiertas',
  cerrado: 'Caso cerrado',
  critico: 'Requiere atención urgente',
}

const ESTADO_COLORS: Record<string, string> = {
  activo: 'bg-cyan-100 text-cyan-800',
  estable: 'bg-green-100 text-green-800',
  cerrado: 'bg-gray-100 text-gray-600',
  critico: 'bg-red-100 text-red-800',
}

interface ResultadoPublico {
  nombre: string; apellido: string; estadoCaso: string
  ciudadAtencion: string; tutorContacto: string
}

interface ResultadoPrivado {
  nombre: string; apellido: string; cedula: string | null
  estadoCaso: string; sectorCoro: string | null; tipoAlojamiento: string | null
  tutorNombre: string; casoId: string; necesidadesPendientes: number
}

interface Props {
  voluntario: { nombre_completo: string; rol: string } | null
}

export default function BuscadorPage({ voluntario }: Props) {
  const [query, setQuery] = useState('')
  const [resultadosPublicos, setResultadosPublicos] = useState<ResultadoPublico[] | null>(null)
  const [resultadosPrivados, setResultadosPrivados] = useState<ResultadoPrivado[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const esVoluntario = !!voluntario

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length < 2) return
    setLoading(true)
    setError('')
    setResultadosPublicos(null)
    setResultadosPrivados(null)

    const endpoint = esVoluntario
      ? `/api/buscar-privado?q=${encodeURIComponent(query.trim())}`
      : `/api/buscar?q=${encodeURIComponent(query.trim())}`

    const res = await fetch(endpoint)
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al buscar'); setLoading(false); return }
    if (esVoluntario) setResultadosPrivados(data.resultados)
    else setResultadosPublicos(data.resultados)
    setLoading(false)
  }

  const totalResultados = esVoluntario
    ? (resultadosPrivados?.length ?? null)
    : (resultadosPublicos?.length ?? null)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0C4A6E 0%, #0891B2 60%, #164E63 100%)' }}>
      {/* Barra superior */}
      <div className="bg-black/20 backdrop-blur-sm text-white px-5 py-3.5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm">
            <Logo size={26} />
          </div>
          <div>
            <Wordmark className="text-base leading-none" coroColor="#FACC15" presenteColor="#60A5FA" />
            <p className="text-cyan-300 text-xs mt-1">Portal de búsqueda familiar</p>
          </div>
        </div>
        {esVoluntario ? (
          <Link href="/dashboard" className="text-cyan-200 hover:text-white text-sm font-medium transition flex items-center gap-1">
            Ir al panel <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link href="/login" className="text-cyan-200 hover:text-white text-sm font-medium transition flex items-center gap-1">
            Soy voluntario <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Banner voluntario */}
        {esVoluntario && (
          <div className="mb-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-sm text-cyan-100">
            Bienvenido, <span className="font-semibold text-white">{voluntario.nombre_completo}</span> —
            estás viendo la <span className="font-semibold">vista de voluntario</span> con más información.
          </div>
        )}

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Search className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Buscar familiar</h2>
          <p className="text-cyan-200 text-sm leading-relaxed max-w-sm mx-auto">
            {esVoluntario
              ? 'Busca por nombre, apellido o cédula para ver el estado completo del caso.'
              : 'Si tienes un familiar afectado por el terremoto en Coro, búscalo aquí. Solo necesitas su nombre, apellido o cédula.'}
          </p>
        </div>

        <form onSubmit={buscar} className="flex gap-2 mb-8">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nombre, apellido o cédula..."
            className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C] bg-white shadow-lg"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="bg-[#EA580C] hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-xl transition disabled:opacity-50 whitespace-nowrap shadow-lg btn-press"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {totalResultados !== null && (
          <div className="space-y-3">
            {totalResultados === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">No encontramos a nadie con esa búsqueda.</p>
                <p className="text-sm text-gray-400">
                  Puede que aún no esté registrado. Contacta directamente a la coordinación de Coro Presente.
                </p>
              </div>
            ) : (
              <>
                <p className="text-cyan-200 text-sm mb-2">
                  Se encontraron {totalResultados} resultado(s):
                </p>

                {/* Vista pública */}
                {!esVoluntario && resultadosPublicos?.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-5 card-hover">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{r.nombre} {r.apellido}</h3>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {r.ciudadAtencion}
                        </p>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                          Responsable: <span className="font-medium text-gray-700">{r.tutorContacto}</span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[r.estadoCaso] || 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_LABELS[r.estadoCaso] || r.estadoCaso}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Vista voluntario */}
                {esVoluntario && resultadosPrivados?.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-5 card-hover">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{r.nombre} {r.apellido}</h3>
                        {r.cedula && <p className="text-gray-400 text-xs mt-0.5">{r.cedula}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.necesidadesPendientes > 0 && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                            <Clock className="w-3 h-3" />
                            {r.necesidadesPendientes} pendiente{r.necesidadesPendientes > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_COLORS[r.estadoCaso] || 'bg-gray-100 text-gray-600'}`}>
                          {ESTADO_LABELS[r.estadoCaso] || r.estadoCaso}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                      {r.sectorCoro && (
                        <div className="bg-[var(--color-muted)] rounded-lg px-3 py-2">
                          <p className="text-gray-400 font-medium mb-0.5">Sector en Coro</p>
                          <p className="font-semibold text-gray-800">{r.sectorCoro}</p>
                        </div>
                      )}
                      {r.tipoAlojamiento && (
                        <div className="bg-[var(--color-muted)] rounded-lg px-3 py-2">
                          <p className="text-gray-400 font-medium mb-0.5">Alojamiento</p>
                          <p className="font-semibold text-gray-800">{r.tipoAlojamiento}</p>
                        </div>
                      )}
                      <div className="bg-[var(--color-muted)] rounded-lg px-3 py-2">
                        <p className="text-gray-400 font-medium mb-0.5">Tutor asignado</p>
                        <p className="font-semibold text-gray-800">{r.tutorNombre}</p>
                      </div>
                    </div>

                    <Link
                      href={`/casos/${r.casoId}`}
                      className="inline-flex items-center gap-1 text-xs text-cyan-600 font-semibold hover:underline"
                    >
                      Ver ficha completa <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="mt-12 text-center space-y-1.5 text-cyan-300 text-xs">
          {!esVoluntario && (
            <>
              <p>Este portal solo muestra si la persona está registrada y siendo atendida.</p>
              <p>No expone dirección exacta, teléfono, cédula ni datos médicos.</p>
            </>
          )}
          <div className="pt-4 border-t border-white/10 mt-4">
            <p className="flex items-center justify-center gap-1.5">
              <Logo size={18} />
              <Wordmark className="text-sm" coroColor="#FACC15" presenteColor="#60A5FA" />
            </p>
            <p className="text-[#FB7185] mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em]">Juntos nos levantamos</p>
            <Link
              href="/transparencia"
              className="flex items-center justify-center gap-1.5 text-xs text-cyan-400 hover:text-white transition mt-3"
            >
              <Globe className="w-3.5 h-3.5" />
              Ver datos de transparencia
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
