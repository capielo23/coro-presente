-- Migración 007: Foto de perfil de voluntarios
-- Agrega columna para almacenar el path del avatar en Supabase Storage

ALTER TABLE voluntarios ADD COLUMN IF NOT EXISTS foto_perfil_path TEXT;

-- Bucket privado para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatares',
  'avatares',
  false,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
