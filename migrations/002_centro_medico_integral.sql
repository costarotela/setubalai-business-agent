-- ============================================================
-- MIGRACIÓN 002: Centro Médico Integral (COMPLETA)
-- Fecha: 2026-05-26
-- Modelo: VISITA → ATENCIÓN → PRÁCTICAS
-- ============================================================

BEGIN;

-- PASO 1: CREAR TABLA MÉDICOS
CREATE TABLE IF NOT EXISTS setubalai.medicos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES setubalai.usuarios(id) ON DELETE SET NULL,
    
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    matricula_provincial VARCHAR(50),
    matricula_nacional VARCHAR(50),
    especialidades TEXT[] DEFAULT '{}',
    
    duracion_turno_minutos INTEGER DEFAULT 30,
    horarios_atencion JSONB DEFAULT '{}',
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT medicos_unique_matricula_prov UNIQUE(empresa_id, matricula_provincial)
);

CREATE INDEX IF NOT EXISTS idx_medicos_empresa ON setubalai.medicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_medicos_activo ON setubalai.medicos(activo);

-- PASO 2: CREAR TABLA HISTORIA CLÍNICA
CREATE TABLE IF NOT EXISTS setubalai.historia_clinica (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    
    grupo_sanguineo VARCHAR(10),
    alergias TEXT[] DEFAULT '{}',
    medicacion_habitual TEXT[] DEFAULT '{}',
    antecedentes_personales TEXT,
    antecedentes_familiares TEXT,
    cirugias_previas TEXT[] DEFAULT '{}',
    notas_adicionales TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, paciente_id)
);

CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente ON setubalai.historia_clinica(paciente_id);

