import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Solo voluntarios aprobados pueden usar esta vista
  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('estado').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Ingresa al menos 2 caracteres' }, { status: 400 })
  }

  const { data: personas, error } = await admin.rpc('buscar_personas_privado', { termino: q })

  if (error) return NextResponse.json({ error: 'Error al buscar' }, { status: 500 })

  const TIPO_ALOJ: Record<string, string> = {
    casa_familiar: 'Casa familiar', albergue: 'Albergue', iglesia: 'Iglesia / comunitario',
    hotel: 'Hotel / posada', otro: 'Otro',
  }

  const resultados = (personas || []).map((p: any) => ({
    nombre: p.nombre,
    apellido: p.apellido,
    cedula: p.cedula ? `CI: ${p.cedula}` : null,
    estadoCaso: p.estado_caso,
    sectorCoro: p.sector_coro || null,
    tipoAlojamiento: TIPO_ALOJ[p.tipo_alojamiento] || p.tipo_alojamiento || null,
    tutorNombre: p.tutor_nombre || 'Sin tutor asignado',
    casoId: p.caso_id,
    necesidadesPendientes: Number(p.necesidades_pendientes ?? 0),
  }))

  return NextResponse.json({ resultados })
}
