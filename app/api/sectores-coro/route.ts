import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Sectores conocidos de Coro como base — se complementan con los que la gente vaya registrando
const SECTORES_BASE = [
  'Centro / Casco Histórico', 'San José', 'Los Médanos', 'La Chapa',
  'Los Claritos', 'El Moralito', 'Santa Ana', 'Barrio Unión',
  'Las Calderas', 'San Antonio', 'La Milagrosa', 'El Recreo',
  'Las Eugenias', 'Bicentenario', 'La Saladilla', 'El Cardón',
  'Santa Rita', 'El Paraíso', 'La Florida', 'Los Tamarindos',
  'Sector Norte', 'Sector Sur', 'La Vega', 'El Empedrado',
  'Barrio Bolívar', 'Barrio Sucre', 'Barrio Miranda',
]

export async function GET() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('casos')
    .select('sector_coro')
    .not('sector_coro', 'is', null)

  const dbSectores = (data || [])
    .map((r: { sector_coro: string }) => r.sector_coro)
    .filter(Boolean)

  const todos = Array.from(new Set([...SECTORES_BASE, ...dbSectores])).sort((a, b) =>
    a.localeCompare(b, 'es')
  )
  return NextResponse.json(todos)
}
