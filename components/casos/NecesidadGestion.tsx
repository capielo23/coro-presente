'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIA_LABELS, ESTADO_NECESIDAD_COLORS } from '@/lib/utils'
import { RefreshCw, Check, RotateCcw, ClipboardEdit, UserCog, ListChecks, Undo2, PackageCheck, User, Plus, X, Pencil, Trash2, AlertCircle } from 'lucide-react'

interface Item { id?: string; texto: string; persona_id?: string | null; persona_nombre?: string | null; entregado: boolean; entregado_por?: string | null; marcado_por?: string | null; fecha?: string; nota?: string | null }
interface ItemsData { items: Item[]; total: number; entregados: number; notas?: string }
interface Voluntario { id: string; nombre_completo: string }
interface Persona { id: string; nombre: string; apellido?: string }
interface Entrega { id: string; fecha: string; descripcion?: string | null; entregado_por_nombre: string; persona_nombre?: string | null; marcador?: { nombre_completo: string } | null }
interface ItemParse { texto: string; grupo?: string }

function parsearItems(descripcion?: string): ItemParse[] {
  if (!descripcion) return []
  const segmentos = descripcion.trim().split(/\.\s+/).map(s => s.replace(/\.+$/, '').trim()).filter(Boolean)
  const res: ItemParse[] = []
  for (const seg of segmentos) {
    const colonIdx = seg.indexOf(':')
    if (colonIdx > 0 && colonIdx < 35) {
      const grupo = seg.substring(0, colonIdx).trim()
      seg.substring(colonIdx + 1).trim().split(/,\s*/).map(s => s.trim()).filter(Boolean).forEach(t => res.push({ texto: t, grupo }))
    } else {
      const subItems = seg.split(/,\s*/).map(s => s.trim()).filter(s => s.length > 2)
      if (subItems.length > 1) subItems.forEach(t => res.push({ texto: t }))
      else if (seg.length > 0) res.push({ texto: seg })
    }
  }
  return res.length >= 2 ? res : []
}

