import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: vol } = await admin.from('voluntarios').select('estado, rol, puede_aprobar_coordinadores').eq('id', user.id).single()
  if (!vol || vol.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Coordinadores/admins pueden agregar a otro voluntario pasando voluntario_id en el body
  let targetVoluntarioId = user.id
  const esGestor = ['admin', 'coordinador'].includes(vol.rol) || !!vol.puede_aprobar_coordinadores
  if (esGestor) {
    try {
      const body = await req.json()
      if (body?.voluntario_id && body.voluntario_id !== user.id) {
        targetVoluntarioId = body.voluntario_id
      }
    } catch { /* body vacío — usa el propio usuario */ }
  }

  const { error } = await admin.from('caso_colaboradores').insert({
    caso_id: params.id,
    voluntario_id: targetVoluntarioId,
    agregado_por: user.id,
  })

  if (error && error.code === '23505') {
    return NextResponse.json({ error: 'Ya eres colaborador de este caso' }, { status: 409 })
  }
  if (error) return NextResponse.json({ error: 'Error al unirse' }, { status: 500 })

  await admin.from('historial_caso').insert({
    caso_id: params.id, voluntario_id: user.id,
    accion: 'colaborador_unido', detalle: {},
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: vol } = await admin.from('voluntarios').select('rol, puede_aprobar_coordinadores').eq('id', user.id).single()

  let targetVoluntarioId = user.id
  const esGestor = ['admin', 'coordinador'].includes(vol?.rol ?? '') || !!vol?.puede_aprobar_coordinadores
  if (esGestor) {
    try {
      const body = await req.json()
      if (body?.voluntario_id) targetVoluntarioId = body.voluntario_id
    } catch { /* body vacío */ }
  }

  const { error } = await admin
    .from('caso_colaboradores')
    .delete()
    .eq('caso_id', params.id)
    .eq('voluntario_id', targetVoluntarioId)

  if (error) return NextResponse.json({ error: 'Error al salir' }, { status: 500 })

  await admin.from('historial_caso').insert({
    caso_id: params.id, voluntario_id: user.id,
    accion: 'colaborador_salio', detalle: {},
  })

  return NextResponse.json({ ok: true })
}
