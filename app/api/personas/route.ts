import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const personaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  cedula: z.string().optional(),
  edad_aprox: z.number().optional(),
  sexo: z.enum(['M', 'F', 'no_especificado']).optional(),
  rol_familia: z.string().optional(),
  condicion_especial: z.string().optional(),
  telefono: z.string().optional(),
})

const casoSchema = z.object({
  tipo: z.enum(['individual', 'familiar']),
  nombre_caso: z.string().min(1),
  ciudad_origen: z.string().optional(),
  estado_origen: z.string().optional(),
  zona_afectada: z.string().optional(),
  direccion_actual: z.string().optional(),
  tipo_alojamiento: z.string().optional(),
  personas: z.array(personaSchema).min(1, 'Al menos un integrante requerido'),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = casoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { personas, ...datosCaso } = parsed.data

  // Verificar duplicados por cédula
  const cedulas = personas.map(p => p.cedula).filter(Boolean) as string[]
  if (cedulas.length > 0) {
    const { data: duplicados } = await supabase
      .from('personas')
      .select('nombre, apellido, cedula, caso_id')
      .in('cedula', cedulas)

    if (duplicados && duplicados.length > 0) {
      return NextResponse.json({
        error: 'duplicado',
        mensaje: `La cédula ${duplicados[0].cedula} ya está registrada (${duplicados[0].nombre} ${duplicados[0].apellido}). Revisar el registro existente antes de continuar.`,
        duplicados,
      }, { status: 409 })
    }
  }

  // Crear el caso
  const { data: caso, error: casoError } = await supabase
    .from('casos')
    .insert({
      ...datosCaso,
      num_integrantes: personas.length,
      registrado_por: user.id,
    })
    .select()
    .single()

  if (casoError) return NextResponse.json({ error: 'Error al crear caso: ' + casoError.message }, { status: 500 })

  // Insertar personas
  const { error: personasError } = await supabase.from('personas').insert(
    personas.map(p => ({ ...p, caso_id: caso.id }))
  )

  if (personasError) return NextResponse.json({ error: 'Error al registrar integrantes' }, { status: 500 })

  // Log en historial
  await supabase.from('historial_caso').insert({
    caso_id: caso.id,
    voluntario_id: user.id,
    accion: 'caso_creado',
    detalle: { nombre_caso: caso.nombre_caso, tipo: caso.tipo, num_integrantes: personas.length },
  })

  return NextResponse.json({ id: caso.id }, { status: 201 })
}
