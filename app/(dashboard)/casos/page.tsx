import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS } from '@/lib/utils'

export default async function CasosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string }
}) {
  const supabase = createClient()
  let query = supabase
    .from('casos')
    .select('id, nombre_caso, tipo, estado, num_integrantes, ciudad_origen, created_at, tutor:voluntarios!casos_tutor_id_fkey(nombre_completo)')
    .order('created_at', { ascending: false })

  if (searchParams.estado) query = query.eq('estado', searchParams.estado)
  if (searchParams.q) query = query.ilike('nombre_caso', `%${searchParams.q}%`)

  const { data: casos } = await query.limit(200)

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Casos registrados</h2>
          <p className="text-gray-500 text-sm">{casos?.length ?? 0} casos</p>
        </div>
        <Link
          href="/casos/nuevo"
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Nuevo registro
        </Link>
      </div>

      <form className="flex gap-3 flex-wrap">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por nombre del caso..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="estado"
          defaultValue={searchParams.estado ?? ''}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="critico">🚨 Crítico</option>
          <option value="activo">✅ Activo</option>
          <option value="estable">💙 Estable</option>
          <option value="cerrado">⬜ Cerrado</option>
        </select>
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          Filtrar
        </button>
        {(searchParams.q || searchParams.estado) && (
          <Link href="/casos" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">
            Limpiar
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {casos && casos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-center">Personas</th>
                  <th className="px-4 py-3 text-left">Origen</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Tutor</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {casos.map((caso: any) => (
                  <tr key={caso.id} className={`hover:bg-gray-50 transition ${caso.estado === 'critico' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {caso.estado === 'critico' && <span className="mr-1">🚨</span>}
                      {caso.nombre_caso}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{caso.tipo}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{caso.num_integrantes}</td>
                    <td className="px-4 py-3 text-gray-600">{caso.ciudad_origen || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                        {ESTADO_CASO_LABELS[caso.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{caso.tutor?.nombre_completo || <span className="text-gray-300">Sin asignar</span>}</td>
                    <td className="px-4 py-3">
                      <Link href={`/casos/${caso.id}`} className="text-blue-700 hover:underline font-medium text-sm">
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>No hay casos registrados aún.</p>
            <Link href="/casos/nuevo" className="text-blue-700 hover:underline text-sm mt-2 inline-block font-medium">
              Registrar el primer caso →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
