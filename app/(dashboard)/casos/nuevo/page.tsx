'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Users, Check, Plus, X, ClipboardList } from 'lucide-react'
import CedulaInput from '@/components/ui/CedulaInput'
import TelefonoInput from '@/components/ui/TelefonoInput'
import { CATEGORIA_LABELS } from '@/lib/utils'

function CampoError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1">⚠ {msg}</p>
}

const ESTADOS_VENEZUELA = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital',
]

const TIPOS_ALOJAMIENTO = [
  { value: 'casa_familiar', label: 'Casa de un familiar o conocido' },
  { value: 'albergue', label: 'Albergue oficial' },
  { value: 'iglesia', label: 'Iglesia / centro comunitario' },
  { value: 'hotel', label: 'Hotel / posada' },
  { value: 'otro', label: 'Otro' },
]

interface PersonaForm {
  nombre: string
  apellido: string
  cedula: string
  edad_aprox: string
  edad_unidad: string
  fecha_nacimiento: string
  sexo: string
  rol_familia: string
  condicion_especial: string
  telefono: string
}

const personaVacia = (): PersonaForm => ({
  nombre: '', apellido: '', cedula: '', edad_aprox: '', edad_unidad: 'anios', fecha_nacimiento: '',
  sexo: 'no_especificado', rol_familia: '', condicion_especial: '', telefono: '',
})

// Necesidades definidas desde el registro (Fase 2)
interface ItemForm { texto: string; cantidad: string; persona_idx: number | null }
interface NecesidadForm {
  categoria: string
  descripcion: string
  es_recurrente: boolean
  frecuencia: string
  items: ItemForm[]
}
const necesidadVacia = (): NecesidadForm => ({
  categoria: 'alimentacion', descripcion: '', es_recurrente: false, frecuencia: 'semanal', items: [],
})

const PASOS = [
  { numero: 1, label: '¿Quién?' },
  { numero: 2, label: 'Ubicación' },
  { numero: 3, label: 'Personas' },
  { numero: 4, label: 'Necesidades' },
  { numero: 5, label: 'Seguimiento' },
]

