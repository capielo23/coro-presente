import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  // Verificar que el voluntario está aprobado
  const { data: vol } = await admin.from('voluntarios').select('estado').eq('id', user.id).single()
  if (!vol || vol.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Insertar colaborador (la constraint UNIQUE evita duplicados)
  const { error } = await admin.from('caso_colaboradores').insert({
    caso_id: params.id,
    voluntario_id: user.id,
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('caso_colaboradores')
    .delete()
    .eq('caso_id', params.id)
    .eq('voluntario_id', user.id)

  if (error) return NextResponse.json({ error: 'Error al salir' }, { status: 500 })

  await admin.from('historial_caso').insert({
    caso_id: params.id, voluntario_id: user.id,
    accion: 'colaborador_salio', detalle: {},
  })

  return NextResponse.json({ ok: true })
}
