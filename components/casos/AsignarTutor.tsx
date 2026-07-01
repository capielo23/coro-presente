'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Sparkles, X, CheckCircle2 } from 'lucide-react'

interface Voluntario {
  id: string
  nombre_completo: string
  areas_ayuda?: string[] | null
  especialidades?: string[] | null
}

interface Props {
  casoId: string
  tutorActual?: Voluntario | null
  voluntarios: Voluntario[]
  puedeEditar: boolean
  estadoActual: string
  /** Áreas de necesidades del caso (para matching) */
  areasNecesidades?: string[]
  /** Especialidades requeridas del caso */
  especialidadesRequeridas?: string[]
}

function matchScore(v: Voluntario, areasNecesidades: string[], especialidadesRequeridas: string[]): number {
  const areas = v.areas_ayuda ?? []
  const esp = v.especialidades ?? []
  const matchAreas = areasNecesidades.filter(a => areas.includes(a)).length
  const matchEsp = especialidadesRequeridas.filter(e =>
    esp.some(ve => ve.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(ve.toLowerCase()))
  ).length
  return matchAreas + matchEsp
}

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'critico', label: 'Crítico' },
  { value: 'estable', label: 'Estable' },
  { value: 'cerrado', label: 'Cerrado' },
]

export default function AsignarTutor({
  casoId, tutorActual, voluntarios, puedeEditar, estadoActual,
  areasNecesidades = [], especialidadesRequeridas = [],
}: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [tutorId, setTutorId] = useState(tutorActual?.id || '')
  const [estadoCaso, setEstadoCaso] = useState(estadoActual)
  const [loading, setLoading] = useState(false)

  // Calcular puntuaciones una sola vez
  const voluntariosConScore = voluntarios.map(v => ({
    ...v,
    score: matchScore(v, areasNecesidades, especialidadesRequeridas),
  }))
  const sugeridos = voluntariosConScore.filter(v => v.score > 0).sort((a, b) => b.score - a.score)
  const otros = voluntariosConScore.filter(v => v.score === 0)

  async function guardar() {
    setLoading(true)
    await fetch(`/api/casos/${casoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asignar_tutor_id: tutorId || null, estado: estadoCaso }),
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
        className="flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-900 border border-cyan-200 px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 transition btn-press"
      >
        <Pencil className="w-3.5 h-3.5" />
        Tutor: {tutorActual?.nombre_completo || 'Sin asignar'}
      </button>
    )
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Asignar tutor</p>
        <button onClick={() => setEditando(false)} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selector con grupos */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Tutor responsable</label>
        <select
          value={tutorId}
          onChange={e => setTutorId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Sin asignar</option>

          {sugeridos.length > 0 && (
            <optgroup label={`Voluntarios sugeridos (${sugeridos.length})`}>
              {sugeridos.map(v => (
                <option key={v.id} value={v.id}>
                  {v.nombre_completo} — {v.score} coincidencia{v.score !== 1 ? 's' : ''}
                </option>
              ))}
            </optgroup>
          )}

          {otros.length > 0 && (
            <optgroup label="Otros voluntarios">
              {otros.map(v => (
                <option key={v.id} value={v.id}>{v.nombre_completo}</option>
              ))}
            </optgroup>
          )}
        </select>

        {sugeridos.length > 0 && tutorId && sugeridos.find(v => v.id === tutorId) && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-cyan-700">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Este voluntario tiene habilidades que coinciden con las necesidades del caso.
          </div>
        )}
      </div>

      {/* Estado del caso */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">Estado del caso</label>
        <select
          value={estadoCaso}
          onChange={e => setEstadoCaso(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {ESTADOS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={guardar}
          disabled={loading}
          className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition btn-press"
        >
          <CheckCircle2 className="w-4 h-4" />
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={() => setEditando(false)}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
