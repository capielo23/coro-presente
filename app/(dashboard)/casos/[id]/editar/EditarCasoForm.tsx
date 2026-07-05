'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, User, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertCircle, UserPlus, Trash2 } from 'lucide-react'
import { CATEGORIA_LABELS } from '@/lib/utils'

const ESTADOS_CASO = [
  { value: 'activo',  label: 'Activo — en gestión activa' },
  { value: 'critico', label: 'Crítico — urgencia alta' },
  { value: 'estable', label: 'Estable — sin urgencia inmediata' },
  { value: 'cerrado', label: 'Cerrado — caso resuelto' },
]

const TIPOS_ALOJAMIENTO = [
  { value: 'casa_familiar', label: 'Casa de familiar' },
  { value: 'albergue',      label: 'Albergue oficial' },
  { value: 'iglesia',       label: 'Iglesia / comunitario' },
  { value: 'hotel',         label: 'Hotel / posada' },
  { value: 'otro',          label: 'Otro' },
]

const ROLES_FAMILIA = [
  { value: 'padre',        label: 'Padre' },
  { value: 'madre',        label: 'Madre' },
  { value: 'hijo',         label: 'Hijo/a' },
  { value: 'abuelo',       label: 'Abuelo/a' },
  { value: 'adulto_mayor', label: 'Adulto mayor' },
  { value: 'otro',         label: 'Otro' },
]

