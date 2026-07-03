import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/registro')
  const isDashboard = pathname.startsWith('/dashboard') || pathname.startsWith('/casos') || pathname.startsWith('/admin')
  const isCambiarContrasena = pathname.startsWith('/cambiar-contrasena')

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Si el usuario tiene marcado que debe cambiar su contraseña (clave temporal),
  // leer desde user_metadata (disponible sin RLS ni query extra)
  if (user && isDashboard && !isCambiarContrasena) {
    if (user.user_metadata?.debe_cambiar_contrasena === true) {
      const url = new URL('/cambiar-contrasena', request.url)
      url.searchParams.set('temporal', '1')
      const redirect = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value))
      return redirect
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
