-- Migration: Grillas Médicas, Bloqueos y Duraciones
-- Fecha: 2026-05-29
-- Descripción: Tablas para gestión de horarios, excepciones y duración de turnos

-- 1. GRILLAS MÉDICAS: Horarios base por día de semana
CREATE TABLE IF NOT EXISTS setubalai.grillas_medicas (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  medico_id INT NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_medico_dia_hora UNIQUE (medico_id, dia_semana, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_grillas_medico ON setubalai.grillas_medicas(medico_id);
CREATE INDEX IF NOT EXISTS idx_grillas_activo ON setubalai.grillas_medicas(activo);
CREATE INDEX IF NOT EXISTS idx_grillas_empresa ON setubalai.grillas_medicas(empresa_id);

COMMENT ON TABLE setubalai.grillas_medicas IS 'Horarios de atención base de cada médico por día de semana';
COMMENT ON COLUMN setubalai.grillas_medicas.dia_semana IS '1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado, 7=Domingo';

-- 2. BLOQUEOS GRILLA: Excepciones (vacaciones, congresos, feriados)
CREATE TABLE IF NOT EXISTS setubalai.bloqueos_grilla (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  medico_id INT NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
  fecha_desde DATE NOT NULL,
  fecha_hasta DATE NOT NULL,
  hora_inicio TIME, -- NULL = todo el día bloqueado
  hora_fin TIME,
  motivo VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_fecha_orden CHECK (fecha_hasta >= fecha_desde),
  CONSTRAINT check_hora_orden CHECK (hora_inicio IS NULL OR hora_fin IS NULL OR hora_fin > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_bloqueos_medico ON setubalai.bloqueos_grilla(medico_id);
CREATE INDEX IF NOT EXISTS idx_bloqueos_fecha ON setubalai.bloqueos_grilla(fecha_desde, fecha_hasta);
CREATE INDEX IF NOT EXISTS idx_bloqueos_empresa ON setubalai.bloqueos_grilla(empresa_id);

COMMENT ON TABLE setubalai.bloqueos_grilla IS 'Excepciones a los horarios regulares: vacaciones, congresos, feriados';
COMMENT ON COLUMN setubalai.bloqueos_grilla.hora_inicio IS 'NULL = bloqueo de día completo';

-- 3. DURACIÓN PRESTACIONES: Tiempo por especialidad
CREATE TABLE IF NOT EXISTS setubalai.duracion_prestaciones (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  especialidad VARCHAR(100) NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
  sobre_turnos_permitidos INT DEFAULT 0 CHECK (sobre_turnos_permitidos >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_empresa_especialidad UNIQUE (empresa_id, especialidad)
);

CREATE INDEX IF NOT EXISTS idx_duracion_empresa ON setubalai.duracion_prestaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_duracion_especialidad ON setubalai.duracion_prestaciones(especialidad);

COMMENT ON TABLE setubalai.duracion_prestaciones IS 'Duración de turno por especialidad médica';
COMMENT ON COLUMN setubalai.duracion_prestaciones.sobre_turnos_permitidos IS 'Cantidad de turnos extras permitidos por día';

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON setubalai.grillas_medicas TO paperclip;
GRANT SELECT, INSERT, UPDATE, DELETE ON setubalai.bloqueos_grilla TO paperclip;
GRANT SELECT, INSERT, UPDATE, DELETE ON setubalai.duracion_prestaciones TO paperclip;
GRANT USAGE, SELECT ON SEQUENCE setubalai.grillas_medicas_id_seq TO paperclip;
GRANT USAGE, SELECT ON SEQUENCE setubalai.bloqueos_grilla_id_seq TO paperclip;
GRANT USAGE, SELECT ON SEQUENCE setubalai.duracion_prestaciones_id_seq TO paperclip;
