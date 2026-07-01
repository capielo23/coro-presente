'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIA_LABELS } from '@/lib/utils'
import { PlusCircle, X, Plus, ListChecks } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition'

interface Persona { id: string; nombre: string; apellido?: string }
interface ItemEntrada { texto: string; persona_id: string | null }

export default function AgregarNecesidad({ casoId, personas = [] }: { casoId: string; personas?: Persona[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    categoria: 'alimentacion',
    descripcion: '',
    especialidad_requerida: '',
    es_recurrente: false,
    frecuencia: 'semanal',
  })
  const [personaNecesidad, setPersonaNecesidad] = useState('') // '' = Toda la familia
  const [items, setItems] = useState<ItemEntrada[]>([])
  const [itemInput, setItemInput] = useState('')
  const [itemPersona, setItemPersona] = useState('') // '' = Toda la familia
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const nombrePersona = (pid: string | null) => {
    const p = personas.find(x => x.id === pid)
    return p ? `${p.nombre} ${p.apellido ?? ''}`.trim() : 'Toda la familia'
  }

  function agregarItem() {
    const t = itemInput.trim()
    if (!t) return
    setItems(prev => [...prev, { texto: t, persona_id: itemPersona || null }])
    setItemInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const res = await fetch('/api/necesidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, persona_id: personaNecesidad || undefined, caso_id: casoId }),
    })
    if (!res.ok) { setErrorMsg('No se pudo guardar. Intenta de nuevo.'); setLoading(false); return }
    setAbierto(false)
    setLoading(false)
    setForm({ categoria: 'alimentacion', descripcion: '', especialidad_requerida: '', es_recurrente: false, frecuencia: 'semanal' })
    setPersonaNecesidad('')
    setItems([])
    setItemInput('')
    setItemPersona('')
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-sm text-cyan-600 font-medium hover:text-cyan-800 transition btn-press"
      >
        <PlusCircle className="w-4 h-4" />
        Agregar necesidad
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full border border-cyan-200 bg-cyan-50 rounded-xl p-4 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--color-foreground)] text-sm">Nueva necesidad</h4>
        <button type="button" onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {personas.length > 0 && (
        <div className="bg-white border border-cyan-200 rounded-lg p-2.5">
          <label className="block text-xs font-semibold text-gray-700 mb-1">¿Para quién es esta necesidad?</label>
          <select
            value={personaNecesidad}
            onChange={e => { setPersonaNecesidad(e.target.value); setItemPersona(e.target.value) }}
            className={inputCls}
          >
            <option value="">Toda la familia</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>{`${p.nombre} ${p.apellido ?? ''}`.trim()}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Elige primero a quién se le asignará. Si la necesidad incluye varios miembros, puedes ajustar por artículo más abajo.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <select
            value={form.categoria}
            onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
            className={inputCls}
          >
            {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Ej: Insulina, talla M, leche de fórmula..."
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          ¿Requiere especialista? <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          value={form.especialidad_requerida}
          onChange={e => setForm(p => ({ ...p, especialidad_requerida: e.target.value }))}
          placeholder="Ej: Pediatría, Psicología, Electricista..."
          maxLength={100}
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-1">
          Si se necesita un voluntario con conocimiento específico, indícalo aquí.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-cyan-600" />
          Artículos específicos <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <p className="text-xs text-gray-400 mb-1.5">
          Para necesidades con varios elementos (ropa por tallas, varios medicamentos, insumos).
          Asigna cada artículo a un integrante para hacer seguimiento por persona.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={itemInput}
            onChange={e => setItemInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarItem() } }}
            placeholder="Ej: Franela talla XL"
            maxLength={200}
            className={`${inputCls} flex-1 min-w-[140px]`}
          />
          {personas.length > 0 && (
            <select value={itemPersona} onChange={e => setItemPersona(e.target.value)} className={`${inputCls} w-auto`}>
              <option value="">Toda la familia</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{`${p.nombre} ${p.apellido ?? ''}`.trim()}</option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={agregarItem}
            className="flex items-center gap-1 text-sm text-cyan-700 border border-cyan-200 bg-white px-3 py-2 rounded-lg hover:bg-cyan-100 transition btn-press whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
        {items.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-1 text-xs bg-white text-gray-700 border border-cyan-200 pl-2.5 pr-1 py-1 rounded-full">
                <span>{it.texto}</span>
                <span className="text-cyan-600">· {nombrePersona(it.persona_id)}</span>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-400 hover:text-red-500 transition"
                  aria-label={`Quitar ${it.texto}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.es_recurrente}
          onChange={e => setForm(p => ({ ...p, es_recurrente: e.target.checked }))}
          className="accent-cyan-600 rounded"
        />
        Es necesidad recurrente (se repite)
      </label>

      {form.es_recurrente && (
        <select
          value={form.frecuencia}
          onChange={e => setForm(p => ({ ...p, frecuencia: e.target.value }))}
          className={`${inputCls} w-auto`}
        >
          <option value="semanal">Cada semana</option>
          <option value="quincenal">Cada 15 días</option>
          <option value="mensual">Mensual</option>
        </select>
      )}

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition btn-press"
        >
          {loading ? 'Guardando...' : 'Guardar necesidad'}
        </button>
      </div>
    </form>
  )
}
