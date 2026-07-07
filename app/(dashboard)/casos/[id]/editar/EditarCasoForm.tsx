'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, UserPlus, Trash2, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Camera, X,
} from 'lucide-react'
import AgregarNecesidad from '@/components/casos/AgregarNecesidad'
import { CATEGORIA_LABELS } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const ESTADOS_VENEZUELA = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital',
]

const TIPOS_ALOJAMIENTO = [
  { value: 'casa_familiar', label: 'Casa de un familiar o conocido' },
  { value: 'albergue',      label: 'Albergue oficial' },
  { value: 'iglesia',       label: 'Iglesia / centro comunitario' },
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

const ESTADOS_CASO = [
  { value: 'activo',  label: 'Activo — en gestión activa' },
  { value: 'critico', label: 'Crítico — urgencia alta' },
  { value: 'estable', label: 'Estable — sin urgencia inmediata' },
  { value: 'cerrado', label: 'Cerrado — caso resuelto' },
]

const PASOS = [
  { numero: 1, label: 'General' },
  { numero: 2, label: 'Ubicación' },
  { numero: 3, label: 'Personas' },
  { numero: 4, label: 'Necesidades' },
]

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white transition'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

// ── PersonaEditor ─────────────────────────────────────────────────────────────

interface PersonaFormState {
  nombre: string; apellido: string; cedula: string
  edad_aprox: string; edad_unidad: 'anios' | 'meses'
  fecha_nacimiento: string; sexo: string
  rol_familia: string; condicion_especial: string; telefono: string
}

function personaToForm(p: any): PersonaFormState {
  return {
    nombre:             p.nombre ?? '',
    apellido:           p.apellido ?? '',
    cedula:             p.cedula ?? '',
    edad_aprox:         p.edad_meses != null ? String(p.edad_meses) : (p.edad_aprox != null ? String(p.edad_aprox) : ''),
    edad_unidad:        p.edad_meses != null ? 'meses' : 'anios',
    fecha_nacimiento:   p.fecha_nacimiento ?? '',
    sexo:               p.sexo ?? '',
    rol_familia:        p.rol_familia ?? '',
    condicion_especial: p.condicion_especial ?? '',
    telefono:           p.telefono ?? '',
  }
}

async function subirFoto(file: File): Promise<string | undefined> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload-foto', { method: 'POST', body: fd })
  if (!res.ok) return undefined
  return (await res.json()).path as string
}

