'use client'
import { useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'

interface Props {
  casoId: string
  campo: string
  valor?: string | null
  etiqueta: string
  placeholder?: string
  puedeEditar?: boolean
  listaId?: string
}

export default function CampoEditable({
  casoId, campo, valor, etiqueta, placeholder, puedeEditar = true, listaId,
}: Props) {
  const [editando, setEditando] = useState(false)
  const [input, setInput] = useState(valor || '')
  const [valorActual, setValorActual] = useState(valor || '')
  const [saving, setSaving] = useState(false)

  async function guardar() {
    setSaving(true)
    const res = await fetch(`/api/casos/${casoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: input }),
    })
    if (res.ok) { setValorActual(input); setEditando(false) }
    setSaving(false)
  }

  return (
    <div className="bg-[var(--color-muted)] rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-0.5 font-medium">{etiqueta}</p>
      {editando ? (
        <div className="mt-1 space-y-1.5">
          <input
            list={listaId}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') guardar()
              if (e.key === 'Escape') { setInput(valorActual); setEditando(false) }
            }}
            className="w-full text-xs px-2 py-1.5 border border-cyan-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          />
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={guardar}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-[#0891B2] text-white px-2.5 py-1 rounded-lg hover:bg-[#0C4A6E] disabled:opacity-50 transition btn-press"
              aria-label="Guardar"
            >
              <Check className="w-3.5 h-3.5" /> Guardar
            </button>
            <button
              onClick={() => { setInput(valorActual); setEditando(false) }}
              className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition"
              aria-label="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 group min-h-[1.25rem]">
          <p className={`font-medium text-sm leading-snug ${!valorActual ? 'text-gray-300 italic' : 'text-gray-800'}`}>
            {valorActual || 'Sin registrar'}
          </p>
          {puedeEditar && (
            <button
              onClick={() => setEditando(true)}
              className="opacity-0 group-hover:opacity-100 text-xs text-cyan-600 hover:underline transition-opacity whitespace-nowrap flex items-center gap-0.5 focus-visible:opacity-100"
              aria-label={`Editar ${etiqueta}`}
            >
              <Pencil className="w-3 h-3" />
              {valorActual ? 'editar' : 'agregar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
