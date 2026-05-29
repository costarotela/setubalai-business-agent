-- Seed: Datos DEFAULT para grillas médicas
-- Fecha: 2026-05-29
-- Empresa: Centro Médico Santa Clara (id=16)

-- ==================================================
-- GRILLAS MÉDICAS: Horarios base de cada médico
-- ==================================================

-- Dr. García (Clínica Médica, id=1)
-- Lunes y Martes: 9-13h mañana, 15-19h tarde
INSERT INTO setubalai.grillas_medicas (empresa_id, medico_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
  (16, 1, 1, '09:00', '13:00', TRUE),  -- Lunes mañana
  (16, 1, 1, '15:00', '19:00', TRUE),  -- Lunes tarde
  (16, 1, 2, '09:00', '13:00', TRUE),  -- Martes mañana
  (16, 1, 2, '15:00', '19:00', TRUE);  -- Martes tarde

-- Dr. Rodríguez (Cardiología, id=2)
-- Lunes y Miércoles: 14-20h
INSERT INTO setubalai.grillas_medicas (empresa_id, medico_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
  (16, 2, 1, '14:00', '20:00', TRUE),  -- Lunes
  (16, 2, 3, '14:00', '20:00', TRUE);  -- Miércoles

-- Dr. Martínez (Traumatología, id=3)
-- Martes y Jueves: 10-14h
INSERT INTO setubalai.grillas_medicas (empresa_id, medico_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
  (16, 3, 2, '10:00', '14:00', TRUE),  -- Martes
  (16, 3, 4, '10:00', '14:00', TRUE);  -- Jueves

-- ==================================================
-- DURACIONES POR ESPECIALIDAD
-- ==================================================

INSERT INTO setubalai.duracion_prestaciones (empresa_id, especialidad, duracion_minutos, sobre_turnos_permitidos) VALUES
  (16, 'Clínica Médica', 20, 2),     -- Consultas rápidas, 2 sobreturnos
  (16, 'Cardiología', 30, 1),         -- Electro + consulta, 1 sobreturno
  (16, 'Traumatología', 45, 0);       -- Puede requerir yeso/vendajes, sin sobreturnos

-- ==================================================
-- BLOQUEOS: Tabla vacía por ahora
-- ==================================================
-- El admin agregará vacaciones, congresos, feriados según necesidad
-- (no hay seed aquí)
