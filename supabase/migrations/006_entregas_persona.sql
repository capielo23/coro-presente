-- 006: Atribución por miembro familiar en el ledger de entregas
-- Permite registrar QUÉ recibió cada integrante del caso. Aditiva e idempotente.

ALTER TABLE entregas
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS persona_nombre text;

CREATE INDEX IF NOT EXISTS idx_entregas_persona ON entregas(persona_id) WHERE persona_id IS NOT NULL;
