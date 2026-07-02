import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'
import DashboardShell from '@/components/layout/DashboardShell'
import { AlertTriangle, Clock, XCircle } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!voluntario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Perfil de voluntario no encontrado</h2>
          <p className="text-gray-600 text-sm mb-1">
            Tu cuenta existe pero no tiene un perfil de voluntario asociado.
          </p>
          <p className="text-gray-500 text-xs">
            Contacta al coordinador para que active tu acceso. <br />
            Cuenta: <span className="font-mono">{user.email}</span>
          </p>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="text-sm text-cyan-600 hover:underline">Cerrar sesión</button>
          </form>
        </div>
      </div>
    )
  }

  if (voluntario.estado === 'pendiente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-cyan-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso pendiente de aprobación</h2>
          <p className="text-gray-600 text-sm">
            Un coordinador revisará tu solicitud pronto y te contactará por WhatsApp.
          </p>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="text-sm text-cyan-600 hover:underline">Cerrar sesión</button>
          </form>
        </div>
      </div>
    )
  }

  if (voluntario.estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso no aprobado</h2>
          <p className="text-gray-600 text-sm">Contacta al coordinador para más información.</p>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="text-sm text-cyan-600 hover:underline">Cerrar sesión</button>
          </form>
        </div>
      </div>
    )
  }

  const puedeGestionar =
    ['admin', 'coordinador'].includes(voluntario.rol) || !!voluntario.puede_aprobar_coordinadores

  let pendientesCount = 0
  if (puedeGestionar) {
    // Cacheado 30s — el badge no necesita ser instantáneo
    const getPendientes = unstable_cache(
      async () => {
        const { count } = await admin.from('voluntarios').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente')
        return count ?? 0
      },
      ['pendientes-count'],
      { revalidate: 30, tags: ['pendientes-count'] }
    )
    pendientesCount = await getPendientes()
  }

  const perfilCompletitud = [
    (voluntario.especialidades?.length ?? 0) > 0,
    !!voluntario.zona_cobertura,
    !!voluntario.disponibilidad,
    !!voluntario.descripcion_ayuda,
  ].filter(Boolean).length * 25

  return (
    <DashboardShell
      voluntario={{ nombre_completo: voluntario.nombre_completo, rol: voluntario.rol, puedeGestionar }}
      pendientesCount={pendientesCount}
      perfilCompletitud={perfilCompletitud}
    >
      {children}
    </DashboardShell>
  )
}
