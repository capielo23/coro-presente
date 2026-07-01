'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TIPO_CONTACTO_LABELS } from '@/lib/utils'
import { PlusCircle, X } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition'

export default function AgregarSeguimiento({ casoId }: { casoId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    tipo_contacto: 'visita',
    descripcion: '',
    proximos_pasos: '',
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion.trim()) { setErrorMsg('Describe qué hiciste en este contacto.'); return }
    setLoading(true)
    setErrorMsg('')
    const res = await fetch('/api/seguimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, caso_id: casoId }),
    })
    if (!res.ok) { setErrorMsg('No se pudo guardar. Intenta de nuevo.'); setLoading(false); return }
    setAbierto(false)
    setLoading(false)
    setForm({ tipo_contacto: 'visita', descripcion: '', proximos_pasos: '' })
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-1.5 text-sm text-cyan-600 font-medium hover:text-cyan-800 transition btn-press"
      >
        <PlusCircle className="w-4 h-4" />
        Registrar contacto
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full border border-cyan-200 bg-cyan-50 rounded-xl p-4 mt-2 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-[var(--color-foreground)] text-sm">Nuevo seguimiento</h4>
        <button type="button" onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de contacto</label>
        <select
          value={form.tipo_contacto}
          onChange={e => setForm(p => ({ ...p, tipo_contacto: e.target.value }))}
          className={`${inputCls} sm:w-auto`}
        >
          {Object.entries(TIPO_CONTACTO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">¿Qué se hizo?</label>
        <textarea
          value={form.descripcion}
          onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
          placeholder="Ej: Contacté a la familia. Confirman que necesitan los medicamentos antes del viernes."
          rows={3}
          maxLength={2000}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Próximos pasos <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={form.proximos_pasos}
          onChange={e => setForm(p => ({ ...p, proximos_pasos: e.target.value }))}
          placeholder="Ej: Gestionar medicamentos con la farmacia solidaria."
          rows={2}
          maxLength={2000}
          className={inputCls}
        />
      </div>

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
          {loading ? 'Guardando...' : 'Guardar seguimiento'}
        </button>
      </div>
    </form>
  )
}
