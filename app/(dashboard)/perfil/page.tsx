import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PerfilForm from './PerfilForm'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: perfil, error } = await admin
    .from('voluntarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !perfil) redirect('/dashboard')

  // Generar URL firmada del avatar si existe (válida 1 hora)
  let avatarUrl: string | null = null
  if (perfil.foto_perfil_path) {
    const { data: signed } = await admin.storage
      .from('avatares')
      .createSignedUrl(perfil.foto_perfil_path, 3600)
    avatarUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi perfil</h2>
        <p className="text-gray-500 text-sm mt-1">
          Cuanto más completo esté tu perfil, mejor podremos conectarte con los casos que necesitan exactamente lo que tú ofreces.
        </p>
      </div>
      <PerfilForm perfil={perfil} avatarUrl={avatarUrl} />
    </div>
  )
}
