import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import StatCard from '@/components/ui/StatCard'
import EstadisticasAmpliadas from '@/components/dashboard/EstadisticasAmpliadas'
import FiltroGrupo from '@/components/dashboard/FiltroGrupo'
import Link from 'next/link'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS } from '@/lib/utils'
import { Users2, OctagonAlert, ClipboardList, UserX, UserCheck, Users, Sparkles } from 'lucide-react'

// Estadísticas globales: cacheadas 60s en el servidor — 100 usuarios comparten 1 sola consulta
const getEstadisticasGlobales = unstable_cache(
  async () => {
    const admin = createAdminClient()
    const [
      { count: totalCasos },
      { count: casosCriticos },
      { count: casosActivos },
      { count: casosEstables },
      { count: casosCerrados },
      { count: necesidadesPendientes },
      { count: necesidadesEntregadas },
      { count: necesidadesTotal },
      { count: casosSinTutor },
      { count: totalFamilias },
      { count: totalPersonas },
      { count: voluntariosActivos },
      { data: voluntariosMiPerfil },
      { data: topCategoriasData },
    ] = await Promise.all([
      admin.from('casos').select('*', { count: 'exact', head: true }),
      admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
      admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
      admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'estable'),
      admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'cerrado'),
      admin.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      admin.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'entregado'),
      admin.from('necesidades').select('*', { count: 'exact', head: true }),
      admin.from('casos').select('*', { count: 'exact', head: true }).is('tutor_id', null).neq('estado', 'cerrado'),
      admin.from('casos').select('*', { count: 'exact', head: true }).eq('tipo', 'familiar'),
      admin.from('personas').select('*', { count: 'exact', head: true }),
      admin.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
      admin.from('voluntarios').select('areas_ayuda').eq('estado', 'aprobado'),
      admin.from('necesidades').select('categoria').in('estado', ['pendiente', 'en_gestion']),
    ])

    // Agrupar categorías en memoria (PostgREST no soporta GROUP BY nativo)
    const catCount: Record<string, number> = {}
    ;(topCategoriasData ?? []).forEach((n: any) => {
      if (n.categoria) catCount[n.categoria] = (catCount[n.categoria] ?? 0) + 1
    })
    const topCategorias = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoria, count]) => ({ categoria, count }))

    return {
      totalCasos, casosCriticos, casosActivos, casosEstables, casosCerrados,
      necesidadesPendientes, necesidadesEntregadas, necesidadesTotal,
      casosSinTutor, totalFamilias, totalPersonas,
      voluntariosActivos, voluntariosMiPerfil, topCategorias,
    }
  },
  ['dashboard-stats'],
  { revalidate: 60, tags: ['dashboard-stats'] }
)

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Estadísticas globales (cacheadas) + datos del usuario (siempre frescos)
  const admin = createAdminClient()
  const [stats, { data: misCasos }, { data: miPerfil }] = await Promise.all([
    getEstadisticasGlobales(),
    admin.from('casos')
      .select('id, nombre_caso, estado, created_at, tipo')
      .eq('tutor_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(8),
    admin.from('voluntarios')
      .select('areas_ayuda, especialidades')
      .eq('id', user!.id)
      .single(),
  ])

  // Matching de casos relevantes: por area y por especialidad
  const areasAyuda: string[] = miPerfil?.areas_ayuda ?? []
  const especialidades: string[] = miPerfil?.especialidades ?? []
  let casosRelevantes: any[] = []

  if (areasAyuda.length > 0 || especialidades.length > 0) {
    const queries: Promise<{ data: any[] | null }>[] = []
    if (areasAyuda.length > 0) {
      queries.push(
        admin.from('necesidades')
          .select('caso_id')
          .in('categoria', areasAyuda)
          .in('estado', ['pendiente', 'en_gestion']) as any
      )
    }
    if (especialidades.length > 0) {
      queries.push(
        admin.from('necesidades')
          .select('caso_id')
          .in('especialidad_requerida', especialidades)
          .in('estado', ['pendiente', 'en_gestion']) as any
      )
    }

    const results = await Promise.all(queries)
    const todosIds = Array.from(
      new Set(results.flatMap(r => (r.data ?? []).map((n: any) => n.caso_id as string)))
    )

    if (todosIds.length > 0) {
      const { data: casosData } = await admin
        .from('casos')
        .select('id, nombre_caso, estado, tipo')
        .in('id', todosIds)
        .neq('estado', 'cerrado')
        .neq('tutor_id', user!.id)
        .limit(6)

      const ORDER: Record<string, number> = { critico: 0, activo: 1, estable: 2 }
      casosRelevantes = (casosData ?? []).sort(
        (a, b) => (ORDER[a.estado] ?? 9) - (ORDER[b.estado] ?? 9)
      )
    }
  }

  const {
    totalCasos, casosCriticos, casosActivos, casosEstables, casosCerrados,
    necesidadesPendientes, necesidadesEntregadas, necesidadesTotal,
    casosSinTutor, totalFamilias, totalPersonas,
    voluntariosActivos, voluntariosMiPerfil, topCategorias,
  } = stats

  // Resumir capacidades del equipo
  const areaCount: Record<string, number> = {}
  ;(voluntariosMiPerfil ?? []).forEach((v: any) => {
    ;(v.areas_ayuda ?? []).forEach((area: string) => {
      areaCount[area] = (areaCount[area] ?? 0) + 1
    })
  })
  const topAreas = Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen del operativo</h2>
        <p className="text-gray-500 text-sm mt-1">Estado en tiempo real · Coro Presente</p>
      </div>

      <EstadisticasAmpliadas
        totalCasos={totalCasos ?? 0}
        totalFamilias={totalFamilias ?? 0}
        totalPersonas={totalPersonas ?? 0}
        casosCerrados={casosCerrados ?? 0}
        necesidadesEntregadas={necesidadesEntregadas ?? 0}
        necesidadesTotal={necesidadesTotal ?? 0}
        topCategorias={topCategorias}
      />

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado operativo</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard titulo="Total de casos"     valor={totalCasos ?? 0}          Icon={Users2}       variant="default" />
        <StatCard titulo="Críticos"           valor={casosCriticos ?? 0}       Icon={OctagonAlert} variant="danger"  />
        <StatCard titulo="Necesidades pend."  valor={necesidadesPendientes ?? 0} Icon={ClipboardList} variant="warning" />
        <StatCard titulo="Sin tutor"          valor={casosSinTutor ?? 0}       Icon={UserX}        variant="info"    />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Desglose por estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Casos por estado</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Crítico', count: casosCriticos ?? 0, color: 'bg-red-500' },
              { label: 'Activo', count: casosActivos ?? 0, color: 'bg-green-500' },
              { label: 'Estable', count: casosEstables ?? 0, color: 'bg-cyan-400' },
              { label: 'Cerrado', count: casosCerrados ?? 0, color: 'bg-gray-300' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-14 shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: totalCasos ? `${Math.round((count / (totalCasos ?? 1)) * 100)}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {voluntariosActivos ?? 0} voluntarios activos
            </span>
            {(casosSinTutor ?? 0) > 0 && (
              <Link href="/casos?sinTutor=1" className="text-amber-600 font-medium hover:underline">
                {casosSinTutor} sin tutor →
              </Link>
            )}
          </div>
        </div>

        {/* Capacidades del equipo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Capacidades del equipo</h3>
          {topAreas.length > 0 ? (
            <div className="space-y-2">
              {topAreas.map(([area, count]) => (
                <div key={area} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 capitalize">{area.replace(/_/g, ' ')}</span>
                  <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                    {count} voluntario{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Los voluntarios aún no han declarado sus áreas de ayuda.</p>
          )}
        </div>
      </div>

      {/* Casos relevantes para ti */}
      {areasAyuda.length > 0 || especialidades.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-800">Casos relevantes para ti</h3>
            </div>
            <Link href="/casos" className="text-cyan-600 text-sm hover:underline font-medium">Ver todos →</Link>
          </div>
          {casosRelevantes.length > 0 ? (
            <div className="space-y-2">
              {casosRelevantes.map((caso: any) => (
                <Link
                  key={caso.id}
                  href={`/casos/${caso.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    {caso.tipo === 'familiar'
                      ? <Users className="w-4 h-4 text-cyan-500 shrink-0" />
                      : <UserCheck className="w-4 h-4 text-cyan-500 shrink-0" />}
                    <span className="font-medium text-gray-800 text-sm">{caso.nombre_caso}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                    {ESTADO_CASO_LABELS[caso.estado]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              No hay casos abiertos que coincidan con tus áreas en este momento.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Completa tu perfil para ver casos relevantes</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Cuanto más sepamos de tus habilidades, mejor podemos conectarte con quienes más necesitan tu ayuda.
            </p>
            <Link href="/perfil" className="text-amber-700 font-semibold hover:underline mt-1.5 inline-block">
              Ir a mi perfil →
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Mis casos asignados</h3>
          <Link href="/casos" className="text-cyan-600 text-sm hover:underline font-medium">Ver todos →</Link>
        </div>
        {misCasos && misCasos.length > 0 ? (
          <div className="space-y-2">
            {misCasos.map((caso: any) => (
              <Link
                key={caso.id}
                href={`/casos/${caso.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {caso.tipo === 'familiar'
                    ? <Users className="w-4 h-4 text-cyan-500 shrink-0" />
                    : <UserCheck className="w-4 h-4 text-cyan-500 shrink-0" />}
                  <span className="font-medium text-gray-800 text-sm">{caso.nombre_caso}</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                  {ESTADO_CASO_LABELS[caso.estado]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">No tienes casos asignados aún.</p>
            <Link href="/casos/nuevo" className="text-cyan-600 text-sm font-medium hover:underline mt-2 inline-block">
              Registrar primer caso →
            </Link>
          </div>
        )}
      </div>

      <FiltroGrupo />

      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-[var(--color-foreground)]">
        <strong>Coro Presente</strong> — Sistema humanitario para familias afectadas por el terremoto en Coro, Estado Falcón.
      </div>
    </div>
  )
}
