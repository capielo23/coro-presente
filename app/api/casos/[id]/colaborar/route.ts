import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_COLABORADORES_POR_CASO = 3
const MAX_SLOTS_POR_VOLUNTARIO = 3

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: vol } = await admin.from('voluntarios').select('estado, rol, puede_aprobar_coordinadores').eq('id', user.id).single()
  if (!vol || vol.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const esGestor = ['admin', 'coordinador'].includes(vol.rol) || !!vol.puede_aprobar_coordinadores
  if (!esGestor) {
    return NextResponse.json({ error: 'Solo coordinadores pueden asignar colaboradores a un caso' }, { status: 403 })
  }

  let targetVoluntarioId = user.id
  try {
    const body = await req.json()
    if (body?.voluntario_id) targetVoluntarioId = body.voluntario_id
  } catch { /* body vacío — usa el propio usuario */ }

  // Verificar límite de colaboradores por caso (máx. 3)
  const { count: colaboradoresEnCaso } = await admin
    .from('caso_colaboradores').select('*', { count: 'exact', head: true })
    .eq('caso_id', params.id)
  if ((colaboradoresEnCaso ?? 0) >= MAX_COLABORADORES_POR_CASO) {
    return NextResponse.json(
      { error: `Este caso ya tiene el máximo de ${MAX_COLABORADORES_POR_CASO} colaboradores.` },
      { status: 409 }
    )
  }

  // Verificar capacidad del voluntario: tutorías activas + colaboraciones no deben superar 3
  const [{ count: comoTutor }, { count: comoColaborador }] = await Promise.all([
    admin.from('casos').select('*', { count: 'exact', head: true })
      .eq('tutor_id', targetVoluntarioId).neq('estado', 'cerrado'),
    admin.from('caso_colaboradores').select('*', { count: 'exact', head: true })
      .eq('voluntario_id', targetVoluntarioId),
  ])
  const totalSlots = (comoTutor ?? 0) + (comoColaborador ?? 0)
  if (totalSlots >= MAX_SLOTS_POR_VOLUNTARIO) {
    return NextResponse.json(
      { error: `Este voluntario ya tiene ${totalSlots} caso(s) asignados y no puede recibir más (límite: ${MAX_SLOTS_POR_VOLUNTARIO}).` },
      { status: 409 }
    )
  }

  const { error } = await admin.from('caso_colaboradores').insert({
    caso_id: params.id,
    voluntario_id: targetVoluntarioId,
    agregado_por: user.id,
  })

  if (error && error.code === '23505') {
    return NextResponse.json({ error: 'Este voluntario ya es colaborador de este caso' }, { status: 409 })
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
