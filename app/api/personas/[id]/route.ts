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

  // Verificar que el usuario tiene permiso sobre ese caso
  const [{ data: caso }, { data: voluntario }] = await Promise.all([
    admin.from('casos').select('tutor_id, registrado_por').eq('id', persona.caso_id).single(),
    admin.from('voluntarios').select('rol').eq('id', user.id).single(),
  ])

  const esAdmin = ['admin', 'coordinador'].includes(voluntario?.rol ?? '')
  const esTutor = caso?.tutor_id === user.id
  const esRegistrador = caso?.registrado_por === user.id

  if (!esAdmin && !esTutor && !esRegistrador) {
    return NextResponse.json({ error: 'No tienes permiso para editar este integrante' }, { status: 403 })
  }

  const body = await request.json()

  const camposPermitidos = [
    'nombre', 'apellido', 'cedula', 'edad_aprox',
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
