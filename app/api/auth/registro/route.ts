import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  nombre_completo: z.string().min(3, 'Nombre requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  cedula: z.string().optional(),
  telefono: z.string().min(7, 'Teléfono requerido'),
  areas_ayuda: z.array(z.string()).optional(),
  areas_nuevas: z.array(z.object({ clave: z.string(), etiqueta: z.string() })).optional(),
  descripcion_ayuda: z.string().optional(),
  solicita_rol: z.enum(['voluntario', 'coordinador']).optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { nombre_completo, email, password, cedula, telefono, areas_ayuda, areas_nuevas, descripcion_ayuda, solicita_rol } = parsed.data
  const supabase = createAdminClient()

  // Verificar cédula duplicada ANTES de crear el usuario en Auth
  if (cedula) {
    const { data: cedulaExistente } = await supabase
      .from('voluntarios')
      .select('id')
      .eq('cedula', cedula)
      .maybeSingle()
    if (cedulaExistente) {
      return NextResponse.json({ error: 'Esta cédula ya está registrada en el sistema' }, { status: 409 })
    }
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('[registro] error al crear usuario en Auth:', authError.status, authError.message, (authError as any).code)
    const esEmailDuplicado =
      authError.status === 422 ||
      authError.message?.toLowerCase().includes('already registered') ||
      authError.message?.toLowerCase().includes('already exists') ||
      authError.message?.toLowerCase().includes('user already') ||
      (authError as any).code === 'email_exists'
    if (esEmailDuplicado) {
      return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }

  const { error: profileError } = await supabase.from('voluntarios').insert({
    id: authData.user.id,
    nombre_completo,
    cedula: cedula || null,
    telefono,
    rol: solicita_rol === 'coordinador' ? 'coordinador' : 'voluntario',
    estado: 'pendiente',
    areas_ayuda: areas_ayuda || [],
    descripcion_ayuda: descripcion_ayuda || null,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    const esCedulaDup = profileError.code === '23505' && profileError.message.includes('cedula')
    return NextResponse.json(
      { error: esCedulaDup ? 'Esta cédula ya está registrada en el sistema' : 'Error al guardar perfil' },
      { status: 409 }
    )
  }

  // Agregar áreas nuevas al catálogo para que futuros voluntarios las vean
  if (areas_nuevas && areas_nuevas.length > 0) {
    await supabase.from('areas_ayuda_catalogo').upsert(
      areas_nuevas.map(a => ({
        clave: a.clave,
        etiqueta: a.etiqueta,
        es_personalizada: true,
        usos: 1,
      })),
      { onConflict: 'clave' }
    )
  }

  const mensaje = solicita_rol === 'coordinador'
    ? 'Solicitud de coordinador enviada. El equipo revisará tu acceso y te contactará pronto.'
    : 'Solicitud enviada. Un coordinador aprobará tu acceso pronto.'

  return NextResponse.json({ message: mensaje }, { status: 201 })
}
