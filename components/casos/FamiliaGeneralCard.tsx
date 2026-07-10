'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIA_LABELS } from '@/lib/utils'
import { Users, Check, Undo2, ChevronDown, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

interface Item { id?: string; texto: string; entregado: boolean; entregado_por?: string | null; fecha?: string; nota?: string | null }
interface Entry { necesidadId: string; categoria: string; item: Item }
interface Voluntario { id: string; nombre_completo: string }

const selectCls = 'text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500'

function fmtFecha(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

export default function FamiliaGeneralCard({
  items, equipo = [], puedeMarcarEntregas = false,
}: { items: Entry[]; equipo?: Voluntario[]; puedeMarcarEntregas?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [entries, setEntries] = useState<Entry[]>(items)
  const [entregandoKey, setEntregandoKey] = useState<string | null>(null)
  const [deliverer, setDeliverer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verEntregados, setVerEntregados] = useState(false)

  const keyOf = (e: Entry) => `${e.necesidadId}:${e.item.id ?? e.item.texto}`
  const pendientes = entries.filter(e => !e.item.entregado)
  const entregadosList = entries.filter(e => e.item.entregado)
  const total = entries.length
  const entregadosCount = entregadosList.length
  const todoEntregado = total > 0 && entregadosCount === total

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
        }),
      })
      if (!res.ok) throw new Error('patch')
      const row = await res.json()
      const actualizado = (row.items_entrega?.items ?? []).find((it: Item) => it.id === entry.item.id || it.texto === entry.item.texto)
      setEntries(prev => prev.map(e => keyOf(e) === keyOf(entry) ? { ...e, item: actualizado ?? { ...e.item, entregado: entregar } } : e))
      setEntregandoKey(null); setDeliverer('')
      toast.success(entregar ? 'Entrega registrada' : 'Entrega desmarcada')
      router.refresh()
    } catch {
      setError('No se pudo guardar.')
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

  function renderItem(entry: Entry) {
    const k = keyOf(entry)
    const it = entry.item
    const enProceso = entregandoKey === k
    return (
      <div key={k}>
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => {
              if (!puedeMarcarEntregas || loading) return
              if (it.entregado) marcar(entry, false)
              else setEntregandoKey(enProceso ? null : k)
            }}
            disabled={!puedeMarcarEntregas || loading}
            className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition
              ${it.entregado ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}
              ${puedeMarcarEntregas ? 'cursor-pointer hover:border-green-500' : 'cursor-default'}
              disabled:opacity-60`}
          >
            {it.entregado && <Check className="w-3 h-3 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-xs ${it.entregado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {it.texto}
              <span className={it.entregado ? 'text-gray-300' : 'text-gray-400'}> · {CATEGORIA_LABELS[entry.categoria] || entry.categoria}</span>
            </p>
            {it.entregado
              ? <p className="text-[11px] text-green-600">✓ {it.entregado_por || 'Equipo CoroAyuda'}{it.fecha ? ` · ${fmtFecha(it.fecha)}` : ''}</p>
              : <p className="text-[11px] text-amber-500">Pendiente</p>
            }
          </div>
          {puedeMarcarEntregas && it.entregado && (
            <button type="button" onClick={() => marcar(entry, false)} disabled={loading}
              className="text-gray-300 hover:text-red-500 transition shrink-0" aria-label="Deshacer entrega">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {enProceso && puedeMarcarEntregas && (
          <div className="ml-6 mt-1 bg-cyan-50 border border-cyan-100 rounded-lg p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-gray-500">¿Quién entregó?</span>
              {SelectorDeliverer}
              <button onClick={() => marcar(entry, true)} disabled={loading}
                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg disabled:opacity-50 transition btn-press">
                {loading ? '...' : 'Confirmar entrega'}
              </button>
              <button onClick={() => { setEntregandoKey(null); setDeliverer('') }} className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-3 text-sm col-span-full ${todoEntregado ? 'border-green-200 bg-green-50/30' : 'border-dashed border-gray-200 bg-gray-50/20'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-medium text-gray-600 flex items-center gap-1.5 text-xs">
          <Users className="w-3.5 h-3.5 text-cyan-500" /> Toda la familia
        </p>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${todoEntregado ? 'bg-green-100 text-green-700' : entregadosCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
          {entregadosCount}/{total}
        </span>
      </div>

      <div className="space-y-1.5">
        {pendientes.map(entry => renderItem(entry))}
      </div>

      {entregadosList.length > 0 && (
        <div className={pendientes.length > 0 ? 'mt-2' : ''}>
          {pendientes.length > 0 && (
            <button type="button" onClick={() => setVerEntregados(v => !v)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition mb-1.5">
              {verEntregados ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {entregadosCount} entregado{entregadosCount !== 1 ? 's' : ''}
            </button>
          )}
          {(verEntregados || pendientes.length === 0) && (
            <div className="space-y-1.5">
              {entregadosList.map(entry => renderItem(entry))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