function FotoInput({
  preview,
  onSelect,
}: {
  preview: string | null
  onSelect: (file: File | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0">
        {preview ? (
          <img src={preview} alt="Foto" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className={labelCls}>Foto <span className="text-gray-400 font-normal">(opcional)</span></p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => onSelect(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-cyan-700 border border-cyan-200 bg-white hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition"
        >
          <Camera className="w-3.5 h-3.5" />
          {preview ? 'Cambiar foto' : 'Agregar foto'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="ml-2 text-xs text-gray-400 hover:text-red-500 transition"
          >
            Quitar
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1">JPG, PNG · máx. 5 MB</p>
      </div>
    </div>
  )
}

function CamposPersona({
  form,
  set,
}: {
  form: PersonaFormState
  set: (f: keyof PersonaFormState, v: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nombre <span className="text-red-500">*</span></label>
          <input value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Apellido <span className="text-red-500">*</span></label>
          <input value={form.apellido} onChange={e => set('apellido', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cédula</label>
          <input
            value={form.cedula}
            onChange={e => set('cedula', e.target.value)}
            placeholder="V-12345678"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Fecha de nacimiento</label>
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={e => set('fecha_nacimiento', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Edad</label>
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <input
            type="number"
            min="0"
            max="999"
            value={form.edad_aprox}
            onChange={e => set('edad_aprox', e.target.value)}
            placeholder="0"
            className={inputCls}
          />
          <select
            value={form.edad_unidad}
            onChange={e => set('edad_unidad', e.target.value as 'anios' | 'meses')}
            className={inputCls}
          >
            <option value="anios">Años</option>
            <option value="meses">Meses</option>
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-1">Usa meses para bebés menores de 2 años.</p>
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
        <label className={labelCls}>Condición especial <span className="text-gray-400 font-normal">(salud, movilidad...)</span></label>
        <input
          value={form.condicion_especial}
          onChange={e => set('condicion_especial', e.target.value)}
          placeholder="Ej: Diabetes, asma, discapacidad motriz..."
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Teléfono</label>
        <input
          value={form.telefono}
          onChange={e => set('telefono', e.target.value)}
          placeholder="04XX-XXXXXXX"
          className={inputCls}
        />
      </div>
    </>
  )
}

function PersonaEditor({
  persona,
  onSaved,
  onCancel,
  onEliminar,
}: {
  persona: any
  onSaved: (updated: any) => void
  onCancel: () => void
  onEliminar: () => void
}) {
  const [form, setForm] = useState<PersonaFormState>(personaToForm(persona))
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(persona.foto_signed_url ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof PersonaFormState, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function seleccionarFoto(file: File | null) {
    setFotoFile(file)
    if (fotoPreview && fotoPreview !== persona.foto_signed_url) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(file ? URL.createObjectURL(file) : (persona.foto_signed_url ?? null))
  }

  async function save() {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setSaving(true); setError('')

    let foto_url = persona.foto_url
    if (fotoFile) {
      const path = await subirFoto(fotoFile)
      if (path) foto_url = path
    }

    const body: Record<string, unknown> = {
      nombre:             form.nombre.trim(),
      apellido:           form.apellido.trim(),
      cedula:             form.cedula || null,
      fecha_nacimiento:   form.fecha_nacimiento || null,
      sexo:               form.sexo || null,
      rol_familia:        form.rol_familia || null,
      condicion_especial: form.condicion_especial || null,
      telefono:           form.telefono || null,
    }

    if (form.edad_unidad === 'meses') {
      body.edad_meses = form.edad_aprox ? parseInt(form.edad_aprox) : null
      body.edad_aprox = null
    } else {
      body.edad_aprox = form.edad_aprox ? parseInt(form.edad_aprox) : null
      body.edad_meses = null
    }

    if (foto_url !== persona.foto_url) body.foto_url = foto_url

    const res = await fetch(`/api/personas/${persona.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      onSaved({ ...updated, foto_signed_url: fotoPreview })
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo guardar.')
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
      <FotoInput preview={fotoPreview} onSelect={seleccionarFoto} />
      <CamposPersona form={form} set={set} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition btn-press"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? 'Guardando...' : 'Guardar integrante'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </div>
  )
}

// ── AgregarPersonaForm ────────────────────────────────────────────────────────

const EMPTY_FORM: PersonaFormState = {
  nombre: '', apellido: '', cedula: '', edad_aprox: '', edad_unidad: 'anios',
  fecha_nacimiento: '', sexo: '', rol_familia: '', condicion_especial: '', telefono: '',
}

function AgregarPersonaForm({
  casoId,
  onAdded,
  onCancel,
}: {
  casoId: string
  onAdded: (nueva: any) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<PersonaFormState>({ ...EMPTY_FORM })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof PersonaFormState, val: string) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function seleccionarFoto(file: File | null) {
    setFotoFile(file)
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoPreview(file ? URL.createObjectURL(file) : null)
  }

  async function save() {
    if (!form.nombre.trim() || !form.apellido.trim()) {
      setError('Nombre y apellido son obligatorios.')
      return
    }
    setSaving(true); setError('')

    let foto_url: string | undefined
    if (fotoFile) foto_url = await subirFoto(fotoFile)

    const body: Record<string, unknown> = {
      nombre:             form.nombre.trim(),
      apellido:           form.apellido.trim(),
      cedula:             form.cedula || undefined,
      fecha_nacimiento:   form.fecha_nacimiento || undefined,
      sexo:               form.sexo || undefined,
      rol_familia:        form.rol_familia || undefined,
      condicion_especial: form.condicion_especial || undefined,
      telefono:           form.telefono || undefined,
      foto_url,
    }

    if (form.edad_unidad === 'meses') {
      body.edad_meses = form.edad_aprox ? parseInt(form.edad_aprox) : undefined
    } else {
      body.edad_aprox = form.edad_aprox ? parseInt(form.edad_aprox) : undefined
    }

    const res = await fetch(`/api/casos/${casoId}/personas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      const nueva = await res.json()
      onAdded({ ...nueva, foto_signed_url: fotoPreview })
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo agregar el integrante.')
    }
  }

  return (
    <div className="border-2 border-dashed border-cyan-200 rounded-xl p-4 bg-cyan-50/30 space-y-3">
      <p className="text-xs font-semibold text-cyan-700">Nuevo integrante</p>
      <FotoInput preview={fotoPreview} onSelect={seleccionarFoto} />
      <CamposPersona form={form} set={set} />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition btn-press"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {saving ? 'Agregando...' : 'Agregar integrante'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditarCasoForm({
  caso,
  personas: initialPersonas,
  necesidades,
  esAdmin = false,
}: {
  caso: any
  personas: any[]
  necesidades: any[]
  esAdmin?: boolean
}) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [sectoresCoro, setSectoresCoro] = useState<string[]>([])
  const [necesidadesLocales, setNecesidadesLocales] = useState<any[]>(necesidades)
  const [eliminandoNecId, setEliminandoNecId] = useState<string | null>(null)

  const [datosCaso, setDatosCaso] = useState({
    nombre_caso:      caso.nombre_caso ?? '',
    estado:           caso.estado ?? 'activo',
    ciudad_origen:    caso.ciudad_origen ?? '',
    estado_origen:    caso.estado_origen ?? '',
    zona_afectada:    caso.zona_afectada ?? '',
    tipo_alojamiento: caso.tipo_alojamiento ?? '',
    sector_coro:      caso.sector_coro ?? '',
    direccion_actual: caso.direccion_actual ?? '',
  })

  const [personas, setPersonas] = useState<any[]>(initialPersonas)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [savingCaso, setSavingCaso] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/sectores-coro').then(r => r.json()).then(setSectoresCoro).catch(() => {})
  }, [])

  function setCaso(field: string, val: string) {
    setDatosCaso(prev => ({ ...prev, [field]: val }))
  }

  async function guardarCaso(): Promise<boolean> {
    setSavingCaso(true); setError('')
    const body: Record<string, unknown> = {}
    if (paso === 1) {
      body.nombre_caso   = datosCaso.nombre_caso
      body.estado        = datosCaso.estado
      body.ciudad_origen = datosCaso.ciudad_origen || null
      body.estado_origen = datosCaso.estado_origen || null
      body.zona_afectada = datosCaso.zona_afectada || null
    } else if (paso === 2) {
      body.tipo_alojamiento = datosCaso.tipo_alojamiento || null
      body.sector_coro      = datosCaso.sector_coro || null
      body.direccion_actual  = datosCaso.direccion_actual || null
    }
    const res = await fetch(`/api/casos/${caso.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingCaso(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo guardar. Intenta de nuevo.')
      return false
    }
    return true
  }

  async function avanzar() {
    if (paso <= 2) {
      const ok = await guardarCaso()
      if (!ok) return
    }
    setError('')
    setPaso(p => Math.min(4, p + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retroceder() {
    setError('')
    setPaso(p => Math.max(1, p - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardarYVolver() {
    if (paso <= 2) {
      const ok = await guardarCaso()
      if (!ok) return
    }
    router.push(`/casos/${caso.id}`)
    router.refresh()
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

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const Progreso = (
    <div className="flex items-center justify-between mb-6">
      {PASOS.map((p, i) => {
        const activo = p.numero === paso
        const completado = p.numero < paso
        return (
          <div key={p.numero} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                completado
                  ? 'bg-cyan-600 text-white'
                  : activo
                  ? 'bg-cyan-600 text-white ring-4 ring-cyan-100'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {completado ? <Check className="w-3.5 h-3.5" /> : p.numero}
              </div>
              <span className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                activo ? 'text-cyan-700' : completado ? 'text-cyan-500' : 'text-gray-400'
              }`}>
                {p.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition ${completado ? 'bg-cyan-400' : 'bg-gray-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  // ── Bottom nav ────────────────────────────────────────────────────────────────
  const NavButtons = (
    <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
      <div className="flex items-center gap-3">
        {paso > 1 ? (
          <button
            type="button"
            onClick={retroceder}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>
        ) : (
          <Link
            href={`/casos/${caso.id}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" /> Cancelar
          </Link>
        )}
        <button
          type="button"
          onClick={guardarYVolver}
          disabled={savingCaso}
          className="text-sm text-gray-400 hover:text-cyan-600 transition"
        >
          Guardar y volver
        </button>
      </div>

      {paso < 4 ? (
        <button
          type="button"
          onClick={avanzar}
          disabled={savingCaso}
          className="flex items-center gap-1.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition btn-press"
        >
          {savingCaso ? 'Guardando...' : 'Continuar'}
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { router.push(`/casos/${caso.id}`); router.refresh() }}
          className="flex items-center gap-1.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-lg text-sm font-medium transition btn-press"
        >
          <CheckCircle2 className="w-4 h-4" /> Ver caso
        </button>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      {Progreso}

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* ── Paso 1: General ──────────────────────────────────────────────── */}
      {paso === 1 && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre del caso <span className="text-red-500">*</span></label>
            <input
              value={datosCaso.nombre_caso}
              onChange={e => setCaso('nombre_caso', e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Estado del caso</label>
            <select value={datosCaso.estado} onChange={e => setCaso('estado', e.target.value)} className={inputCls}>
              {ESTADOS_CASO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lugar de origen</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Ciudad</label>
              <input
                value={datosCaso.ciudad_origen}
                onChange={e => setCaso('ciudad_origen', e.target.value)}
                placeholder="Ej: La Guaira"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Estado (Venezuela)</label>
              <input
                list="estados-vzla"
                value={datosCaso.estado_origen}
                onChange={e => setCaso('estado_origen', e.target.value)}
                placeholder="Ej: Vargas"
                className={inputCls}
              />
              <datalist id="estados-vzla">
                {ESTADOS_VENEZUELA.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className={labelCls}>Zona afectada <span className="text-gray-400 font-normal">(barrio o sector de origen)</span></label>
            <input
              value={datosCaso.zona_afectada}
              onChange={e => setCaso('zona_afectada', e.target.value)}
              placeholder="Ej: Barrio La Cruz"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* ── Paso 2: Ubicación ────────────────────────────────────────────── */}
      {paso === 2 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ubicación actual en Coro</p>

          <div>
            <label className={labelCls}>Tipo de alojamiento</label>
            <select value={datosCaso.tipo_alojamiento} onChange={e => setCaso('tipo_alojamiento', e.target.value)} className={inputCls}>
              <option value="">Sin especificar</option>
              {TIPOS_ALOJAMIENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Sector en Coro</label>
            <input
              list="sectores-coro-list"
              value={datosCaso.sector_coro}
              onChange={e => setCaso('sector_coro', e.target.value)}
              placeholder="Ej: Las Eugenias, Centro..."
              className={inputCls}
            />
            <datalist id="sectores-coro-list">
              {sectoresCoro.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label className={labelCls}>Dirección actual</label>
            <input
              value={datosCaso.direccion_actual}
              onChange={e => setCaso('direccion_actual', e.target.value)}
              placeholder="Calle, número de casa, referencia..."
              className={inputCls}
            />
          </div>
        </div>
      )}

      {/* ── Paso 3: Personas ────────────────────────────────────────────── */}
      {paso === 3 && (
        <div className="space-y-3">
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
                <UserPlus className="w-3.5 h-3.5" /> Agregar integrante
              </button>
            )}
          </div>

          {personas.map(persona => (
            <div key={persona.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2">
                {persona.foto_signed_url ? (
                  <img
                    src={persona.foto_signed_url}
                    alt={persona.nombre}
                    className="w-10 h-10 shrink-0 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-xs text-gray-400">
                    {[
                      persona.edad_meses
                        ? `${persona.edad_meses} ${persona.edad_meses === 1 ? 'mes' : 'meses'}`
                        : persona.edad_aprox
                        ? `${persona.edad_aprox} años`
                        : null,
                      ROLES_FAMILIA.find(r => r.value === persona.rol_familia)?.label ?? persona.rol_familia,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setEditandoId(editandoId === persona.id ? null : persona.id); setAgregando(false) }}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-medium border border-cyan-200 hover:border-cyan-400 px-2.5 py-1 rounded-lg transition"
                  >
                    {editandoId === persona.id ? 'Cerrar' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (confirm(`¿Eliminar a ${persona.nombre} ${persona.apellido}? Esta acción no se puede deshacer.`)) eliminarPersona(persona.id) }}
                    disabled={eliminandoId === persona.id}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-2 py-1 rounded-lg transition disabled:opacity-40"
                    title="Eliminar integrante"
                  >
                    {eliminandoId === persona.id ? <span className="text-[10px]">...</span> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {editandoId === persona.id && (
                <PersonaEditor
                  persona={persona}
                  onSaved={onPersonaSaved}
                  onCancel={() => setEditandoId(null)}
                  onEliminar={() => {
                    if (confirm(`¿Eliminar a ${persona.nombre} ${persona.apellido}? Esta acción no se puede deshacer.`)) {
                      eliminarPersona(persona.id)
                    }
                  }}
                />
              )}
            </div>
          ))}

          {agregando && (
            <AgregarPersonaForm
              casoId={caso.id}
              onAdded={onPersonaAdded}
              onCancel={() => setAgregando(false)}
            />
          )}

          {personas.length === 0 && !agregando && (
            <p className="text-sm text-gray-400 text-center py-6">
              No hay integrantes registrados en este caso.
            </p>
          )}
        </div>
      )}

      {/* ── Paso 4: Necesidades ──────────────────────────────────────────── */}
      {paso === 4 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Necesidades · {necesidadesLocales.length}
          </p>

          {necesidadesLocales.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay necesidades registradas aún.
            </p>
          )}

          {necesidadesLocales.map((nec: any) => {
            const catLabel = CATEGORIA_LABELS[nec.categoria as keyof typeof CATEGORIA_LABELS] ?? nec.categoria
            const items: { texto: string }[] = nec.items_entrega?.items ?? []
            return (
              <div key={nec.id} className="flex items-start justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{catLabel}</p>
                  {nec.descripcion && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{nec.descripcion}</p>
                  )}
                  {items.length > 0 && (
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {items.map((it, i) => (
                        <li key={i} className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{it.texto}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {esAdmin && (
                  <button
                    type="button"
                    disabled={eliminandoNecId === nec.id}
                    onClick={async () => {
                      if (!confirm(`¿Eliminar la necesidad "${catLabel}"?`)) return
                      setEliminandoNecId(nec.id)
                      await fetch(`/api/necesidades?id=${nec.id}`, { method: 'DELETE' })
                      setNecesidadesLocales(prev => prev.filter(n => n.id !== nec.id))
                      setEliminandoNecId(null)
                    }}
                    className="shrink-0 text-gray-300 hover:text-red-500 disabled:opacity-40 transition"
                    aria-label="Eliminar necesidad"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}

          <div className="pt-1">
            <AgregarNecesidad
              casoId={caso.id}
              personas={personas.map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido }))}
              necesidadesExistentes={necesidadesLocales.map(n => ({ id: n.id, categoria: n.categoria }))}
            />
          </div>
        </div>
      )}

      {NavButtons}
    </div>
  )
}
