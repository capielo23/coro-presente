import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = createClient()

  const [
    { count: totalCasos },
    { count: casosActivos },
    { count: casosCriticos },
    { count: casosEstables },
    { count: necesidadesPendientes },
    { count: necesidadesEntregadas },
    { count: voluntariosAprobados },
    { count: voluntariosPendientes },
  ] = await Promise.all([
    supabase.from('casos').select('*', { count: 'exact', head: true }),
    supabase.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
    supabase.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'estable'),
    supabase.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'entregado'),
    supabase.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
    supabase.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de administración</h2>
        <p className="text-gray-500 text-sm mt-1">Visión general del operativo CoroAyuda</p>
      </div>

      {voluntariosPendientes && voluntariosPendientes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-orange-800 font-medium text-sm">
            🔔 {voluntariosPendientes} voluntario(s) esperando aprobación
          </p>
          <Link
            href="/admin/voluntarios"
            className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition"
          >
            Revisar ahora →
          </Link>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Casos</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard titulo="Total registrados" valor={totalCasos ?? 0} icono="📋" />
          <StatCard titulo="Activos" valor={casosActivos ?? 0} icono="✅" colorFondo="bg-blue-50" />
          <StatCard titulo="Críticos" valor={casosCriticos ?? 0} icono="🚨" colorFondo="bg-red-50" />
          <StatCard titulo="Estables" valor={casosEstables ?? 0} icono="💙" colorFondo="bg-green-50" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Necesidades</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard titulo="Pendientes" valor={necesidadesPendientes ?? 0} icono="⏳" colorFondo="bg-yellow-50" />
          <StatCard titulo="Entregadas" valor={necesidadesEntregadas ?? 0} icono="✅" colorFondo="bg-green-50" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Voluntarios</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard titulo="Activos" valor={voluntariosAprobados ?? 0} icono="👥" />
          <StatCard titulo="Pendientes" valor={voluntariosPendientes ?? 0} icono="🔔" colorFondo="bg-orange-50" />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/admin/voluntarios"
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
        >
          Gestionar voluntarios →
        </Link>
        <Link
          href="/casos"
          className="bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          Ver todos los casos →
        </Link>
      </div>
    </div>
  )
}
