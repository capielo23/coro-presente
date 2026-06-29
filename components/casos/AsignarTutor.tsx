'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Voluntario { id: string; nombre_completo: string }

interface Props {
  casoId: string
  tutorActual?: Voluntario | null
  voluntarios: Voluntario[]
  puedeEditar: boolean
  estadoActual: string
}

export default function AsignarTutor({ casoId, tutorActual, voluntarios, puedeEditar, estadoActual }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [tutorId, setTutorId] = useState(tutorActual?.id || '')
  const [estadoCaso, setEstadoCaso] = useState(estadoActual)
  const [loading, setLoading] = useState(false)

  async function guardar() {
    setLoading(true)
    await fetch(`/api/casos/${casoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutor_id: tutorId || null, estado: estadoCaso }),
    })
    setEditando(false)
    setLoading(false)
    router.refresh()
  }

  if (!puedeEditar) {
    return (
      <div className="text-sm text-gray-600">
        <span className="text-gray-400">Tutor: </span>
        <span className="font-medium">{tutorActual?.nombre_completo || 'Sin asignar'}</span>
      </div>
    )
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="text-sm text-blue-700 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
      >
        ✏️ Tutor: {tutorActual?.nombre_completo || 'Sin asignar'}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Tutor responsable</label>
        <select
          value={tutorId}
          onChange={e => setTutorId(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Sin asignar</option>
          {voluntarios.map(v => (
            <option key={v.id} value={v.id}>{v.nombre_completo}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Estado del caso</label>
        <select
          value={estadoCaso}
          onChange={e => setEstadoCaso(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="activo">Activo</option>
          <option value="critico">Crítico 🚨</option>
          <option value="estable">Estable</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>
      <div className="flex gap-2 items-end pb-0.5">
        <button
          onClick={guardar}
          disabled={loading}
          className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? '...' : 'Guardar'}
        </button>
        <button
          onClick={() => setEditando(false)}
          className="text-sm text-gray-500 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
