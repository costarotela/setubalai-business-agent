-- ============================================================
-- MIGRACIÓN 005: Adaptar tablas médicas a nueva arquitectura
-- Agrega relaciones a tabla PACIENTES manteniendo compatibilidad
-- ============================================================

BEGIN;

-- ============================================================
-- HISTORIA_CLINICA: Mantener FK a clientes (legacy) Y agregar FK a pacientes (nuevo)
-- ============================================================

-- Agregar nueva columna para referencia a pacientes
ALTER TABLE setubalai.historia_clinica 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente_nuevo 
ON setubalai.historia_clinica(paciente_nuevo_id);

-- ============================================================
-- VISITAS: Agregar FK a pacientes (mantener la vieja)
-- ============================================================

ALTER TABLE setubalai.visitas 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_visitas_paciente_nuevo 
ON setubalai.visitas(paciente_nuevo_id);

-- ============================================================
-- ATENCIONES_MEDICAS: Agregar FK a pacientes
-- ============================================================

ALTER TABLE setubalai.atenciones_medicas 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_atenciones_medicas_paciente_nuevo 
ON setubalai.atenciones_medicas(paciente_nuevo_id);

-- ============================================================
-- PRACTICAS_MEDICAS: Agregar FK a pacientes
-- ============================================================

ALTER TABLE setubalai.practicas_medicas 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_practicas_medicas_paciente_nuevo 
ON setubalai.practicas_medicas(paciente_nuevo_id);

-- ============================================================
-- RECETAS: Agregar FK a pacientes
-- ============================================================

ALTER TABLE setubalai.recetas 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_recetas_paciente_nuevo 
ON setubalai.recetas(paciente_nuevo_id);

-- ============================================================
-- ESTUDIOS_ADJUNTOS: Agregar FK a pacientes
-- ============================================================

ALTER TABLE setubalai.estudios_adjuntos 
ADD COLUMN IF NOT EXISTS paciente_nuevo_id INTEGER REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_paciente_nuevo 
ON setubalai.estudios_adjuntos(paciente_nuevo_id);

COMMIT;

-- Verificación
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'setubalai'
  AND kcu.column_name LIKE '%paciente%'
ORDER BY tc.table_name, kcu.column_name;
