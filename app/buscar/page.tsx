import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import BuscadorPage from './BuscadorPage'

export default async function BuscarPageWrapper() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let voluntario: { nombre_completo: string; rol: string } | null = null

  if (user) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('voluntarios')
      .select('nombre_completo, rol')
      .eq('id', user.id)
      .eq('estado', 'aprobado')
      .single()
    voluntario = data
  }

  return <BuscadorPage voluntario={voluntario} />
}
