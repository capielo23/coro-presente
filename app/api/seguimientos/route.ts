import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  caso_id: z.string().uuid(),
  tipo_contacto: z.enum(['visita', 'llamada', 'whatsapp', 'entrega', 'gestion']),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria').max(2000),
  proximos_pasos: z.string().trim().max(2000).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Solo voluntarios aprobados pueden registrar seguimiento
  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('estado').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('seguimientos')
    .insert({ ...parsed.data, voluntario_id: user.id })
    .select('*, voluntario:voluntarios(nombre_completo)')
    .single()

  if (error) return NextResponse.json({ error: 'Error al registrar el seguimiento' }, { status: 500 })

  // Registrar también en el historial del caso para trazabilidad
  await admin.from('historial_caso').insert({
    caso_id: parsed.data.caso_id,
    voluntario_id: user.id,
    accion: 'seguimiento_registrado',
    detalle: { tipo_contacto: parsed.data.tipo_contacto },
  })

  return NextResponse.json(data, { status: 201 })
}
