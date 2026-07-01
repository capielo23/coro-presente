-- 002: Perfil extendido de voluntarios + especialidad requerida en necesidades
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Columnas de perfil en voluntarios
ALTER TABLE voluntarios
  ADD COLUMN IF NOT EXISTS areas_ayuda        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS especialidades     text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS zona_cobertura     text,
  ADD COLUMN IF NOT EXISTS disponibilidad     text,
  ADD COLUMN IF NOT EXISTS descripcion_ayuda  text;

-- Especialidad requerida en necesidades (para matching)
ALTER TABLE necesidades
  ADD COLUMN IF NOT EXISTS especialidad_requerida text;

-- Índices para búsqueda por arrays
CREATE INDEX IF NOT EXISTS idx_voluntarios_areas
  ON voluntarios USING GIN(areas_ayuda);

CREATE INDEX IF NOT EXISTS idx_voluntarios_especialidades
  ON voluntarios USING GIN(especialidades);

CREATE INDEX IF NOT EXISTS idx_necesidades_especialidad
  ON necesidades(especialidad_requerida)
  WHERE especialidad_requerida IS NOT NULL;

-- Permitir que el voluntario actualice su propio perfil
-- NOTA: PostgreSQL no soporta CREATE POLICY IF NOT EXISTS; usar DROP + CREATE (idempotente)
DROP POLICY IF EXISTS "voluntario_actualizar_propio_perfil" ON voluntarios;
CREATE POLICY "voluntario_actualizar_propio_perfil" ON voluntarios
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
