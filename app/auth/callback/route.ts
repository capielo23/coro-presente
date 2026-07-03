import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'magiclink' | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null

  const cookieStore = cookies()

  // Flujo OTP/token_hash
  if (token_hash && type) {
    const dest = type === 'recovery' ? '/cambiar-contrasena' : (next ?? '/dashboard')
    const response = NextResponse.redirect(new URL(dest, request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return response
  }

  // Flujo PKCE (code exchange)
  if (code) {
    // Crear response provisional — destino lo determinamos después del exchange
    let dest = next ?? '/dashboard'
    const response = NextResponse.redirect(new URL(dest, request.url))

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          // Las cookies van directo al response, no al cookie store global
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      // Si no se pasó `next` explícito, detectar si es recovery por el AMR del token
      if (!next) {
        const amr = data.session.user?.app_metadata?.amr
        const isRecovery = Array.isArray(amr)
          ? amr.some((a: any) => a?.method === 'recovery')
          : false
        dest = isRecovery ? '/cambiar-contrasena' : '/dashboard'
      }
      // Actualizar la URL del redirect con el destino correcto
      response.headers.set('location', new URL(dest, request.url).toString())
      return response
    }
  }

  return NextResponse.redirect(new URL('/login?error=enlace_invalido', request.url))
}
