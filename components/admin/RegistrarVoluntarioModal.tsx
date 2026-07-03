'use client'
import { useEffect, useRef, useState } from 'react'
import {
  UserPlus, X, CheckCircle2, Copy, Check,
  Eye, EyeOff, AlertTriangle, Plus,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

function CampoError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1">⚠ {msg}</p>
}

const AREAS_PRINCIPALES = [
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

// Claves predefinidas para distinguirlas de las personalizadas al renderizar
const CLAVES_PREDEFINIDAS = new Set(AREAS_PRINCIPALES.map(a => a.clave))

interface Props {
  open: boolean
  onClose: () => void
  onRegistrado: () => void
}

interface Credenciales {
  nombre_completo: string
  email: string
  tempPassword: string
}

export default function RegistrarVoluntarioModal({ open, onClose, onRegistrado }: Props) {
  const toast = useToast()
  const [fase, setFase] = useState<'form' | 'exito'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({})
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null)
  const [copiado, setCopiado] = useState<'email' | 'pass' | null>(null)
  const [mostrarPass, setMostrarPass] = useState(false)
  const [emailEsPlaceholder, setEmailEsPlaceholder] = useState(false)

  // Campos del form
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [descripcion, setDescripcion] = useState('')

  // Categoría personalizada
  const [categoriaInput, setCategoriaInput] = useState('')
  const categoriaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setFase('form')
      setError('')
      setErroresCampos({})
      setLoading(false)
      setCredenciales(null)
      setCopiado(null)
      setMostrarPass(false)
      setEmailEsPlaceholder(false)
      setNombre('')
      setCedula('')
      setTelefono('')
      setEmail('')
      setAreas([])
      setDescripcion('')
      setCategoriaInput('')
    }
  }, [open])

  function irACampo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const input = el.querySelector<HTMLElement>('input, select, textarea') ?? el as HTMLElement
      input.focus()
      if (input instanceof HTMLInputElement) input.select()
    }, 150)
  }

  function limpiarError(id: string) {
    setErroresCampos(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function sugerirEmail() {
    const digitos = telefono.replace(/\D/g, '')
    if (digitos.length >= 7 && !email) {
      setEmail(`${digitos}@voluntario.cp`)
      setEmailEsPlaceholder(true)
    }
  }

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

  async function copiar(valor: string, tipo: 'email' | 'pass') {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(tipo)
      setTimeout(() => setCopiado(null), 2000)
    } catch { /* no clipboard access */ }
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs['modal-nombre'] = 'El nombre completo es obligatorio.'
    if (!telefono.trim()) errs['modal-telefono'] = 'El teléfono es obligatorio.'
    if (!email.trim()) errs['modal-email'] = 'El correo electrónico es obligatorio.'

    if (Object.keys(errs).length > 0) {
      setErroresCampos(errs)
      irACampo(Object.keys(errs)[0])
      return
    }

    setLoading(true)

    const res = await fetch('/api/admin/voluntarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_completo: nombre, cedula: cedula || undefined, telefono, email, areas_ayuda: areas, descripcion_ayuda: descripcion || undefined }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      const msg = data.error || 'Error al registrar'
      setError(msg)
      toast.error(msg)
      return
    }

    toast.success(`${data.nombre_completo} registrado y aprobado`)
    setCredenciales({ nombre_completo: data.nombre_completo, email: data.email, tempPassword: data.tempPassword })
    setFase('exito')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-[#0891B2]" />
            <h2 className="font-bold text-gray-900 text-lg">Registrar voluntario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fase: Formulario */}
        {fase === 'form' && (
          <form onSubmit={registrar} className="p-6 space-y-4">
            <p className="text-sm text-gray-500">
              El voluntario quedará aprobado de inmediato. Se generarán credenciales temporales para que puedas compartirlas en persona.
            </p>

            <div id="modal-nombre">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo <span className="text-red-500">*</span></label>
              <input
                required
                value={nombre}
                onChange={e => { setNombre(e.target.value); limpiarError('modal-nombre') }}
                placeholder="Ej. María García"
                className={erroresCampos['modal-nombre']
                  ? 'w-full px-3 py-2.5 border border-red-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50'
                  : 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'}
              />
              <CampoError msg={erroresCampos['modal-nombre']} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cédula</label>
                <input
                  value={cedula}
                  onChange={e => setCedula(e.target.value)}
                  placeholder="V-12345678"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div id="modal-telefono">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono <span className="text-red-500">*</span></label>
                <input
                  required
                  value={telefono}
                  onChange={e => { setTelefono(e.target.value); limpiarError('modal-telefono') }}
                  onBlur={sugerirEmail}
                  placeholder="0414-0000000"
                  className={erroresCampos['modal-telefono']
                    ? 'w-full px-3 py-2.5 border border-red-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50'
                    : 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'}
                />
                <CampoError msg={erroresCampos['modal-telefono']} />
              </div>
            </div>

            <div id="modal-email">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
              <input
                required
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailEsPlaceholder(false); limpiarError('modal-email') }}
                placeholder="ejemplo@correo.com"
                className={erroresCampos['modal-email']
                  ? 'w-full px-3 py-2.5 border border-red-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50'
                  : 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500'}
              />
              <CampoError msg={erroresCampos['modal-email']} />
              {emailEsPlaceholder && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Correo generado del teléfono. El voluntario no podrá recuperar su contraseña por correo.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Áreas de ayuda</label>

              {/* Categorías predefinidas */}
              <div className="flex flex-wrap gap-2 mb-3">
                {AREAS_PRINCIPALES.map(a => (
                  <button
                    key={a.clave}
                    type="button"
                    onClick={() => toggleArea(a.clave)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      areas.includes(a.clave)
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'border-gray-200 text-gray-600 hover:border-cyan-400'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Tags de categorías personalizadas ya agregadas */}
              {areas.filter(a => !CLAVES_PREDEFINIDAS.has(a)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {areas.filter(a => !CLAVES_PREDEFINIDAS.has(a)).map(a => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => quitarArea(a)}
                        className="hover:text-red-500 transition"
                        aria-label={`Quitar ${a}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input para agregar categoría personalizada */}
              <div className="flex gap-2 mt-1">
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

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Qué puede aportar este voluntario..."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar y aprobar'}
              </button>
            </div>
          </form>
        )}

        {/* Fase: Éxito + credenciales */}
        {fase === 'exito' && credenciales && (
          <div className="p-6 space-y-5">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-lg">{credenciales.nombre_completo}</h3>
              <p className="text-sm text-gray-500">Registrado y aprobado como voluntario</p>
            </div>

            {/* Correo */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Correo de acceso</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-mono text-gray-800 break-all">{credenciales.email}</span>
                <button
                  onClick={() => copiar(credenciales.email, 'email')}
                  className={`shrink-0 p-1.5 rounded-lg transition ${copiado === 'email' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  {copiado === 'email' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Contraseña */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contraseña temporal</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm font-mono text-gray-800 tracking-wider">
                  {mostrarPass ? credenciales.tempPassword : '••••••••••'}
                </span>
                <button
                  onClick={() => setMostrarPass(v => !v)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 transition"
                >
                  {mostrarPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copiar(credenciales.tempPassword, 'pass')}
                  className={`shrink-0 p-1.5 rounded-lg transition ${copiado === 'pass' ? 'bg-green-100 text-green-600' : 'hover:bg-gray-200 text-gray-500'}`}
                >
                  {copiado === 'pass' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Aviso de seguridad */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Comparte estas credenciales <strong>solo en persona o por canal seguro</strong>. Esta contraseña no volverá a mostrarse.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setFase('form'); setCredenciales(null); setEmailEsPlaceholder(false) }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Registrar otro
              </button>
              <button
                onClick={onRegistrado}
                className="flex-1 py-2.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white rounded-xl text-sm font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
