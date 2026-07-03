import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'avatares'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const SIGNED_URL_TTL = 3600  // 1 hora

async function garantizarBucket(admin: ReturnType<typeof createAdminClient>) {
  // Crea el bucket si no existe — crea primero, ignora el error si ya existe
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ALLOWED_TYPES,
  })
  // "already exists" no es error real
  if (error && !error.message.toLowerCase().includes('already exist')) {
    console.error('[avatar] Error al crear bucket:', error)
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: volCheck } = await admin.from('voluntarios').select('estado').eq('id', user.id).single()
  if (!volCheck || volCheck.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (e) {
    console.error('[avatar] Error al parsear formData:', e)
    return NextResponse.json({ error: 'Formato de solicitud inválido' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0)
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: `Tipo de archivo no permitido: "${file.type}". Solo JPEG, PNG o WebP.` }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 })

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `${user.id}.${ext}`

  let buffer: ArrayBuffer
  try {
    buffer = await file.arrayBuffer()
  } catch (e) {
    console.error('[avatar] Error al leer el archivo:', e)
    return NextResponse.json({ error: 'No se pudo leer el archivo' }, { status: 500 })
  }

  // Garantizar que el bucket exista antes de subir
  await garantizarBucket(admin)

  // Eliminar versiones anteriores con distinta extensión (ignorar error si no existen)
  const otrasExt = ['jpg', 'png', 'webp'].filter(e => e !== ext)
  await admin.storage.from(BUCKET).remove(otrasExt.map(e => `${user.id}.${e}`))

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[avatar] Error al subir a Storage:', uploadError)
    return NextResponse.json(
      { error: `Error al subir la imagen: ${uploadError.message}` },
      { status: 500 }
    )
  }

  // Guardar path en la base de datos
  const { error: dbError } = await admin
    .from('voluntarios')
    .update({ foto_perfil_path: storagePath })
    .eq('id', user.id)

  if (dbError) {
    console.error('[avatar] Error al guardar en DB:', dbError)
    // Si la columna no existe todavía (migración 007 pendiente), aún devolvemos la URL
    // para que la imagen sea visible en la sesión actual, aunque no persista
    if (dbError.code === '42703' || dbError.message.includes('does not exist')) {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL)
      return NextResponse.json({
        ok: true,
        url: signed?.signedUrl ?? null,
        aviso: 'La foto se subió pero no se guardó en el perfil. Ejecuta la migración 007 en Supabase para que persista.',
      })
    }
    return NextResponse.json(
      { error: `Error al guardar la referencia: ${dbError.message}` },
      { status: 500 }
    )
  }

  // Generar URL firmada
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL)

  if (signError) {
    console.error('[avatar] Error al generar URL firmada:', signError)
  }

  return NextResponse.json({ ok: true, url: signed?.signedUrl ?? null })
}

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: volCheck } = await admin.from('voluntarios').select('estado').eq('id', user.id).single()
  if (!volCheck || volCheck.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: voluntario } = await admin
    .from('voluntarios')
    .select('foto_perfil_path')
    .eq('id', user.id)
    .single()

  if (voluntario?.foto_perfil_path) {
    const { error } = await admin.storage.from(BUCKET).remove([voluntario.foto_perfil_path])
    if (error) console.error('[avatar] Error al eliminar de Storage:', error)
  }

  const { error: dbError } = await admin
    .from('voluntarios')
    .update({ foto_perfil_path: null })
    .eq('id', user.id)

  if (dbError) {
    console.error('[avatar] Error al limpiar DB:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
