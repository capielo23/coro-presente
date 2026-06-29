-- CoroAyuda: Schema inicial para MVP
-- Ejecutar en Supabase Dashboard > SQL Editor

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: voluntarios (extiende auth.users de Supabase)
-- ============================================
CREATE TABLE voluntarios (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cedula TEXT UNIQUE,
  telefono TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'voluntario' CHECK (rol IN ('admin', 'voluntario')),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: casos (persona o familia)
-- ============================================
CREATE TABLE casos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('individual', 'familiar')),
  nombre_caso TEXT NOT NULL,
  num_integrantes INTEGER DEFAULT 1,
  foto_grupo_url TEXT,
  ciudad_origen TEXT,
  estado_origen TEXT,
  zona_afectada TEXT,
  direccion_actual TEXT,
  tipo_alojamiento TEXT CHECK (tipo_alojamiento IN ('casa_familiar','albergue','iglesia','hotel','otro')),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','estable','cerrado','critico')),
  tutor_id UUID REFERENCES voluntarios(id),
  registrado_por UUID REFERENCES voluntarios(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: personas (integrantes de un caso)
-- ============================================
CREATE TABLE personas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula TEXT,
  fecha_nacimiento DATE,
  edad_aprox INTEGER,
  sexo TEXT CHECK (sexo IN ('M','F','no_especificado')),
  rol_familia TEXT CHECK (rol_familia IN ('padre','madre','hijo','hija','adulto_mayor','solo','otro')),
  condicion_especial TEXT,
  telefono TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: necesidades
-- ============================================
CREATE TABLE necesidades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'alimentacion','ropa','medicamentos','traslado',
    'alojamiento','hogar','utiles','ninos','adulto_mayor','otro'
  )),
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_gestion','entregado','recurrente')),
  es_recurrente BOOLEAN DEFAULT FALSE,
  frecuencia TEXT CHECK (frecuencia IN ('semanal','quincenal','mensual')),
  proxima_fecha DATE,
  entregado_por UUID REFERENCES voluntarios(id),
  fecha_entrega TIMESTAMPTZ,
  descripcion_entrega TEXT,
  foto_entrega_url TEXT,
  registrado_por UUID REFERENCES voluntarios(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: notas_caso (notas internas)
-- ============================================
CREATE TABLE notas_caso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  autor_id UUID REFERENCES voluntarios(id) NOT NULL,
  contenido TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: historial_caso
-- ============================================
CREATE TABLE historial_caso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  caso_id UUID REFERENCES casos(id) ON DELETE CASCADE NOT NULL,
  voluntario_id UUID REFERENCES voluntarios(id),
  accion TEXT NOT NULL,
  detalle JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE necesidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_caso ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_caso ENABLE ROW LEVEL SECURITY;

-- Voluntarios: ver propio perfil
CREATE POLICY "voluntario_ver_propio" ON voluntarios
  FOR SELECT USING (auth.uid() = id);

-- Admin ve y gestiona todos
CREATE POLICY "admin_gestionar_voluntarios" ON voluntarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.rol = 'admin' AND v.estado = 'aprobado')
  );

-- Casos: solo voluntarios aprobados
CREATE POLICY "voluntarios_ver_casos" ON casos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_crear_casos" ON casos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "tutor_o_admin_editar_caso" ON casos
  FOR UPDATE USING (
    tutor_id = auth.uid() OR
    registrado_por = auth.uid() OR
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.rol = 'admin' AND v.estado = 'aprobado')
  );

-- Personas
CREATE POLICY "voluntarios_ver_personas" ON personas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_crear_personas" ON personas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

-- Necesidades
CREATE POLICY "voluntarios_ver_necesidades" ON necesidades
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_crear_necesidades" ON necesidades
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_editar_necesidades" ON necesidades
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

-- Notas e historial
CREATE POLICY "voluntarios_notas" ON notas_caso
  FOR ALL USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_ver_historial" ON historial_caso
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

CREATE POLICY "voluntarios_insertar_historial" ON historial_caso
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM voluntarios v WHERE v.id = auth.uid() AND v.estado = 'aprobado')
  );

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX idx_personas_cedula ON personas(cedula) WHERE cedula IS NOT NULL;
CREATE INDEX idx_personas_nombre ON personas(nombre, apellido);
CREATE INDEX idx_casos_estado ON casos(estado);
CREATE INDEX idx_casos_tutor ON casos(tutor_id);
CREATE INDEX idx_necesidades_caso ON necesidades(caso_id);
CREATE INDEX idx_necesidades_estado ON necesidades(estado);

-- ============================================
-- FUNCION: auto-actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actualizar_casos_updated_at
  BEFORE UPDATE ON casos FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER actualizar_necesidades_updated_at
  BEFORE UPDATE ON necesidades FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER actualizar_voluntarios_updated_at
  BEFORE UPDATE ON voluntarios FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
