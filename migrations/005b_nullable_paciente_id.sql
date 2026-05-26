-- ============================================================
-- MIGRACIÓN 005b: Hacer paciente_id nullable y agregar constraint
-- ============================================================

BEGIN;

-- Hacer paciente_id nullable en historia_clinica
ALTER TABLE setubalai.historia_clinica 
ALTER COLUMN paciente_id DROP NOT NULL;

-- Agregar constraint: al menos uno de los dos debe existir
ALTER TABLE setubalai.historia_clinica
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

-- Hacer lo mismo en visitas
ALTER TABLE setubalai.visitas 
ALTER COLUMN paciente_id DROP NOT NULL;

ALTER TABLE setubalai.visitas
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

-- Atenciones médicas
ALTER TABLE setubalai.atenciones_medicas 
ALTER COLUMN paciente_id DROP NOT NULL;

ALTER TABLE setubalai.atenciones_medicas
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

-- Practicas médicas
ALTER TABLE setubalai.practicas_medicas 
ALTER COLUMN paciente_id DROP NOT NULL;

ALTER TABLE setubalai.practicas_medicas
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

-- Recetas
ALTER TABLE setubalai.recetas 
ALTER COLUMN paciente_id DROP NOT NULL;

ALTER TABLE setubalai.recetas
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

-- Estudios adjuntos
ALTER TABLE setubalai.estudios_adjuntos 
ALTER COLUMN paciente_id DROP NOT NULL;

ALTER TABLE setubalai.estudios_adjuntos
ADD CONSTRAINT check_paciente_id_or_nuevo 
CHECK (paciente_id IS NOT NULL OR paciente_nuevo_id IS NOT NULL);

COMMIT;

SELECT 'Constraints actualizados correctamente' AS status;
