-- ============================================================
-- MIGRACIÓN 004: Tabla PACIENTES (arquitectura limpia)
-- NO TOCA nada existente. Solo AGREGA tabla nueva.
-- ============================================================

BEGIN;

-- Crear tabla pacientes (arquitectura vertical médico)
CREATE TABLE IF NOT EXISTS setubalai.pacientes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
    
    -- Datos personales
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10) CHECK (sexo IN ('Masculino', 'Femenino', 'Otro')),
    
    -- Contacto
    telefono VARCHAR(50),
    email VARCHAR(200),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    
    -- Obra social
    obra_social VARCHAR(200),
    numero_afiliado VARCHAR(100),
    plan VARCHAR(100),
    vigencia_afiliacion DATE,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único
    CONSTRAINT pacientes_unique_dni_empresa UNIQUE (empresa_id, dni)
);

-- Índices
CREATE INDEX idx_pacientes_empresa ON setubalai.pacientes(empresa_id);
CREATE INDEX idx_pacientes_dni ON setubalai.pacientes(dni);
CREATE INDEX idx_pacientes_apellido ON setubalai.pacientes(apellido);
CREATE INDEX idx_pacientes_activo ON setubalai.pacientes(activo);
CREATE INDEX idx_pacientes_nombre_completo ON setubalai.pacientes(empresa_id, apellido, nombre);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION setubalai.update_pacientes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pacientes_timestamp
    BEFORE UPDATE ON setubalai.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION setubalai.update_pacientes_timestamp();

COMMIT;

-- Verificación
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'setubalai' 
  AND table_name = 'pacientes'
ORDER BY ordinal_position;
