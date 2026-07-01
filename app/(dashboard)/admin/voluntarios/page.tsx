'use client'
import { useEffect, useState } from 'react'
import {
  CheckCircle2, XCircle, Clock, Settings2,
  Users, UserCheck, UserPlus, ShieldCheck, ShieldOff,
} from 'lucide-react'
import { Voluntario } from '@/lib/types'
import RegistrarVoluntarioModal from '@/components/admin/RegistrarVoluntarioModal'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  aprobado:  'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

const ROL_CHIP: Record<string, { label: string; color: string }> = {
  coordinador: { label: 'Coordinador',  color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  admin:       { label: 'Administrador', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
  voluntario:  { label: 'Voluntario',   color: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
}

interface YoPerfil {
  id: string
  rol: 'admin' | 'coordinador'
  puedeAprobarCoordinadores: boolean
}

export default function VoluntariosAdminPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [yo, setYo] = useState<YoPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  async function cargar() {
    const res = await fetch('/api/admin/voluntarios')
    if (res.ok) {
      const json = await res.json()
      setVoluntarios(json.lista ?? [])
      setYo(json.yo ?? null)
    }
    setLoading(false)
  }

  async function cambiarEstadoYRol(id: string, estado: string, rol?: string) {
    await fetch('/api/admin/voluntarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado, ...(rol ? { rol } : {}) }),
    })
    cargar()
  }

  async function togglePermisoEspecial(id: string, valor: boolean) {
    await fetch('/api/admin/voluntarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, puede_aprobar_coordinadores: valor }),
    })
    cargar()
  }

  useEffect(() => { cargar() }, [])

  const filtrados = busqueda
    ? voluntarios.filter(v => v.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()))
    : voluntarios

  const esAdmin = yo?.rol === 'admin'
  const puedeAprobarCoords = yo?.puedeAprobarCoordinadores ?? false

  const pendientesCoord = filtrados.filter(v => v.estado === 'pendiente' && (v as any).rol === 'coordinador')
  const pendientesVol   = filtrados.filter(v => v.estado === 'pendiente' && (v as any).rol !== 'coordinador')
  const aprobados       = filtrados.filter(v => v.estado === 'aprobado')
  const rechazados      = filtrados.filter(v => v.estado === 'rechazado')
  const totalPendientes = pendientesCoord.length + pendientesVol.length

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Clock className="w-4 h-4 animate-pulse" />
        Cargando...
      </div>
    )
  }

  function TarjetaPendiente({ v, seccion }: { v: Voluntario & Record<string, unknown>; seccion: 'coordinador' | 'voluntario' }) {
    return (
      <div className="bg-white border rounded-xl p-4 space-y-2.5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{v.nombre_completo}</p>
              {seccion === 'coordinador' && (
                <span className="text-xs bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Settings2 className="w-3 h-3" />
                  Solicitó: Coordinador
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {v.cedula ? `CI: ${v.cedula} · ` : ''}Tel: {v.telefono}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Solicitó el {new Date(v.created_at).toLocaleDateString('es-VE')}
            </p>
            {((v.areas_ayuda as string[] | null)?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(v.areas_ayuda as string[]).map(area => (
                  <span key={area} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-100">
                    {area.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
            {!!v.descripcion_ayuda && (
              <p className="text-xs text-gray-500 mt-1.5 italic line-clamp-2">
                &ldquo;{String(v.descripcion_ayuda)}&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {seccion === 'coordinador' ? (
              <>
                <button
                  onClick={() => cambiarEstadoYRol(v.id, 'aprobado', 'coordinador')}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Aprobar como Coordinador
                </button>
                <button
                  onClick={() => cambiarEstadoYRol(v.id, 'aprobado', 'voluntario')}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Aprobar como Voluntario
                </button>
                <button
                  onClick={() => cambiarEstadoYRol(v.id, 'rechazado')}
                  className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rechazar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => cambiarEstadoYRol(v.id, 'aprobado')}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprobar
                </button>
                <button
                  onClick={() => cambiarEstadoYRol(v.id, 'rechazado')}
                  className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rechazar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de voluntarios</h2>
          <p className="text-gray-500 text-sm mt-1">
            {voluntarios.filter(v => v.estado === 'aprobado').length} activos ·{' '}
            {totalPendientes} pendientes ·{' '}
            {voluntarios.filter(v => v.estado === 'rechazado').length} rechazados
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-64"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-xl text-sm font-semibold transition btn-press"
          >
            <UserPlus className="w-4 h-4" />
            Registrar voluntario directo
          </button>
        </div>
      </div>

      {/* Solicitudes de coordinadores — solo visible para quien puede aprobarlos */}
      {puedeAprobarCoords && pendientesCoord.length > 0 && (
        <section className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-indigo-800">
              Coordinadores pendientes ({pendientesCoord.length})
            </h3>
          </div>
          <p className="text-xs text-indigo-600 mb-3">
            Solo {esAdmin ? 'el administrador y coordinadores con permiso especial' : 'coordinadores con permiso especial'} pueden aprobar estas solicitudes.
            Puedes aprobarlos como coordinador (acceso completo) o reasignarlos como voluntario.
          </p>
          <div className="space-y-3">
            {pendientesCoord.map(v => (
              <TarjetaPendiente key={v.id} v={v as any} seccion="coordinador" />
            ))}
          </div>
        </section>
      )}

      {/* Si hay coordinadores pendientes pero el coordinador actual no puede aprobarlos */}
      {!puedeAprobarCoords && pendientesCoord.length > 0 && (
        <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
          <Settings2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-600">
              {pendientesCoord.length} solicitud(es) de coordinador pendientes
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Solo el administrador puede aprobar coordinadores. Notifica al administrador para que revise estas solicitudes.
            </p>
          </div>
        </section>
      )}

      {/* Solicitudes de voluntarios — visible para todos los gestores */}
      {pendientesVol.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-800">
              Voluntarios pendientes ({pendientesVol.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendientesVol.map(v => (
              <TarjetaPendiente key={v.id} v={v as any} seccion="voluntario" />
            ))}
          </div>
        </section>
      )}

      {totalPendientes === 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay solicitudes pendientes</p>
        </div>
      )}

      {/* Tabla de todos los voluntarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm">Todos los voluntarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Rol</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Teléfono</th>
                <th className="px-4 py-3 text-left">Áreas</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...aprobados, ...rechazados].map(v => {
                const rolInfo = ROL_CHIP[(v as any).rol] ?? ROL_CHIP.voluntario
                const esCoord = (v as any).rol === 'coordinador'
                const tienePermisoEspecial = !!(v as any).puede_aprobar_coordinadores
                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{v.nombre_completo}</p>
                      {v.cedula && <p className="text-xs text-gray-400">CI: {v.cedula}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${rolInfo.color}`}>
                          {rolInfo.label}
                        </span>
                        {esCoord && tienePermisoEspecial && (
                          <span className="text-xs text-indigo-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Perm. especial
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{v.telefono}</td>
                    <td className="px-4 py-3">
                      {((v as any).areas_ayuda?.length ?? 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(v as any).areas_ayuda.slice(0, 2).map((area: string) => (
                            <span key={area} className="text-xs bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-full">
                              {area.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {(v as any).areas_ayuda.length > 2 && (
                            <span className="text-xs text-gray-400">+{(v as any).areas_ayuda.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[v.estado]}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        {v.estado === 'aprobado' && (
                          <button
                            onClick={() => cambiarEstadoYRol(v.id, 'rechazado')}
                            className="text-xs text-red-500 hover:underline text-left"
                          >
                            Revocar
                          </button>
                        )}
                        {v.estado === 'rechazado' && (
                          <button
                            onClick={() => cambiarEstadoYRol(v.id, 'aprobado')}
                            className="text-xs text-green-600 hover:underline text-left"
                          >
                            Re-aprobar
                          </button>
                        )}
                        {/* Permiso especial: solo admin puede otorgarlo/revocarlo a coordinadores */}
                        {esAdmin && esCoord && v.estado === 'aprobado' && (
                          <button
                            onClick={() => togglePermisoEspecial(v.id, !tienePermisoEspecial)}
                            className={`text-xs flex items-center gap-1 hover:underline text-left ${
                              tienePermisoEspecial ? 'text-amber-600' : 'text-indigo-500'
                            }`}
                          >
                            {tienePermisoEspecial
                              ? <><ShieldOff className="w-3 h-3" /> Revocar perm. especial</>
                              : <><ShieldCheck className="w-3 h-3" /> Otorgar perm. especial</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RegistrarVoluntarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegistrado={() => { setModalOpen(false); cargar() }}
      />
    </div>
  )
}
