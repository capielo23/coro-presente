'use client'
import { useState } from 'react'
import { Search, X, Copy, Check, ChevronDown, ChevronUp, Users } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition'
const selectCls = `${inputCls} appearance-none pr-8 cursor-pointer`

const ROL_LABELS: Record<string, string> = {
  padre: 'Padre', madre: 'Madre', hijo: 'Hijo', hija: 'Hija',
  adulto_mayor: 'Adulto mayor', solo: 'Persona sola', otro: 'Otro',
}

const ESTADO_CASO_LABELS: Record<string, string> = {
  activo: 'Activo', estable: 'Estable', critico: 'Crítico', cerrado: 'Cerrado',
}

const CATEGORIA_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación', ropa: 'Ropa y calzado', medicamentos: 'Medicamentos',
  traslado: 'Traslado', alojamiento: 'Alojamiento', hogar: 'Artículos del hogar',
  utiles: 'Útiles escolares', ninos: 'Niños', adulto_mayor: 'Adulto mayor', otro: 'Otro',
}

interface PersonaResultado {
  id: string
  nombre: string
  apellido: string
  edad_aprox: number | null
  sexo: string
  rol_familia: string
  condicion_especial: string | null
  casos: { nombre_caso: string; estado: string; tipo: string }
}

export default function FiltroGrupo() {
  const [abierto, setAbierto] = useState(false)
  const [edadMin, setEdadMin] = useState('')
  const [edadMax, setEdadMax] = useState('')
  const [sexo, setSexo] = useState('')
  const [rolFamilia, setRolFamilia] = useState('')
  const [conCondicion, setConCondicion] = useState('')
  const [estadoCaso, setEstadoCaso] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ total: number; personas: PersonaResultado[]; sinFiltros?: boolean } | null>(null)
  const [copiado, setCopiado] = useState(false)

  function limpiar() {
    setEdadMin(''); setEdadMax(''); setSexo(''); setRolFamilia('')
    setConCondicion(''); setEstadoCaso(''); setResultado(null)
  }

  async function buscar() {
    const params = new URLSearchParams()
    if (edadMin) params.set('edad_min', edadMin)
    if (edadMax) params.set('edad_max', edadMax)
    if (sexo) params.set('sexo', sexo)
    if (rolFamilia) params.set('rol_familia', rolFamilia)
    if (conCondicion) params.set('con_condicion', conCondicion)
    if (estadoCaso) params.set('estado_caso', estadoCaso)

    setLoading(true)
    try {
      const res = await fetch(`/api/personas/filtrar?${params.toString()}`)
      const data = await res.json()
      setResultado(data)
    } catch {
      setResultado(null)
    } finally {
      setLoading(false)
    }
  }

  function copiarResumen() {
    if (!resultado) return
    const filtrosTexto = [
      edadMin && `Edad mín: ${edadMin}`,
      edadMax && `Edad máx: ${edadMax}`,
      sexo && `Sexo: ${sexo === 'M' ? 'Masculino' : 'Femenino'}`,
      rolFamilia && `Rol: ${ROL_LABELS[rolFamilia] ?? rolFamilia}`,
      conCondicion && `Condición especial: ${conCondicion === 'si' ? 'Con condición' : 'Sin condición'}`,
      estadoCaso && `Estado del caso: ${ESTADO_CASO_LABELS[estadoCaso] ?? estadoCaso}`,
    ].filter(Boolean).join(' · ') || 'Sin filtros específicos'

    const fecha = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
    const texto = [
      `Coro Presente — Consulta demográfica (${fecha})`,
      `Total de personas: ${resultado.total}`,
      `Filtros aplicados: ${filtrosTexto}`,
      resultado.total > 0 && resultado.personas.length > 0
        ? `\nDetalle (primeros ${resultado.personas.length}):\n` +
          resultado.personas.map(p =>
            `• ${p.nombre} ${p.apellido}${p.edad_aprox ? `, ${p.edad_aprox} años` : ''} — ${p.casos?.nombre_caso ?? 'Sin caso'}`
          ).join('\n')
        : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-600" />
          <span className="font-semibold text-gray-800">Consultar grupo específico</span>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {abierto && (
        <div className="px-5 pb-5 border-t border-gray-100 space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            Filtra personas registradas por perfil demográfico para generar informes rápidos para organizaciones aliadas.
          </p>

          {/* Controles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Edad mínima</label>
              <input type="number" min="0" max="120" value={edadMin}
                onChange={e => setEdadMin(e.target.value)} placeholder="Ej: 5" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Edad máxima</label>
              <input type="number" min="0" max="120" value={edadMax}
                onChange={e => setEdadMax(e.target.value)} placeholder="Ej: 12" className={inputCls} />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol familiar</label>
              <select value={rolFamilia} onChange={e => setRolFamilia(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                {Object.entries(ROL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Condición especial</label>
              <select value={conCondicion} onChange={e => setConCondicion(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                <option value="si">Con condición</option>
                <option value="no">Sin condición</option>
              </select>
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado del caso</label>
              <select value={estadoCaso} onChange={e => setEstadoCaso(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                {Object.entries(ESTADO_CASO_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={buscar}
              disabled={loading}
              className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition btn-press"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? 'Buscando...' : 'Buscar grupo'}
            </button>
            {(edadMin || edadMax || sexo || rolFamilia || conCondicion || estadoCaso || resultado) && (
              <button onClick={limpiar}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>

          {/* Resultados */}
          {resultado && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {resultado.sinFiltros ? (
                <p className="text-sm text-gray-400 text-center py-2">Selecciona al menos un filtro para consultar el grupo.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-cyan-700">{resultado.total}</span>
                      <span className="text-sm text-gray-600">
                        {resultado.total === 1 ? 'persona coincide' : 'personas coinciden'} con este perfil
                      </span>
                    </div>
                    {resultado.total > 0 && (
                      <button onClick={copiarResumen}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-700 px-3 py-1.5 rounded-lg hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 transition">
                        {copiado ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiado ? 'Copiado' : 'Copiar para informe'}
                      </button>
                    )}
                  </div>

                  {resultado.total > 100 && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Mostrando los primeros 100 resultados. Ajusta los filtros para reducir.
                    </p>
                  )}

                  {resultado.personas.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Nombre</th>
                            <th className="text-left px-3 py-2 font-medium">Edad</th>
                            <th className="text-left px-3 py-2 font-medium">Sexo</th>
                            <th className="text-left px-3 py-2 font-medium">Rol</th>
                            <th className="text-left px-3 py-2 font-medium">Caso</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {resultado.personas.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-800">
                                {p.nombre} {p.apellido}
                                {p.condicion_especial && (
                                  <span className="ml-1.5 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                    {p.condicion_especial}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {p.edad_aprox != null ? `${p.edad_aprox} años` : '—'}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {p.sexo === 'M' ? 'Masc.' : p.sexo === 'F' ? 'Fem.' : '—'}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {ROL_LABELS[p.rol_familia] ?? p.rol_familia ?? '—'}
                              </td>
                              <td className="px-3 py-2 text-gray-600 text-xs">
                                {(p.casos as any)?.nombre_caso ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {resultado.total === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Ninguna persona registrada coincide con estos filtros.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
