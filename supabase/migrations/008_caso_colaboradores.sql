-- Tabla de colaboradores por caso
-- Permite que múltiples voluntarios se unan a un caso además del tutor principal.

CREATE TABLE IF NOT EXISTS caso_colaboradores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  voluntario_id UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  agregado_por UUID REFERENCES voluntarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (caso_id, voluntario_id)
);

ALTER TABLE caso_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voluntarios aprobados pueden ver colaboradores"
  ON caso_colaboradores FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM voluntarios WHERE id = auth.uid() AND estado = 'aprobado')
  );

CREATE POLICY "Voluntarios aprobados pueden unirse como colaboradores"
  ON caso_colaboradores FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios WHERE id = auth.uid() AND estado = 'aprobado')
  );

CREATE POLICY "Cada voluntario puede salir de sus propios casos"
  ON caso_colaboradores FOR DELETE
  USING (voluntario_id = auth.uid());
