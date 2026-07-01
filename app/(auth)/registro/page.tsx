'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle2, UserPlus, AlertCircle, Users, Settings2 } from 'lucide-react'
import CedulaInput from '@/components/ui/CedulaInput'
import TelefonoInput from '@/components/ui/TelefonoInput'

interface AreaCatalogo {
  clave: string
  etiqueta: string
  es_personalizada: boolean
}

type Errores = Partial<Record<
  'nombre_completo' | 'email' | 'password' | 'cedula' | 'telefono' | 'areas',
  string
>>

type TipoRegistro = 'voluntario' | 'coordinador'

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

function enfocarPrimerError(errores: Errores) {
  const orden: (keyof Errores)[] = ['nombre_completo', 'email', 'password', 'cedula', 'telefono', 'areas']
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

export default function RegistroPage() {
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>('voluntario')
  const [form, setForm] = useState({
    nombre_completo: '', email: '', password: '', cedula: '', telefono: '', descripcion_ayuda: '',
  })
  const [areasDisponibles, setAreasDisponibles] = useState<AreaCatalogo[]>([])
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<string[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [errorServidor, setErrorServidor] = useState('')
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetch('/api/areas-ayuda')
      .then(r => r.json())
      .then(d => setAreasDisponibles(d.areas || []))
      .catch(() => {})
  }, [])

  function limpiarError(campo: keyof Errores) {
    if (errores[campo]) setErrores(prev => { const e = { ...prev }; delete e[campo]; return e })
  }

  function set(campo: keyof typeof form, valor: string) {
    setForm(prev => ({ ...prev, [campo]: valor }))
    limpiarError(campo as keyof Errores)
  }

  function toggleArea(clave: string) {
    setAreasSeleccionadas(prev =>
      prev.includes(clave) ? prev.filter(a => a !== clave) : [...prev, clave]
    )
    limpiarError('areas')
  }

  const validar = useCallback((): Errores => {
    const e: Errores = {}
    const digitosTel = form.telefono.replace(/\D/g, '')
    const digitosCed = form.cedula.replace(/[^0-9]/g, '')

    if (!form.nombre_completo.trim() || form.nombre_completo.trim().length < 3)
      e.nombre_completo = 'Escribe tu nombre completo (al menos 3 caracteres).'

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Ingresa un correo electrónico válido, por ejemplo: nombre@correo.com'

    if (!form.password || form.password.length < 8)
      e.password = 'La contraseña debe tener al menos 8 caracteres para ser segura.'

    if (!form.cedula.trim() || !/^[VEJPG]-/.test(form.cedula) || digitosCed.length < 5)
      e.cedula = 'Selecciona el tipo de documento (V, E, J…) y escribe el número completo.'

    if (digitosTel.length < 10)
      e.telefono = 'Ingresa un teléfono venezolano válido, por ejemplo: (0412) 456-7899.'

    // Áreas requeridas solo para voluntarios de campo
    if (tipoRegistro === 'voluntario' && areasSeleccionadas.length === 0)
      e.areas = 'Selecciona al menos un área en la que puedas colaborar.'

    return e
  }, [form, areasSeleccionadas, tipoRegistro])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e_ = validar()
    if (Object.keys(e_).length > 0) {
      setErrores(e_)
      enfocarPrimerError(e_)
      return
    }
    setLoading(true)
    setErrorServidor('')
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, areas_ayuda: areasSeleccionadas, solicita_rol: tipoRegistro }),
    })
    const data = await res.json()
    if (!res.ok) { setErrorServidor(data.error || 'Error al registrarse'); setLoading(false); return }
    setExito(true)
    setMensaje(data.message)
    setLoading(false)
  }

  if (exito) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">¡Solicitud enviada!</h2>
        <p className="text-gray-500 text-sm mb-6">{mensaje}</p>
        <Link href="/login" className="text-cyan-600 font-medium hover:underline">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="w-5 h-5 text-cyan-600" />
        <h2 className="text-xl font-semibold text-gray-800">Registrarse en Coro Presente</h2>
      </div>
      <p className="text-sm text-gray-400 mb-5">Un coordinador aprobará tu acceso antes de que puedas entrar.</p>

      {/* Selector de tipo de registro */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Cómo quieres participar?</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipoRegistro('voluntario')}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition ${
              tipoRegistro === 'voluntario'
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-cyan-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">Voluntario</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              Ayudo en campo: traslados, donaciones, atención, etc.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTipoRegistro('coordinador')}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition ${
              tipoRegistro === 'coordinador'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-800">Coordinador</span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">
              Gestiono casos y voluntarios dentro del sistema.
            </p>
          </button>
        </div>
        {tipoRegistro === 'coordinador' && (
          <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-xs text-indigo-700">
            Los coordinadores aprueban voluntarios, registran y asignan casos. Este acceso requiere aprobación especial.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Nombre */}
        <div id="campo-nombre_completo">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Tu nombre y apellido completos"
            value={form.nombre_completo}
            onChange={e => set('nombre_completo', e.target.value)}
            className={cls(errores.nombre_completo)}
            maxLength={120}
          />
          <CampoError msg={errores.nombre_completo} />
        </div>

        {/* Email */}
        <div id="campo-email">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className={cls(errores.email)}
          />
          <CampoError msg={errores.email} />
        </div>

        {/* Contraseña */}
        <div id="campo-password">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            className={cls(errores.password)}
          />
          <CampoError msg={errores.password} />
        </div>

        {/* Cédula */}
        <div id="campo-cedula">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula de identidad <span className="text-red-500">*</span>
          </label>
          <div className={errores.cedula ? 'ring-2 ring-red-400 rounded-lg' : ''}>
            <CedulaInput
              value={form.cedula}
              onChange={val => { set('cedula', val) }}
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm text-gray-800 bg-white transition ${
                errores.cedula ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-cyan-500'
              }`}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">V Venezolano · E Extranjero · J Jurídico · P Pasaporte · G Gubernamental</p>
          <CampoError msg={errores.cedula} />
        </div>

        {/* Teléfono */}
        <div id="campo-telefono">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono / WhatsApp <span className="text-red-500">*</span>
          </label>
          <TelefonoInput
            value={form.telefono}
            onChange={val => { set('telefono', val) }}
            className={cls(errores.telefono)}
          />
          <CampoError msg={errores.telefono} />
        </div>

        {/* Áreas de ayuda — requeridas para voluntarios, opcionales para coordinadores */}
        <div id="campo-areas">
          <label className="block text-sm font-semibold text-gray-800 mb-0.5">
            ¿En qué puedes ayudar?{' '}
            {tipoRegistro === 'voluntario'
              ? <span className="text-red-500">*</span>
              : <span className="text-gray-400 font-normal">(opcional)</span>}
          </label>
          <p className="text-xs text-gray-400 mb-2">
            {tipoRegistro === 'coordinador'
              ? 'Si también participas en campo, selecciona tus áreas para que el sistema te sugiera casos.'
              : 'Selecciona todas las que apliquen.'}
          </p>
          <div className={`max-h-60 overflow-y-auto rounded-xl border-2 p-2 space-y-1.5 transition ${
            errores.areas ? 'border-red-400 bg-red-50' : 'border-gray-100'
          }`}>
            {areasDisponibles.map(area => {
              const sel = areasSeleccionadas.includes(area.clave)
              return (
                <label
                  key={area.clave}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border-2 cursor-pointer transition select-none ${
                    sel ? 'border-cyan-500 bg-cyan-50' : 'border-transparent hover:border-cyan-100 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => toggleArea(area.clave)}
                    className="mt-0.5 accent-cyan-600 shrink-0"
                  />
                  <span className="text-sm text-gray-800 leading-snug">{area.etiqueta}</span>
                </label>
              )
            })}
          </div>
          <CampoError msg={errores.areas} />
        </div>

        {/* Descripción — opcional para todos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Algo más que quieras agregar?{' '}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            {tipoRegistro === 'coordinador'
              ? 'Experiencia de coordinación, tu disponibilidad o cómo llegaste a Coro Presente.'
              : 'Si tienes algo específico que ofrecer — un talento, un recurso, tiempo libre, contactos — cuéntanoslo.'}
          </p>
          <textarea
            value={form.descripcion_ayuda}
            onChange={e => setForm(prev => ({ ...prev, descripcion_ayuda: e.target.value }))}
            placeholder={tipoRegistro === 'coordinador'
              ? 'Ej: Tengo experiencia coordinando grupos de WhatsApp durante la emergencia del 2024...'
              : 'Ej: Tengo un camión disponible los fines de semana. Puedo cocinar para grupos grandes...'}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-gray-800 bg-white transition resize-none"
          />
        </div>

        {errorServidor && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorServidor}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 btn-press ${
            tipoRegistro === 'coordinador'
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-[#0891B2] hover:bg-[#0C4A6E]'
          }`}
        >
          {loading
            ? 'Enviando solicitud...'
            : tipoRegistro === 'coordinador'
            ? 'Solicitar acceso como coordinador'
            : 'Solicitar acceso como voluntario'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        <Link href="/login" className="text-cyan-600 hover:underline font-medium">Ya tengo cuenta</Link>
      </p>
    </>
  )
}
