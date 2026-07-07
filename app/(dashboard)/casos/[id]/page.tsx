import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ESTADO_CASO_COLORS, ESTADO_CASO_LABELS, CATEGORIA_LABELS } from '@/lib/utils'
import AgregarNecesidad from '@/components/casos/AgregarNecesidad'
import NecesidadGestion from '@/components/casos/NecesidadGestion'
import CampoEditable from '@/components/casos/CampoEditable'
import TutorActions from '@/components/casos/TutorActions'
import AsignarTutor from '@/components/casos/AsignarTutor'
import AgregarSeguimiento from '@/components/casos/AgregarSeguimiento'
import BitacoraSeguimiento from '@/components/casos/BitacoraSeguimiento'
import EquipoCaso from '@/components/casos/EquipoCaso'
import EliminarCaso from '@/components/casos/EliminarCaso'
import GestionColaboradores from '@/components/casos/GestionColaboradores'
import IntegranteCard from '@/components/casos/IntegranteCard'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Pencil } from 'lucide-react'

export default async function FichaCasoPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const [{ data: caso }, { data: miPerfil }, { data: colaboracion }, { data: seguimientos }, { data: todosVoluntarios }, { data: colaboradoresLista }, { data: entregasCaso }] = await Promise.all([
    admin.from('casos').select(`
      *,
      personas(*),
      necesidades(*),
      tutor:voluntarios!casos_tutor_id_fkey(id, nombre_completo),
      registrador:voluntarios!casos_registrado_por_fkey(nombre_completo),
      historial_caso(*, voluntario:voluntarios(nombre_completo))
    `).eq('id', params.id).single(),
    admin.from('voluntarios')
      .select('rol, areas_ayuda, especialidades, zona_cobertura, disponibilidad, descripcion_ayuda')
      .eq('id', user!.id).single(),
    admin.from('caso_colaboradores')
      .select('id').eq('caso_id', params.id).eq('voluntario_id', user!.id).maybeSingle(),
    // Bitácora aparte: si la migración 003 aún no se corrió, esto falla sin tumbar la página
    admin.from('seguimientos')
      .select('*, voluntario:voluntarios(nombre_completo)')
      .eq('caso_id', params.id)
      .order('created_at', { ascending: false }),
    // Voluntarios aprobados para AsignarTutor (solo coordinadores los necesitan)
    admin.from('voluntarios')
      .select('id, nombre_completo, areas_ayuda, especialidades')
      .eq('estado', 'aprobado')
      .order('nombre_completo'),
    // Equipo: colaboradores del caso (con nombre)
    admin.from('caso_colaboradores')
      .select('voluntario:voluntarios(id, nombre_completo)')
      .eq('caso_id', params.id),
    // Ledger de entregas del caso (con nombre de quien registró)
    admin.from('entregas')
      .select('*, marcador:voluntarios!entregas_marcado_por_fkey(nombre_completo)')
      .eq('caso_id', params.id)
      .order('fecha', { ascending: false }),
  ])

  if (!caso) notFound()

  // Generar URLs firmadas (1h) para fotos de personas
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'fotos-personas'
  const personasConFoto = await Promise.all(
    (caso.personas ?? []).map(async (p: any) => {
      if (!p.foto_url) return { ...p, foto_signed_url: null }
      const { data } = await admin.storage.from(bucket).createSignedUrl(p.foto_url, 3600)
      return { ...p, foto_signed_url: data?.signedUrl ?? null }
    })
  )

  const esAdmin = ['admin', 'coordinador'].includes(miPerfil?.rol ?? '')
  const esTutor = caso.tutor_id === user!.id
  const esColaborador = !!colaboracion
  const puedeEditar = esAdmin
  const puedeMarcarEntregas = esAdmin || esTutor

  // Datos de coincidencia para el modal de compromiso (al tomar el seguimiento)
  const necesidadesAbiertas: any[] = (caso.necesidades ?? []).filter((n: any) => n.estado !== 'entregado')
  const misAreas: string[] = miPerfil?.areas_ayuda ?? []
  const misEspecialidades: string[] = miPerfil?.especialidades ?? []
  const categoriasMatch = Array.from(
    new Set(necesidadesAbiertas.map((n: any) => n.categoria as string))
  ).filter((c) => misAreas.includes(c))
  const habilidadesCaso: string[] = (caso.habilidades_requeridas?.length
    ? caso.habilidades_requeridas
    : Array.from(new Set(necesidadesAbiertas.map((n: any) => n.especialidad_requerida).filter(Boolean)))) as string[]
  const especialidadesMatch = habilidadesCaso.filter((h) => misEspecialidades.includes(h))
  const zonaVol = (miPerfil?.zona_cobertura ?? '').trim().toLowerCase()
  const sectorCaso = (caso.sector_coro ?? '').trim().toLowerCase()
  const zonaCoincide = !!zonaVol && !!sectorCaso && (sectorCaso.includes(zonaVol) || zonaVol.includes(sectorCaso))
  const camposPerfil = [
    misEspecialidades.length > 0,
    !!miPerfil?.zona_cobertura,
    !!miPerfil?.disponibilidad,
    !!miPerfil?.descripcion_ayuda,
  ]
  const perfilIncompleto = camposPerfil.filter(Boolean).length < camposPerfil.length

  const matchInfo = {
    categoriasMatch: categoriasMatch.map((c) => CATEGORIA_LABELS[c] ?? c),
    especialidadesMatch,
    zonaCoincide,
    sectorCaso: caso.sector_coro ?? null,
    zonaVol: miPerfil?.zona_cobertura ?? null,
    perfilIncompleto,
  }

  // Equipo del caso para el selector "¿Quién entregó?": SOLO personas asignadas al caso
  // (responsable/coordinador + quien lo registró + colaboradores), no todo el equipo aprobado.
  const equipoCaso: { id: string; nombre_completo: string }[] = []
  const addMiembroCaso = (mid?: string | null, nombre?: string | null) => {
    if (mid && nombre && !equipoCaso.some(m => m.id === mid)) equipoCaso.push({ id: mid, nombre_completo: nombre })
  }
  addMiembroCaso(caso.tutor_id, (caso.tutor as any)?.nombre_completo)
  addMiembroCaso(caso.registrado_por, (caso.registrador as any)?.nombre_completo)
  ;(colaboradoresLista ?? []).forEach((c: any) => addMiembroCaso(c.voluntario?.id, c.voluntario?.nombre_completo))

  const colaboradoresNombres: string[] = (colaboradoresLista ?? [])
    .map((c: any) => c.voluntario?.nombre_completo).filter(Boolean)
  const colaboradoresConId: { id: string; nombre: string }[] = (colaboradoresLista ?? [])
    .filter((c: any) => c.voluntario?.id && c.voluntario?.nombre_completo)
    .map((c: any) => ({ id: c.voluntario.id, nombre: c.voluntario.nombre_completo }))
  const entregasPorNec: Record<string, any[]> = {}
  ;(entregasCaso ?? []).forEach((e: any) => { (entregasPorNec[e.necesidad_id] ??= []).push(e) })
  const entregadores: string[] = Array.from(
    new Set((entregasCaso ?? []).map((e: any) => e.entregado_por_nombre as string).filter(Boolean))
  )
  const responsableNombre = (caso.tutor as any)?.nombre_completo ?? null
  const registradorNombre = (caso.registrador as any)?.nombre_completo ?? null

  // Artículos asignados a cada integrante (para gestión por persona en su tarjeta).
  // Si la necesidad completa está marcada como entregada, propagamos ese estado a cada ítem.
  const itemsPorPersona: Record<string, { necesidadId: string; categoria: string; item: any }[]> = {}
  ;(caso.necesidades ?? []).forEach((nec: any) => {
    const necResuelta = nec.estado === 'entregado'
    ;(nec.items_entrega?.items ?? []).forEach((item: any) => {
      if (item?.persona_id) {
        (itemsPorPersona[item.persona_id] ??= []).push({
          necesidadId: nec.id,
          categoria: nec.categoria,
          item: necResuelta ? { ...item, entregado: true } : item,
        })
      }
    })
  })

  // Artículos de medicamentos sin persona_id asignada.
  // Se usan como fallback para personas con condicion_especial sin ítems directos,
  // mostrando el checklist real de medicamentos en su tarjeta de integrante.
  const medItemsGenerales: { necesidadId: string; categoria: string; item: any }[] = []
  ;(caso.necesidades ?? []).forEach((nec: any) => {
    if (nec.categoria === 'medicamentos') {
      const necResuelta = nec.estado === 'entregado'
      ;(nec.items_entrega?.items ?? []).forEach((item: any) => {
        if (!item?.persona_id) {
          medItemsGenerales.push({
            necesidadId: nec.id,
            categoria: nec.categoria,
            item: necResuelta ? { ...item, entregado: true } : item,
          })
        }
      })
    }
  })
  // Asignar fallback: personas con condicion_especial y sin ítems propios ven los medicamentos generales
  ;(caso.personas ?? []).forEach((p: any) => {
    if (!(itemsPorPersona[p.id]?.length) && p.condicion_especial && medItemsGenerales.length > 0) {
      itemsPorPersona[p.id] = medItemsGenerales
    }
  })

  // condicionAtendida: todos los ítems del integrante (directos o fallback) están entregados
  const condicionAtendidaPorPersona: Record<string, boolean> = {}
  ;(caso.personas ?? []).forEach((p: any) => {
    const items = itemsPorPersona[p.id] ?? []
    condicionAtendidaPorPersona[p.id] = items.length > 0
      ? items.every(e => e.item.entregado)
      : false
  })

  const TIPO_ALOJAMIENTO_LABEL: Record<string, string> = {
    casa_familiar: 'Casa familiar', albergue: 'Albergue oficial',
    iglesia: 'Iglesia / comunitario', hotel: 'Hotel / posada', otro: 'Otro',
  }

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
            <p className="text-gray-500 text-sm mt-1">
              {caso.tipo === 'familiar' ? 'Grupo familiar' : 'Persona individual'} · {caso.personas?.length ?? 0} integrantes · Registrado por {(caso.registrador as any)?.nombre_completo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {puedeEditar && (
              <Link
                href={`/casos/${caso.id}/editar`}
                className="flex items-center gap-1.5 bg-[#0891B2] hover:bg-[#0C4A6E] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition btn-press"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar caso
              </Link>
            )}
            <Link href="/casos" className="text-sm text-gray-400 hover:text-cyan-600 flex items-center gap-1 transition">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
          </div>
        </div>

        {/* Grid de ubicación — editable inline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Origen</p>
            <p className="font-medium">{caso.ciudad_origen || '—'}, {caso.estado_origen || 'Falcón'}</p>
          </div>
          <CampoEditable
            casoId={caso.id}
            campo="zona_afectada"
            valor={caso.zona_afectada}
            etiqueta="Zona afectada"
            placeholder="Barrio o sector de origen"
            puedeEditar={puedeEditar}
          />
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs">Alojamiento</p>
            <p className="font-medium">{TIPO_ALOJAMIENTO_LABEL[caso.tipo_alojamiento] || caso.tipo_alojamiento || '—'}</p>
          </div>
          <CampoEditable
            casoId={caso.id}
            campo="sector_coro"
            valor={caso.sector_coro}
            etiqueta="Sector en Coro"
            placeholder="San José, Los Claritos..."
            puedeEditar={puedeEditar}
          />
        </div>
        <CampoEditable
          casoId={caso.id}
          campo="direccion_actual"
          valor={caso.direccion_actual}
          etiqueta="Dirección actual"
          placeholder="Calle, número de casa, referencia..."
          puedeEditar={puedeEditar}
        />

        <div className="mt-4 space-y-3">
          <TutorActions
            casoId={caso.id}
            tutorId={caso.tutor_id}
            tutorNombre={(caso.tutor as any)?.nombre_completo ?? null}
            userId={user!.id}
            esColaborador={esColaborador}
            match={matchInfo}
          />
          {esAdmin && (
            <AsignarTutor
              casoId={caso.id}
              tutorActual={caso.tutor as any}
              voluntarios={todosVoluntarios ?? []}
              puedeEditar={esAdmin}
              estadoActual={caso.estado}
              areasNecesidades={Array.from(new Set((caso.necesidades ?? []).map((n: any) => n.categoria as string)))}
              especialidadesRequeridas={habilidadesCaso}
            />
          )}
        </div>

        {puedeEditar && (
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <EliminarCaso casoId={caso.id} nombreCaso={caso.nombre_caso} />
          </div>
        )}
      </div>

      {/* Equipo del caso */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <EquipoCaso
          responsable={responsableNombre}
          registrador={registradorNombre}
          colaboradores={colaboradoresNombres}
          entregadores={entregadores}
        />
        {esAdmin && (
          <GestionColaboradores
            casoId={caso.id}
            colaboradores={colaboradoresConId}
            voluntariosDisponibles={(todosVoluntarios ?? []).filter(v => v.id !== caso.tutor_id)}
          />
        )}
      </div>

      {/* Integrantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Integrantes ({caso.personas?.length ?? 0})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personasConFoto.map((persona: any) => (
            <IntegranteCard
              key={persona.id}
              persona={persona}
              itemsPersona={itemsPorPersona[persona.id] ?? []}
              equipo={equipoCaso}
              puedeEditar={puedeEditar}
              puedeMarcarEntregas={puedeMarcarEntregas}
              condicionAtendida={condicionAtendidaPorPersona[persona.id] ?? false}
            />
          ))}
        </div>
      </div>

      {/* Necesidades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800">
            Necesidades ({caso.necesidades?.length ?? 0})
          </h3>
          {esAdmin && (
            <AgregarNecesidad
              casoId={caso.id}
              personas={caso.personas ?? []}
              necesidadesExistentes={(caso.necesidades ?? []).map((n: any) => ({ id: n.id, categoria: n.categoria }))}
            />
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Registra aquí qué necesita esta familia: alimentos, medicamentos, ropa, traslado, etc. Marca cada ítem como entregado cuando se resuelva.
        </p>

        {caso.necesidades && caso.necesidades.length > 0 ? (
          <div className="space-y-2">
            {caso.necesidades.map((nec: any) => (
              <NecesidadGestion
                key={nec.id}
                nec={nec}
                puedeEditar={puedeEditar}
                puedeMarcarEntregas={puedeMarcarEntregas}
                equipo={equipoCaso}
                entregas={entregasPorNec[nec.id] ?? []}
                casoCreatedAt={caso.created_at}
                personas={caso.personas ?? []}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay necesidades registradas. Agrega la primera.
          </p>
        )}
      </div>

      {/* Ruta de seguimiento */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-500" />
            Ruta de seguimiento ({seguimientos?.length ?? 0})
          </h3>
          <AgregarSeguimiento casoId={caso.id} />
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Registra cada contacto con este caso: visita realizada, llamada hecha, entrega completada o gestión adelantada.
          Si el caso se resuelve en una sola visita, agrega ese único registro. Si requiere varias visitas en el tiempo, aquí queda el historial completo del acompañamiento.
        </p>
        <BitacoraSeguimiento seguimientos={seguimientos ?? []} />
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
