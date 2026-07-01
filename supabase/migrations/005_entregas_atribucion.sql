-- 005: Ledger de entregas (atribución transparente deliverer vs marker)
-- Separa QUIÉN entregó de QUIÉN registró la entrega, y permite historial por
-- período en necesidades recurrentes. Ejecutar en Supabase SQL Editor o Management API.

CREATE TABLE IF NOT EXISTS entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  necesidad_id uuid REFERENCES necesidades(id) ON DELETE CASCADE NOT NULL,
  caso_id uuid REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  item_texto text,                                       -- null = entrega de la necesidad completa (modo simple)
  descripcion text,                                      -- qué se entregó / nota del período
  entregado_por_id uuid REFERENCES voluntarios(id),      -- voluntario que entregó (null = equipo / sin especificar)
  entregado_por_nombre text NOT NULL,                    -- etiqueta visible: nombre o 'Equipo CoroAyuda'
  marcado_por uuid REFERENCES voluntarios(id) NOT NULL,  -- coordinador que registró la entrega
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entregas_necesidad ON entregas(necesidad_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_caso ON entregas(caso_id, fecha DESC);

ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voluntarios_ver_entregas" ON entregas;
CREATE POLICY "voluntarios_ver_entregas" ON entregas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

DROP POLICY IF EXISTS "voluntarios_crear_entregas" ON entregas;
CREATE POLICY "voluntarios_crear_entregas" ON entregas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );
