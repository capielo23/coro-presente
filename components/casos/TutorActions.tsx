'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, UserMinus, AlertCircle, MapPin, Sparkles, CheckCircle2, X } from 'lucide-react'

interface MatchInfo {
  categoriasMatch: string[]
  especialidadesMatch: string[]
  zonaCoincide: boolean
  sectorCaso: string | null
  zonaVol: string | null
  perfilIncompleto: boolean
}

interface Props {
  casoId: string
  tutorId: string | null
  tutorNombre: string | null
  userId: string
  esColaborador: boolean
  match?: MatchInfo
}

export default function TutorActions({ casoId, tutorId, tutorNombre, userId, esColaborador, match }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [localTutorId, setLocalTutorId] = useState(tutorId)
  const [localTutorNombre, setLocalTutorNombre] = useState(tutorNombre)
  const [confirmarLiberar, setConfirmarLiberar] = useState(false)
  const [mostrarCompromiso, setMostrarCompromiso] = useState(false)
  const [aceptado, setAceptado] = useState(false)

  const esTutor = localTutorId === userId
  const sinTutor = !localTutorId

  async function tomarTutoria() {
    setLoading(true)
    const res = await fetch(`/api/casos/${casoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tomar_tutoria: true }),
    })
    if (res.ok) {
      setLocalTutorId(userId)
      setLocalTutorNombre('Tú')
      setMostrarCompromiso(false)
      setAceptado(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function liberarTutoria() {
    setLoading(true)
    const res = await fetch(`/api/casos/${casoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ liberar_tutor: true }),
    })
    if (res.ok) {
      setLocalTutorId(null)
      setLocalTutorNombre(null)
      setConfirmarLiberar(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-[var(--color-muted)] rounded-xl border border-[var(--color-border)] p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Tutor del caso</p>
          {localTutorId ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">
                {esTutor ? 'Tú (eres el tutor)' : (localTutorNombre || 'Voluntario asignado')}
              </span>
              {esTutor && (
                <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">Responsable</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600 font-semibold">Sin tutor asignado</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Disponible</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {esTutor
              ? 'Eres responsable del seguimiento de este caso.'
              : sinTutor
              ? 'Cualquier voluntario puede tomar el seguimiento.'
              : esColaborador
              ? 'Estás registrado como colaborador. Puedes observar el caso.'
              : 'Este caso ya tiene tutor asignado.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          {sinTutor && (
            <button
              onClick={() => setMostrarCompromiso(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 whitespace-nowrap btn-press"
            >
              <UserCheck className="w-4 h-4" />
              {loading ? 'Procesando...' : 'Tomar seguimiento'}
            </button>
          )}

          {esTutor && !confirmarLiberar && (
            <button
              onClick={() => setConfirmarLiberar(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition self-end"
            >
              <UserMinus className="w-3.5 h-3.5" />
              Liberar este caso
            </button>
          )}
          {esTutor && confirmarLiberar && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-xs text-gray-600">¿Confirmar?</span>
              <button
                onClick={liberarTutoria}
                disabled={loading}
                className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
              >
                {loading ? '...' : 'Sí, liberar'}
              </button>
              <button onClick={() => setConfirmarLiberar(false)} className="text-xs text-gray-400 hover:text-gray-600">
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de compromiso antes de tomar el seguimiento */}
      {mostrarCompromiso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setMostrarCompromiso(false)}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0891B2]" />
                <h3 className="font-bold text-gray-900">Tomar el seguimiento</h3>
              </div>
              <button onClick={() => setMostrarCompromiso(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Al tomar este caso te conviertes en responsable de su seguimiento. Revisa cómo encaja con tu perfil:
            </p>

            {/* Coincidencias de áreas / especialidades */}
            {(match?.categoriasMatch.length || match?.especialidadesMatch.length) ? (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 space-y-2">
                {match.categoriasMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyan-800 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Necesidades en tus áreas de ayuda
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.categoriasMatch.map(c => (
                        <span key={c} className="text-xs bg-white text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {match.especialidadesMatch.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-cyan-800 flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Requiere tu especialidad
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.especialidadesMatch.map(e => (
                        <span key={e} className="text-xs bg-white text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500">
                Este caso no coincide directamente con tus áreas declaradas, pero igual puedes ayudar si tienes disponibilidad.
              </div>
            )}

            {/* Zona */}
            {match?.sectorCaso && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${match.zonaCoincide ? 'text-green-600' : 'text-gray-400'}`} />
                <p className="text-gray-600">
                  Sector del caso: <span className="font-medium text-gray-800">{match.sectorCaso}</span>
                  {match.zonaVol && (
                    <span className={match.zonaCoincide ? 'text-green-600' : 'text-gray-400'}>
                      {' · '}{match.zonaCoincide ? 'coincide con tu zona' : `tu zona: ${match.zonaVol}`}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Aviso suave de perfil incompleto */}
            {match?.perfilIncompleto && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Tu perfil está incompleto. Completarlo ayuda a coordinar mejor, pero no es obligatorio para tomar este caso.</span>
              </div>
            )}

            {/* Checkbox de compromiso */}
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={aceptado}
                onChange={e => setAceptado(e.target.checked)}
                className="accent-cyan-600 mt-0.5"
              />
              Entiendo el compromiso y tengo disponibilidad para dar seguimiento a este caso.
            </label>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setMostrarCompromiso(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={tomarTutoria}
                disabled={!aceptado || loading}
                className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 btn-press"
              >
                <UserCheck className="w-4 h-4" />
                {loading ? 'Procesando...' : 'Confirmar y tomar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
