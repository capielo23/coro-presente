import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const camposPermitidos = ['tutor_id', 'estado', 'direccion_actual', 'tipo_alojamiento']
  const update: Record<string, unknown> = {}
  for (const campo of camposPermitidos) {
    if (campo in body) update[campo] = body[campo]
  }

  const { data, error } = await supabase
    .from('casos')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  await supabase.from('historial_caso').insert({
    caso_id: params.id,
    voluntario_id: user.id,
    accion: 'caso_actualizado',
    detalle: update,
  })

  return NextResponse.json(data)
}
