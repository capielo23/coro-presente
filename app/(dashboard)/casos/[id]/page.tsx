import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS, CATEGORIA_LABELS, ESTADO_NECESIDAD_COLORS } from '@/lib/utils'
import AgregarNecesidad from '@/components/casos/AgregarNecesidad'
import AsignarTutor from '@/components/casos/AsignarTutor'
import Link from 'next/link'

export default async function FichaCasoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: caso }, { data: voluntarios }, { data: miPerfil }] = await Promise.all([
    supabase.from('casos').select(`
      *,
      personas(*),
      necesidades(*),
      tutor:voluntarios!casos_tutor_id_fkey(id, nombre_completo),
      registrador:voluntarios!casos_registrado_por_fkey(nombre_completo),
      historial_caso(*, voluntario:voluntarios(nombre_completo))
    `).eq('id', params.id).single(),
    supabase.from('voluntarios').select('id, nombre_completo').eq('estado', 'aprobado').order('nombre_completo'),
    supabase.from('voluntarios').select('rol').eq('id', user!.id).single(),
  ])

  if (!caso) notFound()

  const esAdmin = miPerfil?.rol === 'admin'
  const esTutor = caso.tutor_id === user!.id
  const puedeEditar = esAdmin || esTutor || caso.registrado_por === user!.id

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{caso.nombre_caso}</h2>
              <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                {ESTADO_CASO_LABELS[caso.estado]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1 capitalize">
              {caso.tipo} · {caso.num_integrantes} integrante(s) · Registrado por {(caso.registrador as any)?.nombre_completo}
            </p>
          </div>
          <Link href="/casos" className="text-sm text-gray-400 hover:text-blue-600">← Volver</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Origen</p>
            <p className="font-medium">{caso.ciudad_origen || '—'}, {caso.estado_origen || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Zona afectada</p>
            <p className="font-medium">{caso.zona_afectada || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Alojamiento</p>
            <p className="font-medium capitalize">{caso.tipo_alojamiento?.replace('_', ' ') || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Dirección</p>
            <p className="font-medium text-xs">{caso.direccion_actual || '—'}</p>
          </div>
        </div>

        <AsignarTutor
          casoId={caso.id}
          tutorActual={caso.tutor as any}
          voluntarios={voluntarios || []}
          puedeEditar={puedeEditar}
          estadoActual={caso.estado}
        />
      </div>

      {/* Integrantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Integrantes ({caso.personas?.length ?? 0})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {caso.personas?.map((persona: any) => (
            <div key={persona.id} className="border border-gray-200 rounded-lg p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{persona.nombre} {persona.apellido}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {persona.cedula && `CI: ${persona.cedula} · `}
                    {persona.edad_aprox && `${persona.edad_aprox} años · `}
                    {persona.rol_familia && <span className="capitalize">{persona.rol_familia}</span>}
                  </p>
                  {persona.condicion_especial && (
                    <p className="text-orange-600 text-xs mt-1">⚠️ {persona.condicion_especial}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {persona.sexo === 'M' ? '♂' : persona.sexo === 'F' ? '♀' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Necesidades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            Necesidades ({caso.necesidades?.length ?? 0})
          </h3>
          <AgregarNecesidad casoId={caso.id} />
        </div>

        {caso.necesidades && caso.necesidades.length > 0 ? (
          <div className="space-y-2">
            {caso.necesidades.map((nec: any) => (
              <NecesidadRow key={nec.id} nec={nec} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay necesidades registradas. Agrega la primera.
          </p>
        )}
      </div>

      {/* Historial */}
      {caso.historial_caso && caso.historial_caso.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Historial de cambios</h3>
          <div className="space-y-2">
            {caso.historial_caso
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 15)
              .map((h: any) => (
                <div key={h.id} className="flex gap-3 text-sm text-gray-600 border-b border-gray-50 pb-2">
                  <span className="text-gray-400 text-xs whitespace-nowrap pt-0.5">
                    {new Date(h.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                  <span className="capitalize">{h.accion.replace(/_/g, ' ')}</span>
                  {h.voluntario && <span className="text-gray-400 text-xs">— {h.voluntario.nombre_completo}</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NecesidadRow({ nec }: { nec: any }) {
  return (
    <div className="flex items-start justify-between border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition">
      <div className="flex-1">
        <p className="font-medium text-gray-800">{CATEGORIA_LABELS[nec.categoria] || nec.categoria}</p>
        {nec.descripcion && <p className="text-gray-500 text-xs mt-0.5">{nec.descripcion}</p>}
        {nec.es_recurrente && (
          <p className="text-purple-600 text-xs mt-0.5">🔄 Recurrente · {nec.frecuencia}</p>
        )}
        {nec.estado === 'entregado' && nec.descripcion_entrega && (
          <p className="text-green-600 text-xs mt-1">✅ {nec.descripcion_entrega}</p>
        )}
      </div>
      <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ESTADO_NECESIDAD_COLORS[nec.estado]}`}>
        {nec.estado.replace('_', ' ')}
      </span>
    </div>
  )
}
