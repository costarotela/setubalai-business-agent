-- ============================================================
-- 009_seed_atenciones_y_practicas.sql
-- ============================================================
SET search_path TO setubalai;
SET client_encoding = 'UTF8';

DELETE FROM practicas_medicas WHERE empresa_id = 16;
DELETE FROM atenciones_medicas WHERE empresa_id = 16;

DO $$
DECLARE
    at1 INTEGER; at2 INTEGER; at3 INTEGER; at4 INTEGER;
    at5 INTEGER; at6 INTEGER; at7 INTEGER; at8 INTEGER;
    at9 INTEGER; at10 INTEGER; at11 INTEGER; at12 INTEGER;
BEGIN

-- ATENCION 1: Dr. García (1) -> Juan Pérez (41)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 43, NULL, 41, 1,
    '2026-05-26 08:00:00', '2026-05-26 08:35:00', 'completado',
    'Paciente refiere control de presión arterial. Episodios de cefalea ocasional.',
    'Buen estado general. Cardiorrespiratorio sin compromiso.',
    'Hipertensión arterial esencial en control',
    'Continuar Losartán 50mg c/24hs. Control en 30 días.',
    'Paciente adherente al tratamiento.',
    '150/92 mmHg', 82, 18, 36.5, 98, 82, 1.75, 26.8, NOW(), NOW()
) RETURNING id INTO at1;

-- ATENCION 2: Dr. García (1) -> María González (42)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 59, NULL, 42, 1,
    '2026-05-25 14:00:00', '2026-05-25 14:40:00', 'completado',
    'Chequeo general anual. Asintomática. Alergia a sulfamidas.',
    'Buen estado general. Normotenso.',
    'Chequeo de salud general',
    'Solicitar chequeo hematológico completo.',
    'Paciente refiere cansancio ocasional.',
    '120/78 mmHg', 76, 16, 36.4, 99, 65, 1.62, 24.8, NOW(), NOW()
) RETURNING id INTO at2;

-- ATENCION 3: Dr. García (1) -> Roberto Sánchez (45)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 23, NULL, 45, 1,
    '2026-05-26 09:30:00', '2026-05-26 10:00:00', 'completado',
    'Dolor lumbar de 3 días. Niega irradiación.',
    'Contractura paravertebral lumbar.',
    'Lumbalgia inespecífica aguda',
    'Reposo relativo. AINE. Kinesi si persiste.',
    'Paciente jubilado PAMI, sedentario.',
    '138/85 mmHg', 78, 17, 36.6, 97, 88, 1.70, 30.5, NOW(), NOW()
) RETURNING id INTO at3;

-- ATENCION 4: Dr. Rodríguez (2) -> Ana Torres (44)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 39, NULL, 44, 2,
    '2026-05-24 10:00:00', '2026-05-24 10:45:00', 'completado',
    'Control cardiológico. Palpitaciones ocasionales.',
    'Ruidos cardíacos rítmicos. Sin soplos.',
    'Hipertensión arterial en seguimiento',
    'ECG de control. Continuar enalapril 10mg.',
    'ALERGIAS: yodo, contraste — PRECAUCIÓN con estudios contrastados.',
    '145/88 mmHg', 84, 18, 36.4, 98, 70, 1.68, 24.8, NOW(), NOW()
) RETURNING id INTO at4;

-- ATENCION 5: Dr. Rodríguez (2) -> María González (42) — en curso
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 45, NULL, 42, 2,
    '2026-05-26 10:00:00', NULL, 'en_curso',
    'Chequeo cardiológico anual. Asintomática.',
    'En evaluación...',
    NULL, NULL, NULL,
    '125/80 mmHg', 72, 16, 36.5, 99, 65, 1.62, 24.8, NOW(), NOW()
) RETURNING id INTO at5;

