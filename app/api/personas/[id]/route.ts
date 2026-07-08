import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  // Obtener la persona para verificar a qué caso pertenece
  const { data: persona } = await admin
    .from('personas').select('caso_id').eq('id', params.id).single()
  if (!persona) return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 })

  // Solo coordinadores/admin pueden editar datos de integrantes
  const { data: voluntario } = await admin.from('voluntarios').select('estado, rol').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const esAdmin = ['admin', 'coordinador'].includes(voluntario?.rol ?? '')
  if (!esAdmin) {
    return NextResponse.json({ error: 'Solo coordinadores pueden editar los datos de los integrantes' }, { status: 403 })
  }

  const body = await request.json()

  const camposPermitidos = [
    'nombre', 'apellido', 'cedula', 'edad_aprox', 'edad_meses',
    'fecha_nacimiento', 'foto_url',
    'sexo', 'rol_familia', 'condicion_especial', 'telefono',
  ]
  const update: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in body) {
      // Convertir strings vacíos a null para campos opcionales
      const val = body[campo]
      update[campo] = (val === '' && campo !== 'nombre' && campo !== 'apellido') ? null : val
    }
  }

  if ('edad_aprox' in update && update.edad_aprox !== null) {
    update.edad_aprox = Number(update.edad_aprox) || null
  }

  const { data, error } = await admin
    .from('personas').update(update).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: 'Error al actualizar integrante' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: persona } = await admin
    .from('personas').select('caso_id').eq('id', params.id).single()
  if (!persona) return NextResponse.json({ error: 'Persona no encontrada' }, { status: 404 })

  const { data: voluntario } = await admin.from('voluntarios').select('estado, rol').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const esAdmin = ['admin', 'coordinador'].includes(voluntario?.rol ?? '')
  if (!esAdmin) {
    return NextResponse.json({ error: 'Solo coordinadores pueden eliminar integrantes' }, { status: 403 })
  }

  const { error } = await admin.from('personas').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Error al eliminar integrante' }, { status: 500 })

  // Actualizar num_integrantes en el caso
  const { count } = await admin
    .from('personas').select('*', { count: 'exact', head: true }).eq('caso_id', persona.caso_id)
  await admin.from('casos').update({ num_integrantes: count ?? 0 }).eq('id', persona.caso_id)

  return NextResponse.json({ ok: true })
}
