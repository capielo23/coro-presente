import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'magiclink' | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      const redirectTo = type === 'recovery' ? '/cambiar-contrasena' : next
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=enlace_invalido', request.url))
}
