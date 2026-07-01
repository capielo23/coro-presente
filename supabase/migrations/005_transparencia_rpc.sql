-- Función de transparencia: devuelve estadísticas agregadas sin PII
-- SECURITY DEFINER para que funcione sin sesión de auth (usuarios anónimos/externos)
-- SET search_path evita search_path injection
--
-- Patrón clave: todos los COUNT/SUM se calculan en subqueries o CTEs separados.
-- PostgreSQL no permite anidar funciones de agregación (json_agg + COUNT).
-- La solución: pre-agregar en CTEs, luego json_agg sobre columnas ya calculadas.

CREATE OR REPLACE FUNCTION reporte_transparencia()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $BODY$
DECLARE
  v_resultado  JSON;
  v_resumen    JSON;
  v_etarios    JSON;
  v_categorias JSON;
  v_gestion    JSON;
BEGIN
  -- 1. Resumen global (subqueries escalares — no hay agregados anidados)
  SELECT json_build_object(
    'total_casos_activos',          (SELECT COUNT(*) FROM casos WHERE estado IN ('activo','critico','estable')),
    'total_personas_atendidas',     (SELECT COUNT(*) FROM personas p JOIN casos cc ON cc.id = p.caso_id WHERE cc.estado != 'cerrado'),
    'total_necesidades_pendientes', (SELECT COUNT(*) FROM necesidades n JOIN casos cc ON cc.id = n.caso_id WHERE n.estado IN ('pendiente','en_gestion') AND cc.estado != 'cerrado'),
    'total_necesidades',            (SELECT COUNT(*) FROM necesidades),
    'total_entregadas',             (SELECT COUNT(*) FROM necesidades WHERE estado = 'entregado'),
    'tasa_cumplimiento',            CASE
      WHEN (SELECT COUNT(*) FROM necesidades) = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(*) FROM necesidades WHERE estado = 'entregado')::numeric
        / (SELECT COUNT(*) FROM necesidades)::numeric * 100, 1
      )
    END
  ) INTO v_resumen;

  -- 2. Por grupo etario
  -- Clasificación: fecha_nacimiento > edad_aprox > rol_familia
  WITH clasificados AS (
    SELECT p.caso_id, p.id AS persona_id,
      CASE
        WHEN p.fecha_nacimiento IS NOT NULL AND p.fecha_nacimiento <= CURRENT_DATE THEN
          CASE
            WHEN DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento)) < 12 THEN 'nino'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento)) < 18 THEN 'adolescente'
            WHEN DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento)) < 60 THEN 'adulto'
            ELSE 'adulto_mayor'
          END
        WHEN p.edad_aprox IS NOT NULL THEN
          CASE
            WHEN p.edad_aprox < 12 THEN 'nino'
            WHEN p.edad_aprox < 18 THEN 'adolescente'
            WHEN p.edad_aprox < 60 THEN 'adulto'
            ELSE 'adulto_mayor'
          END
        WHEN p.rol_familia IN ('hijo','hija') THEN 'nino'
        WHEN p.rol_familia = 'adulto_mayor' THEN 'adulto_mayor'
        ELSE 'adulto'
      END AS grupo
    FROM personas p JOIN casos c ON c.id = p.caso_id WHERE c.estado != 'cerrado'
  ),
  grupo_casos AS (SELECT grupo, caso_id FROM clasificados GROUP BY grupo, caso_id),
  grupo_nec AS (
    SELECT gc.grupo,
      COUNT(n.id) FILTER (WHERE n.estado IN ('pendiente','en_gestion')) AS pendientes,
      COUNT(n.id) FILTER (WHERE n.estado = 'entregado') AS entregadas
    FROM grupo_casos gc LEFT JOIN necesidades n ON n.caso_id = gc.caso_id GROUP BY gc.grupo
  ),
  grupos_count AS (SELECT grupo, COUNT(*) AS total_personas FROM clasificados GROUP BY grupo),
  grupos_final AS (
    SELECT
      gc.grupo,
      gc.total_personas,
      COALESCE(gn.pendientes, 0) AS pendientes,
      COALESCE(gn.entregadas, 0) AS entregadas,
      CASE gc.grupo WHEN 'nino' THEN 1 WHEN 'adolescente' THEN 2 WHEN 'adulto' THEN 3 ELSE 4 END AS orden
    FROM grupos_count gc LEFT JOIN grupo_nec gn ON gn.grupo = gc.grupo
  )
  SELECT COALESCE(json_agg(
    json_build_object(
      'grupo',                  grupo,
      'total_personas',         total_personas,
      'necesidades_pendientes', pendientes,
      'necesidades_entregadas', entregadas
    ) ORDER BY orden
  ), '[]'::json)
  INTO v_etarios
  FROM grupos_final;

  -- 3. Por categoría (pre-agregar en CTE, luego json_agg sobre columnas)
  WITH cat_agg AS (
    SELECT categoria,
      COUNT(*)                                            AS total,
      COUNT(*) FILTER (WHERE estado IN ('pendiente','en_gestion')) AS pendientes,
      COUNT(*) FILTER (WHERE estado = 'entregado')       AS entregadas
    FROM necesidades GROUP BY categoria
  )
  SELECT COALESCE(json_agg(
    json_build_object(
      'categoria', categoria,
      'total',     total,
      'pendientes', pendientes,
      'entregadas',  entregadas
    ) ORDER BY pendientes DESC
  ), '[]'::json)
  INTO v_categorias
  FROM cat_agg;

  -- 4. Métricas de gestión
  SELECT json_build_object(
    'entregadas_ultimos_30_dias', (SELECT COUNT(*) FROM necesidades WHERE estado = 'entregado' AND fecha_entrega >= NOW() - INTERVAL '30 days'),
    'voluntarios_activos',        (SELECT COUNT(*) FROM voluntarios WHERE estado = 'aprobado')
  ) INTO v_gestion;

  -- Ensamblar respuesta final
  SELECT json_build_object(
    'generado_en',    NOW(),
    'resumen',        v_resumen,
    'por_grupo_etario', v_etarios,
    'por_categoria',  v_categorias,
    'gestion',        v_gestion
  ) INTO v_resultado;

  RETURN v_resultado;
END;
$BODY$;

-- Acceso público (sin sesión auth) y para usuarios autenticados
GRANT EXECUTE ON FUNCTION reporte_transparencia() TO anon;
GRANT EXECUTE ON FUNCTION reporte_transparencia() TO authenticated;
