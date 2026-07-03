'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-gray-800 bg-white transition'

export default function CambiarContrasenaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // Con flujo PKCE la sesión ya existe cuando la página carga (creada server-side en el callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setListo(true)
    })
    // Fallback para flujo implícito (envía PASSWORD_RECOVERY via hash fragment)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setListo(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('No se pudo cambiar la contraseña. El enlace puede haber expirado.')
      setLoading(false)
      return
    }
    setExito(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (exito) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Contraseña actualizada</h2>
        <p className="text-gray-400 text-sm">Redirigiendo al dashboard...</p>
      </div>
    )
  }

  if (!listo) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Verificando enlace de recuperación...</p>
        <p className="text-xs text-gray-400 mt-2">
          Si llegaste aquí por error,{' '}
          <Link href="/login" className="text-cyan-600 hover:underline">vuelve al inicio de sesión</Link>.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-5 h-5 text-cyan-600" />
        <h2 className="text-xl font-semibold text-gray-800">Nueva contraseña</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">Elige una contraseña segura para tu cuenta.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className={inputCls + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setVerPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={verPassword ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repite la contraseña"
              className={inputCls + ' pr-10'}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0891B2] hover:bg-[#0C4A6E] text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 btn-press flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            : 'Cambiar contraseña'}
        </button>
      </form>
    </>
  )
}
