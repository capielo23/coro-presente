import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function verificarAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('voluntarios')
    .select('rol, estado')
    .eq('id', user.id)
    .single()
  if (!data || data.rol !== 'admin' || data.estado !== 'aprobado') return null
  return user
}

export async function GET() {
  const supabase = createClient()
  const admin = await verificarAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data } = await supabase
    .from('voluntarios')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const admin = await verificarAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, estado, rol } = await request.json()

  const update: Record<string, string> = {}
  if (estado && ['aprobado', 'rechazado', 'pendiente'].includes(estado)) update.estado = estado
  if (rol && ['admin', 'voluntario'].includes(rol)) update.rol = rol

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('voluntarios')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  return NextResponse.json(data)
}
