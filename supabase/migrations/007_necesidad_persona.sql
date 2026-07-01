-- 007: Asignar la necesidad a un integrante específico (o a toda la familia = null)
-- Permite que el registro empiece por "¿para quién es?" y quede guardado a nivel de necesidad.
-- Aditiva e idempotente.

ALTER TABLE necesidades
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_necesidades_persona ON necesidades(persona_id) WHERE persona_id IS NOT NULL;
