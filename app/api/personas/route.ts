import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const personaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  cedula: z.string().optional(),
  edad_aprox: z.number().optional(),
  edad_meses: z.number().optional(),
  fecha_nacimiento: z.string().optional(),
  sexo: z.enum(['M', 'F', 'no_especificado']).optional(),
  rol_familia: z.string().optional(),
  condicion_especial: z.string().optional(),
  telefono: z.string().optional(),
  foto_url: z.string().optional(),
})

const CATEGORIAS = ['alimentacion','ropa','medicamentos','traslado','alojamiento','hogar','utiles','ninos','adulto_mayor','otro'] as const

// Necesidad definida desde el registro (con ítems que referencian persona por índice)
const necesidadNuevaSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  descripcion: z.string().optional(),
  es_recurrente: z.boolean().optional(),
  frecuencia: z.enum(['semanal', 'quincenal', 'mensual']).optional(),
  items: z.array(z.object({
    texto: z.string().trim().min(1).max(200),
    persona_idx: z.number().int().nullable().optional(),
  })).max(50).optional(),
})

const casoSchema = z.object({
  tipo: z.enum(['individual', 'familiar']),
  nombre_caso: z.string().min(1),
  ciudad_origen: z.string().optional(),
  estado_origen: z.string().optional(),
  zona_afectada: z.string().optional(),
  direccion_actual: z.string().optional(),
  tipo_alojamiento: z.string().optional(),
  sector_coro: z.string().optional(),
  ser_tutor: z.boolean().optional(),
  personas: z.array(personaSchema).min(1, 'Al menos un integrante requerido'),
  necesidades: z.array(necesidadNuevaSchema).max(30).optional(),
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

  const { personas, ser_tutor, necesidades: necesidadesNuevas, ...datosCaso } = parsed.data
  const admin = createAdminClient()

  // Verificar duplicados por cédula
  const cedulas = personas.map(p => p.cedula).filter(Boolean) as string[]
  if (cedulas.length > 0) {
    const { data: duplicados } = await admin
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

  // Crear el caso — si el voluntario elige ser tutor, se asigna tutor_id al crear
  const { data: caso, error: casoError } = await admin
    .from('casos')
    .insert({
      ...datosCaso,
      num_integrantes: personas.length,
      registrado_por: user.id,
      ...(ser_tutor ? { tutor_id: user.id } : {}),
    })
    .select()
    .single()

  if (casoError) return NextResponse.json({ error: 'Error al crear caso: ' + casoError.message }, { status: 500 })

  // Insertar personas (con select para obtener sus ids en orden de inserción)
  const { data: personasCreadas, error: personasError } = await admin.from('personas').insert(
    personas.map(p => ({ ...p, caso_id: caso.id }))
  ).select('id')

  if (personasError || !personasCreadas) return NextResponse.json({ error: 'Error al registrar integrantes' }, { status: 500 })

  // Crear las necesidades definidas en el registro, con ítems asignados por miembro.
  // Best-effort: si algo falla aquí, el caso + integrantes ya quedaron creados y se pueden
  // agregar necesidades luego al editar el caso (no se pierde el registro).
  if (necesidadesNuevas && necesidadesNuevas.length > 0) {
    const filas = necesidadesNuevas.map(n => {
      const items = (n.items ?? []).map(it => {
        const pidx = it.persona_idx ?? null
        const creada = pidx !== null && pidx >= 0 && pidx < personasCreadas.length ? personasCreadas[pidx] : null
        const orig = pidx !== null && pidx >= 0 && pidx < personas.length ? personas[pidx] : null
        return {
          id: crypto.randomUUID(),
          texto: it.texto,
          persona_id: creada?.id ?? null,
          persona_nombre: orig ? `${orig.nombre} ${orig.apellido ?? ''}`.trim() : null,
          entregado: false,
        }
      })
      const itemsEntrega = items.length > 0 ? { items, total: items.length, entregados: 0 } : null
      return {
        caso_id: caso.id,
        categoria: n.categoria,
        descripcion: n.descripcion ?? null,
        es_recurrente: n.es_recurrente ?? false,
        frecuencia: n.es_recurrente ? (n.frecuencia ?? null) : null,
        items_entrega: itemsEntrega,
        estado: n.es_recurrente ? 'recurrente' : 'pendiente',
        registrado_por: user.id,
      }
    })
    await admin.from('necesidades').insert(filas)
  }

  // Log en historial
  await admin.from('historial_caso').insert({
    caso_id: caso.id,
    voluntario_id: user.id,
    accion: 'caso_creado',
    detalle: {
      nombre_caso: caso.nombre_caso,
      tipo: caso.tipo,
      num_integrantes: personas.length,
      con_tutor: ser_tutor ?? false,
    },
  })

  // Un caso nuevo cambia los contadores del dashboard (cacheados 60s)
  revalidateTag('dashboard-stats')

  return NextResponse.json({ id: caso.id }, { status: 201 })
}
