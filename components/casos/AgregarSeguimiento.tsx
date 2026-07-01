'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, X, MapPin, Phone, MessageCircle, Package, Settings2, CheckCircle2 } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition'

const TIPOS = [
  { value: 'visita',    label: 'Visita presencial',      Icon: MapPin,          hint: 'Fuiste a verlos en persona.' },
  { value: 'llamada',   label: 'Llamada telefónica',     Icon: Phone,           hint: 'Hablaste con ellos por teléfono.' },
  { value: 'whatsapp',  label: 'Mensaje de WhatsApp',    Icon: MessageCircle,   hint: 'Coordinaste o verificaste por mensaje.' },
  { value: 'entrega',   label: 'Entrega de insumos',     Icon: Package,         hint: 'Llevaste o coordinaste una entrega de artículos.' },
  { value: 'gestion',   label: 'Gestión o trámite',      Icon: Settings2,       hint: 'Hiciste una gestión en nombre del caso.' },
]

function fechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function AgregarSeguimiento({ casoId }: { casoId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    tipo_contacto: 'visita',
    descripcion: '',
    proximos_pasos: '',
    fecha: fechaHoy(),
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const tipoActual = TIPOS.find(t => t.value === form.tipo_contacto)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.descripcion.trim()) { setErrorMsg('Describe qué se hizo o qué ocurrió.'); return }
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
    setForm({ tipo_contacto: 'visita', descripcion: '', proximos_pasos: '', fecha: fechaHoy() })
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
        <h4 className="font-semibold text-gray-800 text-sm">Registrar contacto con el caso</h4>
        <button type="button" onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de tipo — chips visuales */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">¿Qué tipo de contacto fue?</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(p => ({ ...p, tipo_contacto: value }))}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                form.tipo_contacto === value
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
        {tipoActual && (
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-500 shrink-0" /> {tipoActual.hint}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del contacto</label>
        <input
          type="date"
          value={form.fecha}
          max={fechaHoy()}
          onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-0.5">Por defecto: hoy. Cámbiala si fue ayer o antes.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">¿Qué ocurrió o qué se hizo? *</label>
        <textarea
          value={form.descripcion}
          onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
          placeholder="Ej: Visita domiciliaria. Se verificó que recibieron los medicamentos. La familia confirmó que están bien alojados."
          rows={3}
          maxLength={2000}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          ¿Qué sigue? — próximo paso <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={form.proximos_pasos}
          onChange={e => setForm(p => ({ ...p, proximos_pasos: e.target.value }))}
          placeholder="Ej: Gestionar ropa la semana próxima. Llamar para confirmar fecha de traslado."
          rows={2}
          maxLength={2000}
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-0.5">Si nada queda pendiente, déjalo vacío.</p>
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
          {loading ? 'Guardando...' : 'Guardar registro'}
        </button>
      </div>
    </form>
  )
}
