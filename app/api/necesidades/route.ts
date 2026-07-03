import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  caso_id: z.string().uuid(),
  categoria: z.enum(['alimentacion','ropa','medicamentos','traslado','alojamiento','hogar','utiles','ninos','adulto_mayor','otro']),
  descripcion: z.string().optional(),
  especialidad_requerida: z.string().trim().max(100).optional(),
  persona_id: z.string().uuid().optional(),
  items: z.array(z.any()).max(50).optional(),
  es_recurrente: z.boolean().default(false),
  frecuencia: z.enum(['semanal','quincenal','mensual']).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: volPost } = await admin.from('voluntarios').select('estado, rol').eq('id', user.id).single()
  if (!volPost || volPost.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (!['admin', 'coordinador'].includes(volPost.rol ?? '')) {
    return NextResponse.json({ error: 'Solo coordinadores pueden agregar necesidades' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const { especialidad_requerida, items, persona_id, ...rest } = parsed.data
  const especialidad = especialidad_requerida && especialidad_requerida.length > 0 ? especialidad_requerida : null

  // Validar que la persona asignada pertenezca a este caso (o null = toda la familia)
  let personaId: string | null = null
  if (persona_id) {
    const { data: per } = await admin.from('personas').select('id').eq('id', persona_id).eq('caso_id', parsed.data.caso_id).maybeSingle()
    personaId = per?.id ?? null
  }

  // Si se definieron artículos específicos, inicializar el checklist (con dueño por miembro)
  const itemsEntrega = await construirItemsEntrega(admin, parsed.data.caso_id, items)

  const { data, error } = await admin.from('necesidades').insert({
    ...rest,
    persona_id: personaId,
    especialidad_requerida: especialidad,
    items_entrega: itemsEntrega,
    estado: parsed.data.es_recurrente ? 'recurrente' : 'pendiente',
    registrado_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Error al registrar necesidad' }, { status: 500 })

  // Propagar la especialidad al caso (matching a nivel de caso) sin duplicar
  if (especialidad) {
    const { data: casoRow } = await admin
      .from('casos').select('habilidades_requeridas').eq('id', parsed.data.caso_id).single()
    const actuales: string[] = casoRow?.habilidades_requeridas ?? []
    if (!actuales.includes(especialidad)) {
      await admin
        .from('casos')
        .update({ habilidades_requeridas: [...actuales, especialidad] })
        .eq('id', parsed.data.caso_id)
    }
  }

  return NextResponse.json(data, { status: 201 })
}

const UUID_RE = /^[0-9a-f-]{36}$/

// Resuelve la etiqueta del deliverer: voluntario específico o "Equipo CoroAyuda"
async function resolverDeliverer(admin: ReturnType<typeof createAdminClient>, entregado_por_id: unknown) {
  if (typeof entregado_por_id === 'string' && UUID_RE.test(entregado_por_id)) {
    const { data } = await admin.from('voluntarios').select('id, nombre_completo').eq('id', entregado_por_id).single()
    if (data) return { id: data.id as string, nombre: data.nombre_completo as string }
  }
  return { id: null as string | null, nombre: 'Equipo CoroAyuda' }
}

// Normaliza la entrada de artículos (strings o { texto, persona_id, persona_nombre }) a forma uniforme
function normalizarItemsEntrada(input: unknown): { texto: string; persona_id: string | null; persona_nombre: string | null }[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, 50).map((it: any) => {
    if (typeof it === 'string') return { texto: it.trim().slice(0, 200), persona_id: null, persona_nombre: null }
    const pid = typeof it?.persona_id === 'string' && UUID_RE.test(it.persona_id) ? it.persona_id : null
    const pn = typeof it?.persona_nombre === 'string' ? (it.persona_nombre.trim().slice(0, 120) || null) : null
    return { texto: String(it?.texto ?? '').trim().slice(0, 200), persona_id: pid, persona_nombre: pn }
  }).filter(i => i.texto.length > 0)
}

// Construye items_entrega con id estable y dueño (persona) por artículo.
// El nombre real se resuelve desde `personas` del caso; si no hay id válido se usa
// la etiqueta libre (persona_nombre) recibida — útil al desglosar texto sin match exacto.
async function construirItemsEntrega(admin: ReturnType<typeof createAdminClient>, casoId: string, input: unknown) {
  const norm = normalizarItemsEntrada(input)
  if (norm.length === 0) return null
  const ids = Array.from(new Set(norm.map(i => i.persona_id).filter(Boolean))) as string[]
  const nombres = new Map<string, string>()
  if (ids.length) {
    // Solo personas que pertenezcan a este caso (evita filtrar dueños de otros casos)
    const { data } = await admin.from('personas').select('id, nombre, apellido').eq('caso_id', casoId).in('id', ids)
    ;(data ?? []).forEach((p: any) => nombres.set(p.id, `${p.nombre} ${p.apellido ?? ''}`.trim()))
  }
  const items = norm.map(i => {
    const idValido = !!i.persona_id && nombres.has(i.persona_id)
    return {
      id: crypto.randomUUID(),
      texto: i.texto,
      persona_id: idValido ? i.persona_id : null,
      persona_nombre: idValido ? nombres.get(i.persona_id!)! : (i.persona_nombre || null),
      entregado: false,
    }
  })
  return { items, total: items.length, entregados: 0 }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, accion, estado, descripcion_entrega, items, item_texto, item_id, entregado_por_id } = body

  if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  // Verificar que el voluntario está aprobado
  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('estado, rol, nombre_completo').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const esAdmin = ['admin', 'coordinador'].includes(voluntario.rol ?? '')
  const marcadoNombre = voluntario.nombre_completo ?? null
  const now = new Date().toISOString()

  // ============================================================
  // ACCIONES SOBRE EL CHECKLIST DE ARTÍCULOS Y EL LEDGER DE ENTREGAS
  // ============================================================
  if (typeof accion === 'string') {
    // Cargar la necesidad (estado actual del checklist + caso)
    const { data: nec } = await admin
      .from('necesidades').select('caso_id, items_entrega, es_recurrente').eq('id', id).single()
    if (!nec) return NextResponse.json({ error: 'Necesidad no encontrada' }, { status: 404 })

    // Verificar tutor del caso para acciones de entrega
    const { data: casoTutor } = await admin.from('casos').select('tutor_id').eq('id', nec.caso_id).single()
    const esTutor = casoTutor?.tutor_id === user.id

    type Item = { id?: string; texto: string; persona_id?: string | null; persona_nombre?: string | null; entregado: boolean; entregado_por?: string | null; entregado_por_id?: string | null; marcado_por?: string | null; fecha?: string; nota?: string | null }
    const itemsActuales: Item[] = nec.items_entrega?.items ?? []
    const notas = nec.items_entrega?.notas

    const persistirChecklist = (nuevos: Item[]) => {
      const total = nuevos.length
      const entregados = nuevos.filter(i => i.entregado).length
      const nuevoEstado = entregados === 0 ? 'pendiente' : entregados === total ? 'entregado' : 'parcial'
      const updateData: Record<string, unknown> = {
        items_entrega: { items: nuevos, total, entregados, ...(notas ? { notas } : {}) },
        estado: nuevoEstado,
      }
      if (entregados > 0) { updateData.entregado_por = user!.id; updateData.fecha_entrega = now }
      return admin.from('necesidades').update(updateData).eq('id', id).select().single()
    }

    // Inicializar el checklist desde una lista de artículos
    if (accion === 'desglosar') {
      if (!esAdmin) return NextResponse.json({ error: 'Solo coordinadores pueden modificar las necesidades' }, { status: 403 })
      if (!Array.isArray(items)) return NextResponse.json({ error: 'Faltan artículos' }, { status: 400 })
      const construido = await construirItemsEntrega(admin, nec.caso_id, items)
      const nuevos: Item[] = construido?.items ?? []
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al desglosar' }, { status: 500 })
      return NextResponse.json(data)
    }

    // Agregar uno o más artículos a un checklist existente (sin borrar lo ya cargado)
    if (accion === 'agregar_item') {
      if (!esAdmin) return NextResponse.json({ error: 'Solo coordinadores pueden modificar las necesidades' }, { status: 403 })
      if (!Array.isArray(items)) return NextResponse.json({ error: 'Faltan artículos' }, { status: 400 })
      const construido = await construirItemsEntrega(admin, nec.caso_id, items)
      const nuevos: Item[] = [...itemsActuales, ...(construido?.items ?? [])]
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al agregar artículo' }, { status: 500 })
      return NextResponse.json(data)
    }

    // Editar un artículo: corregir su texto y/o reasignar el integrante
    if (accion === 'editar_item') {
      if (!esAdmin) return NextResponse.json({ error: 'Solo coordinadores pueden modificar las necesidades' }, { status: 403 })
      const coincide = (it: Item) => (item_id ? it.id === item_id : it.texto === String(item_texto ?? ''))
      const nuevoTexto = typeof body.nuevo_texto === 'string' ? body.nuevo_texto.trim().slice(0, 200) : null
      // Resolver nuevo dueño si se envió persona_id (cadena vacía = "Toda la familia")
      let pid: string | null | undefined = undefined
      let pnombre: string | null = null
      if ('persona_id' in body) {
        pid = typeof body.persona_id === 'string' && UUID_RE.test(body.persona_id) ? body.persona_id : null
        if (pid) {
          const { data: per } = await admin.from('personas').select('nombre, apellido').eq('id', pid).eq('caso_id', nec.caso_id).single()
          if (per) pnombre = `${per.nombre} ${per.apellido ?? ''}`.trim()
          else pid = null
        }
      }
      const nuevos = itemsActuales.map(it => {
        if (!coincide(it)) return it
        const upd: Item = { ...it }
        if (nuevoTexto) upd.texto = nuevoTexto
        if (pid !== undefined) { upd.persona_id = pid; upd.persona_nombre = pnombre }
        return upd
      })
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al editar artículo' }, { status: 500 })
      return NextResponse.json(data)
    }

    // Eliminar un artículo del checklist + su registro en el ledger
    if (accion === 'eliminar_item') {
      if (!esAdmin) return NextResponse.json({ error: 'Solo coordinadores pueden modificar las necesidades' }, { status: 403 })
      const coincide = (it: Item) => (item_id ? it.id === item_id : it.texto === String(item_texto ?? ''))
      const target = itemsActuales.find(coincide)
      const nuevos = itemsActuales.filter(it => !coincide(it))
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al eliminar artículo' }, { status: 500 })
      if (target) {
        let del = admin.from('entregas').delete().eq('necesidad_id', id).eq('item_texto', target.texto)
        del = target.persona_id ? del.eq('persona_id', target.persona_id) : del.is('persona_id', null)
        await del
      }
      return NextResponse.json(data)
    }

    // Editar los datos de la necesidad (corregir categoría / descripción / etc.)
    if (accion === 'editar_necesidad') {
      if (!esAdmin) return NextResponse.json({ error: 'Solo coordinadores pueden modificar las necesidades' }, { status: 403 })
      const cats = ['alimentacion','ropa','medicamentos','traslado','alojamiento','hogar','utiles','ninos','adulto_mayor','otro']
      const update: Record<string, unknown> = {}
      if (typeof body.categoria === 'string' && cats.includes(body.categoria)) update.categoria = body.categoria
      if (typeof body.descripcion === 'string') update.descripcion = body.descripcion.slice(0, 1000)
      if ('especialidad_requerida' in body) {
        update.especialidad_requerida = typeof body.especialidad_requerida === 'string' && body.especialidad_requerida.trim()
          ? body.especialidad_requerida.trim().slice(0, 100) : null
      }
      if (typeof body.frecuencia === 'string' && ['semanal','quincenal','mensual'].includes(body.frecuencia)) update.frecuencia = body.frecuencia
      if ('persona_id' in body) {
        const pid = typeof body.persona_id === 'string' && UUID_RE.test(body.persona_id) ? body.persona_id : null
        if (pid) {
          const { data: per } = await admin.from('personas').select('id').eq('id', pid).eq('caso_id', nec.caso_id).maybeSingle()
          update.persona_id = per?.id ?? null
        } else { update.persona_id = null }
      }
      if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
      const { data, error } = await admin.from('necesidades').update(update).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: 'Error al editar necesidad' }, { status: 500 })
      return NextResponse.json(data)
    }

    // Marcar un artículo como entregado (con atribución al deliverer real)
    if (accion === 'entregar_item') {
      if (!esAdmin && !esTutor) return NextResponse.json({ error: 'Solo el tutor o coordinador puede marcar entregas' }, { status: 403 })
      const texto = String(item_texto ?? '')
      const nota = typeof body.nota === 'string' ? (body.nota.trim().slice(0, 500) || null) : null
      const coincide = (it: Item) => (item_id ? it.id === item_id : it.texto === texto)
      const target = itemsActuales.find(coincide)
      const deliverer = await resolverDeliverer(admin, entregado_por_id)
      const nuevos = itemsActuales.map(it => coincide(it)
        ? { ...it, entregado: true, entregado_por: deliverer.nombre, entregado_por_id: deliverer.id, marcado_por: marcadoNombre, fecha: now, nota }
        : it)
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al registrar entrega' }, { status: 500 })
      await admin.from('entregas').insert({
        necesidad_id: id, caso_id: nec.caso_id, item_texto: target?.texto ?? texto, descripcion: nota,
        entregado_por_id: deliverer.id, entregado_por_nombre: deliverer.nombre, marcado_por: user.id,
        persona_id: target?.persona_id ?? null, persona_nombre: target?.persona_nombre ?? null,
      })
      return NextResponse.json(data)
    }

    // Desmarcar un artículo (corrección): vuelve a pendiente y se elimina su registro del ledger
    if (accion === 'desmarcar_item') {
      if (!esAdmin && !esTutor) return NextResponse.json({ error: 'Solo el tutor o coordinador puede marcar entregas' }, { status: 403 })
      const texto = String(item_texto ?? '')
      const coincide = (it: Item) => (item_id ? it.id === item_id : it.texto === texto)
      const target = itemsActuales.find(coincide)
      const nuevos = itemsActuales.map(it => coincide(it)
        ? { ...it, entregado: false, entregado_por: null, entregado_por_id: null, marcado_por: null, fecha: undefined, nota: null }
        : it)
      const { data, error } = await persistirChecklist(nuevos)
      if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
      let del = admin.from('entregas').delete().eq('necesidad_id', id).eq('item_texto', target?.texto ?? texto)
      del = target?.persona_id ? del.eq('persona_id', target.persona_id) : del.is('persona_id', null)
      await del
      return NextResponse.json(data)
    }

    // Registrar una entrega de período (necesidades recurrentes): no cierra la necesidad
    if (accion === 'entrega_periodo') {
      if (!esAdmin && !esTutor) return NextResponse.json({ error: 'Solo el tutor o coordinador puede registrar entregas' }, { status: 403 })
      const deliverer = await resolverDeliverer(admin, entregado_por_id)
      const desc = typeof descripcion_entrega === 'string' ? descripcion_entrega.slice(0, 500) : null
      const { error } = await admin.from('entregas').insert({
        necesidad_id: id, caso_id: nec.caso_id, item_texto: null, descripcion: desc,
        entregado_por_id: deliverer.id, entregado_por_nombre: deliverer.nombre, marcado_por: user.id,
      })
      if (error) return NextResponse.json({ error: 'Error al registrar entrega' }, { status: 500 })
      // Sella la última entrega; la necesidad sigue recurrente/abierta
      const { data } = await admin.from('necesidades')
        .update({ fecha_entrega: now, entregado_por: user.id }).eq('id', id).select().single()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  }

  // ============================================================
  // MODO ESTADO SIMPLE (necesidades sin desglose de artículos)
  // ============================================================
  const estadosValidos = ['pendiente', 'en_gestion', 'entregado', 'parcial', 'recurrente']
  if (!estado || !estadosValidos.includes(estado)) {
    return NextResponse.json({ error: 'Estado no permitido' }, { status: 400 })
  }

  // Verificar tutor para el modo simple
  const { data: necSimple } = await admin.from('necesidades').select('caso_id').eq('id', id).single()
  if (!necSimple) return NextResponse.json({ error: 'Necesidad no encontrada' }, { status: 404 })
  const { data: casoSimple } = await admin.from('casos').select('tutor_id').eq('id', necSimple.caso_id).single()
  const esTutorSimple = casoSimple?.tutor_id === user.id
  if (!esAdmin && !esTutorSimple) {
    return NextResponse.json({ error: 'Solo el tutor o coordinador puede actualizar el estado' }, { status: 403 })
  }

  const updateData: Record<string, unknown> = { estado }
  if (estado === 'entregado' || estado === 'parcial') {
    updateData.entregado_por = user.id
    updateData.fecha_entrega = now
    if (descripcion_entrega && typeof descripcion_entrega === 'string') {
      updateData.descripcion_entrega = descripcion_entrega.slice(0, 500)
    }
  }

  const { data, error } = await admin
    .from('necesidades').update(updateData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  // Registrar la entrega en el ledger (deliverer real vs marcador)
  if (estado === 'entregado' || estado === 'parcial') {
    const { data: nec } = await admin.from('necesidades').select('caso_id').eq('id', id).single()
    if (nec) {
      const deliverer = await resolverDeliverer(admin, entregado_por_id)
      await admin.from('entregas').insert({
        necesidad_id: id, caso_id: nec.caso_id, item_texto: null,
        descripcion: typeof descripcion_entrega === 'string' ? descripcion_entrega.slice(0, 500) : null,
        entregado_por_id: deliverer.id, entregado_por_nombre: deliverer.nombre, marcado_por: user.id,
      })
    }
  }

  return NextResponse.json(data)
}

// Eliminar una necesidad completa (corrección de errores de registro).
// Las entregas asociadas se borran por ON DELETE CASCADE.
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json().catch(() => ({}))
  if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: voluntario } = await admin
    .from('voluntarios').select('estado, rol').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (!['admin', 'coordinador'].includes(voluntario.rol ?? '')) {
    return NextResponse.json({ error: 'Solo coordinadores pueden eliminar necesidades' }, { status: 403 })
  }

  const { error } = await admin.from('necesidades').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error al eliminar la necesidad' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
