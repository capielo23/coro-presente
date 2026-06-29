'use client'
import { useEffect, useState } from 'react'
import { Voluntario } from '@/lib/types'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
}

export default function VoluntariosAdminPage() {
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [loading, setLoading] = useState(true)

  async function cargar() {
    const res = await fetch('/api/admin/voluntarios')
    if (res.ok) {
      const data = await res.json()
      setVoluntarios(data)
    }
    setLoading(false)
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch('/api/admin/voluntarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    cargar()
  }

  useEffect(() => { cargar() }, [])

  const pendientes = voluntarios.filter(v => v.estado === 'pendiente')
  const aprobados = voluntarios.filter(v => v.estado === 'aprobado')
  const rechazados = voluntarios.filter(v => v.estado === 'rechazado')

  if (loading) {
    return <div className="text-gray-400 text-sm">Cargando voluntarios...</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestión de voluntarios</h2>
        <p className="text-gray-500 text-sm mt-1">
          {aprobados.length} activos · {pendientes.length} pendientes · {rechazados.length} rechazados
        </p>
      </div>

      {pendientes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h3 className="font-semibold text-yellow-800 mb-3">
            ⏳ Solicitudes pendientes ({pendientes.length})
          </h3>
          <div className="space-y-2">
            {pendientes.map(v => (
              <div
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-white border border-yellow-100 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{v.nombre_completo}</p>
                  <p className="text-sm text-gray-500">
                    {v.cedula ? `CI: ${v.cedula} · ` : ''}Tel: {v.telefono}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Solicitó: {new Date(v.created_at).toLocaleDateString('es-VE')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado(v.id, 'aprobado')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => cambiarEstado(v.id, 'rechazado')}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-700 text-sm">Todos los voluntarios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...aprobados, ...rechazados].map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{v.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-600">{v.cedula || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.telefono}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.rol === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                      {v.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[v.estado]}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {v.estado === 'aprobado' && (
                        <button
                          onClick={() => cambiarEstado(v.id, 'rechazado')}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Revocar
                        </button>
                      )}
                      {v.estado === 'rechazado' && (
                        <button
                          onClick={() => cambiarEstado(v.id, 'aprobado')}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Re-aprobar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
