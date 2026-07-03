// Gestión de voluntarios — jerarquía y permisos especiales
import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PerfilGestor {
  userId: string
  rol: 'admin' | 'coordinador'
  puedeAprobarCoordinadores: boolean
}

// Verifica que el usuario sea admin o coordinador aprobado y devuelve su perfil completo.
async function verificarGestor(): Promise<PerfilGestor | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await createAdminClient()
    .from('voluntarios')
    .select('rol, estado, puede_aprobar_coordinadores')
    .eq('id', user.id)
    .single()

  if (!data || !['admin', 'coordinador'].includes(data.rol) || data.estado !== 'aprobado') return null

  return {
    userId: user.id,
    rol: data.rol as 'admin' | 'coordinador',
    puedeAprobarCoordinadores: data.rol === 'admin' || !!data.puede_aprobar_coordinadores,
  }
}

// GET — devuelve la lista de voluntarios + el perfil del usuario actual
export async function GET() {
  const gestor = await verificarGestor()
  if (!gestor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = createAdminClient()

  const [{ data: voluntarios }, { data: authData }] = await Promise.all([
    admin.from('voluntarios').select('*').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Inyectar email desde auth.users (fuente de verdad para credenciales)
  const emailMap = new Map(authData?.users.map(u => [u.id, u.email]) ?? [])
  const lista = (voluntarios ?? []).map(v => ({
    ...v,
    email: emailMap.get(v.id) ?? null,
  }))

  return NextResponse.json({
    lista,
    yo: {
      id: gestor.userId,
      rol: gestor.rol,
      puedeAprobarCoordinadores: gestor.puedeAprobarCoordinadores,
    },
  })
}

// PATCH — aprobación/rechazo con jerarquía, o cambio de permiso especial
export async function PATCH(request: NextRequest) {
  const gestor = await verificarGestor()
  if (!gestor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { id } = body

  // Acción: otorgar/revocar permiso especial (solo admin)
  if ('puede_aprobar_coordinadores' in body) {
    if (gestor.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede otorgar permisos especiales' }, { status: 403 })
    }
    // Solo aplica a coordinadores
    const { data: objetivo } = await createAdminClient()
      .from('voluntarios').select('rol').eq('id', id).single()
    if (!objetivo || objetivo.rol !== 'coordinador') {
      return NextResponse.json({ error: 'El permiso especial solo aplica a coordinadores' }, { status: 400 })
    }
    const { data, error } = await createAdminClient()
      .from('voluntarios')
      .update({ puede_aprobar_coordinadores: !!body.puede_aprobar_coordinadores })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: 'Error al actualizar permiso' }, { status: 500 })
    return NextResponse.json(data)
  }

  // Acción: cambiar estado y/o rol
  const { estado, rol } = body

  // Validar estado de quien se está aprobando/rechazando
  const { data: objetivo } = await createAdminClient()
    .from('voluntarios').select('rol, estado').eq('id', id).single()
  if (!objetivo) return NextResponse.json({ error: 'Voluntario no encontrado' }, { status: 404 })

  // Regla: para aprobar o cambiar a coordinador se necesita ser admin o tener permiso especial
  const estaAprobandoCoordinador =
    (rol === 'coordinador') ||
    (objetivo.rol === 'coordinador' && estado === 'aprobado')

  if (estaAprobandoCoordinador && !gestor.puedeAprobarCoordinadores) {
    return NextResponse.json(
      { error: 'Solo el administrador (o coordinadores con permiso especial) pueden aprobar coordinadores' },
      { status: 403 }
    )
  }

  const update: Record<string, string> = {}
  if (estado && ['aprobado', 'rechazado', 'pendiente'].includes(estado)) update.estado = estado
  if (rol && ['admin', 'coordinador', 'voluntario'].includes(rol)) update.rol = rol

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await createAdminClient()
    .from('voluntarios')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  if (estado) revalidateTag('pendientes-count')
  return NextResponse.json(data)
}

// POST — coordinador registra voluntario directamente (estado aprobado, sin flujo de solicitud)
const registroSchema = z.object({
  nombre_completo:   z.string().min(3, 'Nombre demasiado corto'),
  cedula:            z.string().optional(),
  telefono:          z.string().min(7, 'Teléfono inválido'),
  email:             z.string().email('Correo inválido'),
  areas_ayuda:       z.array(z.string()).optional().default([]),
  descripcion_ayuda: z.string().optional(),
})

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function generarClaveTemporal(len = 10) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

// PUT — restablecer contraseña de un voluntario (solo admin o coordinador con permiso especial)
export async function PUT(request: NextRequest) {
  const gestor = await verificarGestor()
  if (!gestor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (!gestor.puedeAprobarCoordinadores) {
    return NextResponse.json({ error: 'Solo el administrador o coordinadores con permiso especial pueden restablecer contraseñas' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const admin = createAdminClient()

  const { data: voluntario } = await admin.from('voluntarios').select('nombre_completo, estado').eq('id', id).single()
  if (!voluntario) return NextResponse.json({ error: 'Voluntario no encontrado' }, { status: 404 })
  if (voluntario.estado !== 'aprobado') return NextResponse.json({ error: 'El voluntario no está aprobado' }, { status: 400 })

  const tempPassword = generarClaveTemporal()
  // Guardar flag en user_metadata para que el middleware lo lea sin RLS
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: tempPassword,
    user_metadata: { debe_cambiar_contrasena: true },
  })

  if (error) return NextResponse.json({ error: 'No se pudo restablecer la contraseña' }, { status: 500 })

  // También marcar en la tabla como respaldo
  await admin.from('voluntarios').update({ debe_cambiar_contrasena: true }).eq('id', id)

  return NextResponse.json({ ok: true, tempPassword, nombre: voluntario.nombre_completo })
}

export async function POST(request: NextRequest) {
  const gestor = await verificarGestor()
  if (!gestor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const parsed = registroSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { nombre_completo, cedula, telefono, email, areas_ayuda, descripcion_ayuda } = parsed.data

  const tempPassword = Array.from(
    { length: 10 },
    () => CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    const existe = authError.message.toLowerCase().includes('already registered')
    return NextResponse.json(
      { error: existe ? 'Este correo ya está registrado' : 'Error al crear cuenta' },
      { status: existe ? 409 : 500 }
    )
  }

  const { error: profileError } = await admin.from('voluntarios').insert({
    id: authData.user.id,
    nombre_completo,
    cedula: cedula || null,
    telefono,
    rol: 'voluntario',
    estado: 'aprobado',
    areas_ayuda: areas_ayuda ?? [],
    descripcion_ayuda: descripcion_ayuda || null,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    const cedDup = profileError.code === '23505' && profileError.message.includes('cedula')
    return NextResponse.json(
      { error: cedDup ? 'Esa cédula ya está registrada' : 'Error al guardar perfil' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, email, tempPassword, nombre_completo }, { status: 201 })
}
