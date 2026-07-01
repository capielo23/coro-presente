import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Rate limiting en memoria — para producción usar Upstash Redis
const limitMap = new Map<string, { count: number; resetTime: number }>()
const LIMITE = 30
const VENTANA_MS = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const ahora = Date.now()
  const entrada = limitMap.get(ip)
  if (!entrada || ahora > entrada.resetTime) {
    limitMap.set(ip, { count: 1, resetTime: ahora + VENTANA_MS })
    return true
  }
  if (entrada.count >= LIMITE) return false
  entrada.count++
  return true
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas búsquedas. Espera un momento e intenta de nuevo.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Ingresa al menos 2 caracteres para buscar.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Búsqueda sin distinción de acentos, mayúsculas o tildes via función PostgreSQL
  const { data: personas, error } = await supabase
    .rpc('buscar_personas_publico', { termino: q })

  if (error) {
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 })
  }

  if (!personas || personas.length === 0) {
    return NextResponse.json({ resultados: [] })
  }

  // Solo exponer datos públicos — sin teléfono, dirección exacta, cédula, condición médica
  const resultados = personas.map((p: any) => ({
    nombre: p.nombre,
    apellido: p.apellido,
    estadoCaso: p.estado_caso,
    ciudadAtencion: 'Coro, Estado Falcón',
    tutorContacto: p.tutor_nombre || 'Coordinación Coro Presente',
  }))

  return NextResponse.json({ resultados })
}