export default function NuevoCasoPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [tipo, setTipo] = useState<'individual' | 'familiar'>('individual')
  const [serTutor, setSerTutor] = useState<'si' | 'no' | null>(null)
  const [datosCaso, setDatosCaso] = useState({
    nombre_caso: '',
    ciudad_origen: '',
    estado_origen: 'Falcón',
    zona_afectada: '',
    direccion_actual: '',
    tipo_alojamiento: 'casa_familiar',
    sector_coro: '',
  })
  const [sectoresCoro, setSectoresCoro] = useState<string[]>([])
  const [personas, setPersonas] = useState<PersonaForm[]>([personaVacia()])
  const [fotos, setFotos] = useState<(File | null)[]>([null])
  const [previews, setPreviews] = useState<(string | null)[]>([null])
  // Para familiar: índice del formulario actualmente abierto (null = todos confirmados)
  const [personaEditandoIdx, setPersonaEditandoIdx] = useState<number | null>(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({})
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])
  // Necesidades (Fase 2): se definen desde el registro
  const [necesidades, setNecesidades] = useState<NecesidadForm[]>([])
  const [necDraft, setNecDraft] = useState<NecesidadForm>(necesidadVacia())
  const [itemDraft, setItemDraft] = useState<ItemForm>({ texto: '', cantidad: '', persona_idx: null })

  const nombreIntegrante = (idx: number | null) => {
    if (idx === null || !personas[idx]) return 'Toda la familia'
    return `${personas[idx].nombre} ${personas[idx].apellido}`.trim() || `Integrante ${idx + 1}`
  }
  function agregarItemADraft() {
    const t = itemDraft.texto.trim()
    if (!t) return
    setNecDraft(prev => ({ ...prev, items: [...prev.items, { ...itemDraft, texto: t }] }))
    setItemDraft({ texto: '', cantidad: '', persona_idx: itemDraft.persona_idx })
  }
  function agregarNecesidadDraft() {
    setNecesidades(prev => [...prev, necDraft])
    setNecDraft(necesidadVacia())
    setItemDraft({ texto: '', cantidad: '', persona_idx: null })
  }
  function eliminarNecesidad(idx: number) {
    setNecesidades(prev => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    fetch('/api/sectores-coro').then(r => r.json()).then(setSectoresCoro).catch(() => {})
  }, [])

  function irACampo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const input = el.querySelector<HTMLElement>('input, select, textarea') ?? el as HTMLElement
      input.focus()
      if (input instanceof HTMLInputElement && input.type !== 'radio') input.select()
    }, 150)
  }

  function limpiarError(id: string) {
    setErroresCampos(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function actualizarPersona(idx: number, campo: string, valor: string) {
    setPersonas(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p))
  }

  function agregarPersona() {
    if (personaEditandoIdx !== null) return // bloquear si hay uno abierto
    const nuevoIdx = personas.length
    setPersonas(prev => [...prev, personaVacia()])
    setFotos(prev => [...prev, null])
    setPreviews(prev => [...prev, null])
    setPersonaEditandoIdx(nuevoIdx)
    setError('')
  }

  function confirmarIntegrante(idx: number) {
    const p = personas[idx]
    const errs: Record<string, string> = {}
    if (!p.nombre.trim()) errs[`p${idx}-nombre`] = 'El nombre es obligatorio.'
    if (!p.apellido.trim()) errs[`p${idx}-apellido`] = 'El apellido es obligatorio.'

    if (Object.keys(errs).length > 0) {
      setErroresCampos(errs)
      irACampo(Object.keys(errs)[0])
      return
    }
    setErroresCampos({})
    setError('')
    setPersonaEditandoIdx(null)
  }

  function editarIntegrante(idx: number) {
    setPersonaEditandoIdx(idx)
    setError('')
  }

  function eliminarPersona(idx: number) {
    setPersonas(prev => prev.filter((_, i) => i !== idx))
    setFotos(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      const url = prev[idx]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== idx)
    })
    // Si se elimina el que estaba abierto, cerrar el formulario activo
    setPersonaEditandoIdx(prev => {
      if (prev === null) return null
      if (prev === idx) return null
      if (prev > idx) return prev - 1
      return prev
    })
  }

  function seleccionarFoto(idx: number, file: File | null) {
    const prev = [...fotos]
    prev[idx] = file
    setFotos(prev)
    const prevUrls = [...previews]
    if (prevUrls[idx]) URL.revokeObjectURL(prevUrls[idx]!)
    prevUrls[idx] = file ? URL.createObjectURL(file) : null
    setPreviews(prevUrls)
  }

  async function subirFoto(file: File): Promise<string | undefined> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload-foto', { method: 'POST', body: fd })
    if (!res.ok) return undefined
    const data = await res.json()
    return data.path as string
  }

  function validarPaso(): string | null {
    if (paso === 1) {
      if (tipo === 'familiar' && !datosCaso.nombre_caso.trim()) {
        const id = 'campo-nombre-caso'
        setErroresCampos({ [id]: 'Escribe un nombre para identificar al grupo familiar.' })
        irACampo(id)
        return 'Hay campos obligatorios sin completar.'
      }
    }
    if (paso === 3) {
      if (tipo === 'familiar' && personaEditandoIdx !== null) {
        const p = personas[personaEditandoIdx]
        const errs: Record<string, string> = {}
        if (!p.nombre.trim()) errs[`p${personaEditandoIdx}-nombre`] = 'El nombre es obligatorio.'
        if (!p.apellido.trim()) errs[`p${personaEditandoIdx}-apellido`] = 'El apellido es obligatorio.'

        if (Object.keys(errs).length > 0) {
          setErroresCampos(errs)
          irACampo(Object.keys(errs)[0])
          return 'Completa los campos obligatorios antes de continuar.'
        }
        setPersonaEditandoIdx(null)
        return null
      }
      for (let i = 0; i < personas.length; i++) {
        if (!personas[i].nombre.trim() || !personas[i].apellido.trim()) {
          editarIntegrante(i)
          return `Integrante ${i + 1}: nombre y apellido son obligatorios.`
        }
      }
    }
    return null
  }

  function avanzar() {
    const err = validarPaso()
    if (err) { setError(err); return }
    setError('')
    setErroresCampos({})
    setPaso(p => Math.min(5, p + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retroceder() {
    setError('')
    setPaso(p => Math.max(1, p - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (serTutor === null) {
      const id = 'campo-ser-tutor'
      setErroresCampos({ [id]: 'Selecciona una opción antes de registrar.' })
      irACampo(id)
      return
    }
    setLoading(true)
    setError('')

    const fotoPaths = await Promise.all(
      fotos.map(foto => foto ? subirFoto(foto) : Promise.resolve(undefined))
    )

    const { nombre_caso: _nc, ...restoDatosCaso } = datosCaso
    const payload = {
      tipo,
      nombre_caso: tipo === 'individual'
        ? `${personas[0].nombre} ${personas[0].apellido}`.trim()
        : datosCaso.nombre_caso,
      ...restoDatosCaso,
      ser_tutor: serTutor === 'si',
      personas: personas.map((p, idx) => {
        const edadNum = p.edad_aprox ? parseInt(p.edad_aprox) : undefined
        const esMeses = p.edad_unidad === 'meses'
        return {
          nombre: p.nombre,
          apellido: p.apellido,
          cedula: p.cedula || undefined,
          sexo: p.sexo,
          rol_familia: p.rol_familia || undefined,
          condicion_especial: p.condicion_especial || undefined,
          telefono: p.telefono || undefined,
          fecha_nacimiento: p.fecha_nacimiento || undefined,
          edad_aprox: esMeses ? undefined : edadNum,
          edad_meses: esMeses ? edadNum : undefined,
          foto_url: fotoPaths[idx] || undefined,
        }
      }),
      necesidades: necesidades.map(n => ({
        categoria: n.categoria,
        descripcion: n.descripcion || undefined,
        es_recurrente: n.es_recurrente,
        frecuencia: n.es_recurrente ? n.frecuencia : undefined,
        items: n.items.map(it => ({
          texto: it.cantidad ? `${it.texto} ×${it.cantidad}` : it.texto,
          persona_idx: it.persona_idx,
        })),
      })),
    }

    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error === 'duplicado' ? `⚠️ ${data.mensaje}` : (data.error || 'Error al registrar'))
      setLoading(false)
      return
    }

    router.push(`/casos/${data.id}`)
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white transition'
  const inputErrCls = (id: string) => erroresCampos[id]
    ? 'w-full px-3 py-2.5 border border-red-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent text-sm bg-red-50 transition'
    : inputCls

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registrar nuevo caso</h2>
        <p className="text-gray-500 text-sm mt-1">Completa los datos del afectado o grupo familiar.</p>
      </div>

      {/* Barra de progreso */}
      <div className="flex items-center gap-0">
        {PASOS.map((p, i) => (
          <div key={p.numero} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                paso > p.numero ? 'bg-[#0891B2] text-white' :
                paso === p.numero ? 'bg-[#0891B2] text-white ring-4 ring-cyan-100' :
                'bg-gray-200 text-gray-500'
              }`}>
                {paso > p.numero ? '✓' : p.numero}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${paso === p.numero ? 'text-cyan-700 font-semibold' : 'text-gray-400'}`}>
                {p.label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition ${paso > p.numero ? 'bg-[#0891B2]' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Paso 1: Tipo + Procedencia */}
        {paso === 1 && (
          <div className="space-y-4">
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">¿A quién vas a registrar?</h3>
              <p className="text-xs text-gray-400 mb-4">Una persona sola o un grupo que vive junto y se atiende como unidad.</p>
              <div className="flex gap-4">
                {(['individual', 'familiar'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTipo(t)
                      if (t === 'individual') {
                        setPersonas([personaVacia()])
                        setFotos([null])
                        setPreviews([null])
                        setPersonaEditandoIdx(0)
                      } else {
                        setPersonaEditandoIdx(0)
                      }
                    }}
                    className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition ${
                      tipo === t
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {t === 'individual' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      {t === 'individual' ? 'Persona individual' : 'Grupo familiar'}
                    </span>
                  </button>
                ))}
              </div>
              {tipo === 'familiar' && (
                <div className="mt-4" id="campo-nombre-caso">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo familiar *</label>
                  <input
                    value={datosCaso.nombre_caso}
                    onChange={e => {
                      setDatosCaso(p => ({ ...p, nombre_caso: e.target.value }))
                      limpiarError('campo-nombre-caso')
                    }}
                    placeholder="Ej: Familia González Pérez"
                    className={inputErrCls('campo-nombre-caso')}
                  />
                  <CampoError msg={erroresCampos['campo-nombre-caso']} />
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-1">¿De dónde vienen?</h3>
              <p className="text-xs text-gray-400 mb-4">Ciudad y barrio donde vivían antes del terremoto.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / municipio de origen</label>
                  <input
                    value={datosCaso.ciudad_origen}
                    onChange={e => setDatosCaso(p => ({ ...p, ciudad_origen: e.target.value }))}
                    placeholder="Ej: Coro, Punto Fijo, La Vela..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={datosCaso.estado_origen}
                    onChange={e => setDatosCaso(p => ({ ...p, estado_origen: e.target.value }))}
                    className={inputCls}
                  >
                    {ESTADOS_VENEZUELA.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barrio o zona afectada</label>
                  <input
                    value={datosCaso.zona_afectada}
                    onChange={e => setDatosCaso(p => ({ ...p, zona_afectada: e.target.value }))}
                    placeholder="Ej: Barrio San Antonio, Centro Histórico..."
                    className={inputCls}
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Paso 2: Alojamiento */}
        {paso === 2 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">¿Dónde están alojados ahora?</h3>
              <p className="text-xs text-gray-400">Ubicación actual dentro de Coro.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alojamiento</label>
                <select
                  value={datosCaso.tipo_alojamiento}
                  onChange={e => setDatosCaso(p => ({ ...p, tipo_alojamiento: e.target.value }))}
                  className={inputCls}
                >
                  {TIPOS_ALOJAMIENTO.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector en Coro
                  <span className="text-gray-400 font-normal text-xs ml-1">(para ubicarlos rápido)</span>
                </label>
                <input
                  list="sectores-coro-list"
                  value={datosCaso.sector_coro}
                  onChange={e => setDatosCaso(p => ({ ...p, sector_coro: e.target.value }))}
                  placeholder="Ej: San José, Los Claritos..."
                  className={inputCls}
                />
                <datalist id="sectores-coro-list">
                  {sectoresCoro.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección actual</label>
                <input
                  value={datosCaso.direccion_actual}
                  onChange={e => setDatosCaso(p => ({ ...p, direccion_actual: e.target.value }))}
                  placeholder="Calle, número, referencia..."
                  className={inputCls}
                />
              </div>
            </div>
          </section>
        )}

        {/* Paso 3: Personas */}
        {paso === 3 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">
                {tipo === 'individual' ? 'Datos de la persona' : `Integrantes (${personas.length})`}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Nombre y apellido son obligatorios. La foto ayuda a identificar.</p>
            </div>

            <div className="space-y-3">
              {personas.map((persona, idx) => {
                const confirmado = tipo === 'familiar' && personaEditandoIdx !== idx

                /* ── Tarjeta compacta (confirmado) ── */
                if (confirmado) {
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                      {previews[idx] ? (
                        <img src={previews[idx]!} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 border border-dashed border-gray-300 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {persona.nombre} {persona.apellido}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {[
                            persona.edad_aprox ? `${persona.edad_aprox} años` : null,
                            persona.rol_familia ? persona.rol_familia : null,
                            persona.condicion_especial || null,
                          ].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => editarIntegrante(idx)}
                          className="text-xs text-cyan-600 hover:underline font-medium"
                        >
                          Editar
                        </button>
                        {personas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarPersona(idx)}
                            className="text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }

                /* ── Formulario activo ── */
                return (
                  <div key={idx} className="border-2 border-cyan-200 rounded-xl p-4 space-y-3 bg-cyan-50/30">
                    {tipo === 'familiar' && (
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-cyan-800">Integrante {idx + 1}</p>
                        {idx > 0 && (
                          <button type="button" onClick={() => eliminarPersona(idx)} className="text-xs text-gray-400 hover:text-red-500 transition">
                            ✕ Cancelar
                          </button>
                        )}
                      </div>
                    )}

                    {/* Foto */}
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {previews[idx] ? (
                          <img src={previews[idx]!} alt="Vista previa" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white border border-dashed border-gray-300 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">Foto <span className="text-gray-400">(opcional)</span></p>
                        <input
                          ref={el => { fileRefs.current[idx] = el }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => seleccionarFoto(idx, e.target.files?.[0] ?? null)}
                        />
                        <button type="button" onClick={() => fileRefs.current[idx]?.click()}
                          className="text-xs text-cyan-700 border border-cyan-200 bg-white hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition">
                          {previews[idx] ? 'Cambiar foto' : 'Agregar foto'}
                        </button>
                        {previews[idx] && (
                          <button type="button" onClick={() => seleccionarFoto(idx, null)}
                            className="ml-2 text-xs text-gray-400 hover:text-red-500 transition">
                            Quitar
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG · máx. 5 MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div id={`p${idx}-nombre`}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
                        <input
                          required
                          value={persona.nombre}
                          onChange={e => { actualizarPersona(idx, 'nombre', e.target.value); limpiarError(`p${idx}-nombre`) }}
                          className={inputErrCls(`p${idx}-nombre`)}
                        />
                        <CampoError msg={erroresCampos[`p${idx}-nombre`]} />
                      </div>
                      <div id={`p${idx}-apellido`}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Apellido <span className="text-red-500">*</span></label>
                        <input
                          required
                          value={persona.apellido}
                          onChange={e => { actualizarPersona(idx, 'apellido', e.target.value); limpiarError(`p${idx}-apellido`) }}
                          className={inputErrCls(`p${idx}-apellido`)}
                        />
                        <CampoError msg={erroresCampos[`p${idx}-apellido`]} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cédula / Documento</label>
                        <CedulaInput value={persona.cedula} onChange={val => actualizarPersona(idx, 'cedula', val)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de nacimiento <span className="text-gray-400">(opcional)</span></label>
                        <input type="date" value={persona.fecha_nacimiento} onChange={e => actualizarPersona(idx, 'fecha_nacimiento', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Edad aproximada</label>
                        <div className="flex gap-2">
                          <input type="number" min="0" max="120" value={persona.edad_aprox} onChange={e => actualizarPersona(idx, 'edad_aprox', e.target.value)} placeholder="Ej: 3" className={inputCls} />
                          <select value={persona.edad_unidad} onChange={e => actualizarPersona(idx, 'edad_unidad', e.target.value)} className={`${inputCls} w-auto`}>
                            <option value="anios">años</option>
                            <option value="meses">meses</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">Para recién nacidos, usa la opción de meses.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                        <select value={persona.sexo} onChange={e => actualizarPersona(idx, 'sexo', e.target.value)} className={inputCls}>
                          <option value="no_especificado">No especificado</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>
                      {tipo === 'familiar' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Rol en la familia</label>
                          <select value={persona.rol_familia} onChange={e => actualizarPersona(idx, 'rol_familia', e.target.value)} className={inputCls}>
                            <option value="">Seleccionar...</option>
                            <option value="padre">Padre</option>
                            <option value="madre">Madre</option>
                            <option value="hijo">Hijo</option>
                            <option value="hija">Hija</option>
                            <option value="adulto_mayor">Adulto mayor</option>
                            <option value="solo">Solo/a</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono <span className="text-gray-400">(privado)</span></label>
                        <TelefonoInput value={persona.telefono} onChange={val => actualizarPersona(idx, 'telefono', val)} className={inputCls} />
                      </div>
                      <div className={tipo === 'familiar' ? '' : 'sm:col-span-2'}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Condición especial</label>
                        <input value={persona.condicion_especial} onChange={e => actualizarPersona(idx, 'condicion_especial', e.target.value)} placeholder="Embarazo, discapacidad, medicación..." className={inputCls} />
                      </div>
                    </div>

                    {/* Botón confirmar — solo para familiar */}
                    {tipo === 'familiar' && (
                      <button
                        type="button"
                        onClick={() => confirmarIntegrante(idx)}
                        className="w-full mt-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Confirmar integrante {idx + 1}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Botón agregar — solo visible cuando todos están confirmados */}
            {tipo === 'familiar' && personaEditandoIdx === null && (
              <button
                type="button"
                onClick={agregarPersona}
                className="w-full py-2.5 border-2 border-dashed border-cyan-300 text-cyan-600 hover:border-cyan-400 hover:bg-cyan-50 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                + Agregar otro integrante
              </button>
            )}
          </section>
        )}

        {/* Paso 4: Necesidades */}
        {paso === 4 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyan-600" /> Necesidades del caso
              </h3>
              <p className="text-xs text-gray-400">
                Detalla desde ya lo que se necesita, por categoría y por integrante. Cada artículo (ej. cada
                medicina o cada prenda) se marca por separado cuando se entregue. Es opcional; puedes agregarlas luego al editar el caso.
              </p>
            </div>

            {/* Necesidades ya agregadas */}
            {necesidades.length > 0 && (
              <div className="space-y-2">
                {necesidades.map((n, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{CATEGORIA_LABELS[n.categoria] || n.categoria}
                        {n.es_recurrente && <span className="text-purple-600 text-xs font-normal"> · recurrente ({n.frecuencia})</span>}
                      </p>
                      <button type="button" onClick={() => eliminarNecesidad(i)} className="text-gray-300 hover:text-red-500 transition" aria-label="Quitar necesidad">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {n.descripcion && <p className="text-gray-500 text-xs mt-0.5">{n.descripcion}</p>}
                    {n.items.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {n.items.map((it, j) => (
                          <li key={j} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-cyan-500 shrink-0" />
                            {it.texto}{it.cantidad ? ` ×${it.cantidad}` : ''} <span className="text-cyan-600">· {nombreIntegrante(it.persona_idx)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constructor de una necesidad */}
            <div className="border border-cyan-200 bg-cyan-50 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-700">Agregar una necesidad</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                  <select value={necDraft.categoria} onChange={e => setNecDraft(p => ({ ...p, categoria: e.target.value }))} className={inputCls}>
                    {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descripción <span className="text-gray-400">(opcional)</span></label>
                  <input value={necDraft.descripcion} onChange={e => setNecDraft(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ej: medicinas crónicas, ropa por tallas..." className={inputCls} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={necDraft.es_recurrente} onChange={e => setNecDraft(p => ({ ...p, es_recurrente: e.target.checked }))} className="accent-cyan-600" />
                Es recurrente (se repite)
              </label>
              {necDraft.es_recurrente && (
                <select value={necDraft.frecuencia} onChange={e => setNecDraft(p => ({ ...p, frecuencia: e.target.value }))} className={`${inputCls} sm:w-auto`}>
                  <option value="semanal">Cada semana</option>
                  <option value="quincenal">Cada 15 días</option>
                  <option value="mensual">Mensual</option>
                </select>
              )}

              {/* Artículos de esta necesidad */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Artículos <span className="text-gray-400">(cada uno se marca por separado)</span></label>
                <div className="flex flex-wrap gap-2">
                  <input value={itemDraft.texto} onChange={e => setItemDraft(p => ({ ...p, texto: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarItemADraft() } }}
                    placeholder="Ej: Paracetamol 500mg" className={`${inputCls} flex-1 min-w-[130px]`} />
                  <input value={itemDraft.cantidad} onChange={e => setItemDraft(p => ({ ...p, cantidad: e.target.value }))} type="number" min="1" placeholder="Cant." className={`${inputCls} w-20`} />
                  <select value={itemDraft.persona_idx === null ? '' : String(itemDraft.persona_idx)} onChange={e => setItemDraft(p => ({ ...p, persona_idx: e.target.value === '' ? null : Number(e.target.value) }))} className={`${inputCls} w-auto`}>
                    <option value="">Toda la familia</option>
                    {personas.map((p, idx) => <option key={idx} value={idx}>{`${p.nombre} ${p.apellido}`.trim() || `Integrante ${idx + 1}`}</option>)}
                  </select>
                  <button type="button" onClick={agregarItemADraft} className="flex items-center gap-1 text-sm text-cyan-700 border border-cyan-200 bg-white px-2.5 py-2 rounded-lg hover:bg-cyan-100 transition whitespace-nowrap">
                    <Plus className="w-4 h-4" /> Ítem
                  </button>
                </div>
                {necDraft.items.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 mt-2">
                    {necDraft.items.map((it, j) => (
                      <li key={j} className="flex items-center gap-1 text-xs bg-white text-gray-700 border border-cyan-200 pl-2.5 pr-1 py-1 rounded-full">
                        {it.texto}{it.cantidad ? ` ×${it.cantidad}` : ''} <span className="text-cyan-600">· {nombreIntegrante(it.persona_idx)}</span>
                        <button type="button" onClick={() => setNecDraft(p => ({ ...p, items: p.items.filter((_, idx) => idx !== j) }))} className="text-gray-400 hover:text-red-500" aria-label="Quitar ítem"><X className="w-3.5 h-3.5" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="button" onClick={agregarNecesidadDraft}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Agregar esta necesidad
              </button>
            </div>
          </section>
        )}

        {/* Paso 5: Seguimiento */}
        {paso === 5 && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">¿Quieres hacerle seguimiento?</h3>
              <p className="text-xs text-gray-400">
                El tutor se compromete a estar pendiente del caso hasta que las necesidades estén resueltas.
              </p>
            </div>
            <div className="space-y-2" id="campo-ser-tutor">
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                serTutor === 'si' ? 'border-cyan-500 bg-cyan-50' : 'border-gray-200 hover:border-cyan-200'
              }`}>
                <input type="radio" name="ser_tutor" value="si" checked={serTutor === 'si'} onChange={() => { setSerTutor('si'); limpiarError('campo-ser-tutor') }} className="mt-0.5 accent-cyan-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">Sí, yo me encargo del seguimiento</p>
                  <p className="text-xs text-gray-400 mt-0.5">Quedarás asignado como tutor. Puedes liberarlo más adelante.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                serTutor === 'no' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="ser_tutor" value="no" checked={serTutor === 'no'} onChange={() => { setSerTutor('no'); limpiarError('campo-ser-tutor') }} className="mt-0.5 accent-amber-600" />
                <div>
                  <p className="font-medium text-sm text-gray-800">No, dejarlo disponible para otro voluntario</p>
                  <p className="text-xs text-gray-400 mt-0.5">El caso aparecerá como disponible para que alguien más lo tome.</p>
                </div>
              </label>
            </div>
            <CampoError msg={erroresCampos['campo-ser-tutor']} />

            {/* Resumen */}
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1 border border-gray-100">
              <p className="font-medium text-gray-700 mb-1.5">Resumen del registro</p>
              <p>Tipo: <span className="text-gray-800">{tipo === 'individual' ? 'Persona individual' : 'Grupo familiar'}</span></p>
              {tipo === 'familiar' && datosCaso.nombre_caso && (
                <p>Nombre: <span className="text-gray-800">{datosCaso.nombre_caso}</span></p>
              )}
              <p>Integrantes: <span className="text-gray-800">{personas.length}</span></p>
              <p>Necesidades: <span className="text-gray-800">{necesidades.length}</span></p>
              {datosCaso.ciudad_origen && (
                <p>Origen: <span className="text-gray-800">{datosCaso.ciudad_origen}, {datosCaso.estado_origen}</span></p>
              )}
              {datosCaso.sector_coro && (
                <p>Sector en Coro: <span className="text-gray-800">{datosCaso.sector_coro}</span></p>
              )}
            </div>
          </section>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex gap-3 mt-2">
          {paso > 1 ? (
            <button type="button" onClick={retroceder}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              ← Anterior
            </button>
          ) : (
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Cancelar
            </button>
          )}

          {paso < 5 ? (
            <button type="button" onClick={avanzar}
              className="flex-1 bg-[#0891B2] hover:bg-[#0C4A6E] text-white py-2.5 rounded-lg text-sm font-medium transition btn-press">
              Siguiente →
            </button>
          ) : (
            <button type="submit" disabled={loading || serTutor === null}
              className="flex-1 bg-[#0891B2] hover:bg-[#0C4A6E] text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50 btn-press">
              {loading ? 'Registrando...' : 'Registrar caso'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
