import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'fotos-personas'
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

  // Validar tipo MIME y extensión — no confiar solo en file.type
  const MIME_ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const EXT_ALLOWED: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  }
  const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  const ext = EXT_ALLOWED[rawExt] ? rawExt : null
  if (!ext || !MIME_ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Solo se permiten imágenes JPG, PNG, WEBP o GIF' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'La imagen no puede superar 5 MB' }, { status: 400 })

  const path = `personas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })

  return NextResponse.json({ path })
}
