-- 003: Bitácora de seguimiento por caso + habilidades requeridas a nivel de caso
-- Ejecutar en Supabase Dashboard > SQL Editor

-- ============================================
-- TABLA: seguimientos (bitácora de contacto del voluntario con el caso)
-- ============================================
CREATE TABLE IF NOT EXISTS seguimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  voluntario_id UUID REFERENCES voluntarios(id),
  tipo_contacto TEXT NOT NULL CHECK (tipo_contacto IN (
    'visita','llamada','whatsapp','entrega','gestion'
  )),
  descripcion TEXT NOT NULL,
  proximos_pasos TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguimientos_caso
  ON seguimientos(caso_id, created_at DESC);

-- ============================================
-- RLS: bitácora privada, solo voluntarios aprobados
-- ============================================
ALTER TABLE seguimientos ENABLE ROW LEVEL SECURITY;

-- PostgreSQL no soporta CREATE POLICY IF NOT EXISTS; DROP + CREATE para ser idempotente
DROP POLICY IF EXISTS "voluntarios_ver_seguimientos" ON seguimientos;
CREATE POLICY "voluntarios_ver_seguimientos" ON seguimientos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

DROP POLICY IF EXISTS "voluntarios_crear_seguimientos" ON seguimientos;
CREATE POLICY "voluntarios_crear_seguimientos" ON seguimientos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

-- ============================================
-- casos.habilidades_requeridas: suma de especialidades requeridas por sus necesidades
-- Permite matching a nivel de caso (GIN) sin recorrer necesidad por necesidad.
-- Se mantiene desde la API POST /api/necesidades al crear una necesidad con
-- especialidad_requerida.
-- ============================================
ALTER TABLE casos
  ADD COLUMN IF NOT EXISTS habilidades_requeridas TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_casos_habilidades
  ON casos USING GIN(habilidades_requeridas);

-- ============================================
-- necesidades.especialidad_requerida: garantizar que exista antes del backfill.
-- (Originalmente la añadía la 002; se incluye aquí para que la 003 sea autosuficiente.)
-- ============================================
ALTER TABLE necesidades
  ADD COLUMN IF NOT EXISTS especialidad_requerida TEXT;

CREATE INDEX IF NOT EXISTS idx_necesidades_especialidad
  ON necesidades(especialidad_requerida)
  WHERE especialidad_requerida IS NOT NULL;

-- ============================================
-- Backfill: poblar habilidades_requeridas con las especialidades ya registradas
-- en necesidades existentes (idempotente).
-- ============================================
UPDATE casos c
SET habilidades_requeridas = sub.habilidades
FROM (
  SELECT caso_id, ARRAY_AGG(DISTINCT especialidad_requerida) AS habilidades
  FROM necesidades
  WHERE especialidad_requerida IS NOT NULL AND especialidad_requerida <> ''
  GROUP BY caso_id
) sub
WHERE c.id = sub.caso_id;
