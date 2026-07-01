'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cambiar-contrasena`,
    })
    setEnviado(true)
    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="text-center py-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-50 mb-4">
          <Mail size={26} className="text-cyan-600" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Revisa tu correo</h2>
        <p className="text-slate-500 text-sm mb-6">
          Si <strong className="text-slate-700">{email}</strong> tiene una cuenta en Coro Presente,
          recibirás un enlace para restablecer tu contraseña. Puede tardar unos minutos.
        </p>
        <Link href="/login" className="text-cyan-700 text-sm hover:text-cyan-800 hover:underline transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Recuperar contraseña</h2>
      <p className="text-slate-500 text-sm mb-6">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-medium py-2.5 rounded-lg transition-all duration-150 disabled:opacity-50 cursor-pointer"
          style={{ background: '#0891B2' }}
        >
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>
      <p className="text-center text-sm mt-6">
        <Link href="/login" className="text-cyan-700 hover:text-cyan-800 hover:underline transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