-- PASO 3: CREAR TABLA VISITAS
CREATE TABLE IF NOT EXISTS setubalai.visitas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_consulta TEXT,
    tipo_visita VARCHAR(50) DEFAULT 'consulta',
    
    recordatorio_enviado BOOLEAN DEFAULT false,
    recordatorio_fecha TIMESTAMPTZ,
    
    cancelacion_motivo TEXT,
    fecha_cancelacion TIMESTAMPTZ,
    cancelado_por_usuario_id INTEGER REFERENCES setubalai.usuarios(id),
    reprogramado_a_visita_id INTEGER REFERENCES setubalai.visitas(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitas_empresa ON setubalai.visitas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_visitas_paciente ON setubalai.visitas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_visitas_medico ON setubalai.visitas(medico_id);
CREATE INDEX IF NOT EXISTS idx_visitas_fecha ON setubalai.visitas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_visitas_estado ON setubalai.visitas(estado);

-- PASO 4: CREAR TABLA ATENCIONES MÉDICAS
CREATE TABLE IF NOT EXISTS setubalai.atenciones_medicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    visita_id INTEGER NOT NULL UNIQUE REFERENCES setubalai.visitas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    fecha_hora_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_hora_fin TIMESTAMPTZ,
    estado VARCHAR(50) DEFAULT 'en_curso',
    
    anamnesis TEXT,
    examen_fisico TEXT,
    diagnostico TEXT,
    plan_tratamiento TEXT,
    observaciones TEXT,
    
    presion_arterial VARCHAR(20),
    frecuencia_cardiaca INTEGER,
    frecuencia_respiratoria INTEGER,
    temperatura DECIMAL(4,2),
    saturacion_oxigeno INTEGER,
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    imc DECIMAL(5,2),
    
    evolucion TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atenciones_medicas_empresa ON setubalai.atenciones_medicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_medicas_paciente ON setubalai.atenciones_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_medicas_medico ON setubalai.atenciones_medicas(medico_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_medicas_visita ON setubalai.atenciones_medicas(visita_id);

-- PASO 5: CREAR TABLA NOMENCLADOR DE PRÁCTICAS
CREATE TABLE IF NOT EXISTS setubalai.nomenclador_practicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    
    codigo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(100),
    especialidad_requerida VARCHAR(100),
    
    precio_particular DECIMAL(10,2),
    valor_modulo DECIMAL(10,2),
    duracion_minutos INTEGER,
    requiere_autorizacion BOOLEAN DEFAULT false,
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_nomenclador_practicas_empresa ON setubalai.nomenclador_practicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nomenclador_practicas_codigo ON setubalai.nomenclador_practicas(codigo);
CREATE INDEX IF NOT EXISTS idx_nomenclador_practicas_tipo ON setubalai.nomenclador_practicas(tipo);

-- PASO 6: CREAR TABLA PRÁCTICAS MÉDICAS
CREATE TABLE IF NOT EXISTS setubalai.practicas_medicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    atencion_medica_id INTEGER NOT NULL REFERENCES setubalai.atenciones_medicas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    tipo_practica VARCHAR(100) NOT NULL,
    codigo_nomenclador VARCHAR(50),
    descripcion_nomenclador TEXT,
    
    precio_practica DECIMAL(10,2),
    coseguro_paciente DECIMAL(10,2),
    cobertura_obra_social DECIMAL(10,2),
    
    estado_facturacion VARCHAR(50) DEFAULT 'pendiente',
    fecha_facturacion DATE,
    numero_factura VARCHAR(100),
    
    requiere_autorizacion BOOLEAN DEFAULT false,
    numero_autorizacion VARCHAR(100),
    fecha_autorizacion DATE,
    
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_practicas_medicas_empresa ON setubalai.practicas_medicas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_practicas_medicas_atencion ON setubalai.practicas_medicas(atencion_medica_id);
CREATE INDEX IF NOT EXISTS idx_practicas_medicas_paciente ON setubalai.practicas_medicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_practicas_medicas_estado ON setubalai.practicas_medicas(estado_facturacion);

-- PASO 7: CREAR TABLA ESTUDIOS ADJUNTOS
CREATE TABLE IF NOT EXISTS setubalai.estudios_adjuntos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    
    tipo_estudio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_estudio DATE,
    
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_url TEXT NOT NULL,
    archivo_tipo VARCHAR(50),
    archivo_tamano_bytes BIGINT,
    
    consulta_id INTEGER REFERENCES setubalai.visitas(id) ON DELETE SET NULL,
    subido_por_usuario_id INTEGER REFERENCES setubalai.usuarios(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_paciente ON setubalai.estudios_adjuntos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_tipo ON setubalai.estudios_adjuntos(tipo_estudio);

-- PASO 8: CREAR TABLA RECETAS
CREATE TABLE IF NOT EXISTS setubalai.recetas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    atencion_medica_id INTEGER NOT NULL REFERENCES setubalai.atenciones_medicas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    medicamentos JSONB NOT NULL,
    indicaciones TEXT,
    valida_hasta DATE,
    archivo_pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recetas_atencion ON setubalai.recetas(atencion_medica_id);
CREATE INDEX IF NOT EXISTS idx_recetas_paciente ON setubalai.recetas(paciente_id);

COMMIT;

-- Verificación
SELECT 
    'medicos' AS tabla, COUNT(*) AS registros FROM setubalai.medicos
UNION ALL
SELECT 'historia_clinica', COUNT(*) FROM setubalai.historia_clinica
UNION ALL
SELECT 'visitas', COUNT(*) FROM setubalai.visitas
UNION ALL
SELECT 'atenciones_medicas', COUNT(*) FROM setubalai.atenciones_medicas
UNION ALL
SELECT 'nomenclador_practicas', COUNT(*) FROM setubalai.nomenclador_practicas
UNION ALL
SELECT 'practicas_medicas', COUNT(*) FROM setubalai.practicas_medicas
UNION ALL
SELECT 'estudios_adjuntos', COUNT(*) FROM setubalai.estudios_adjuntos
UNION ALL
SELECT 'recetas', COUNT(*) FROM setubalai.recetas;
