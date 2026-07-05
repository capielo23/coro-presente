import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: voluntario } = await admin.from('voluntarios').select('estado, rol').eq('id', user.id).single()
  if (!voluntario || voluntario.estado !== 'aprobado') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const esAdmin = ['admin', 'coordinador'].includes(voluntario?.rol ?? '')
  if (!esAdmin) {
    return NextResponse.json({ error: 'Solo coordinadores pueden agregar integrantes' }, { status: 403 })
  }

  const { data: caso } = await admin.from('casos').select('id').eq('id', params.id).single()
  if (!caso) return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })

  const body = await request.json()
  const { nombre, apellido, cedula, edad_aprox, sexo, rol_familia, condicion_especial, telefono } = body

  if (!nombre?.trim() || !apellido?.trim()) {
    return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })
  }

  // Verificar cédula duplicada si se proporciona
  if (cedula?.trim()) {
    const { data: dup } = await admin.from('personas').select('id, nombre, apellido').eq('cedula', cedula.trim()).maybeSingle()
    if (dup) {
      return NextResponse.json({
        error: `La cédula ${cedula} ya está registrada (${dup.nombre} ${dup.apellido}).`,
      }, { status: 409 })
    }
  }

  const { data: nueva, error } = await admin.from('personas').insert({
    caso_id: params.id,
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    cedula: cedula?.trim() || null,
    edad_aprox: edad_aprox ? Number(edad_aprox) : null,
    sexo: sexo || null,
    rol_familia: rol_familia || null,
    condicion_especial: condicion_especial?.trim() || null,
    telefono: telefono?.trim() || null,
  }).select().single()

  if (error) return NextResponse.json({ error: 'Error al agregar integrante' }, { status: 500 })

  // Actualizar num_integrantes
  const { count } = await admin
    .from('personas').select('*', { count: 'exact', head: true }).eq('caso_id', params.id)
  await admin.from('casos').update({ num_integrantes: count ?? 0 }).eq('id', params.id)

  return NextResponse.json(nueva, { status: 201 })
}