function fmtFecha(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

const selectCls = 'text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500'

export default function NecesidadGestion({
  nec, puedeEditar, puedeMarcarEntregas = false, equipo = [], entregas = [], casoCreatedAt, personas = [],
}: { nec: any; puedeEditar: boolean; puedeMarcarEntregas?: boolean; equipo?: Voluntario[]; entregas?: Entrega[]; casoCreatedAt?: string; personas?: Persona[] }) {
  const router = useRouter()
  const [estado, setEstado] = useState<string>(nec.estado)
  const [data, setData] = useState<ItemsData | null>(nec.items_entrega?.items?.length ? (nec.items_entrega as ItemsData) : null)
  const [entregaGuardada] = useState<string>(nec.descripcion_entrega || '')
  const [entregandoKey, setEntregandoKey] = useState<string | null>(null)
  const [deliverer, setDeliverer] = useState('')
  const [periodoAbierto, setPeriodoAbierto] = useState(false)
  const [periodoNota, setPeriodoNota] = useState('')
  // Editor para detallar / agregar artículos
  const [detallarAbierto, setDetallarAbierto] = useState(false)
  const [editItems, setEditItems] = useState<{ texto: string; persona_id: string | null }[]>([])
  const [editTexto, setEditTexto] = useState('')
  const [editPersona, setEditPersona] = useState('')
  // Editar / eliminar artículo y necesidad
  const [itemEdit, setItemEdit] = useState<{ key: string; texto: string; persona_id: string } | null>(null)
  const [itemDelete, setItemDelete] = useState<string | null>(null)
  const [necEdit, setNecEdit] = useState(false)
  const [necForm, setNecForm] = useState({
    categoria: nec.categoria, descripcion: nec.descripcion ?? '',
    especialidad_requerida: nec.especialidad_requerida ?? '', frecuencia: nec.frecuencia ?? 'semanal',
    persona_id: nec.persona_id ?? '',
  })
  const [necDelete, setNecDelete] = useState(false)
  const [eliminado, setEliminado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sincronizar checklist y estado cuando el servidor envía datos frescos (tras router.refresh())
  const serverKey = `${nec.items_entrega?.total}:${nec.items_entrega?.entregados}:${nec.estado}`
  useEffect(() => {
    if (nec.items_entrega?.items?.length) setData(nec.items_entrega as ItemsData)
    setEstado(nec.estado)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey])

  const esRecurrente = !!nec.es_recurrente
  const tieneItems = !esRecurrente && !!data?.items?.length
  const itemsParseables = tieneItems || esRecurrente ? [] : parsearItems(nec.descripcion)

  const keyOf = (it: Item) => it.id ?? it.texto
  const primerNombre = (s: string) => s.trim().toLowerCase().split(/[\s(,/]/)[0]
  const matchPersonaId = (grupo?: string) => {
    if (!grupo) return null
    const fn = primerNombre(grupo)
    return personas.find(x => x.nombre.toLowerCase().split(' ')[0] === fn || x.nombre.toLowerCase() === fn)?.id ?? null
  }

  // Agrupar el checklist por integrante (dueño del artículo)
  const gruposItems = (() => {
    if (!tieneItems) return [] as { key: string; nombre: string; items: Item[] }[]
    const grupos: { key: string; nombre: string; items: Item[] }[] = []
    const idx = new Map<string, number>()
    for (const it of data!.items) {
      const k = it.persona_id ?? '__general__'
      let gi = idx.get(k)
      if (gi === undefined) { gi = grupos.length; idx.set(k, gi); grupos.push({ key: k, nombre: it.persona_nombre ?? 'Toda la familia', items: [] }) }
      grupos[gi].items.push(it)
    }
    return grupos
  })()
  const mostrarGrupos = gruposItems.length > 1 || (!!gruposItems[0] && gruposItems[0].nombre !== 'Toda la familia')

  // "Inicial" (registrada junto al caso) vs "Agregada después" (en una visita posterior)
  const agregadaDespues = !!casoCreatedAt && !!nec.created_at &&
    (new Date(nec.created_at).getTime() - new Date(casoCreatedAt).getTime() > 10 * 60 * 1000)

  async function patch(payload: any) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/necesidades', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nec.id, ...payload }),
      })
      if (!res.ok) throw new Error('patch')
      return await res.json()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function entregarItem(it: Item) {
    const row = await patch({ accion: 'entregar_item', item_id: it.id, item_texto: it.texto, entregado_por_id: deliverer || undefined })
    if (row) { setData(row.items_entrega); setEstado(row.estado); setEntregandoKey(null); setDeliverer('') }
  }
  async function desmarcarItem(it: Item) {
    const row = await patch({ accion: 'desmarcar_item', item_id: it.id, item_texto: it.texto })
    if (row) { setData(row.items_entrega); setEstado(row.estado) }
  }

  // Editor para detallar (crear checklist) o agregar artículos a uno existente
  function abrirDetalle() {
    if (!tieneItems && itemsParseables.length > 0) {
      setEditItems(itemsParseables.map(it => ({ texto: it.texto, persona_id: matchPersonaId(it.grupo) })))
    } else {
      setEditItems([])
    }
    setEditTexto(''); setEditPersona(nec.persona_id ?? ''); setDetallarAbierto(true)
  }
  function addEdit() {
    const t = editTexto.trim()
    if (!t) return
    setEditItems(prev => [...prev, { texto: t, persona_id: editPersona || null }])
    setEditTexto('')
  }
  async function guardarDetalle() {
    // Auto-recoger texto pendiente en el campo si el usuario no clickeó "+ Agregar"
    const extra = editTexto.trim()
      ? [{ texto: editTexto.trim(), persona_id: editPersona || null }]
      : []
    const itemsFinal = [...editItems, ...extra]
    if (itemsFinal.length === 0) return
    if (extra.length) setEditTexto('')
    const payload = itemsFinal.map(i => ({ texto: i.texto, persona_id: i.persona_id || undefined }))
    const row = await patch({ accion: tieneItems ? 'agregar_item' : 'desglosar', items: payload })
    if (row) { setData(row.items_entrega); setEstado(row.estado); setDetallarAbierto(false); setEditItems([]) }
  }
  const nombrePersona = (pid: string | null) => personas.find(p => p.id === pid)
    ? `${personas.find(p => p.id === pid)!.nombre} ${personas.find(p => p.id === pid)!.apellido ?? ''}`.trim()
    : 'Toda la familia'

  async function guardarEditarItem(item: Item) {
    if (!itemEdit) return
    const row = await patch({ accion: 'editar_item', item_id: item.id, item_texto: item.texto, nuevo_texto: itemEdit.texto, persona_id: itemEdit.persona_id })
    if (row) { setData(row.items_entrega); setEstado(row.estado); setItemEdit(null) }
  }
  async function eliminarItem(item: Item) {
    const row = await patch({ accion: 'eliminar_item', item_id: item.id, item_texto: item.texto })
    if (row) { setData(row.items_entrega); setEstado(row.estado); setItemDelete(null) }
  }
  async function guardarEditarNec() {
    const row = await patch({
      accion: 'editar_necesidad',
      categoria: necForm.categoria, descripcion: necForm.descripcion,
      especialidad_requerida: necForm.especialidad_requerida,
      frecuencia: esRecurrente ? necForm.frecuencia : undefined,
      persona_id: necForm.persona_id || '',
    })
    if (row) { setNecEdit(false); router.refresh() }
  }
  async function eliminarNecesidad() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/necesidades', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: nec.id }),
      })
      if (!res.ok) throw new Error('del')
      setEliminado(true); router.refresh()
    } catch { setError('No se pudo eliminar.') } finally { setLoading(false) }
  }
  async function patchEstado(nuevoEstado: string) {
    const row = await patch({ estado: nuevoEstado, entregado_por_id: deliverer || undefined })
    if (row) { setEstado(nuevoEstado); setDeliverer('') }
  }
  async function registrarPeriodo() {
    const row = await patch({ accion: 'entrega_periodo', entregado_por_id: deliverer || undefined, descripcion_entrega: periodoNota || undefined })
    if (row) { setPeriodoAbierto(false); setPeriodoNota(''); setDeliverer(''); router.refresh() }
  }

  const estadoLabel: Record<string, string> = {
    pendiente: 'pendiente', en_gestion: 'en gestión', entregado: 'entregado', parcial: 'parcial', recurrente: 'recurrente',
  }

  // Selector reutilizable de "quién entregó"
  const SelectorDeliverer = (
    <select value={deliverer} onChange={e => setDeliverer(e.target.value)} className={selectCls}>
      <option value="">Equipo CoroAyuda</option>
      {equipo.map(v => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
    </select>
  )

  if (eliminado) return null

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-3.5 text-sm bg-white">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{CATEGORIA_LABELS[nec.categoria] || nec.categoria}</p>
            {agregadaDespues
              ? <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">Agregada {fmtFecha(nec.created_at)}</span>
              : <span className="text-[10px] bg-gray-50 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full">Inicial</span>}
            {nec.persona_id && (
              <span className="text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> Para {nombrePersona(nec.persona_id)}
              </span>
            )}
          </div>
          {nec.descripcion && <p className="text-gray-500 text-xs mt-0.5">{nec.descripcion}</p>}
          {esRecurrente && (
            <p className="text-purple-600 text-xs mt-0.5 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Recurrente · {nec.frecuencia}
            </p>
          )}
          {nec.especialidad_requerida && (
            <p className="text-cyan-700 text-xs mt-0.5 flex items-center gap-1">
              <UserCog className="w-3 h-3" /> Requiere: {nec.especialidad_requerida}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tieneItems && <span className="text-xs font-semibold text-gray-500">{data!.entregados}/{data!.total}</span>}
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTADO_NECESIDAD_COLORS[estado] || 'bg-gray-100 text-gray-600'}`}>
            {estadoLabel[estado] || estado}
          </span>
          {puedeEditar && (
            <div className="flex items-center gap-1">
              <button onClick={() => { setNecDelete(false); setNecForm({ categoria: nec.categoria, descripcion: nec.descripcion ?? '', especialidad_requerida: nec.especialidad_requerida ?? '', frecuencia: nec.frecuencia ?? 'semanal', persona_id: nec.persona_id ?? '' }); setNecEdit(v => !v) }}
                className="text-gray-300 hover:text-cyan-600 transition" aria-label="Editar necesidad">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setNecEdit(false); setNecDelete(v => !v) }}
                className="text-gray-300 hover:text-red-500 transition" aria-label="Eliminar necesidad">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editar datos de la necesidad */}
      {necEdit && puedeEditar && (
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 space-y-2">
          {personas.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">¿Para quién es?</label>
              <select value={necForm.persona_id} onChange={e => setNecForm(p => ({ ...p, persona_id: e.target.value }))} className={`${selectCls} w-full`}>
                <option value="">Toda la familia</option>
                {personas.map(p => <option key={p.id} value={p.id}>{`${p.nombre} ${p.apellido ?? ''}`.trim()}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={necForm.categoria} onChange={e => setNecForm(p => ({ ...p, categoria: e.target.value }))} className={`${selectCls} w-full`}>
              {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={necForm.especialidad_requerida} onChange={e => setNecForm(p => ({ ...p, especialidad_requerida: e.target.value }))}
              placeholder="¿Requiere especialista? (opcional)" maxLength={100}
              className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          </div>
          <input value={necForm.descripcion} onChange={e => setNecForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción" className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
          {esRecurrente && (
            <select value={necForm.frecuencia} onChange={e => setNecForm(p => ({ ...p, frecuencia: e.target.value }))} className={selectCls}>
              <option value="semanal">Cada semana</option>
              <option value="quincenal">Cada 15 días</option>
              <option value="mensual">Mensual</option>
            </select>
          )}
          <div className="flex gap-2">
            <button onClick={guardarEditarNec} disabled={loading}
              className="text-xs bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition btn-press">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button onClick={() => setNecEdit(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancelar</button>
          </div>
        </div>
      )}

      {/* Confirmar eliminación de la necesidad */}
      {necDelete && puedeEditar && (
        <div className="mt-2 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="text-xs text-gray-700">¿Eliminar esta necesidad y todo su historial?</span>
          <button onClick={eliminarNecesidad} disabled={loading} className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
            {loading ? '...' : 'Sí, eliminar'}
          </button>
          <button onClick={() => setNecDelete(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
        </div>
      )}

      {/* Checklist persistente de artículos, agrupado por integrante */}
      {tieneItems && (
        <div className="mt-3 space-y-3">
          {gruposItems.map(g => {
            const ent = g.items.filter(i => i.entregado).length
            return (
              <div key={g.key}>
                {mostrarGrupos && (
                  <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-cyan-600" /> {g.nombre}
                    <span className="text-gray-400 font-normal">· {ent}/{g.items.length}</span>
                  </p>
                )}
                <div className={`space-y-1.5 ${mostrarGrupos ? 'pl-1.5 border-l-2 border-gray-100' : ''}`}>
                  {g.items.map(item => {
                    const enProceso = entregandoKey === keyOf(item)
                    return (
                      <div key={keyOf(item)} className={mostrarGrupos ? 'pl-1.5' : ''}>
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => { if (!puedeMarcarEntregas || loading) return; if (item.entregado) { desmarcarItem(item) } else { setEntregandoKey(enProceso ? null : keyOf(item)) } }}
                            disabled={!puedeMarcarEntregas || loading}
                            className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition ${item.entregado ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'} ${puedeMarcarEntregas ? 'cursor-pointer hover:border-green-500' : 'cursor-default'} disabled:opacity-60`}
                            aria-label={item.entregado ? `Desmarcar ${item.texto}` : `Marcar ${item.texto} como entregado`}
                          >
                            {item.entregado && <Check className="w-3 h-3 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${item.entregado ? 'text-gray-800' : 'text-gray-600'}`}>{item.texto}</p>
                            {item.entregado ? (
                              <p className="text-[11px] text-green-700">
                                Entregó: {item.entregado_por || 'Equipo CoroAyuda'}
                                {item.marcado_por ? ` · Registró: ${item.marcado_por}` : ''}{item.fecha ? ` · ${fmtFecha(item.fecha)}` : ''}
                              </p>
                            ) : (
                              <p className="text-[11px] text-amber-600">Pendiente</p>
                            )}
                            {item.nota && <p className="text-[11px] text-gray-500 italic">Nota: {item.nota}</p>}
                          </div>
                          {(puedeEditar || puedeMarcarEntregas) && (
                            <div className="flex items-center gap-1 shrink-0">
                              {item.entregado && puedeMarcarEntregas && (
                                <button type="button" onClick={() => desmarcarItem(item)} disabled={loading}
                                  className="text-gray-300 hover:text-amber-500 transition" aria-label="Deshacer entrega">
                                  <Undo2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button type="button"
                                onClick={() => { setItemDelete(null); setItemEdit({ key: keyOf(item), texto: item.texto, persona_id: item.persona_id ?? '' }) }}
                                className="text-gray-300 hover:text-cyan-600 transition" aria-label="Editar artículo">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button type="button"
                                onClick={() => { setItemEdit(null); setItemDelete(itemDelete === keyOf(item) ? null : keyOf(item)) }}
                                className="text-gray-300 hover:text-red-500 transition" aria-label="Eliminar artículo">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Editar artículo */}
                        {itemEdit?.key === keyOf(item) && puedeEditar && (
                          <div className="ml-6 mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1.5">
                            <input value={itemEdit.texto} onChange={e => setItemEdit(prev => prev ? { ...prev, texto: e.target.value } : prev)}
                              className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                            {personas.length > 0 && (
                              <select value={itemEdit.persona_id} onChange={e => setItemEdit(prev => prev ? { ...prev, persona_id: e.target.value } : prev)} className={selectCls}>
                                <option value="">Toda la familia</option>
                                {personas.map(p => <option key={p.id} value={p.id}>{`${p.nombre} ${p.apellido ?? ''}`.trim()}</option>)}
                              </select>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => guardarEditarItem(item)} disabled={loading || !itemEdit.texto.trim()}
                                className="text-xs bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition btn-press">
                                {loading ? '...' : 'Guardar'}
                              </button>
                              <button onClick={() => setItemEdit(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                            </div>
                          </div>
                        )}
                        {/* Confirmar eliminación de artículo */}
                        {itemDelete === keyOf(item) && puedeEditar && (
                          <div className="ml-6 mt-1 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2">
                            <span className="text-[11px] text-gray-700">¿Eliminar &quot;{item.texto}&quot;?</span>
                            <button onClick={() => eliminarItem(item)} disabled={loading} className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50">
                              {loading ? '...' : 'Sí, eliminar'}
                            </button>
                            <button onClick={() => setItemDelete(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                          </div>
                        )}
                        {/* Confirmación de entrega: solo quién entregó */}
                        {enProceso && puedeMarcarEntregas && (
                          <div className="ml-6 mt-1 bg-cyan-50 border border-cyan-100 rounded-lg p-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] text-gray-500">¿Quién entregó?</span>
                              {SelectorDeliverer}
                              <button onClick={() => entregarItem(item)} disabled={loading}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition btn-press">
                                {loading ? '...' : '✓ Confirmar'}
                              </button>
                              <button onClick={() => { setEntregandoKey(null); setDeliverer('') }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {data!.notas && <p className="text-xs text-gray-400 italic mt-1">{data!.notas}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {puedeEditar && !detallarAbierto && (
            <button onClick={abrirDetalle}
              className="flex items-center gap-1 text-xs text-cyan-700 hover:text-cyan-800 transition btn-press mt-1">
              <Plus className="w-3.5 h-3.5" /> Agregar artículo
            </button>
          )}
        </div>
      )}

      {/* Necesidad recurrente: bitácora de entregas por período */}
      {esRecurrente && (
        <div className="mt-3 space-y-2">
          {entregas.length > 0 && (
            <div className="space-y-1.5 border-l-2 border-purple-100 pl-3">
              {entregas.map(e => (
                <div key={e.id} className="text-[11px]">
                  <span className="text-gray-700 font-medium">{fmtFecha(e.fecha)}</span>
                  <span className="text-gray-500"> · Entregó: {e.entregado_por_nombre}</span>
                  {e.marcador?.nombre_completo && <span className="text-gray-400"> · Registró: {e.marcador.nombre_completo}</span>}
                  {e.descripcion && <span className="text-gray-500"> — {e.descripcion}</span>}
                </div>
              ))}
            </div>
          )}
          {puedeMarcarEntregas && !periodoAbierto && (
            <button onClick={() => setPeriodoAbierto(true)}
              className="flex items-center gap-1 text-xs text-purple-700 border border-purple-200 bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition btn-press">
              <PackageCheck className="w-3.5 h-3.5" /> Registrar entrega del período
            </button>
          )}
          {puedeMarcarEntregas && periodoAbierto && (
            <div className="flex flex-wrap items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg p-2">
              <span className="text-[11px] text-gray-500">¿Quién entregó?</span>
              {SelectorDeliverer}
              <input value={periodoNota} onChange={e => setPeriodoNota(e.target.value)} placeholder="Nota (opcional)"
                className="flex-1 min-w-[120px] text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500" />
              <button onClick={registrarPeriodo} disabled={loading}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition btn-press">
                {loading ? '...' : 'Registrar'}
              </button>
              <button onClick={() => { setPeriodoAbierto(false); setPeriodoNota(''); setDeliverer('') }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}

      {/* Entrega registrada en modo simple */}
      {!tieneItems && !esRecurrente && (estado === 'entregado' || estado === 'parcial') && entregaGuardada && (
        <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> {entregaGuardada}</p>
      )}

      {/* Acciones modo sin ítems */}
      {!tieneItems && !esRecurrente && puedeMarcarEntregas && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {estado === 'pendiente' && (
            <button onClick={() => patchEstado('en_gestion')} disabled={loading}
              className="flex items-center gap-1 text-xs text-cyan-700 border border-cyan-200 bg-cyan-50 px-2.5 py-1 rounded-lg hover:bg-cyan-100 disabled:opacity-50 transition btn-press">
              <ClipboardEdit className="w-3.5 h-3.5" /> Tomar en gestión
            </button>
          )}
          {(estado === 'en_gestion' || estado === 'entregado' || estado === 'parcial') && (
            <button onClick={() => patchEstado('pendiente')} disabled={loading}
              className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition btn-press">
              <RotateCcw className="w-3.5 h-3.5" /> Devolver a pendiente
            </button>
          )}
        </div>
      )}
      {!tieneItems && !esRecurrente && error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {/* Editor para detallar / agregar artículos (con dueño por miembro) */}
      {detallarAbierto && puedeEditar && (
        <div className="mt-2 border border-cyan-200 bg-cyan-50 rounded-lg p-2.5 space-y-2">
          <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-cyan-600" /> {tieneItems ? 'Agregar artículos' : 'Detallar en artículos'}
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={editTexto} onChange={e => setEditTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEdit() } }}
              placeholder="Ej: Fórmula para bebé, pañales, toallas..."
              className="flex-1 min-w-[140px] text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            {personas.length > 0 && (
              <select value={editPersona} onChange={e => setEditPersona(e.target.value)} className={selectCls}>
                <option value="">Toda la familia</option>
                {personas.map(p => <option key={p.id} value={p.id}>{`${p.nombre} ${p.apellido ?? ''}`.trim()}</option>)}
              </select>
            )}
            <button onClick={addEdit}
              className="flex items-center gap-1 text-xs text-cyan-700 border border-cyan-200 bg-white px-2.5 py-1 rounded-lg hover:bg-cyan-100 transition btn-press">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
          {editItems.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {editItems.map((it, i) => (
                <li key={i} className="flex items-center gap-1 text-xs bg-white text-gray-700 border border-cyan-200 pl-2.5 pr-1 py-1 rounded-full">
                  <span>{it.texto}</span>
                  <span className="text-cyan-600">· {nombrePersona(it.persona_id)}</span>
                  <button onClick={() => setEditItems(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition" aria-label={`Quitar ${it.texto}`}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button onClick={guardarDetalle} disabled={loading || (editItems.length === 0 && !editTexto.trim())}
              className="text-xs bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition btn-press">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setDetallarAbierto(false); setEditItems([]); setEditTexto(''); setEditPersona('') }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
