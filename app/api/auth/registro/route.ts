import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  nombre_completo: z.string().min(3, 'Nombre requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  cedula: z.string().optional(),
  telefono: z.string().min(7, 'Teléfono requerido'),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { nombre_completo, email, password, cedula, telefono } = parsed.data
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 })
  }

  const { error: profileError } = await supabase.from('voluntarios').insert({
    id: authData.user.id,
    nombre_completo,
    cedula: cedula || null,
    telefono,
    rol: 'voluntario',
    estado: 'pendiente',
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Error al guardar perfil' }, { status: 500 })
  }

  return NextResponse.json(
    { message: 'Solicitud enviada. Un coordinador aprobará tu acceso pronto.' },
    { status: 201 }
  )
}