-- ATENCION 6: Dr. Rodríguez (2) -> Sofía Gómez (48)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 48, NULL, 48, 2,
    '2026-05-27 08:00:00', '2026-05-27 08:30:00', 'completado',
    'Post-operatorio reemplazo valvular mitral (6 meses).',
    'Regular estado general. Prótesis audible.',
    'Post-operatorio de reemplazo valvular',
    'Continuar anticoagulación. Coagulograma mensual.',
    'Evolución favorable post-operatoria.',
    '118/72 mmHg', 68, 16, 36.7, 98, 60, 1.65, 22.0, NOW(), NOW()
) RETURNING id INTO at6;

-- ATENCION 7: Dr. Martínez (3) -> Carlos Rodríguez (43)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 22, NULL, 43, 3,
    '2026-05-26 08:00:00', '2026-05-26 08:45:00', 'completado',
    'Dolor en rodilla derecha de 2 semanas. Niega traumatismo.',
    'Rodilla derecha con leve derrame articular. McMurray positivo.',
    'Lesión meniscal probable',
    'RMN de rodilla. Reposo deportivo. AINE.',
    'Deportista amateur.',
    '130/82 mmHg', 74, 17, 36.5, 99, 85, 1.80, 26.2, NOW(), NOW()
) RETURNING id INTO at7;

-- ATENCION 8: Dr. Martínez (3) -> Diego Fernández (47)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 46, NULL, 47, 3,
    '2026-05-26 11:00:00', '2026-05-26 11:30:00', 'completado',
    'Dolor lumbar persistente de 2 semanas.',
    'Limitación de movimientos en flexión. No dolor radicular.',
    'Lumbalgia mecánica en evolución',
    'Kinesiología 10 sesiones. Reposo deportivo 1 semana.',
    'Trabajo de oficina sedentario.',
    '128/80 mmHg', 72, 16, 36.6, 98, 78, 1.72, 26.4, NOW(), NOW()
) RETURNING id INTO at8;

-- ATENCION 9: Dr. López (4) -> Hernán Ruiz (55)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 30, NULL, 55, 4,
    '2026-05-27 09:00:00', '2026-05-27 09:25:00', 'completado',
    'Nuevos lunares en espalda. Antecedente familiar de melanoma.',
    '2 nevos típicos, 1 nevo atípico a vigilar.',
    'Nevus melanocíticos múltiples — seguimiento',
    'Fotografía corporal. Biopsia del nevo atípico.',
    'Alto riesgo por antecedente familiar.',
    '122/76 mmHg', 70, 15, 36.5, 99, 90, 1.82, 27.2, NOW(), NOW()
) RETURNING id INTO at9;

-- ATENCION 10: Dr. Fernández (5) -> Valeria Morales (52)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 27, NULL, 52, 5,
    '2026-05-26 14:00:00', '2026-05-26 14:20:00', 'completado',
    'Dolor de oído derecho. Fiebre hasta 38.5°C.',
    'Otoscopia: tímpano eritematoso, abombado, sin perforación.',
    'Otitis media aguda',
    'Amoxicilina 875mg c/12hs x 7 días. Paracetamol si dolor.',
    'ALERGIA: AAS (Aspirina) — NO administrar.',
    '105/68 mmHg', 88, 20, 37.8, 98, 45.00, 1.45, 21.4, NOW(), NOW()
) RETURNING id INTO at10;

-- ATENCION 11: Dr. García (1) -> Pablo Ramírez (49)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 60, NULL, 49, 1,
    '2026-05-20 10:00:00', '2026-05-20 10:35:00', 'completado',
    'Cefalea recurrente de 2 semanas.',
    'Neurológico sin signos focales.',
    'Cefalea tensional',
    'Paracetamol prn. Control de PA diario.',
    'Estrés laboral referido.',
    '132/84 mmHg', 80, 17, 36.5, 99, 75, 1.78, 23.7, NOW(), NOW()
) RETURNING id INTO at11;

