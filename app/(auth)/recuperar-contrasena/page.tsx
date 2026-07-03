'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Mail, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mostrarEmail, setMostrarEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/cambiar-contrasena`,
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
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Correo enviado</h2>
        <p className="text-slate-500 text-sm mb-6">
          Si <strong className="text-slate-700">{email}</strong> tiene una cuenta,
          recibirás el enlace en unos minutos.
        </p>
        <Link href="/login" className="text-cyan-700 text-sm hover:text-cyan-800 hover:underline transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="w-5 h-5 text-cyan-600" />
        <h2 className="text-xl font-semibold text-slate-800">Recuperar contraseña</h2>
      </div>

      {/* Mensaje principal: proceso manual */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 mb-5">
        <p className="text-sm text-cyan-900 font-medium mb-2">¿Olvidaste tu contraseña?</p>
        <p className="text-sm text-cyan-800 leading-relaxed">
          Un coordinador o administrador te generará una <strong>contraseña temporal</strong> y te la enviará por <strong>WhatsApp</strong>.
          Con esa clave puedes entrar al sistema y crear tu contraseña definitiva de inmediato.
        </p>
        <p className="text-xs text-cyan-700 mt-3">
          Comunícate con tu coordinador de referencia o escribe al equipo de Coro Presente para solicitar el restablecimiento.
        </p>
      </div>

      {/* Opción alternativa: correo electrónico (colapsable) */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarEmail(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            También puedes solicitar por correo electrónico
          </span>
          {mostrarEmail ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {mostrarEmail && (
          <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                El envío por correo está limitado a 2 por hora. Si no llega, usa el proceso por WhatsApp.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
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
                className="w-full text-white font-medium py-2.5 rounded-lg transition-all duration-150 disabled:opacity-50 cursor-pointer text-sm"
                style={{ background: '#0891B2' }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace por correo'}
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="text-center text-sm mt-6">
        <Link href="/login" className="text-cyan-700 hover:text-cyan-800 hover:underline transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </>
  )
}
