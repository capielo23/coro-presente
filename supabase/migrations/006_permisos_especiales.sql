-- Permiso especial: coordinadores que el admin habilita para aprobar a otros coordinadores.
-- Solo los admins pueden otorgar o revocar este permiso.
-- Por defecto false: un coordinador nuevo no puede aprobar otros coordinadores.

ALTER TABLE voluntarios
ADD COLUMN IF NOT EXISTS puede_aprobar_coordinadores boolean NOT NULL DEFAULT false;
