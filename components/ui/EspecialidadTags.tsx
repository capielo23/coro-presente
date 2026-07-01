'use client'
import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export default function EspecialidadTags({
  tags,
  onChange,
  placeholder = 'Ej: Pediatría, Electricidad, Psicología...',
  maxTags = 20,
}: Props) {
  const [input, setInput] = useState('')

  function agregar() {
    const val = input.trim()
    if (!val || tags.includes(val) || tags.length >= maxTags) {
      setInput('')
      return
    }
    onChange([...tags, val])
    setInput('')
  }

  function quitar(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs px-2.5 py-1 rounded-full font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => quitar(tag)}
                className="text-cyan-400 hover:text-cyan-700 transition ml-0.5"
                aria-label={`Quitar ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              e.stopPropagation()
              agregar()
            }
          }}
          placeholder={placeholder}
          disabled={tags.length >= maxTags}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:opacity-50"
        />
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation(); agregar() }}
          disabled={!input.trim() || tags.length >= maxTags}
          className="flex items-center gap-1 px-3 py-2 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-100 transition disabled:opacity-40 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Escribe y presiona <kbd className="bg-gray-100 px-1 rounded text-[10px]">Enter</kbd> para añadir cada especialidad.
      </p>
    </div>
  )
}
