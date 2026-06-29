'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre_completo: '', email: '', password: '', cedula: '', telefono: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [mensaje, setMensaje] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
      setLoading(false)
      return
    }

    setExito(true)
    setMensaje(data.message)
    setLoading(false)
  }

  if (exito) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Solicitud enviada!</h2>
        <p className="text-gray-600 text-sm mb-6">{mensaje}</p>
        <Link href="/login" className="text-blue-700 font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  const campos = [
    { label: 'Nombre completo *', key: 'nombre_completo', type: 'text', required: true },
    { label: 'Correo electrónico *', key: 'email', type: 'email', required: true },
    { label: 'Contraseña (mín. 8 caracteres) *', key: 'password', type: 'password', required: true },
    { label: 'Cédula de identidad (opcional)', key: 'cedula', type: 'text', required: false },
    { label: 'Teléfono / WhatsApp *', key: 'telefono', type: 'tel', required: true },
  ]

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Registrarse como voluntario</h2>
      <p className="text-sm text-gray-500 mb-5">Un coordinador aprobará tu acceso antes de que puedas entrar.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {campos.map(campo => (
          <div key={campo.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{campo.label}</label>
            <input
              type={campo.type}
              required={campo.required}
              value={form[campo.key as keyof typeof form]}
              onChange={e => setForm(prev => ({ ...prev, [campo.key]: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Enviando solicitud...' : 'Solicitar acceso'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        <Link href="/login" className="text-blue-700 hover:underline">Ya tengo cuenta</Link>
      </p>
    </>
  )
}
