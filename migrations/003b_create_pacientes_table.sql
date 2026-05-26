-- ============================================================
-- MIGRACIÓN 003b: Tabla PACIENTES separada (vertical médico)
-- Fecha: 2026-05-26
-- ARQUITECTURA CORRECTA: Clientes (CRM) ≠ Pacientes (Médico)
-- ============================================================

BEGIN;

-- ============================================================
-- TABLA PACIENTES (Solo para empresas rubro='Salud')
-- ============================================================

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
    
    -- Metadata flexible (JSON)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único por empresa
    CONSTRAINT pacientes_unique_dni_empresa UNIQUE (empresa_id, dni)
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_pacientes_empresa ON setubalai.pacientes(empresa_id);
CREATE INDEX idx_pacientes_dni ON setubalai.pacientes(dni);
CREATE INDEX idx_pacientes_apellido ON setubalai.pacientes(apellido);
CREATE INDEX idx_pacientes_activo ON setubalai.pacientes(activo);

-- Índice de búsqueda por nombre completo
CREATE INDEX idx_pacientes_nombre_apellido ON setubalai.pacientes(empresa_id, apellido, nombre);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION setubalai.update_pacientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pacientes_updated_at
    BEFORE UPDATE ON setubalai.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION setubalai.update_pacientes_updated_at();

-- ============================================================
-- ACTUALIZAR HISTORIA_CLINICA: paciente_id ahora referencia tabla pacientes
-- ============================================================

-- Si historia_clinica ya existe, no hacemos nada (mantiene compatibilidad)
-- En migración futura se puede migrar data si hay clientes que deberían ser pacientes

COMMIT;

-- Verificación
SELECT 
    'pacientes' AS tabla,
    COUNT(*) AS columnas
FROM information_schema.columns
WHERE table_schema = 'setubalai' 
  AND table_name = 'pacientes';

SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE schemaname = 'setubalai' 
  AND tablename = 'pacientes';
