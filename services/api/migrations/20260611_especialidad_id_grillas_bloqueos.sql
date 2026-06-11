-- ============================================================
-- Migration: 2026-06-11
-- Agregar especialidad_id a grillas_medicas y bloqueos_grilla
-- ============================================================
-- Jerarquia sagrada: Clinica -> Especialidad -> Profesional
-- Si especialidad_id sin medico_id => configura para TODA la especialidad
-- Si especialidad_id + medico_id => configura para ese medico especifico
-- ============================================================

-- 1. Agregar columna especialidad_id a grillas_medicas
ALTER TABLE setubalai.grillas_medicas 
  ADD COLUMN IF NOT EXISTS especialidad_id INT DEFAULT NULL 
  REFERENCES setubalai.especialidades_medicas(id);

-- 2. Agregar columna especialidad_id a bloqueos_grilla
ALTER TABLE setubalai.bloqueos_grilla 
  ADD COLUMN IF NOT EXISTS especialidad_id INT DEFAULT NULL 
  REFERENCES setubalai.especialidades_medicas(id);

-- 3. BACKFILL: Derivar especialidad_id para filas existentes
-- Para cada grilla existente, buscar la especialidad del medico via medico_especialidades
UPDATE setubalai.grillas_medicas gm
SET especialidad_id = (
  SELECT me.especialidad_id 
  FROM setubalai.medico_especialidades me 
  WHERE me.medico_id = gm.medico_id 
  LIMIT 1
)
WHERE gm.especialidad_id IS NULL;

UPDATE setubalai.bloqueos_grilla bg
SET especialidad_id = (
  SELECT me.especialidad_id 
  FROM setubalai.medico_especialidades me 
  WHERE me.medico_id = bg.medico_id 
  LIMIT 1
)
WHERE bg.especialidad_id IS NULL;

-- 4. Crear indices para performance
CREATE INDEX IF NOT EXISTS idx_grillas_especialidad 
  ON setubalai.grillas_medicas(especialidad_id);
CREATE INDEX IF NOT EXISTS idx_bloqueos_especialidad 
  ON setubalai.bloqueos_grilla(especialidad_id);

-- 5. Verificacion
SELECT 'grillas_medicas' as tabla, 
       COUNT(*) as total,
       COUNT(especialidad_id) as con_esp,
       COUNT(CASE WHEN especialidad_id IS NULL THEN 1 END) as sin_esp
FROM setubalai.grillas_medicas 
WHERE empresa_id = 16
UNION ALL
SELECT 'bloqueos_grilla', COUNT(*), COUNT(especialidad_id),
       COUNT(CASE WHEN especialidad_id IS NULL THEN 1 END)
FROM setubalai.bloqueos_grilla 
WHERE empresa_id = 16;
