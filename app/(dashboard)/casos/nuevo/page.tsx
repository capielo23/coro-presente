'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ESTADOS_VENEZUELA = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda',
  'Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo',
  'Vargas','Yaracuy','Zulia','Distrito Capital',
]

const TIPOS_ALOJAMIENTO = [
  { value: 'casa_familiar', label: 'Casa familiar' },
  { value: 'albergue', label: 'Albergue' },
  { value: 'iglesia', label: 'Iglesia' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'otro', label: 'Otro' },
]

interface PersonaForm {
  nombre: string
  apellido: string
  cedula: string
  edad_aprox: string
  sexo: string
  rol_familia: string
  condicion_especial: string
  telefono: string
}

const personaVacia = (): PersonaForm => ({
  nombre: '', apellido: '', cedula: '', edad_aprox: '',
  sexo: 'no_especificado', rol_familia: '', condicion_especial: '', telefono: '',
})

export default function NuevoCasoPage() {
  const router = useRouter()
  const [tipo, setTipo] = useState<'individual' | 'familiar'>('individual')
  const [datosCaso, setDatosCaso] = useState({
    nombre_caso: '',
    ciudad_origen: '',
    estado_origen: 'Falcón',
    zona_afectada: '',
    direccion_actual: '',
    tipo_alojamiento: 'casa_familiar',
  })
  const [personas, setPersonas] = useState<PersonaForm[]>([personaVacia()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function actualizarPersona(idx: number, campo: string, valor: string) {
    setPersonas(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { nombre_caso: _nc, ...restoDatosCaso } = datosCaso
    const payload = {
      tipo,
      nombre_caso: tipo === 'individual'
        ? `${personas[0].nombre} ${personas[0].apellido}`.trim()
        : datosCaso.nombre_caso,
      ...restoDatosCaso,
      personas: personas.map(p => ({
        ...p,
        edad_aprox: p.edad_aprox ? parseInt(p.edad_aprox) : undefined,
        cedula: p.cedula || undefined,
        telefono: p.telefono || undefined,
        condicion_especial: p.condicion_especial || undefined,
        rol_familia: p.rol_familia || undefined,
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registrar nuevo caso</h2>
        <p className="text-gray-500 text-sm mt-1">Completa todos los campos disponibles para facilitar el seguimiento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo de caso */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Tipo de caso</h3>
          <div className="flex gap-4">
            {(['individual', 'familiar'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  if (t === 'individual') setPersonas([personaVacia()])
                }}
                className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition ${
                  tipo === t
                    ? 'border-blue-700 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'individual' ? '👤 Persona individual' : '👨‍👩‍👧‍👦 Grupo familiar'}
              </button>
            ))}
          </div>
          {tipo === 'familiar' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo familiar *</label>
              <input
                required
                value={datosCaso.nombre_caso}
                onChange={e => setDatosCaso(p => ({ ...p, nombre_caso: e.target.value }))}
                placeholder="Ej: Familia González Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          )}
        </section>

        {/* Origen y alojamiento */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Origen y alojamiento actual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad de origen</label>
              <input
                value={datosCaso.ciudad_origen}
                onChange={e => setDatosCaso(p => ({ ...p, ciudad_origen: e.target.value }))}
                placeholder="Ej: Güiria, Maturín..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de origen</label>
              <select
                value={datosCaso.estado_origen}
                onChange={e => setDatosCaso(p => ({ ...p, estado_origen: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {ESTADOS_VENEZUELA.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zona / barrio afectado</label>
              <input
                value={datosCaso.zona_afectada}
                onChange={e => setDatosCaso(p => ({ ...p, zona_afectada: e.target.value }))}
                placeholder="Barrio, sector, urbanización..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alojamiento en Coro</label>
              <select
                value={datosCaso.tipo_alojamiento}
                onChange={e => setDatosCaso(p => ({ ...p, tipo_alojamiento: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {TIPOS_ALOJAMIENTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección actual en Coro</label>
              <input
                value={datosCaso.direccion_actual}
                onChange={e => setDatosCaso(p => ({ ...p, direccion_actual: e.target.value }))}
                placeholder="Calle, sector, referencia de ubicación..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </section>

        {/* Integrantes */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">
              {tipo === 'individual' ? 'Datos de la persona' : `Integrantes del grupo (${personas.length})`}
            </h3>
            {tipo === 'familiar' && (
              <button
                type="button"
                onClick={() => setPersonas(prev => [...prev, personaVacia()])}
                className="text-sm text-blue-700 font-medium hover:underline"
              >
                + Agregar integrante
              </button>
            )}
          </div>

          <div className="space-y-5">
            {personas.map((persona, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                {tipo === 'familiar' && (
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-sm text-gray-700">Integrante {idx + 1}</p>
                    {personas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPersonas(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500 text-sm transition"
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                    <input
                      required
                      value={persona.nombre}
                      onChange={e => actualizarPersona(idx, 'nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
                    <input
                      required
                      value={persona.apellido}
                      onChange={e => actualizarPersona(idx, 'apellido', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cédula / Documento</label>
                    <input
                      value={persona.cedula}
                      onChange={e => actualizarPersona(idx, 'cedula', e.target.value)}
                      placeholder="V-12345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Edad aproximada</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={persona.edad_aprox}
                      onChange={e => actualizarPersona(idx, 'edad_aprox', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sexo</label>
                    <select
                      value={persona.sexo}
                      onChange={e => actualizarPersona(idx, 'sexo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="no_especificado">No especificado</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rol en la familia</label>
                    <select
                      value={persona.rol_familia}
                      onChange={e => actualizarPersona(idx, 'rol_familia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
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
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono (protegido)</label>
                    <input
                      type="tel"
                      value={persona.telefono}
                      onChange={e => actualizarPersona(idx, 'telefono', e.target.value)}
                      placeholder="0412-0000000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Condición especial</label>
                    <input
                      value={persona.condicion_especial}
                      onChange={e => actualizarPersona(idx, 'condicion_especial', e.target.value)}
                      placeholder="Embarazo, discapacidad, medicación..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar caso'}
          </button>
        </div>
      </form>
    </div>
  )
}
