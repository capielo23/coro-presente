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

  // Solo coordinadores/admins pueden asignar colaboradores
  const esGestor = ['admin', 'coordinador'].includes(vol.rol) || !!vol.puede_aprobar_coordinadores
  if (!esGestor) {
    return NextResponse.json({ error: 'Solo coordinadores pueden asignar colaboradores a un caso' }, { status: 403 })
  }

  let targetVoluntarioId = user.id
  try {
    const body = await req.json()
    if (body?.voluntario_id) targetVoluntarioId = body.voluntario_id
  } catch { /* body vacío — usa el propio usuario */ }

  // Límite: máximo 5 casos activos como colaborador
  const { count: yaComoColaborador } = await admin
    .from('caso_colaboradores').select('*', { count: 'exact', head: true })
    .eq('voluntario_id', targetVoluntarioId)
  if ((yaComoColaborador ?? 0) >= 5) {
    return NextResponse.json(
      { error: 'Este voluntario ha alcanzado el límite de 5 casos como colaborador.' },
      { status: 409 }
    )
  }

  const { error } = await admin.from('caso_colaboradores').insert({
    caso_id: params.id,
    voluntario_id: targetVoluntarioId,
    agregado_por: user.id,
  })

  if (error && error.code === '23505') {
    return NextResponse.json({ error: 'Ya eres colaborador de este caso' }, { status: 409 })
  }
  if (error) {
    console.error('[colaborar POST] Supabase error:', error.code, error.message)
    return NextResponse.json({ error: error.message ?? 'Error al unirse' }, { status: 500 })
  }

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
  const { data: vol } = await admin.from('voluntarios').select('rol, estado, puede_aprobar_coordinadores').eq('id', user.id).single()
  if (!vol || vol.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const esGestor = ['admin', 'coordinador'].includes(vol?.rol ?? '') || !!vol?.puede_aprobar_coordinadores
  if (!esGestor) {
    return NextResponse.json({ error: 'Solo coordinadores pueden quitar colaboradores de un caso' }, { status: 403 })
  }

  let targetVoluntarioId = user.id
  try {
    const body = await req.json()
    if (body?.voluntario_id) targetVoluntarioId = body.voluntario_id
  } catch { /* body vacío */ }

  const { error } = await admin
    .from('caso_colaboradores')
    .delete()
    .eq('caso_id', params.id)
    .eq('voluntario_id', targetVoluntarioId)

  if (error) {
    console.error('[colaborar DELETE] Supabase error:', error.code, error.message)
    return NextResponse.json({ error: error.message ?? 'Error al quitar colaborador' }, { status: 500 })
  }

  await admin.from('historial_caso').insert({
    caso_id: params.id, voluntario_id: user.id,
    accion: 'colaborador_salio', detalle: {},
  })

  return NextResponse.json({ ok: true })
}
