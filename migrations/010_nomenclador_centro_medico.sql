-- ============================================================
-- MIGRACIÓN 010: Nomenclador de Prácticas Médicas
-- Sembrado con datos consistentes para empresa_id=16 (Centro Médico Santa Clara demo)
-- Se alinean con las prácticas existentes en practicas_medicas
-- ============================================================

BEGIN;
SET search_path TO setubalai;

INSERT INTO nomenclador_practicas
(empresa_id, codigo, descripcion, tipo, especialidad_requerida, precio_particular, valor_modulo, duracion_minutos, requiere_autorizacion, activo, created_at, updated_at)
VALUES
-- ════════════════════════════════════════
-- CONSULTAS
-- ════════════════════════════════════
(16, 'CON-001', 'Consulta de clínica médica - Consulta general con médico clínico', 'Consulta', 'Clínica Médica', 15000, NULL, 30, false, true, NOW(), NOW()),
(16, 'CON-002', 'Consulta cardiológica - Consulta con especialista en cardiología', 'Consulta', 'Cardiología', 25000, NULL, 40, true, true, NOW(), NOW()),
(16, 'CON-003', 'Consulta traumatológica - Consulta con especialista en traumatología', 'Consulta', 'Traumatología', 22000, NULL, 40, true, true, NOW(), NOW()),
(16, 'CON-004', 'Consulta dermatológica - Consulta con especialista en dermatología', 'Consulta', 'Dermatología', 20000, NULL, 30, false, true, NOW(), NOW()),
(16, 'CON-005', 'Consulta pediátrica - Consulta con pediatra', 'Consulta', 'Pediatría', 18000, NULL, 30, false, true, NOW(), NOW()),

-- ════════════════════════════════════
-- ESTUDIOS DE CARDIOLOGÍA
-- ═══════════════════════════
(16, 'CAR-001', 'Electrocardiograma 12 derivaciones - Registro de actividad eléctrica cardíaca', 'Estudio', 'Cardiología', 8000, NULL, 15, false, true, NOW(), NOW()),
(16, 'CAR-005', 'Ecocardiograma Doppler - Ecografía cardíaca con flujo Doppler', 'Estudio', 'Cardiología', 35000, NULL, 30, true, true, NOW(), NOW()),

-- ══════════════════════════
-- ESTUDIOS DE DERMATOLOGÍA
-- ═══════════════════════════
(16, 'DER-001', 'Dermatoscopia digital - Análisis de lesiones cutáneas con dermatoscopio digital', 'Estudio', 'Dermatología', 12000, NULL, 20, false, true, NOW(), NOW()),
(16, 'DER-003', 'Biopsia de piel con anatomía patológica - Extracción de muestra y análisis histológico', 'Estudio', 'Dermatología', 30000, NULL, 45, true, true, NOW(), NOW()),

-- ══════════════════════════
-- ESTUDIOS DE OTORRINOLARINGOLOGÍA
-- ════════════════════════════════════
(16, 'ENT-001', 'Audiometría - Evaluación de capacidad auditiva', 'Estudio', 'Otorrinolaringología', 10000, NULL, 30, false, true, NOW(), NOW()),

-- ══════════════════════════
-- ESTUDIOS DE IMÁGENES
-- ═══════════════════════════
(16, 'IMA-RMN01', 'Resonancia magnética de rodilla - RMN con contraste de articulación', 'Estudio', 'Traumatología', 55000, NULL, 45, true, true, NOW(), NOW()),
(16, 'IMA-RX001', 'Radiografía de columna lumbar - Radiografía AP y lateral', 'Estudio', 'Traumatología', 5000, NULL, 10, false, true, NOW(), NOW()),

-- ══════════════════════════
-- ESTUDIOS DE OFTALMOLOGÍA
-- ════════════════════════════════════
(16, 'OFT-001', 'Fondo de ojo - Evaluación de retina y nervio óptico', 'Estudio', 'Oftalmología', 12000, NULL, 20, false, true, NOW(), NOW()),

-- ══════════════════════════
-- LABORATORIO
-- ══════════════════════════
(16, 'LAB-001', 'Hemograma completo - Glóbulos rojos, blancos, plaquetas, hemoglobina', 'Laboratorio', 'Laboratorio', 4500, NULL, 5, false, true, NOW(), NOW()),
(16, 'LAB-015', 'Perfil lipídico - Colesterol total, HDL, LDL, triglicéridos', 'Laboratorio', 'Laboratorio', 6000, NULL, 5, false, true, NOW(), NOW()),
(16, 'LAB-022', 'Glucemia en ayunas - Nivel de glucosa en sangre', 'Laboratorio', 'Laboratorio', 3500, NULL, 5, false, true, NOW(), NOW()),
(16, 'LAB-030', 'Coagulograma completo - TP, TTPA, fibrinógeno, plaquetas', 'Laboratorio', 'Laboratorio', 8000, NULL, 5, false, true, NOW(), NOW()),

-- ══════════════════════════
-- KINESIOLOGÍA
-- ══════════════════════════
(16, 'KIN-001', 'Kinesiología (sesión individual) - Sesión de rehabilitación kinésica', 'Kinesiología', 'Kinesiología', 12000, NULL, 45, false, true, NOW(), NOW())
;

-- VERIFICACIÓN
SELECT COUNT(*) as total_cargados FROM setubalai.nomenclador_practicas WHERE empresa_id = 16;
SELECT tipo, COUNT(*) as cantidad FROM setubalai.nomenclador_practicas WHERE empresa_id = 16 GROUP BY tipo ORDER BY tipo;

COMMIT;
