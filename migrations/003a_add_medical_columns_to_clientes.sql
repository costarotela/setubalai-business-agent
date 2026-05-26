-- ============================================================
-- MIGRACIÓN 003a: Agregar columnas médicas a clientes
-- Fecha: 2026-05-26
-- Propósito: Preparar tabla clientes para funcionar como pacientes
-- ============================================================

BEGIN;

-- Agregar columnas necesarias para pacientes médicos
ALTER TABLE setubalai.clientes 
ADD COLUMN IF NOT EXISTS apellido VARCHAR(200),
ADD COLUMN IF NOT EXISTS dni VARCHAR(20),
ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON setubalai.clientes(empresa_id, dni);
CREATE INDEX IF NOT EXISTS idx_clientes_apellido ON setubalai.clientes(empresa_id, apellido);

-- Verificar tabla historia_clinica existe y tiene paciente_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'setubalai' 
        AND table_name = 'historia_clinica' 
        AND column_name = 'paciente_id'
    ) THEN
        RAISE EXCEPTION 'Tabla historia_clinica no tiene columna paciente_id. Ejecutar migración 001 y 002 primero.';
    END IF;
END $$;

COMMIT;

-- Verificación
SELECT 
    column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'setubalai'
  AND table_name = 'clientes'
  AND column_name IN ('apellido', 'dni', 'fecha_nacimiento', 'metadata')
ORDER BY column_name;
