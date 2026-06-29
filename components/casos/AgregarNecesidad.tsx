'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIA_LABELS } from '@/lib/utils'

export default function AgregarNecesidad({ casoId }: { casoId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    categoria: 'alimentacion',
    descripcion: '',
    es_recurrente: false,
    frecuencia: 'semanal',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/necesidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, caso_id: casoId }),
    })

    setAbierto(false)
    setLoading(false)
    setForm({ categoria: 'alimentacion', descripcion: '', es_recurrente: false, frecuencia: 'semanal' })
    router.refresh()
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="text-sm text-blue-700 font-medium hover:underline"
      >
        + Agregar necesidad
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-blue-200 bg-blue-50 rounded-lg p-4 mt-4 space-y-3">
      <h4 className="font-medium text-blue-800 text-sm">Nueva necesidad</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <select
            value={form.categoria}
            onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
          <input
            value={form.descripcion}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
            placeholder="Ej: Insulina, talla M, leche de fórmula..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.es_recurrente}
          onChange={e => setForm(p => ({ ...p, es_recurrente: e.target.checked }))}
          className="rounded"
        />
        Es necesidad recurrente (se repite)
      </label>
      {form.es_recurrente && (
        <select
          value={form.frecuencia}
          onChange={e => setForm(p => ({ ...p, frecuencia: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="semanal">Cada semana</option>
          <option value="quincenal">Cada 15 días</option>
          <option value="mensual">Mensual</option>
        </select>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar necesidad'}
        </button>
      </div>
    </form>
  )
}
