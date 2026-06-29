import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  caso_id: z.string().uuid(),
  categoria: z.enum(['alimentacion','ropa','medicamentos','traslado','alojamiento','hogar','utiles','ninos','adulto_mayor','otro']),
  descripcion: z.string().optional(),
  es_recurrente: z.boolean().default(false),
  frecuencia: z.enum(['semanal','quincenal','mensual']).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { data, error } = await supabase.from('necesidades').insert({
    ...parsed.data,
    estado: parsed.data.es_recurrente ? 'recurrente' : 'pendiente',
    registrado_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Error al registrar necesidad' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, estado, descripcion_entrega } = await request.json()

  const updateData: Record<string, unknown> = { estado }
  if (estado === 'entregado') {
    updateData.entregado_por = user.id
    updateData.fecha_entrega = new Date().toISOString()
    if (descripcion_entrega) updateData.descripcion_entrega = descripcion_entrega
  }

  const { data, error } = await supabase
    .from('necesidades')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json(data)
}
