// Script de migración — lee credenciales de .env.local y ejecuta SQL en Supabase
// Uso: node scripts/migrate.mjs
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.local')

// Leer .env.local manualmente
const env = {}
readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
})

const MANAGEMENT_KEY = env['SUPABASE_MANAGEMENT_API_KEY']
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const PROJECT_REF = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!MANAGEMENT_KEY || !PROJECT_REF) {
  console.error('Faltan SUPABASE_MANAGEMENT_API_KEY o NEXT_PUBLIC_SUPABASE_URL en .env.local')
  process.exit(1)
}

async function sql(query, descripcion) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MANAGEMENT_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error(`❌ ${descripcion}:`, data)
    return false
  }
  console.log(`✅ ${descripcion}`)
  return true
}

console.log(`\n🚀 Ejecutando migraciones en proyecto ${PROJECT_REF}\n`)

// ── MIGRACIÓN 1: tabla caso_colaboradores ─────────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS caso_colaboradores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
    voluntario_id UUID REFERENCES voluntarios(id) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(caso_id, voluntario_id)
  )
`, 'caso_colaboradores: tabla creada')

// ── MIGRACIÓN 2: columnas áreas de ayuda en voluntarios ──────────────────────
await sql(`
  ALTER TABLE voluntarios ADD COLUMN IF NOT EXISTS areas_ayuda TEXT[] DEFAULT '{}'
`, 'voluntarios: columna areas_ayuda')

await sql(`
  ALTER TABLE voluntarios ADD COLUMN IF NOT EXISTS descripcion_ayuda TEXT
`, 'voluntarios: columna descripcion_ayuda')

// ── MIGRACIÓN 3: catálogo de áreas de ayuda ───────────────────────────────────
await sql(`
  CREATE TABLE IF NOT EXISTS areas_ayuda_catalogo (
    clave TEXT PRIMARY KEY,
    etiqueta TEXT NOT NULL,
    es_personalizada BOOLEAN DEFAULT false,
    usos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`, 'areas_ayuda_catalogo: tabla creada')

await sql(`
  INSERT INTO areas_ayuda_catalogo (clave, etiqueta, es_personalizada, usos) VALUES
    ('traslado',      'Traslado y logística (tengo vehículo)', false, 0),
    ('medico',        'Atención médica (médico, enfermero, farmacéutico)', false, 0),
    ('psicologia',    'Apoyo psicológico / emocional', false, 0),
    ('legal',         'Asesoría legal y recuperación de documentos', false, 0),
    ('alimentos',     'Alimentos (cocina, donación de comida, restaurante)', false, 0),
    ('alojamiento',   'Alojamiento temporal (tengo espacio disponible)', false, 0),
    ('donacion',      'Donaciones e insumos (tengo o consigo bienes)', false, 0),
    ('construccion',  'Construcción y reparación', false, 0),
    ('cuidado_ninos', 'Cuidado de niños / educación', false, 0),
    ('comunicacion',  'Visitas y seguimiento presencial (trabajo de campo)', false, 0),
    ('registro',      'Registro y coordinación de casos', false, 0)
  ON CONFLICT (clave) DO NOTHING
`, 'areas_ayuda_catalogo: áreas base insertadas')

console.log('\n✔ Migraciones completadas\n')
