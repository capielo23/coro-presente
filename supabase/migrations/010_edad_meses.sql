-- 010: Edad en meses para recién nacidos (aditiva, no altera datos existentes)
-- Permite registrar la edad de un bebé en meses cuando aún no cumple un año.
-- fecha_nacimiento ya existe como columna en personas.

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS edad_meses integer;
