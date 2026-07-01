'use client'
import { useRef, useState, useCallback } from 'react'
import { CheckCircle2, Loader2, AlertCircle, Plus, X } from 'lucide-react'
import EspecialidadTags from '@/components/ui/EspecialidadTags'
import TelefonoInput from '@/components/ui/TelefonoInput'
import CedulaInput from '@/components/ui/CedulaInput'
import AvatarUpload from '@/components/ui/AvatarUpload'

interface PerfilData {
  nombre_completo: string
  cedula?: string | null
  telefono?: string | null
  areas_ayuda?: string[] | null
  especialidades?: string[] | null
  zona_cobertura?: string | null
  disponibilidad?: string | null
  descripcion_ayuda?: string | null
  [key: string]: unknown
}

const AREAS_PREDEFINIDAS = [
  { clave: 'traslado',     label: 'Traslado y logística' },
  { clave: 'medico',       label: 'Atención médica' },
  { clave: 'psicologia',   label: 'Apoyo psicológico' },
  { clave: 'legal',        label: 'Asesoría legal' },
  { clave: 'alimentacion', label: 'Alimentos' },
  { clave: 'alojamiento',  label: 'Alojamiento' },
  { clave: 'donaciones',   label: 'Donaciones e insumos' },
  { clave: 'construccion', label: 'Construcción y reparación' },
  { clave: 'ninos',        label: 'Cuidado de niños' },
  { clave: 'campo',        label: 'Visitas presenciales' },
  { clave: 'coordinacion', label: 'Registro y coordinación' },
]

const CLAVES_PREDEFINIDAS = new Set(AREAS_PREDEFINIDAS.map(a => a.clave))

type Errores = Partial<Record<'nombre' | 'cedula' | 'telefono', string>>

function cls(error?: string) {
  return `w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-800 bg-white transition ${
    error ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-cyan-500'
  }`
}

function CampoError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  )
}

function completitudLabel(pct: number) {
  if (pct === 100) return { texto: 'Perfil completo', color: 'text-green-600 bg-green-50 border-green-200' }
  if (pct >= 75)   return { texto: 'Casi completo',   color: 'text-cyan-700 bg-cyan-50 border-cyan-200' }
  if (pct >= 50)   return { texto: 'Perfil parcial',  color: 'text-amber-700 bg-amber-50 border-amber-200' }
  return                  { texto: 'Perfil básico',   color: 'text-gray-600 bg-gray-50 border-gray-200' }
}

