import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: totalCasos },
    { count: casosCriticos },
    { count: necesidadesPendientes },
    { data: misCasos },
  ] = await Promise.all([
    supabase.from('casos').select('*', { count: 'exact', head: true }),
    supabase.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
    supabase.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('casos')
      .select('id, nombre_caso, estado, created_at, tipo')
      .eq('tutor_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resumen del operativo</h2>
        <p className="text-gray-500 text-sm mt-1">Estado en tiempo real · CoroAyuda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard titulo="Total de casos" valor={totalCasos ?? 0} icono="👨‍👩‍👧‍👦" />
        <StatCard titulo="Casos críticos" valor={casosCriticos ?? 0} icono="🚨" colorFondo="bg-red-50" />
        <StatCard titulo="Necesidades pendientes" valor={necesidadesPendientes ?? 0} icono="📋" colorFondo="bg-yellow-50" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Mis casos asignados</h3>
          <Link href="/casos" className="text-blue-700 text-sm hover:underline">Ver todos →</Link>
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
                  <span className="text-lg">{caso.tipo === 'familiar' ? '👨‍👩‍👧‍👦' : '👤'}</span>
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
            <Link href="/casos/nuevo" className="text-blue-700 text-sm font-medium hover:underline mt-2 inline-block">
              Registrar primer caso →
            </Link>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>🇻🇪 CoroAyuda</strong> — Sistema humanitario para familias afectadas por el terremoto.
        Ciudad de Coro, Estado Falcón.
      </div>
    </div>
  )
}
