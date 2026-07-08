import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: vol } = await admin.from('voluntarios').select('rol, estado').eq('id', user.id).single()
  if (!vol || vol.estado !== 'aprobado' || !['admin', 'coordinador'].includes(vol.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const filtro = req.nextUrl.searchParams.get('filtro') ?? 'total'

  let query = admin
    .from('casos')
    .select('id, nombre_caso, estado, sector_coro, tutor:voluntarios!casos_tutor_id_fkey(nombre_completo)')
    .order('created_at', { ascending: false })
    .limit(50)

  switch (filtro) {
    case 'criticos':
      query = query.eq('estado', 'critico')
      break
    case 'sin_tutor':
      query = query.is('tutor_id', null).neq('estado', 'cerrado')
      break
    case 'necesidades':
      // Casos que tienen al menos una necesidad pendiente
      const { data: necIds } = await admin
        .from('necesidades')
        .select('caso_id')
        .eq('estado', 'pendiente')
      const casoIds = [...new Set((necIds ?? []).map((n: any) => n.caso_id as string))]
      if (casoIds.length === 0) return NextResponse.json([])
      query = query.in('id', casoIds).neq('estado', 'cerrado')
      break
    default: // total
      query = query.neq('estado', 'cerrado')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
