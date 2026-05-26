-- ============================================================
-- ROLLBACK 003a: Revertir columnas médicas de clientes
-- ============================================================

BEGIN;

-- Eliminar índices
DROP INDEX IF EXISTS setubalai.idx_clientes_dni;
DROP INDEX IF EXISTS setubalai.idx_clientes_apellido;

-- Eliminar columnas agregadas
ALTER TABLE setubalai.clientes 
DROP COLUMN IF EXISTS apellido,
DROP COLUMN IF EXISTS dni,
DROP COLUMN IF EXISTS fecha_nacimiento,
DROP COLUMN IF EXISTS metadata;

COMMIT;

SELECT 'Rollback completado. Clientes limpio.' AS status;
