'use client'
import { useState } from 'react'
import Link from 'next/link'

const ESTADO_LABELS: Record<string, string> = {
  activo: 'Siendo atendido/a',
  estable: 'Estable — necesidades cubiertas',
  cerrado: 'Caso cerrado',
  critico: 'Requiere atención urgente',
}

const ESTADO_COLORS: Record<string, string> = {
  activo: 'bg-blue-100 text-blue-800',
  estable: 'bg-green-100 text-green-800',
  cerrado: 'bg-gray-100 text-gray-600',
  critico: 'bg-red-100 text-red-800',
}

interface Resultado {
  nombre: string
  apellido: string
  estadoCaso: string
  ciudadAtencion: string
  tutorContacto: string
}

export default function BuscarPage() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Resultado[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().length < 2) return
    setLoading(true)
    setError('')
    setResultados(null)

    const res = await fetch(`/api/buscar?q=${encodeURIComponent(query.trim())}`)
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al buscar')
      setLoading(false)
      return
    }

    setResultados(data.resultados)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      {/* Barra superior */}
      <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">CoroAyuda</h1>
          <p className="text-blue-300 text-xs">Portal de búsqueda familiar</p>
        </div>
        <Link href="/login" className="text-blue-200 hover:text-white text-sm underline">
          Soy voluntario →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-3xl font-bold text-white">Buscar familiar</h2>
          <p className="text-blue-200 mt-3 text-sm leading-relaxed">
            Si tienes un familiar afectado por el terremoto que puede encontrarse en Coro,
            búscalo aquí. Solo necesitas su nombre, apellido o cédula.
          </p>
        </div>

        <form onSubmit={buscar} className="flex gap-2 mb-8">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nombre, apellido o cédula..."
            className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold px-6 py-3 rounded-xl transition disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? '...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {resultados !== null && (
          <div className="space-y-3">
            {resultados.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">😔</div>
                <p className="font-medium text-gray-800">No encontramos a nadie con esa búsqueda.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Puede que aún no esté registrado. Contacta directamente a la coordinación de CoroAyuda.
                </p>
              </div>
            ) : (
              <>
                <p className="text-blue-200 text-sm mb-2">
                  Se encontraron {resultados.length} resultado(s):
                </p>
                {resultados.map((r, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {r.nombre} {r.apellido}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          📍 {r.ciudadAtencion}
                        </p>
                        <p className="text-gray-500 text-sm">
                          👤 Voluntario responsable: <span className="font-medium text-gray-700">{r.tutorContacto}</span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[r.estadoCaso] || 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_LABELS[r.estadoCaso] || r.estadoCaso}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <div className="mt-12 text-center space-y-2 text-blue-300 text-xs">
          <p>Este portal solo muestra si la persona está registrada y siendo atendida.</p>
          <p>No expone dirección exacta, teléfono, cédula ni datos médicos.</p>
          <div className="pt-4 border-t border-blue-800">
            <p className="text-blue-400 font-medium">CoroAyuda 🇻🇪</p>
            <p>Coro presente. Falcón solidario.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
