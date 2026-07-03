import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  // select('*') es resistente a drift de migración: devuelve solo columnas que existen
  const { data, error } = await admin
    .from('voluntarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: volCheck } = await admin.from('voluntarios').select('estado').eq('id', user.id).single()
  if (!volCheck || volCheck.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { nombre_completo, cedula, telefono, areas_ayuda, especialidades, zona_cobertura, disponibilidad, descripcion_ayuda, debe_cambiar_contrasena } = body

  // Limpiar marca de contraseña temporal (la página /cambiar-contrasena la envía como false)
  if (debe_cambiar_contrasena === false) {
    await admin.from('voluntarios').update({ debe_cambiar_contrasena: false }).eq('id', user.id)
    return NextResponse.json({ ok: true })
  }

  // Validar campos de identificación
  if (nombre_completo !== undefined) {
    if (typeof nombre_completo !== 'string' || nombre_completo.trim().length < 3)
      return NextResponse.json({ error: 'El nombre completo es requerido (mínimo 3 caracteres).' }, { status: 400 })
    if (nombre_completo.length > 120)
      return NextResponse.json({ error: 'Nombre demasiado largo.' }, { status: 400 })
  }

  if (cedula !== undefined && typeof cedula === 'string' && cedula.trim().length > 0) {
    if (!/^[VEJPG]-[\d.]+$/.test(cedula.trim()))
      return NextResponse.json({ error: 'Formato de cédula inválido. Debe ser tipo-número, ej: V-12.345.678.' }, { status: 400 })
  }

  if (areas_ayuda !== undefined) {
    if (!Array.isArray(areas_ayuda))
      return NextResponse.json({ error: 'areas_ayuda debe ser un arreglo.' }, { status: 400 })
    if (areas_ayuda.length > 20)
      return NextResponse.json({ error: 'Máximo 20 áreas de ayuda.' }, { status: 400 })
    if (areas_ayuda.some((a: unknown) => typeof a !== 'string' || (a as string).length > 60))
      return NextResponse.json({ error: 'Nombre de área inválido (máximo 60 caracteres).' }, { status: 400 })
  }

  if (especialidades !== undefined) {
    if (!Array.isArray(especialidades))
      return NextResponse.json({ error: 'especialidades debe ser un arreglo.' }, { status: 400 })
    if (especialidades.length > 20)
      return NextResponse.json({ error: 'Máximo 20 especialidades.' }, { status: 400 })
    if (especialidades.some((e: unknown) => typeof e !== 'string' || (e as string).length > 100))
      return NextResponse.json({ error: 'Especialidad inválida (máximo 100 caracteres cada una).' }, { status: 400 })
  }

  if (typeof zona_cobertura === 'string' && zona_cobertura.length > 200)
    return NextResponse.json({ error: 'Zona demasiado larga.' }, { status: 400 })
  if (typeof disponibilidad === 'string' && disponibilidad.length > 300)
    return NextResponse.json({ error: 'Disponibilidad demasiado larga.' }, { status: 400 })
  if (typeof descripcion_ayuda === 'string' && descripcion_ayuda.length > 1000)
    return NextResponse.json({ error: 'Descripción demasiado larga.' }, { status: 400 })

  // Columnas base: siempre existen desde la migración 001
  const baseUpdate: Record<string, unknown> = {}
  if (nombre_completo !== undefined) baseUpdate.nombre_completo = (nombre_completo as string).trim()
  if (cedula !== undefined)          baseUpdate.cedula           = (cedula as string) || null
  if (telefono !== undefined)        baseUpdate.telefono         = (telefono as string) || null

  // Columnas extendidas: existen solo si se ejecutó la migración 002
  const extUpdate: Record<string, unknown> = {}
  if (areas_ayuda !== undefined)       extUpdate.areas_ayuda       = areas_ayuda
  if (especialidades !== undefined)    extUpdate.especialidades    = especialidades
  if (zona_cobertura !== undefined)    extUpdate.zona_cobertura    = (zona_cobertura as string) || null
  if (disponibilidad !== undefined)    extUpdate.disponibilidad    = (disponibilidad as string) || null
  if (descripcion_ayuda !== undefined) extUpdate.descripcion_ayuda = (descripcion_ayuda as string) || null

  const fullUpdate = { ...baseUpdate, ...extUpdate }

  // Intento 1: actualizar todos los campos (incluyendo los de migración 002)
  const { error } = await admin.from('voluntarios').update(fullUpdate).eq('id', user.id)

  if (!error) return NextResponse.json({ ok: true })

  // Error 42703 = columna no existe en PostgreSQL (migración 002 pendiente de ejecutar)
  // Fallback: guardar al menos los datos base que siempre existen
  const esMissingColumn = error.code === '42703' || error.message?.includes('does not exist')

  if (esMissingColumn && Object.keys(baseUpdate).length > 0) {
    const { error: baseError } = await admin.from('voluntarios').update(baseUpdate).eq('id', user.id)
    if (baseError) return NextResponse.json({ error: baseError.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      aviso: 'Datos de identificación guardados. Para activar especialidades y zona de cobertura, el administrador debe ejecutar la migración 002 en Supabase.',
    })
  }

  return NextResponse.json({ error: error.message }, { status: 500 })
}