const ESTADO_NEC_CONFIG: Record<string, { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  pendiente:   { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-700',  Icon: ({ className }) => <Clock className={className} /> },
  en_gestion:  { label: 'En gestión', cls: 'bg-indigo-100 text-indigo-700', Icon: ({ className }) => <AlertCircle className={className} /> },
  entregado:   { label: 'Entregado',  cls: 'bg-green-100 text-green-700',  Icon: ({ className }) => <CheckCircle2 className={className} /> },
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white transition'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

const EMPTY_PERSONA_FORM = {
  nombre: '', apellido: '', cedula: '', edad_aprox: '',
  sexo: '', rol_familia: '', condicion_especial: '', telefono: '',
}

// ── Subcomponente: campos compartidos entre editar y agregar ──────────────────
function PersonaFields({
  form,
  set,
}: {
  form: typeof EMPTY_PERSONA_FORM
  set: (field: string, val: string) => void
}) {
  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre *</label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Apellido *</label>
          <input value={form.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cédula</label>
          <input value={form.cedula} onChange={e => set('cedula', e.target.value)} placeholder="V-12345678" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Edad (aprox.)</label>
          <input type="number" min="0" max="120" value={form.edad_aprox} onChange={e => set('edad_aprox', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Sexo</label>
          <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className={inputCls}>
            <option value="">Sin especificar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="no_especificado">Prefiero no indicar</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Rol en la familia</label>
          <select value={form.rol_familia} onChange={e => set('rol_familia', e.target.value)} className={inputCls}>
            <option value="">Sin especificar</option>
            {ROLES_FAMILIA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Condición especial (salud, movilidad, etc.)</label>
        <input value={form.condicion_especial} onChange={e => set('condicion_especial', e.target.value)} placeholder="Ej: Diabetes, asma..." className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Teléfono</label>
        <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="04XX-XXXXXXX" className={inputCls} />
      </div>
    </div>
  )
}

// ── Subcomponente: edición de persona existente ───────────────────────────────
function PersonaEditor({
  persona: initial,
  onSaved,
  onCancel,
}: {
  persona: any
  onSaved: (updated: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nombre:             initial.nombre ?? '',
    apellido:           initial.apellido ?? '',
    cedula:             initial.cedula ?? '',
    edad_aprox:         initial.edad_aprox?.toString() ?? '',
    sexo:               initial.sexo ?? '',
    rol_familia:        initial.rol_familia ?? '',
    condicion_especial: initial.condicion_especial ?? '',
    telefono:           initial.telefono ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function save() {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setSaving(true); setError('')
    const res = await fetch(`/api/personas/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, edad_aprox: form.edad_aprox || null }),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      onSaved(updated)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo guardar.')
    }
  }

  return (
    <>
      <PersonaFields form={form} set={set} />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="flex gap-2 pt-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
          Cancelar
        </button>
      </div>
    </>
  )
}

// ── Subcomponente: formulario para agregar integrante nuevo ───────────────────
function AgregarPersonaForm({
  casoId,
  onAdded,
  onCancel,
}: {
  casoId: string
  onAdded: (nueva: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_PERSONA_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function save() {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setSaving(true); setError('')
    const res = await fetch(`/api/casos/${casoId}/personas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, edad_aprox: form.edad_aprox || null }),
    })
    setSaving(false)
    if (res.ok) {
      const nueva = await res.json()
      onAdded(nueva)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo agregar el integrante.')
    }
  }

  return (
    <div className="border-2 border-dashed border-cyan-200 rounded-lg p-4 bg-cyan-50/30">
      <p className="text-xs font-semibold text-cyan-700 mb-1">Nuevo integrante</p>
      <PersonaFields form={form} set={set} />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="flex gap-2 pt-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {saving ? 'Agregando...' : 'Agregar integrante'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EditarCasoForm({
  caso,
  personas: initialPersonas,
  necesidades,
}: {
  caso: any
  personas: any[]
  necesidades: any[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [personas, setPersonas] = useState<any[]>(initialPersonas)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [necAbierta, setNecAbierta] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setError('')
    const fd = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    fd.forEach((val, key) => { body[key] = val.toString().trim() })

    const res = await fetch(`/api/casos/${caso.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      router.push(`/casos/${caso.id}`)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo guardar. Intenta de nuevo.')
    }
  }

  function onPersonaSaved(updated: any) {
    setPersonas(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
    setEditandoId(null)
  }

  function onPersonaAdded(nueva: any) {
    setPersonas(prev => [...prev, nueva])
    setAgregando(false)
  }

  async function eliminarPersona(id: string) {
    setEliminandoId(id)
    const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' })
    setEliminandoId(null)
    if (res.ok) {
      setPersonas(prev => prev.filter(p => p.id !== id))
      if (editandoId === id) setEditandoId(null)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'No se pudo eliminar el integrante.')
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Datos generales del caso ─────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos generales</p>

        <div>
          <label className={labelCls}>Nombre del caso</label>
          <input name="nombre_caso" defaultValue={caso.nombre_caso} required className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Estado del caso</label>
          <select name="estado" defaultValue={caso.estado} className={inputCls}>
            {ESTADOS_CASO.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Origen</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Ciudad de origen</label>
            <input name="ciudad_origen" defaultValue={caso.ciudad_origen ?? ''} placeholder="Ej: La Guaira" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado (Venezuela)</label>
            <input name="estado_origen" defaultValue={caso.estado_origen ?? ''} placeholder="Ej: Vargas" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Zona afectada (barrio o sector de origen)</label>
          <input name="zona_afectada" defaultValue={caso.zona_afectada ?? ''} placeholder="Ej: Barrio La Cruz" className={inputCls} />
        </div>

        <hr className="border-gray-100" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ubicación actual en Coro</p>

        <div>
          <label className={labelCls}>Sector en Coro</label>
          <input name="sector_coro" defaultValue={caso.sector_coro ?? ''} placeholder="Ej: Las Eugenias, Centro..." className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Dirección actual</label>
          <input name="direccion_actual" defaultValue={caso.direccion_actual ?? ''} placeholder="Calle, número de casa, referencia..." className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Tipo de alojamiento</label>
          <select name="tipo_alojamiento" defaultValue={caso.tipo_alojamiento ?? ''} className={inputCls}>
            <option value="">Sin especificar</option>
            {TIPOS_ALOJAMIENTO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href={`/casos/${caso.id}`}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition btn-press"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* ── Integrantes ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Integrantes · {personas.length}
          </p>
          {!agregando && (
            <button
              type="button"
              onClick={() => { setAgregando(true); setEditandoId(null) }}
              className="flex items-center gap-1.5 text-xs text-cyan-600 hover:text-cyan-800 font-medium border border-cyan-200 hover:border-cyan-400 px-2.5 py-1 rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Agregar integrante
            </button>
          )}
        </div>

        {personas.map(persona => (
          <div key={persona.id} className="border border-gray-100 rounded-lg p-3">
            {/* Cabecera de la persona */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[
                      persona.edad_aprox ? `${persona.edad_aprox} años` : null,
                      persona.rol_familia ? ROLES_FAMILIA.find(r => r.value === persona.rol_familia)?.label ?? persona.rol_familia : null,
                      persona.cedula ? `CI: ${persona.cedula}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(editandoId === persona.id ? null : persona.id)
                    setAgregando(false)
                  }}
                  className="text-xs text-cyan-600 hover:text-cyan-800 font-medium border border-cyan-200 hover:border-cyan-400 px-2.5 py-1 rounded-lg transition"
                >
                  {editandoId === persona.id ? 'Cerrar' : 'Editar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`¿Eliminar a ${persona.nombre} ${persona.apellido} del caso? Esta acción no se puede deshacer.`)) {
                      eliminarPersona(persona.id)
                    }
                  }}
                  disabled={eliminandoId === persona.id}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2 py-1 rounded-lg transition disabled:opacity-40"
                  title="Eliminar integrante"
                >
                  {eliminandoId === persona.id
                    ? <span className="text-xs">...</span>
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>

            {/* Editor expandible */}
            {editandoId === persona.id && (
              <PersonaEditor
                persona={persona}
                onSaved={onPersonaSaved}
                onCancel={() => setEditandoId(null)}
              />
            )}
          </div>
        ))}

        {/* Formulario para agregar nuevo integrante */}
        {agregando && (
          <AgregarPersonaForm
            casoId={caso.id}
            onAdded={onPersonaAdded}
            onCancel={() => setAgregando(false)}
          />
        )}

        {personas.length === 0 && !agregando && (
          <p className="text-sm text-gray-400 text-center py-4">
            No hay integrantes registrados en este caso.
          </p>
        )}
      </div>

      {/* ── Necesidades ──────────────────────────────────────────────────── */}
      {necesidades.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          <button
            type="button"
            onClick={() => setNecAbierta(a => !a)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-gray-600 transition"
          >
            <span>Necesidades registradas · {necesidades.length}</span>
            {necAbierta ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {necAbierta && (
            <div className="space-y-2">
              {necesidades.map((nec: any) => {
                const cfg = ESTADO_NEC_CONFIG[nec.estado] ?? ESTADO_NEC_CONFIG.pendiente
                const { Icon } = cfg
                return (
                  <div key={nec.id} className="flex items-center justify-between gap-2 text-sm border border-gray-50 rounded-lg px-3 py-2 bg-gray-50">
                    <span className="text-gray-700">{CATEGORIA_LABELS[nec.categoria] ?? nec.categoria}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
              <p className="text-xs text-gray-400 pt-1">
                Las entregas y detalles de cada necesidad se gestionan desde{' '}
                <Link href={`/casos/${caso.id}`} className="text-cyan-600 hover:underline">la ficha del caso</Link>.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