-- ATENCION 12: Dr. López (4) -> Claudia Díaz (50)
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, paciente_nuevo_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin, estado, anamnesis, examen_fisico,
    diagnostico, plan_tratamiento, observaciones,
    presion_arterial, frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
    saturacion_oxigeno, peso, altura, imc, created_at, updated_at
) VALUES (
    16, 49, NULL, 50, 4,
    '2026-05-27 09:00:00', '2026-05-27 09:30:00', 'completado',
    'Dolores de cabeza. Derivada de clínica médica.',
    'Rosácea eritematotelangiectásica activa en región malar.',
    'Rosácea en brote',
    'Metronidazol gel tópico c/12hs. FPS 50+.',
    'Referida por Dr. García.',
    '128/80 mmHg', 76, 16, 36.6, 99, 62, 1.60, 24.2, NOW(), NOW()
) RETURNING id INTO at12;

-- ==========================================
-- PRÁCTICAS MÉDICAS
-- ==========================================

-- At1: Dr. García -> Juan Pérez (41)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at1, NULL, 41, 1, 'Laboratorio', 'LAB-001', 'Hemograma completo', 2500.00, 500.00, 2000.00, 'facturado'),
    (16, at1, NULL, 41, 1, 'Laboratorio', 'LAB-015', 'Perfil lipídico', 4800.00, 960.00, 3840.00, 'facturado'),
    (16, at1, NULL, 41, 1, 'Laboratorio', 'LAB-022', 'Glucemia en ayunas', 1800.00, 360.00, 1440.00, 'facturado'),
    (16, at1, NULL, 41, 1, 'Consulta', 'CON-001', 'Consulta de clínica médica', 15000.00, 3000.00, 12000.00, 'facturado');

-- At2: Dr. García -> María González (42)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at2, NULL, 42, 1, 'Laboratorio', 'LAB-001', 'Hemograma completo', 2500.00, 750.00, 1750.00, 'facturado'),
    (16, at2, NULL, 42, 1, 'Laboratorio', 'LAB-015', 'Perfil lipídico', 4800.00, 1440.00, 3360.00, 'facturado'),
    (16, at2, NULL, 42, 1, 'Consulta', 'CON-001', 'Consulta de clínica médica', 15000.00, 4500.00, 10500.00, 'facturado');

-- At3: Dr. García -> Roberto Sánchez (45)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at3, NULL, 45, 1, 'Consulta', 'CON-001', 'Consulta de clínica médica', 15000.00, 0.00, 15000.00, 'facturado'),
    (16, at3, NULL, 45, 1, 'Estudio', 'RA-X001', 'Radiografía de columna lumbar', 8500.00, 0.00, 8500.00, 'pendiente');

-- At4: Dr. Rodríguez -> Ana Torres (44)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at4, NULL, 44, 2, 'Estudio', 'CAR-001', 'Electrocardiograma 12 derivaciones', 5500.00, 1100.00, 4400.00, 'facturado'),
    (16, at4, NULL, 44, 2, 'Estudio', 'CAR-005', 'Ecocardiograma Doppler', 22000.00, 4400.00, 17600.00, 'pendiente'),
    (16, at4, NULL, 44, 2, 'Consulta', 'CON-002', 'Consulta cardiológica', 20000.00, 4000.00, 16000.00, 'facturado');

-- At5: Dr. Rodríguez -> María González (42) — en curso
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at5, NULL, 42, 2, 'Estudio', 'CAR-001', 'Electrocardiograma 12 derivaciones', 5500.00, 1650.00, 3850.00, 'pendiente'),
    (16, at5, NULL, 42, 2, 'Consulta', 'CON-002', 'Consulta cardiológica', 20000.00, 6000.00, 14000.00, 'pendiente');

-- At6: Dr. Rodríguez -> Sofía Gómez (48)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at6, NULL, 48, 2, 'Laboratorio', 'LAB-030', 'Coagulograma completo', 6200.00, 1240.00, 4960.00, 'pendiente'),
    (16, at6, NULL, 48, 2, 'Estudio', 'CAR-005', 'Ecocardiograma Doppler', 22000.00, 4400.00, 17600.00, 'facturado'),
    (16, at6, NULL, 48, 2, 'Consulta', 'CON-002', 'Consulta cardiológica', 20000.00, 4000.00, 16000.00, 'facturado');

