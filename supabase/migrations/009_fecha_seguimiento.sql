-- 009: Campo fecha en seguimientos
-- Permite registrar visitas con la fecha real del contacto,
-- independientemente de cuándo se registre en el sistema.
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE seguimientos ADD COLUMN IF NOT EXISTS fecha DATE;

-- Backfill: los seguimientos existentes usan la fecha de created_at
UPDATE seguimientos SET fecha = created_at::date WHERE fecha IS NULL;
