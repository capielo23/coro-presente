import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: voluntario } = await supabase
    .from('voluntarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!voluntario) redirect('/login')

  if (voluntario.estado === 'pendiente') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso pendiente de aprobación</h2>
          <p className="text-gray-600 text-sm">
            Un coordinador revisará tu solicitud pronto y te contactará por WhatsApp.
          </p>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="text-sm text-blue-700 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (voluntario.estado === 'rechazado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso no aprobado</h2>
          <p className="text-gray-600 text-sm">Contacta al coordinador para más información.</p>
          <form action="/api/auth/logout" method="POST" className="mt-6">
            <button type="submit" className="text-sm text-blue-700 hover:underline">
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar esAdmin={voluntario.rol === 'admin'} nombreVoluntario={voluntario.nombre_completo} />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-3 bg-white border-b text-sm text-gray-600 flex items-center justify-between">
          <span>
            Bienvenido, <span className="font-medium text-gray-900">{voluntario.nombre_completo}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${voluntario.rol === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}`}>
            {voluntario.rol === 'admin' ? '⚙️ Admin' : '👤 Voluntario'}
          </span>
        </div>
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