-- At7: Dr. Martínez -> Carlos Rodríguez (43)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at7, NULL, 43, 3, 'Estudio', 'IMA-RMN01', 'Resonancia magnética de rodilla', 45000.00, 45000.00, 0.00, 'pendiente'),
    (16, at7, NULL, 43, 3, 'Consulta', 'CON-003', 'Consulta traumatológica', 18000.00, 18000.00, 0.00, 'facturado');

-- At8: Dr. Martínez -> Diego Fernández (47)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at8, NULL, 47, 3, 'Consulta', 'CON-003', 'Consulta traumatológica', 18000.00, 5400.00, 12600.00, 'facturado'),
    (16, at8, NULL, 47, 3, 'Estudio', 'RA-X001', 'Radiografía de columna lumbar', 8500.00, 2550.00, 5950.00, 'pendiente'),
    (16, at8, NULL, 47, 3, 'Kinesiología', 'KIN-001', 'Kinesiología (sesión individual)', 6000.00, 1200.00, 4800.00, 'pendiente');

-- At9: Dr. López -> Hernán Ruiz (55)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at9, NULL, 55, 4, 'Estudio', 'DER-001', 'Dermatoscopia digital', 8000.00, 1600.00, 6400.00, 'pendiente'),
    (16, at9, NULL, 55, 4, 'Estudio', 'DER-003', 'Biopsia de piel con anatomía patológica', 15000.00, 3000.00, 12000.00, 'pendiente'),
    (16, at9, NULL, 55, 4, 'Consulta', 'CON-004', 'Consulta dermatológica', 16000.00, 3200.00, 12800.00, 'facturado');

-- At10: Dr. Fernández -> Valeria Morales (52)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at10, NULL, 52, 5, 'Consulta', 'CON-005', 'Consulta pediátrica', 14000.00, 1400.00, 12600.00, 'facturado'),
    (16, at10, NULL, 52, 5, 'Estudio', 'ENT-001', 'Audiometría', 7500.00, 750.00, 6750.00, 'pendiente');

-- At11: Dr. García -> Pablo Ramírez (49)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at11, NULL, 49, 1, 'Consulta', 'CON-001', 'Consulta de clínica médica', 15000.00, 4500.00, 10500.00, 'facturado'),
    (16, at11, NULL, 49, 1, 'Estudio', 'OFT-001', 'Fondo de ojo', 9000.00, 2700.00, 6300.00, 'pendiente');

-- At12: Dr. López -> Claudia Díaz (50)
INSERT INTO practicas_medicas (empresa_id, atencion_medica_id, paciente_id, paciente_nuevo_id, medico_id, tipo_practica, codigo_nomenclador, descripcion_nomenclador, precio_practica, coseguro_paciente, cobertura_obra_social, estado_facturacion)
VALUES
    (16, at12, NULL, 50, 4, 'Consulta', 'CON-004', 'Consulta dermatológica', 16000.00, 0.00, 16000.00, 'facturado'),
    (16, at12, NULL, 50, 4, 'Estudio', 'DER-001', 'Dermatoscopia digital', 8000.00, 0.00, 8000.00, 'pendiente');

END $$;

-- Verificación
SELECT COUNT(*) AS atenciones FROM atenciones_medicas WHERE empresa_id = 16;
SELECT COUNT(*) AS practicas FROM practicas_medicas WHERE empresa_id = 16;

SELECT am.medico_id,
       CONCAT(m.nombre, ' ', m.apellido) || ' (' || m.especialidades[1] || ')' AS medico,
       ARRAY_REMOVE(ARRAY_AGG(DISTINCT CONCAT(p.nombre, ' ', p.apellido)), NULL) AS pacientes
FROM atenciones_medicas am
JOIN medicos m ON am.medico_id = m.id
LEFT JOIN pacientes p ON am.paciente_nuevo_id = p.id
WHERE am.empresa_id = 16
GROUP BY am.medico_id, m.nombre, m.apellido, m.especialidades
ORDER BY am.medico_id;
