import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const admin = createAdminClient()

  // Verificar rol del voluntario
  const { data: voluntario } = await admin
    .from('voluntarios').select('rol').eq('id', user.id).single()
  const esAdmin = ['admin', 'coordinador'].includes(voluntario?.rol ?? '')

  // Cargar el caso para verificar tutor
  const { data: casoActual } = await admin
    .from('casos').select('tutor_id, estado').eq('id', params.id).single()
  const esTutor = casoActual?.tutor_id === user.id

  // Solo tutor o admin pueden cerrar el caso o cambiar estado
  if ('estado' in body && body.estado === 'cerrado' && !esTutor && !esAdmin) {
    return NextResponse.json(
      { error: 'Solo el tutor o coordinador puede cerrar un caso' },
      { status: 403 }
    )
  }

  // Liberar tutoría: poner tutor_id en null cuando el tutor lo solicita
  if (body.liberar_tutor === true) {
    if (!esTutor && !esAdmin) {
      return NextResponse.json({ error: 'No tienes permiso para liberar este caso' }, { status: 403 })
    }
    const { data, error } = await admin
      .from('casos').update({ tutor_id: null }).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: 'Error al liberar caso' }, { status: 500 })
    await admin.from('historial_caso').insert({
      caso_id: params.id, voluntario_id: user.id,
      accion: 'tutor_liberado', detalle: {},
    })
    return NextResponse.json(data)
  }

  // Tomar tutoría: asignar tutor_id al usuario actual si el caso no tiene tutor
  if (body.tomar_tutoria === true) {
    if (casoActual?.tutor_id) {
      return NextResponse.json({ error: 'Este caso ya tiene tutor asignado' }, { status: 409 })
    }
    // Límite: máximo 3 casos activos como tutor
    const { count: yaComoTutor } = await admin
      .from('casos').select('*', { count: 'exact', head: true })
      .eq('tutor_id', user.id).neq('estado', 'cerrado')
    if ((yaComoTutor ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Has alcanzado el límite de 3 casos activos como tutor. Libera uno antes de tomar otro.' },
        { status: 409 }
      )
    }
    const { data, error } = await admin
      .from('casos').update({ tutor_id: user.id }).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: 'Error al tomar tutoría' }, { status: 500 })
    await admin.from('historial_caso').insert({
      caso_id: params.id, voluntario_id: user.id,
      accion: 'tutor_asignado', detalle: {},
    })
    return NextResponse.json(data)
  }

  // Coordinador puede asignar directamente un tutor a cualquier caso
  if ('asignar_tutor_id' in body && esAdmin) {
    const nuevoTutorId = (body.asignar_tutor_id as string) || null
    const updateData: Record<string, unknown> = { tutor_id: nuevoTutorId }
    if ('estado' in body) updateData.estado = body.estado
    const { data, error } = await admin
      .from('casos').update(updateData).eq('id', params.id).select().single()
    if (error) return NextResponse.json({ error: 'Error al asignar tutor' }, { status: 500 })
    await admin.from('historial_caso').insert({
      caso_id: params.id, voluntario_id: user.id,
      accion: 'tutor_asignado_coordinador',
      detalle: { tutor_id: nuevoTutorId },
    })
    return NextResponse.json(data)
  }

  // Solo tutor o admin pueden actualizar campos generales del caso
  if (!esTutor && !esAdmin) {
    return NextResponse.json(
      { error: 'Solo el tutor o coordinador puede editar los datos del caso' },
      { status: 403 }
    )
  }

  // Actualización de campos generales
  // tutor_id excluido: solo se puede cambiar via tomar_tutoria/liberar_tutor
  const camposPermitidos = [
    'nombre_caso', 'estado', 'tipo',
    'direccion_actual', 'tipo_alojamiento', 'sector_coro',
    'ciudad_origen', 'estado_origen', 'zona_afectada',
  ]
  const update: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in body) update[campo] = body[campo]
  }

  const { data, error } = await admin
    .from('casos')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  if ('estado' in update) revalidateTag('dashboard-stats')

  await admin.from('historial_caso').insert({
    caso_id: params.id,
    voluntario_id: user.id,
    accion: 'caso_actualizado',
    detalle: update,
  })

  return NextResponse.json(data)
}

// Eliminar un caso completo (caso de prueba o que ya no requiere seguimiento).
// Borra en cascada integrantes, necesidades, entregas, seguimientos e historial.
// Solo coordinadores/admin pueden eliminarlo.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('rol, estado').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const esAdmin = ['admin', 'coordinador'].includes(voluntario.rol ?? '')

  if (!esAdmin) {
    return NextResponse.json({ error: 'Solo coordinadores pueden eliminar casos' }, { status: 403 })
  }

  const { data: caso } = await admin
    .from('casos').select('id').eq('id', params.id).single()
  if (!caso) return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })

  const { error } = await admin.from('casos').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar el caso' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

