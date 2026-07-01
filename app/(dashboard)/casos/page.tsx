import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS } from '@/lib/utils'

const PAGE_SIZE = 30

export default async function CasosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string; sinTutor?: string; page?: string }
}) {
  const admin = createAdminClient()
  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  // Buscar también por integrantes: nombre, apellido, cédula
  // Pre-query en personas para obtener caso_ids que coincidan con el término
  let extraCasoIds: string[] = []
  if (searchParams.q) {
    const q = searchParams.q.trim()
    const { data: personasMatch } = await admin
      .from('personas')
      .select('caso_id')
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%,cedula.ilike.%${q}%`)
    if (personasMatch?.length) {
      extraCasoIds = Array.from(new Set(personasMatch.map((p: any) => p.caso_id as string)))
    }
  }

  let query = admin
    .from('casos')
    .select('id, nombre_caso, tipo, estado, ciudad_origen, sector_coro, created_at, personas(count), tutor:voluntarios!casos_tutor_id_fkey(nombre_completo)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (searchParams.estado) query = query.eq('estado', searchParams.estado)
  if (searchParams.sinTutor === '1') query = query.is('tutor_id', null)
  if (searchParams.q) {
    const q = searchParams.q.trim()
    // Busca en: nombre del caso, ciudad de origen, sector, zona afectada, estado de origen
    const camposCaso = `nombre_caso.ilike.%${q}%,ciudad_origen.ilike.%${q}%,sector_coro.ilike.%${q}%,zona_afectada.ilike.%${q}%,estado_origen.ilike.%${q}%`
    if (extraCasoIds.length > 0) {
      query = query.or(`${camposCaso},id.in.(${extraCasoIds.join(',')})`)
    } else {
      query = query.or(camposCaso)
    }
  }

  const { data: casos, count: totalCasos } = await query.range(offset, offset + PAGE_SIZE - 1)

  const totalPages = Math.ceil((totalCasos ?? 0) / PAGE_SIZE)
  const sinTutorCount = casos?.filter((c: any) => !c.tutor).length ?? 0

  function buildPageUrl(p: number) {
    const params = new URLSearchParams()
    if (searchParams.q) params.set('q', searchParams.q)
    if (searchParams.estado) params.set('estado', searchParams.estado)
    if (searchParams.sinTutor) params.set('sinTutor', searchParams.sinTutor)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/casos${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Casos registrados</h2>
          <p className="text-gray-500 text-sm">
            {totalCasos ?? 0} casos en total
            {sinTutorCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">· {sinTutorCount} sin tutor en esta página</span>
            )}
          </p>
        </div>
        <Link
          href="/casos/nuevo"
          className="btn-press bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
        >
          + Nuevo registro
        </Link>
      </div>

      {/* Filtros */}
      <form className="flex gap-2 flex-wrap">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Buscar por nombre, integrante, cédula, sector..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-36 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <select
          name="estado"
          defaultValue={searchParams.estado ?? ''}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todos los estados</option>
          <option value="critico">🚨 Crítico</option>
          <option value="activo">✅ Activo</option>
          <option value="estable">💙 Estable</option>
          <option value="cerrado">⬜ Cerrado</option>
        </select>
        <select
          name="sinTutor"
          defaultValue={searchParams.sinTutor ?? ''}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Todos</option>
          <option value="1">Sin tutor (disponibles)</option>
        </select>
        <button
          type="submit"
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
        >
          Filtrar
        </button>
        {(searchParams.q || searchParams.estado || searchParams.sinTutor) && (
          <Link href="/casos" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition self-center">
            Limpiar
          </Link>
        )}
      </form>

      {/* Aviso de casos sin tutor */}
      {sinTutorCount > 0 && !searchParams.sinTutor && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-amber-800">
            Hay <strong>{sinTutorCount} caso{sinTutorCount > 1 ? 's' : ''}</strong> sin voluntario asignado. ¿Puedes tomar alguno?
          </p>
          <Link href="/casos?sinTutor=1" className="text-xs text-amber-700 font-semibold hover:underline whitespace-nowrap">
            Ver casos disponibles →
          </Link>
        </div>
      )}

      {/* Cuadrícula de tarjetas — funciona en móvil y escritorio */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-white rounded-xl border border-gray-100 px-4 py-2.5">
          <span>Página {page} de {totalPages} · {totalCasos} casos</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-xs">
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-xs">
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}

      {casos && casos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {casos.map((caso: any) => (
            <Link
              key={caso.id}
              href={`/casos/${caso.id}`}
              className={`card-hover bg-white rounded-xl border shadow-sm p-4 block group cursor-pointer ${
                caso.estado === 'critico' ? 'border-red-200 bg-red-50' : 'border-gray-100'
              }`}
            >
              {/* Nombre y estado */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-cyan-700 transition flex-1 min-w-0">
                  {caso.estado === 'critico' && <span className="mr-1">🚨</span>}
                  {caso.nombre_caso}
                </p>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_CASO_COLORS[caso.estado]}`}>
                  {ESTADO_CASO_LABELS[caso.estado]}
                </span>
              </div>

              {/* Detalles secundarios */}
              <div className="space-y-0.5 text-xs text-gray-500">
                <p>
                  {caso.tipo === 'familiar' ? '👨‍👩‍👧‍👦' : '👤'}{' '}
                  {caso.tipo === 'familiar'
                    ? `Grupo familiar · ${(caso.personas as any)?.[0]?.count ?? 0} personas`
                    : 'Persona individual · 1 persona'}
                </p>
                {(caso.ciudad_origen || caso.sector_coro) && (
                  <p>📍 {[caso.sector_coro, caso.ciudad_origen].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              {/* Tutor */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                {caso.tutor?.nombre_completo ? (
                  <span className="text-xs text-gray-500 truncate">
                    👤 <span className="font-medium text-gray-700">{caso.tutor.nombre_completo}</span>
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Disponible · Sin tutor
                  </span>
                )}
                <span className="text-xs text-cyan-600 font-medium group-hover:underline shrink-0 ml-2">Ver →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>No hay casos que coincidan con los filtros.</p>
          <Link href="/casos/nuevo" className="text-cyan-600 hover:underline text-sm mt-2 inline-block font-medium">
            Registrar nuevo caso →
          </Link>
        </div>
      )}
    </div>
  )
}
