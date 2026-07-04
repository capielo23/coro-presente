'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Iniciar sesión</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
            placeholder="tu@correo.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-3 py-2.5 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
            />
            <button
              type="button"
              onClick={() => setVerPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-medium py-2.5 rounded-lg transition-all duration-150 disabled:opacity-50 cursor-pointer"
          style={{ background: loading ? '#64748b' : '#0891B2' }}
          onMouseEnter={e => !loading && ((e.target as HTMLElement).style.background = '#0C4A6E')}
          onMouseLeave={e => !loading && ((e.target as HTMLElement).style.background = '#0891B2')}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center">
          <Link href="/recuperar-contrasena" className="text-slate-400 hover:text-cyan-600 transition-colors duration-150 text-xs">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
      <p className="text-center text-sm text-slate-600 mt-6">
        ¿Eres voluntario nuevo?{' '}
        <Link href="/registro" className="text-cyan-700 font-medium hover:text-cyan-800 hover:underline transition-colors duration-150">
          Solicitar acceso
        </Link>
      </p>
      <div className="border-t border-slate-100 mt-6 pt-4 text-center">
        <Link href="/buscar" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-600 transition-colors duration-150">
          <Search size={13} />
          Buscar un familiar afectado
        </Link>
      </div>
    </>
  )
}
