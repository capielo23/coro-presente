import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('estado').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const edadMin = params.get('edad_min') ? parseInt(params.get('edad_min')!) : null
  const edadMax = params.get('edad_max') ? parseInt(params.get('edad_max')!) : null
  const sexo = params.get('sexo') || null
  const rolFamilia = params.get('rol_familia') || null
  const conCondicion = params.get('con_condicion') || null
  const estadoCaso = params.get('estado_caso') || null
  const limit = Math.min(parseInt(params.get('limit') ?? '100'), 200)

  const hayFiltros = edadMin !== null || edadMax !== null || sexo || rolFamilia || conCondicion || estadoCaso
  if (!hayFiltros) {
    return NextResponse.json({ total: 0, personas: [], sinFiltros: true })
  }

  let q = admin
    .from('personas')
    .select(
      'id, nombre, apellido, edad_aprox, sexo, rol_familia, condicion_especial, caso_id, casos!inner(nombre_caso, estado, tipo)',
      { count: 'exact' }
    )

  if (edadMin !== null) q = q.gte('edad_aprox', edadMin)
  if (edadMax !== null) q = q.lte('edad_aprox', edadMax)
  if (sexo) q = q.eq('sexo', sexo)
  if (rolFamilia) q = q.eq('rol_familia', rolFamilia)
  if (conCondicion === 'si') q = q.not('condicion_especial', 'is', null).neq('condicion_especial', '')
  if (conCondicion === 'no') q = q.or('condicion_especial.is.null,condicion_especial.eq.')
  if (estadoCaso) q = (q as any).eq('casos.estado', estadoCaso)

  const { data, count, error } = await q.limit(limit)
  if (error) return NextResponse.json({ error: 'Error al consultar' }, { status: 500 })

  return NextResponse.json({ total: count ?? 0, personas: data ?? [] })
}
