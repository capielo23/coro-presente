// Puntuación de relevancia voluntario ↔ caso.
//
// Función PURA (sin I/O): recibe datos ya cargados y devuelve un número.
// Mantenerla pura permite testearla sin tocar la base de datos y reutilizarla
// tanto en el dashboard como en la ficha del caso.
//
// El dashboard ordenará los "Casos relevantes para ti" por este score (desc),
// no solo por estado.

export interface EntradaRelevancia {
  /** Necesidades del caso aún abiertas (estado != 'entregado'). */
  necesidadesAbiertas: { categoria: string; especialidad_requerida?: string | null }[]
  /** habilidades_requeridas del caso (denormalizadas). */
  habilidadesCaso: string[]
  /** Sector del caso en Coro (casos.sector_coro). */
  sectorCaso: string | null
  /** Estado del caso ('critico' | 'activo' | 'estable' | ...). */
  estadoCaso: string
  /** areas_ayuda del voluntario. */
  misAreas: string[]
  /** especialidades del voluntario. */
  misEspecialidades: string[]
  /** zona_cobertura declarada del voluntario. */
  miZona: string | null
}

/**
 * Devuelve la puntuación de relevancia de un caso para un voluntario.
 *
 * Fórmula sugerida en el briefing (Session B, punto 4) — ajusta los pesos
 * según la política de coordinación que quieras:
 *
 *   (necesidades cuya categoría ∈ misAreas) / total_necesidades_abiertas * 50
 *   + (habilidadesCaso ∩ misEspecialidades ≠ vacío ? 50 : 0)
 *   + (sectorCaso coincide con miZona ? +20 : 0)
 *   + (estadoCaso === 'critico' ? +30 : 0)
 *
 * Notas de implementación:
 * - Cuida la división por cero cuando no hay necesidades abiertas.
 * - La coincidencia de zona es texto libre: decide si comparas por igualdad
 *   exacta (insensible a mayúsculas/acentos) o por inclusión de substring.
 *   (En la ficha del caso ya se usa comparación por substring en minúsculas.)
 */
export function puntuarRelevancia(e: EntradaRelevancia): number {
  const total = e.necesidadesAbiertas.length
  const areasMatch = total === 0
    ? 0
    : e.necesidadesAbiertas.filter(n => e.misAreas.includes(n.categoria)).length / total

  const tieneHabilidades = e.habilidadesCaso.some(h =>
    e.misEspecialidades.some(me => me.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(me.toLowerCase()))
  )

  const mismaZona = e.sectorCaso && e.miZona
    ? e.sectorCaso.toLowerCase().includes(e.miZona.toLowerCase()) ||
      e.miZona.toLowerCase().includes(e.sectorCaso.toLowerCase())
    : false

  return areasMatch * 50 + (tieneHabilidades ? 50 : 0) + (mismaZona ? 20 : 0) + (e.estadoCaso === 'critico' ? 30 : 0)
}
