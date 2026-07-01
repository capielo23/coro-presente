-- Ampliar el CHECK constraint de voluntarios.rol para incluir 'coordinador'
-- El valor 'admin' se conserva para retrocompatibilidad con el primer usuario creado manualmente.
-- En el código, ambos valores ('admin' y 'coordinador') reciben los mismos permisos.

ALTER TABLE voluntarios DROP CONSTRAINT IF EXISTS voluntarios_rol_check;
ALTER TABLE voluntarios ADD CONSTRAINT voluntarios_rol_check
  CHECK (rol IN ('admin', 'coordinador', 'voluntario'));
