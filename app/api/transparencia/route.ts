import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const revalidate = 300

export async function GET() {
  const { data, error } = await createAdminClient().rpc('reporte_transparencia')

  if (error) {
    return NextResponse.json({ error: 'Error al obtener reporte' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
