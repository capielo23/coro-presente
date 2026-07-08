import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditarCasoForm from './EditarCasoForm'

export default async function EditarCasoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const [{ data: caso }, { data: miPerfil }] = await Promise.all([
    admin.from('casos').select('*, personas(*), necesidades(*)').eq('id', params.id).single(),
    admin.from('voluntarios').select('rol').eq('id', user.id).single(),
  ])

  if (!caso) notFound()

  const esAdmin = ['admin', 'coordinador'].includes(miPerfil?.rol ?? '')
  const esTutor = caso.tutor_id === user.id
  const esRegistrador = caso.registrado_por === user.id
  const puedeEditar = esAdmin || esTutor || esRegistrador

  if (!puedeEditar) redirect(`/casos/${params.id}`)

  // Generar URLs firmadas (1h) para fotos de personas
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'fotos-personas'
  const personasConFoto = await Promise.all(
    (caso.personas ?? []).map(async (p: any) => {
      if (!p.foto_url) return { ...p, foto_signed_url: null }
      const { data } = await admin.storage.from(bucket).createSignedUrl(p.foto_url, 3600)
      return { ...p, foto_signed_url: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Editar caso</h2>
          <p className="text-sm text-gray-400">{caso.nombre_caso}</p>
        </div>
        <Link href={`/casos/${params.id}`} className="text-sm text-gray-400 hover:text-cyan-600 flex items-center gap-1 transition">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
      </div>

      <EditarCasoForm
        caso={caso}
        personas={personasConFoto}
        necesidades={caso.necesidades ?? []}
        esAdmin={esAdmin}
      />
    </div>
  )
}
