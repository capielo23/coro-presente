import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Áreas base del sistema — se usan como fallback si la tabla aún no existe
const AREAS_BASE = [
  { clave: 'traslado', etiqueta: 'Traslado y logística (tengo vehículo)', es_personalizada: false },
  { clave: 'medico', etiqueta: 'Atención médica (médico, enfermero, farmacéutico)', es_personalizada: false },
  { clave: 'psicologia', etiqueta: 'Apoyo psicológico / emocional', es_personalizada: false },
  { clave: 'legal', etiqueta: 'Asesoría legal y recuperación de documentos', es_personalizada: false },
  { clave: 'alimentos', etiqueta: 'Alimentos (cocina, donación de comida, restaurante)', es_personalizada: false },
  { clave: 'alojamiento', etiqueta: 'Alojamiento temporal (tengo espacio disponible)', es_personalizada: false },
  { clave: 'donacion', etiqueta: 'Donaciones e insumos (tengo o consigo bienes)', es_personalizada: false },
  { clave: 'construccion', etiqueta: 'Construcción y reparación', es_personalizada: false },
  { clave: 'cuidado_ninos', etiqueta: 'Cuidado de niños / educación', es_personalizada: false },
  { clave: 'comunicacion', etiqueta: 'Visitas y seguimiento presencial (trabajo de campo)', es_personalizada: false },
  { clave: 'registro', etiqueta: 'Registro y coordinación de casos', es_personalizada: false },
]

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('areas_ayuda_catalogo')
    .select('clave, etiqueta, es_personalizada, usos')
    .order('usos', { ascending: false })

  if (error) {
    // La tabla aún no existe — devolver las áreas base
    return NextResponse.json({ areas: AREAS_BASE })
  }

  // Combinar: si la tabla está vacía, usar las base
  const areas = data && data.length > 0 ? data : AREAS_BASE
  return NextResponse.json({ areas })
}
