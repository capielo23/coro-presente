'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIA_LABELS } from '@/lib/utils'
import FotoLightbox from '@/components/ui/FotoLightbox'
import { User, Phone, AlertTriangle, CheckCircle2, Check, Undo2, ChevronDown, ChevronRight, PackageCheck } from 'lucide-react'

interface Item { id?: string; texto: string; entregado: boolean; entregado_por?: string | null; marcado_por?: string | null; fecha?: string; nota?: string | null }
interface Entry { necesidadId: string; categoria: string; item: Item }
interface Voluntario { id: string; nombre_completo: string }

function fmtFecha(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

const selectCls = 'text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500'

export default function IntegranteCard({
  persona, itemsPersona, equipo = [], puedeEditar, puedeMarcarEntregas = false, condicionAtendida = false,
}: { persona: any; itemsPersona: Entry[]; equipo?: Voluntario[]; puedeEditar: boolean; puedeMarcarEntregas?: boolean; condicionAtendida?: boolean }) {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>(itemsPersona)

  // Sincronizar con datos frescos del servidor tras router.refresh()
  const serverKey = `${itemsPersona.length}:${itemsPersona.filter(e => e.item.entregado).length}`
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setEntries(itemsPersona) }, [serverKey])

  // Actualización en tiempo real cuando NecesidadGestion marca/desmarca un ítem
  useEffect(() => {
    function handler(e: Event) {
      const { necesidadId, itemId, itemTexto, entregado } = (e as CustomEvent).detail
      setEntries(prev => prev.map(entry => {
        if (entry.necesidadId !== necesidadId) return entry
        if (entry.item.id === itemId || entry.item.texto === itemTexto) {
          return { ...entry, item: { ...entry.item, entregado } }
        }
        return entry
      }))
    }
    window.addEventListener('necesidad-item-change', handler)
    return () => window.removeEventListener('necesidad-item-change', handler)
  }, [])

  const [abierto, setAbierto] = useState(itemsPersona.length > 0)
  const [verEntregados, setVerEntregados] = useState(false)
  const [entregandoKey, setEntregandoKey] = useState<string | null>(null)
  const [deliverer, setDeliverer] = useState('')
  const [notaItem, setNotaItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = entries.length
  const entregados = entries.filter(e => e.item.entregado).length
  const keyOf = (e: Entry) => `${e.necesidadId}:${e.item.id ?? e.item.texto}`

  async function marcar(entry: Entry, entregar: boolean) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/necesidades', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: entry.necesidadId,
          accion: entregar ? 'entregar_item' : 'desmarcar_item',
          item_id: entry.item.id, item_texto: entry.item.texto,
          entregado_por_id: deliverer || undefined,
          nota: entregar ? (notaItem || undefined) : undefined,
        }),
      })
      if (!res.ok) throw new Error('patch')
      const row = await res.json()
      const actualizado = (row.items_entrega?.items ?? []).find((it: Item) => it.id === entry.item.id || it.texto === entry.item.texto)
      setEntries(prev => prev.map(e => keyOf(e) === keyOf(entry) ? { ...e, item: actualizado ?? { ...e.item, entregado: entregar } } : e))
      setEntregandoKey(null); setDeliverer(''); setNotaItem('')
      router.refresh()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const SelectorDeliverer = (
    <select value={deliverer} onChange={e => setDeliverer(e.target.value)} className={selectCls}>
      <option value="">Equipo CoroAyuda</option>
      {equipo.map(v => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
    </select>
  )

  const todoEntregado = total > 0 && entregados === total

  return (
    <div className={`border rounded-lg p-3 text-sm transition-colors ${todoEntregado ? 'border-green-300 bg-green-50/40' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        {persona.foto_signed_url ? (
          <FotoLightbox
            src={persona.foto_signed_url}
            nombre={`${persona.nombre} ${persona.apellido}`}
            className="w-14 h-14 shrink-0 rounded-lg border border-gray-200"
          />
        ) : (
          <div className="w-14 h-14 shrink-0 rounded-lg bg-[var(--color-muted)] border border-dashed border-[var(--color-border)] flex items-center justify-center">
            <User className="w-6 h-6 text-gray-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{persona.nombre} {persona.apellido}</p>
              {todoEntregado && (
                <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Todo entregado
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400 ml-2 shrink-0 font-medium">
              {persona.sexo === 'M' ? 'M' : persona.sexo === 'F' ? 'F' : ''}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            {persona.cedula && `CI: ${persona.cedula} · `}
            {persona.edad_meses
              ? `${persona.edad_meses} ${persona.edad_meses === 1 ? 'mes' : 'meses'} · `
              : persona.edad_aprox ? `${persona.edad_aprox} años · ` : ''}
            {persona.rol_familia && <span className="capitalize">{persona.rol_familia}</span>}
          </p>
          {persona.telefono && (
            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {persona.telefono}
            </p>
          )}
          {persona.condicion_especial && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${condicionAtendida ? 'text-gray-400' : 'text-orange-600'}`}>
              {condicionAtendida
                ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                : <AlertTriangle className="w-3 h-3 shrink-0" />
              }
              {persona.condicion_especial}
              {condicionAtendida && <span className="italic ml-0.5">(atendido)</span>}
            </p>
          )}
        </div>
      </div>

      {/* Necesidades asignadas a esta persona */}
      {total > 0 && (
        <div className="mt-2.5 border-t border-gray-100 pt-2">
          <button
            type="button"
            onClick={() => setAbierto(a => !a)}
            className="w-full flex items-center justify-between text-xs font-medium text-gray-600 hover:text-cyan-700 transition"
          >
            <span className="flex items-center gap-1.5">
              {abierto ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <PackageCheck className="w-3.5 h-3.5 text-cyan-600" /> Lo que necesita
            </span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${entregados === total ? 'bg-green-100 text-green-700' : entregados > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
              {entregados}/{total}
            </span>
          </button>

          {abierto && (() => {
            const pendientes = entries.filter(e => !e.item.entregado)
            const entregadosList = entries.filter(e => e.item.entregado)

            function renderEntry(entry: Entry) {
              const k = keyOf(entry)
              const it = entry.item
              const enProceso = entregandoKey === k
              return (
                <div key={k}>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => { if (!puedeMarcarEntregas || loading) return; if (it.entregado) { marcar(entry, false) } else { setEntregandoKey(enProceso ? null : k) } }}
                      disabled={!puedeMarcarEntregas || loading}
                      className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition ${it.entregado ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'} ${puedeMarcarEntregas ? 'cursor-pointer hover:border-green-500' : 'cursor-default'} disabled:opacity-60`}
                      aria-label={it.entregado ? `Desmarcar ${it.texto}` : `Marcar ${it.texto} como entregado`}
                    >
                      {it.entregado && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${it.entregado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {it.texto}
                        <span className={`not-italic ${it.entregado ? 'text-gray-300' : 'text-gray-400'}`}> · {CATEGORIA_LABELS[entry.categoria] || entry.categoria}</span>
                      </p>
                      {it.entregado ? (
                        <p className="text-[11px] text-green-600">
                          ✓ {it.entregado_por || 'Equipo CoroAyuda'}{it.fecha ? ` · ${fmtFecha(it.fecha)}` : ''}
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-500">Pendiente</p>
                      )}
                      {it.nota && <p className="text-[11px] text-gray-500 italic">Nota: {it.nota}</p>}
                    </div>
                    {puedeMarcarEntregas && it.entregado && (
                      <button type="button" onClick={() => marcar(entry, false)} disabled={loading}
                        className="text-gray-300 hover:text-red-500 transition shrink-0" aria-label="Deshacer entrega">
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {enProceso && puedeMarcarEntregas && (
                    <div className="ml-6 mt-1 bg-cyan-50 border border-cyan-100 rounded-lg p-2 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-gray-500">¿Quién entregó?</span>
                        {SelectorDeliverer}
                      </div>
                      <input value={notaItem} onChange={e => setNotaItem(e.target.value)} placeholder="Nota / incidencia (opcional)"
                        className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500" />
                      <div className="flex gap-2">
                        <button onClick={() => marcar(entry, true)} disabled={loading}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition btn-press">
                          {loading ? '...' : 'Confirmar entrega'}
                        </button>
                        <button onClick={() => { setEntregandoKey(null); setDeliverer(''); setNotaItem('') }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div className="mt-2 space-y-1.5">
                {pendientes.map(renderEntry)}

                {entregadosList.length > 0 && (
                  <div className={pendientes.length > 0 ? 'pt-0.5' : ''}>
                    {pendientes.length > 0 && (
                      <button type="button" onClick={() => setVerEntregados(v => !v)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition mb-1.5">
                        {verEntregados ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        {entregadosList.length} entregado{entregadosList.length !== 1 ? 's' : ''}
                      </button>
                    )}
                    {(verEntregados || pendientes.length === 0) && (
                      <div className="space-y-1.5">
                        {entregadosList.map(renderEntry)}
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
