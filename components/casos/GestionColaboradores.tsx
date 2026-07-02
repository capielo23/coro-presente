'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, X, Users, ChevronDown } from 'lucide-react'

interface Voluntario {
  id: string
  nombre_completo: string
}

interface Props {
  casoId: string
  colaboradores: Array<{ id: string; nombre: string }>
  voluntariosDisponibles: Voluntario[]
}

export default function GestionColaboradores({ casoId, colaboradores, voluntariosDisponibles }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [seleccionado, setSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [removiendo, setRemoviendo] = useState<string | null>(null)
  const [error, setError] = useState('')

  const colaboradoresIds = new Set(colaboradores.map(c => c.id))
  const disponibles = voluntariosDisponibles.filter(v => !colaboradoresIds.has(v.id))

  async function agregar() {
    if (!seleccionado) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/casos/${casoId}/colaborar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voluntario_id: seleccionado }),
    })
    if (res.ok) {
      setSeleccionado('')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al agregar colaborador')
    }
    setLoading(false)
  }

  async function quitar(voluntarioId: string) {
    setRemoviendo(voluntarioId)
    setError('')
    const res = await fetch(`/api/casos/${casoId}/colaborar`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voluntario_id: voluntarioId }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      setError('Error al quitar colaborador')
    }
    setRemoviendo(null)
  }

  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <button
        onClick={() => setAbierto(a => !a)}
        className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 font-medium transition"
      >
        <Users className="w-3.5 h-3.5" />
        Gestionar equipo colaborador
        <ChevronDown className={`w-3 h-3 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="mt-3 space-y-3">
          {/* Colaboradores actuales con botón de quitar */}
          {colaboradores.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {colaboradores.map(c => (
                <span
                  key={c.id}
                  className="flex items-center gap-1.5 text-xs bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-1 rounded-full"
                >
                  {c.nombre}
                  <button
                    onClick={() => quitar(c.id)}
                    disabled={removiendo === c.id}
                    className="text-cyan-400 hover:text-red-500 transition disabled:opacity-50"
                    title="Quitar colaborador"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Ningún colaborador agregado aún.</p>
          )}

          {/* Agregar nuevo */}
          {disponibles.length > 0 && (
            <div className="flex gap-2 items-center">
              <select
                value={seleccionado}
                onChange={e => setSeleccionado(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              >
                <option value="">Seleccionar voluntario...</option>
                {disponibles.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre_completo}</option>
                ))}
              </select>
              <button
                onClick={agregar}
                disabled={!seleccionado || loading}
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap btn-press"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  )
}
