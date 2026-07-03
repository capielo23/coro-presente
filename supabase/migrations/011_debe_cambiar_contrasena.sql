-- Marca si el usuario debe cambiar su contraseña al próximo inicio de sesión
-- Se activa cuando un coordinador restablece la clave manualmente
ALTER TABLE voluntarios
  ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE;
