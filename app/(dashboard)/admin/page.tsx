import { createAdminClient } from '@/lib/supabase/admin'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'
import { ClipboardList, CheckCircle, OctagonAlert, HeartPulse, Clock, PackageCheck, Users2, Bell } from 'lucide-react'

export default async function AdminPage() {
  const admin = createAdminClient()

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
    admin.from('casos').select('*', { count: 'exact', head: true }),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'activo'),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'critico'),
    admin.from('casos').select('*', { count: 'exact', head: true }).eq('estado', 'estable'),
    admin.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    admin.from('necesidades').select('*', { count: 'exact', head: true }).eq('estado', 'entregado'),
    admin.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
    admin.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de administración</h2>
        <p className="text-gray-500 text-sm mt-1">Visión general del operativo Coro Presente</p>
      </div>

      {!!voluntariosPendientes && voluntariosPendientes > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <p className="text-orange-800 font-medium text-sm flex items-center gap-2">
            <Bell size={15} className="shrink-0" />
            {voluntariosPendientes} voluntario(s) esperando aprobación
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
          <StatCard titulo="Total registrados" valor={totalCasos ?? 0}    Icon={ClipboardList} variant="default" />
          <StatCard titulo="Activos"           valor={casosActivos ?? 0}   Icon={CheckCircle}   variant="info"    />
          <StatCard titulo="Críticos"          valor={casosCriticos ?? 0}  Icon={OctagonAlert}  variant="danger"  />
          <StatCard titulo="Estables"          valor={casosEstables ?? 0}  Icon={HeartPulse}    variant="default" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Necesidades</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard titulo="Pendientes" valor={necesidadesPendientes ?? 0} Icon={Clock}        variant="warning" />
          <StatCard titulo="Entregadas" valor={necesidadesEntregadas ?? 0} Icon={PackageCheck} variant="default" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Voluntarios</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard titulo="Activos"    valor={voluntariosAprobados ?? 0}  Icon={Users2}  variant="default" />
          <StatCard titulo="Pendientes" valor={voluntariosPendientes ?? 0} Icon={Bell}    variant="warning" />
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link
          href="/admin/voluntarios"
          className="bg-[#0891B2] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0C4A6E] transition btn-press"
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