function enfocarPrimerError(errores: Errores) {
  const orden: (keyof Errores)[] = ['nombre', 'cedula', 'telefono']
  for (const key of orden) {
    if (errores[key]) {
      const el = document.getElementById(`campo-${key}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const focusable = el.querySelector<HTMLElement>('input, select, textarea')
          focusable?.focus()
        }, 120)
      }
      break
    }
  }
}

export default function PerfilForm({ perfil, avatarUrl }: { perfil: PerfilData; avatarUrl: string | null }) {
  const [nombre, setNombre] = useState(perfil.nombre_completo ?? '')
  const [cedula, setCedula] = useState(perfil.cedula ?? '')
  const [telefono, setTelefono] = useState(perfil.telefono ?? '')
  const [areas, setAreas] = useState<string[]>(perfil.areas_ayuda ?? [])
  const [especialidades, setEspecialidades] = useState<string[]>(perfil.especialidades ?? [])
  const [zona, setZona] = useState(perfil.zona_cobertura ?? '')
  const [disponibilidad, setDisponibilidad] = useState(perfil.disponibilidad ?? '')
  const [descripcion, setDescripcion] = useState(perfil.descripcion_ayuda ?? '')
  const [errores, setErrores] = useState<Errores>({})
  const [errorServidor, setErrorServidor] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  // Categoría personalizada
  const [categoriaInput, setCategoriaInput] = useState('')
  const categoriaRef = useRef<HTMLInputElement>(null)

  function toggleArea(clave: string) {
    setAreas(prev => prev.includes(clave) ? prev.filter(a => a !== clave) : [...prev, clave])
  }

  function agregarCategoriaPersonalizada() {
    const val = categoriaInput.trim()
    if (!val || areas.includes(val)) return
    setAreas(prev => [...prev, val])
    setCategoriaInput('')
    categoriaRef.current?.focus()
  }

  function quitarArea(area: string) {
    setAreas(prev => prev.filter(a => a !== area))
  }

  const completitud = [
    especialidades.length > 0,
    !!zona.trim(),
    !!disponibilidad.trim(),
    !!descripcion.trim(),
  ].filter(Boolean).length * 25

  const { texto: labelTexto, color: labelColor } = completitudLabel(completitud)

  function limpiarError(campo: keyof Errores) {
    if (errores[campo]) setErrores(prev => { const e = { ...prev }; delete e[campo]; return e })
  }

  const validar = useCallback((): Errores => {
    const e: Errores = {}
    const digitosTel = telefono.replace(/\D/g, '')
    const digitosCed = cedula.replace(/[^0-9]/g, '')

    if (!nombre.trim() || nombre.trim().length < 3)
      e.nombre = 'El nombre completo es obligatorio (al menos 3 caracteres).'

    if (!cedula.trim() || !/^[VEJPG]-/.test(cedula) || digitosCed.length < 5)
      e.cedula = 'La cédula es necesaria para verificar tu identidad. Selecciona el tipo y escribe el número.'

    if (digitosTel.length < 10)
      e.telefono = 'El teléfono de contacto es obligatorio. Ej: (0412) 456-7899.'

    return e
  }, [nombre, cedula, telefono])

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const e_ = validar()
    if (Object.keys(e_).length > 0) {
      setErrores(e_)
      enfocarPrimerError(e_)
      return
    }
    setLoading(true)
    setErrorServidor('')
    setExito(false)

    const res = await fetch('/api/voluntarios/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_completo: nombre,
        cedula,
        telefono,
        areas_ayuda: areas,
        especialidades,
        zona_cobertura: zona,
        disponibilidad,
        descripcion_ayuda: descripcion,
      }),
    })
    const data = await res.json()

    if (!res.ok) { setErrorServidor(data.error || 'Error al guardar'); setLoading(false); return }
    setExito(true)
    setLoading(false)
    // Solo mostramos aviso si el servidor guardó parcialmente por migración pendiente
    if (data.aviso) setErrorServidor(data.aviso)
    setTimeout(() => setExito(false), 4000)
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-5">

      {/* Foto de perfil — independiente del resto del form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <AvatarUpload currentUrl={avatarUrl} nombre={nombre} />
      </div>

      {/* Barra de completitud */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Estado del perfil</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${labelColor}`}>
            {labelTexto}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500 bg-[#0891B2]"
            style={{ width: `${completitud}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {completitud < 100
            ? 'Completa tu perfil para que el sistema pueda conectarte con los casos más relevantes para tus habilidades.'
            : 'Tu perfil está completo. El sistema priorizará los casos que necesiten tus habilidades.'}
        </p>
      </div>

      {/* Datos de identificación — todos editables y requeridos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Datos de identificación</h3>
          <p className="text-xs text-gray-400 mt-1">
            Necesitamos que esta información esté completa y correcta para verificar tu identidad y poder contactarte.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Nombre */}
          <div id="campo-nombre" className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => { setNombre(e.target.value); limpiarError('nombre') }}
              required
              maxLength={120}
              placeholder="Nombre y apellido completos"
              className={cls(errores.nombre)}
            />
            <CampoError msg={errores.nombre} />
          </div>

          {/* Cédula */}
          <div id="campo-cedula">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Cédula de identidad <span className="text-red-500">*</span>
            </label>
            <div className={errores.cedula ? 'ring-2 ring-red-400 rounded-lg' : ''}>
              <CedulaInput
                value={cedula}
                onChange={val => { setCedula(val); limpiarError('cedula') }}
                className={cls(errores.cedula)}
              />
            </div>
            <CampoError msg={errores.cedula} />
          </div>

          {/* Teléfono */}
          <div id="campo-telefono">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Teléfono / WhatsApp <span className="text-red-500">*</span>
            </label>
            <TelefonoInput
              value={telefono}
              onChange={val => { setTelefono(val); limpiarError('telefono') }}
              className={cls(errores.telefono)}
            />
            <CampoError msg={errores.telefono} />
          </div>
        </div>

        {/* Áreas de ayuda — editables */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">Áreas de ayuda</p>

          {/* Predefinidas */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {AREAS_PREDEFINIDAS.map(a => (
              <button
                key={a.clave}
                type="button"
                onClick={() => toggleArea(a.clave)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${
                  areas.includes(a.clave)
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'border-gray-200 text-gray-500 hover:border-cyan-400'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Tags personalizados */}
          {areas.filter(a => !CLAVES_PREDEFINIDAS.has(a)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {areas.filter(a => !CLAVES_PREDEFINIDAS.has(a)).map(a => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full"
                >
                  {a}
                  <button type="button" onClick={() => quitarArea(a)} className="hover:text-red-500 transition" aria-label={`Quitar ${a}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input categoría personalizada */}
          <div className="flex gap-2">
            <input
              ref={categoriaRef}
              type="text"
              value={categoriaInput}
              onChange={e => setCategoriaInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarCategoriaPersonalizada() } }}
              placeholder="Otra área no listada… (Enter para agregar)"
              maxLength={60}
              className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={agregarCategoriaPersonalizada}
              disabled={!categoriaInput.trim()}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Especialidades */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Especialidades y habilidades</h3>
          <p className="text-sm text-gray-500 mt-1">
            Sé específico. En lugar de &ldquo;médico&rdquo;, escribe &ldquo;Pediatría&rdquo; o &ldquo;Medicina de emergencia&rdquo;.
            El sistema usará esto para conectarte con los casos que más necesitan tu conocimiento.
          </p>
        </div>

        <EspecialidadTags
          tags={especialidades}
          onChange={setEspecialidades}
          placeholder="Ej: Pediatría, Electricidad domiciliaria, Psicología clínica..."
        />

        {especialidades.length > 0 && (
          <div className="mt-3 bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2.5 text-xs text-cyan-700">
            El sistema priorizará en tu panel los casos que registren necesidades relacionadas con:{' '}
            <strong>{especialidades.join(', ')}</strong>.
          </div>
        )}
      </div>

      {/* Disponibilidad y zona */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Disponibilidad y cobertura</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Cuándo puedes ayudar?
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={disponibilidad}
            onChange={e => setDisponibilidad(e.target.value)}
            placeholder="Ej: Lunes y miércoles por la tarde, fines de semana completos..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-gray-800 bg-white transition"
            maxLength={300}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zona de Coro donde puedes moverte
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={zona}
            onChange={e => setZona(e.target.value)}
            placeholder="Ej: Coro norte, San José, cualquier sector..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-gray-800 bg-white transition"
            maxLength={200}
          />
        </div>
      </div>

      {/* Notas adicionales */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ¿Algo más que quieras agregar?
          <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Recursos, contactos, herramientas o cualquier habilidad puntual que no encaje en las categorías anteriores — pero que pueda ser útil cuando alguien lo necesite.
        </p>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Ej: Tengo un camión disponible los fines de semana. Conozco a un médico en Coro que atiende gratis..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-gray-800 bg-white transition resize-none"
        />
      </div>

      {errorServidor && (
        <div className={`px-3 py-2.5 rounded-lg text-sm flex items-start gap-2 ${
          exito && errorServidor
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {errorServidor}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0891B2] hover:bg-[#0C4A6E] text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 btn-press flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
        ) : exito ? (
          <><CheckCircle2 className="w-4 h-4" /> Guardado</>
        ) : (
          'Guardar perfil'
        )}
      </button>
    </form>
  )
}
