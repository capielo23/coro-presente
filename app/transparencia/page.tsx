import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import Logo, { Wordmark } from '@/components/ui/Logo'
import {
  Users, ClipboardList, CheckCircle2, TrendingUp,
  HeartHandshake, Globe, BarChart3, RefreshCw, AlertTriangle,
} from 'lucide-react'

interface ReporteTransparencia {
  generado_en: string
  resumen: {
    total_casos_activos: number
    total_personas_atendidas: number
    total_necesidades_pendientes: number
    total_necesidades: number
    total_entregadas: number
    tasa_cumplimiento: number
  }
  por_grupo_etario: Array<{
    grupo: string
    total_personas: number
    necesidades_pendientes: number
    necesidades_entregadas: number
  }>
  por_categoria: Array<{
    categoria: string
    total: number
    pendientes: number
    entregadas: number
  }>
  gestion: {
    entregadas_ultimos_30_dias: number
    voluntarios_activos: number
  }
}

const GRUPO_LABELS: Record<string, { label: string; rango: string; color: string }> = {
  nino:         { label: 'Niños',        rango: '0–11 años',   color: 'bg-sky-100 text-sky-700 border-sky-200' },
  adolescente:  { label: 'Adolescentes', rango: '12–17 años',  color: 'bg-violet-100 text-violet-700 border-violet-200' },
  adulto:       { label: 'Adultos',      rango: '18–59 años',  color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  adulto_mayor: { label: 'Adulto mayor', rango: '60+ años',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
}

const CATEGORIA_LABEL: Record<string, string> = {
  alimentacion:  'Alimentación',
  ropa:          'Ropa y calzado',
  medicamentos:  'Medicamentos',
  traslado:      'Traslado',
  alojamiento:   'Alojamiento',
  hogar:         'Hogar y utensilios',
  utiles:        'Útiles escolares',
  ninos:         'Cuidado de niños',
  adulto_mayor:  'Adulto mayor',
  otro:          'Otro',
}

const obtenerReporte = unstable_cache(
  async () => {
    const { data, error } = await createAdminClient().rpc('reporte_transparencia')
    if (error) throw error
    return data as ReporteTransparencia
  },
  ['transparencia-reporte'],
  { revalidate: 300 }
)

export default async function TransparenciaPage() {
  let reporte: ReporteTransparencia | null = null
  let errorMsg: string | null = null

  try {
    reporte = await obtenerReporte()
  } catch {
    errorMsg = 'No se pudo cargar el reporte en este momento.'
  }

  const generadoEn = reporte?.generado_en
    ? new Date(reporte.generado_en).toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas',
      })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #0C4A6E 0%, #0891B2 100%)' }} className="text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] flex items-center justify-center shrink-0 shadow-sm">
              <Logo size={28} />
            </div>
            <div>
              <Wordmark className="text-lg leading-none" coroColor="#FACC15" presenteColor="#60A5FA" />
              <p className="text-cyan-300 text-xs mt-1">Portal de transparencia</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold leading-tight">Transparencia y rendición de cuentas</h1>
            {generadoEn && (
              <p className="text-cyan-300 text-xs mt-1 flex items-center gap-1 justify-end">
                <RefreshCw className="w-3 h-3" />
                Actualizado: {generadoEn}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Banner privacidad */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Los datos no incluyen información personal identificable (sin nombres, teléfonos, cédulas ni direcciones). Actualizado automáticamente cada 5 minutos.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {errorMsg}
          </div>
        )}

        {reporte && (
          <>
            {/* Resumen general */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
                Resumen general
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard
                  icon={<ClipboardList className="w-5 h-5" />}
                  valor={reporte.resumen.total_casos_activos}
                  label="Casos activos"
                  color="cyan"
                />
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  valor={reporte.resumen.total_personas_atendidas}
                  label="Personas atendidas"
                  color="indigo"
                />
                <StatCard
                  icon={<HeartHandshake className="w-5 h-5" />}
                  valor={reporte.resumen.total_necesidades_pendientes}
                  label="Necesidades pendientes"
                  color="amber"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  valor={`${reporte.resumen.tasa_cumplimiento}%`}
                  label="Tasa de cumplimiento"
                  color="green"
                />
              </div>
            </section>

            {/* Por grupo etario */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                Por grupo etario
              </h2>
              {reporte.por_grupo_etario.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin datos de grupos etarios aún.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {reporte.por_grupo_etario.map((g, i) => {
                    const info = GRUPO_LABELS[g.grupo] ?? { label: g.grupo, rango: '', color: 'bg-gray-100 text-gray-700 border-gray-200' }
                    const total = g.necesidades_pendientes + g.necesidades_entregadas
                    const pct = total > 0 ? Math.round((g.necesidades_entregadas / total) * 100) : 0
                    return (
                      <div key={g.grupo} className={`p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${info.color}`}>
                              {info.label}
                            </span>
                            <span className="text-xs text-gray-400">{info.rango}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              <span className="font-bold text-gray-900">{g.total_personas}</span> persona{g.total_personas !== 1 ? 's' : ''}
                            </span>
                            <span className="text-amber-700 text-xs font-medium">{g.necesidades_pendientes} pendiente{g.necesidades_pendientes !== 1 ? 's' : ''}</span>
                            <span className="text-green-700 text-xs font-medium">{g.necesidades_entregadas} entregada{g.necesidades_entregadas !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        {total > 0 && (
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Por categoría */}
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-cyan-600" />
                Necesidades por categoría
              </h2>
              {reporte.por_categoria.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin necesidades registradas aún.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left">Categoría</th>
                          <th className="px-4 py-3 text-right">Total</th>
                          <th className="px-4 py-3 text-right">Pendientes</th>
                          <th className="px-4 py-3 text-right">Entregadas</th>
                          <th className="px-4 py-3 text-left hidden sm:table-cell">Progreso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reporte.por_categoria.map(c => {
                          const pct = c.total > 0 ? Math.round((c.entregadas / c.total) * 100) : 0
                          return (
                            <tr key={c.categoria} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">{c.total}</td>
                              <td className="px-4 py-3 text-right">
                                {c.pendientes > 0
                                  ? <span className="font-semibold text-amber-700">{c.pendientes}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {c.entregadas > 0
                                  ? <span className="font-semibold text-green-700">{c.entregadas}</span>
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[60px]">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* Gestión */}
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Prueba de gestión activa
              </h2>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div>
                  <span className="text-2xl font-bold text-green-700">{reporte.gestion.entregadas_ultimos_30_dias}</span>
                  <p className="text-xs text-gray-500 mt-0.5">necesidades entregadas<br />en los últimos 30 días</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-cyan-700">{reporte.gestion.voluntarios_activos}</span>
                  <p className="text-xs text-gray-500 mt-0.5">voluntarios activos<br />en el sistema</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center space-y-3 text-sm text-gray-400">
          <p className="flex items-center justify-center gap-1.5">
            <Logo size={18} />
            <Wordmark className="text-sm" coroColor="#0891B2" presenteColor="#0C4A6E" />
          </p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/buscar" className="hover:text-cyan-600 transition">
              Portal de búsqueda familiar
            </Link>
            <span>·</span>
            <a
              href="/api/transparencia"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-600 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              API JSON para organizaciones
            </a>
          </div>
          <p className="text-[11px] text-gray-300">
            Datos actualizados automáticamente cada 5 minutos · Sin información personal identificable
          </p>
        </div>

      </div>
    </div>
  )
}

function StatCard({
  icon, valor, label, color,
}: {
  icon: React.ReactNode
  valor: number | string
  label: string
  color: 'cyan' | 'indigo' | 'amber' | 'green'
}) {
  const colors = {
    cyan:   'bg-cyan-50 text-cyan-600 border-cyan-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    green:  'bg-green-50 text-green-600 border-green-100',
  }
  const valueColors = {
    cyan:   'text-cyan-900',
    indigo: 'text-indigo-900',
    amber:  'text-amber-900',
    green:  'text-green-900',
  }

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${valueColors[color]}`}>{valor}</p>
    </div>
  )
}
