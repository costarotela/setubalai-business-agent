-- ============================================================
-- MIGRACIÓN 003: Datos Demo Centro Médico Integral
-- Fecha: 2026-05-26
-- Empresa: Centro Médico Santa Clara (Demo)
-- ESQUEMA COMPLETO Y CONSISTENTE
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: CREAR EMPRESA DEMO
-- ============================================================

INSERT INTO setubalai.empresa (
    nombre, cuit, rubro, email, telefono, direccion,
    web, contacto_nombre, plan, estado
)
VALUES (
    'Centro Médico Santa Clara',
    '30-71234567-8',
    'Salud',
    'contacto@centromedicosantaclara.com.ar',
    '+54 9 3415551234',
    'Av. Pellegrini 2345, Rosario, Santa Fe',
    'https://centromedicosantaclara.com.ar',
    'Dr. Roberto Silva',
    'premium',
    'activa'
)
RETURNING id;

-- Guardar el ID de la empresa
DO $$
DECLARE
    empresa_demo_id INTEGER;
BEGIN
    SELECT id INTO empresa_demo_id FROM setubalai.empresa WHERE nombre = 'Centro Médico Santa Clara';
    RAISE NOTICE 'Empresa creada con ID: %', empresa_demo_id;
    PERFORM set_config('app.empresa_demo_id', empresa_demo_id::text, false);
END $$;

-- ============================================================
-- PASO 2: CREAR USUARIO ADMIN
-- ============================================================

INSERT INTO setubalai.usuarios (
    empresa_id, email, password_hash, rol, nombre, apellido, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'admin@centromedicosantaclara.com.ar',
    '$2b$12$WI9awUEzY5OpKU788V5DtOgNjL0yyLaDM4HEmLg3LTlZyHnIXgOre',
    'admin',
    'Administrador',
    'Centro Médico',
    true;

-- ============================================================
-- PASO 3: CREAR 5 MÉDICOS
-- ============================================================

-- Médico 1: Dra. María García (Clínica Médica)
INSERT INTO setubalai.medicos (
    empresa_id, nombre, apellido, 
    matricula_provincial, matricula_nacional,
    especialidades, duracion_turno_minutos,
    horarios_atencion, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'María', 'García',
    'MP-15234', 'MN-89234',
    ARRAY['Clínica Médica', 'Medicina General'],
    30,
    '{"lunes": ["09:00-13:00", "15:00-19:00"], "martes": ["09:00-13:00", "15:00-19:00"], "miércoles": ["09:00-13:00"], "jueves": ["09:00-13:00", "15:00-19:00"], "viernes": ["09:00-13:00"]}'::jsonb,
    true;

-- Médico 2: Dr. Carlos Rodríguez (Cardiología)
INSERT INTO setubalai.medicos (
    empresa_id, nombre, apellido, 
    matricula_provincial, matricula_nacional,
    especialidades, duracion_turno_minutos,
    horarios_atencion, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Carlos', 'Rodríguez',
    'MP-18567', 'MN-92341',
    ARRAY['Cardiología'],
    45,
    '{"lunes": ["14:00-20:00"], "miércoles": ["14:00-20:00"], "viernes": ["14:00-20:00"]}'::jsonb,
    true;

-- Médico 3: Dr. Juan Martínez (Traumatología)
INSERT INTO setubalai.medicos (
    empresa_id, nombre, apellido, 
    matricula_provincial, matricula_nacional,
    especialidades, duracion_turno_minutos,
    horarios_atencion, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Juan', 'Martínez',
    'MP-16789', 'MN-88123',
    ARRAY['Traumatología', 'Ortopedia'],
    30,
    '{"martes": ["10:00-14:00", "16:00-20:00"], "jueves": ["10:00-14:00", "16:00-20:00"], "sábado": ["09:00-13:00"]}'::jsonb,
    true;

-- Médico 4: Dra. Ana López (Dermatología)
INSERT INTO setubalai.medicos (
    empresa_id, nombre, apellido, 
    matricula_provincial, matricula_nacional,
    especialidades, duracion_turno_minutos,
    horarios_atencion, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Ana', 'López',
    'MP-19234', 'MN-95678',
    ARRAY['Dermatología'],
    20,
    '{"lunes": ["08:00-12:00"], "miércoles": ["08:00-12:00"], "viernes": ["08:00-12:00"]}'::jsonb,
    true;

-- Médico 5: Dr. Roberto Fernández (Pediatría)
INSERT INTO setubalai.medicos (
    empresa_id, nombre, apellido, 
    matricula_provincial, matricula_nacional,
    especialidades, duracion_turno_minutos,
    horarios_atencion, activo
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Roberto', 'Fernández',
    'MP-17891', 'MN-90456',
    ARRAY['Pediatría'],
    25,
    '{"lunes": ["15:00-19:00"], "martes": ["15:00-19:00"], "miércoles": ["15:00-19:00"], "jueves": ["15:00-19:00"], "viernes": ["15:00-19:00"]}'::jsonb,
    true;

-- ============================================================
-- PASO 4: CREAR 20 PACIENTES (con datos completos)
-- ============================================================

-- Paciente 1: Juan Pérez (Hipertenso)
INSERT INTO setubalai.clientes (
    empresa_id, nombre, apellido, dni, telefono, email,
    fecha_nacimiento, direccion,
    metadata
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Juan', 'Pérez', '25678234', '+54 9 3415551001', 'juan.perez@email.com',
    '1975-03-15', 'San Martín 1234, Rosario, Santa Fe',
    '{"obra_social": "OSDE", "numero_afiliado": "5-2567823-4", "grupo_sanguineo": "O+", "plan": "310"}'::jsonb;

INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares, cirugias_previas
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    (SELECT id FROM setubalai.clientes WHERE dni = '25678234' AND empresa_id = current_setting('app.empresa_demo_id')::INTEGER),
    'O+',
    ARRAY['Penicilina'],
    ARRAY['Enalapril 10mg (1 por día)', 'Atorvastatina 20mg (1 por noche)'],
    'Hipertensión arterial diagnosticada en 2018. Dislipemia en tratamiento.',
    'Padre con infarto a los 55 años. Madre diabética.',
    ARRAY['Apendicetomía (1995)'];

-- Paciente 2: María González (Diabética)
INSERT INTO setubalai.clientes (
    empresa_id, nombre, apellido, dni, telefono, email,
    fecha_nacimiento, direccion,
    metadata
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'María', 'González', '30123456', '+54 9 3415552002', 'maria.gonzalez@email.com',
    '1982-07-22', 'Córdoba 567, Rosario, Santa Fe',
    '{"obra_social": "Swiss Medical", "numero_afiliado": "3012345-6", "grupo_sanguineo": "A+", "plan": "SMG20"}'::jsonb;

INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    (SELECT id FROM setubalai.clientes WHERE dni = '30123456' AND empresa_id = current_setting('app.empresa_demo_id')::INTEGER),
    'A+',
    ARRAY[]::TEXT[],
    ARRAY['Metformina 850mg (2 por día)', 'Glibenclamida 5mg (1 por día)'],
    'Diabetes Mellitus tipo 2 desde 2015. HbA1c actual: 7.2%',
    'Madre y abuela maternas diabéticas';

-- Paciente 3: Carlos Rodríguez (Sano, control)
INSERT INTO setubalai.clientes (
    empresa_id, nombre, apellido, dni, telefono, email,
    fecha_nacimiento, direccion,
    metadata
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Carlos', 'Rodríguez', '28456789', '+54 9 3415553003', 'carlos.rodriguez@email.com',
    '1985-11-10', 'Mitre 890, Rosario, Santa Fe',
    '{"obra_social": "Particular", "numero_afiliado": "", "grupo_sanguineo": "B+"}'::jsonb;

INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_id, grupo_sanguineo, antecedentes_personales
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    (SELECT id FROM setubalai.clientes WHERE dni = '28456789' AND empresa_id = current_setting('app.empresa_demo_id')::INTEGER),
    'B+',
    'Paciente sano. Control anual preventivo.';

-- Paciente 4: Ana Torres (Asmática)
INSERT INTO setubalai.clientes (
    empresa_id, nombre, apellido, dni, telefono, email,
    fecha_nacimiento, direccion,
    metadata
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Ana', 'Torres', '32567890', '+54 9 3415554004', 'ana.torres@email.com',
    '1990-05-18', 'San Juan 2345, Rosario, Santa Fe',
    '{"obra_social": "OSDE", "numero_afiliado": "5-3256789-0", "grupo_sanguineo": "AB+", "plan": "410"}'::jsonb;

INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    (SELECT id FROM setubalai.clientes WHERE dni = '32567890' AND empresa_id = current_setting('app.empresa_demo_id')::INTEGER),
    'AB+',
    ARRAY['Polen', 'Ácaros'],
    ARRAY['Salbutamol aerosol (según necesidad)', 'Budesonide 200mcg (2 puff/día)'],
    'Asma bronquial desde la infancia. Crisis esporádicas. FEV1: 85%',
    'Madre asmática';

-- Paciente 5: Roberto Sánchez (Hipertenso + Diabético)
INSERT INTO setubalai.clientes (
    empresa_id, nombre, apellido, dni, telefono, email,
    fecha_nacimiento, direccion,
    metadata
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    'Roberto', 'Sánchez', '22345678', '+54 9 3415555005', 'roberto.sanchez@email.com',
    '1968-01-30', 'Alem 4567, Rosario, Santa Fe',
    '{"obra_social": "PAMI", "numero_afiliado": "2234567-8", "grupo_sanguineo": "O-"}'::jsonb;

INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares, cirugias_previas
)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    (SELECT id FROM setubalai.clientes WHERE dni = '22345678' AND empresa_id = current_setting('app.empresa_demo_id')::INTEGER),
    'O-',
    ARRAY[]::TEXT[],
    ARRAY['Enalapril 20mg (1 por día)', 'Metformina 850mg (2 por día)', 'Aspirina 100mg (1 por día)', 'Atorvastatina 40mg (1 por noche)'],
    'HTA desde 2010. DBT tipo 2 desde 2015. Dislipemia. Cardiopatía isquémica. Angioplastia coronaria 2020.',
    'Padre falleció por IAM a los 60 años',
    ARRAY['Angioplastia coronaria con stent (2020)'];

-- Pacientes 6-20 (15 más)
INSERT INTO setubalai.clientes (empresa_id, nombre, apellido, dni, telefono, email, fecha_nacimiento, direccion, metadata)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    nombre, apellido, dni, telefono, email, fecha_nacimiento::date, direccion, metadata::jsonb
FROM (VALUES
    ('Laura', 'Martínez', '29876543', '+54 9 3415556006', 'laura.martinez@email.com', '1988-09-12', 'Sarmiento 456, Rosario, Santa Fe', '{"obra_social": "Galeno", "numero_afiliado": "298765-43", "grupo_sanguineo": "A-"}'),
    ('Diego', 'Fernández', '31234567', '+54 9 3415557007', 'diego.fernandez@email.com', '1992-12-05', 'Belgrano 789, Rosario, Santa Fe', '{"obra_social": "Particular", "numero_afiliado": "", "grupo_sanguineo": "O+"}'),
    ('Sofía', 'Gómez', '27654321', '+54 9 3415558008', 'sofia.gomez@email.com', '1983-04-20', 'Rivadavia 1011, Rosario, Santa Fe', '{"obra_social": "OSDE", "numero_afiliado": "5-2765432-1", "grupo_sanguineo": "B-", "plan": "210"}'),
    ('Pablo', 'Ramírez', '33456789', '+54 9 3415559009', 'pablo.ramirez@email.com', '1995-08-14', 'Moreno 1213, Rosario, Santa Fe', '{"obra_social": "Swiss Medical", "numero_afiliado": "334567-89", "grupo_sanguineo": "A+"}'),
    ('Claudia', 'Díaz', '26789012', '+54 9 3415560010', 'claudia.diaz@email.com', '1980-02-28', 'Urquiza 1415, Rosario, Santa Fe', '{"obra_social": "OSDE", "numero_afiliado": "5-2678901-2", "grupo_sanguineo": "O+", "plan": "310"}'),
    ('Fernando', 'Castro', '34567890', '+54 9 3415561011', 'fernando.castro@email.com', '1998-06-17', 'Laprida 1617, Rosario, Santa Fe', '{"obra_social": "Particular", "numero_afiliado": "", "grupo_sanguineo": "AB-"}'),
    ('Valeria', 'Morales', '24567890', '+54 9 3415562012', 'valeria.morales@email.com', '1972-10-03', 'Oroño 1819, Rosario, Santa Fe', '{"obra_social": "PAMI", "numero_afiliado": "245678-90", "grupo_sanguineo": "A+"}'),
    ('Martín', 'Silva', '35678901', '+54 9 3415563013', 'martin.silva@email.com', '2000-01-25', 'Santa Fe 2021, Rosario, Santa Fe', '{"obra_social": "OSDE", "numero_afiliado": "5-3567890-1", "grupo_sanguineo": "O-", "plan": "410"}'),
    ('Gabriela', 'Ortiz', '23456789', '+54 9 3415564014', 'gabriela.ortiz@email.com', '1970-07-08', 'Entre Ríos 2223, Rosario, Santa Fe', '{"obra_social": "Swiss Medical", "numero_afiliado": "234567-89", "grupo_sanguineo": "B+"}'),
    ('Hernán', 'Ruiz', '36789012', '+54 9 3415565015', 'hernan.ruiz@email.com', '2003-11-22', 'Tucumán 2425, Rosario, Santa Fe', '{"obra_social": "OSDE", "numero_afiliado": "5-3678901-2", "grupo_sanguineo": "A-", "plan": "210"}'),
    ('Lucía', 'Vega', '21234567', '+54 9 3415566016', 'lucia.vega@email.com', '1965-03-30', 'Corrientes 2627, Rosario, Santa Fe', '{"obra_social": "PAMI", "numero_afiliado": "212345-67", "grupo_sanguineo": "O+"}'),
    ('Javier', 'Mendoza', '37890123', '+54 9 3415567017', 'javier.mendoza@email.com', '2005-05-19', 'Salta 2829, Rosario, Santa Fe', '{"obra_social": "Particular", "numero_afiliado": "", "grupo_sanguineo": "AB+"}'),
    ('Carolina', 'Gutiérrez', '20123456', '+54 9 3415568018', 'carolina.gutierrez@email.com', '1962-09-11', 'Jujuy 3031, Rosario, Santa Fe', '{"obra_social": "PAMI", "numero_afiliado": "201234-56", "grupo_sanguineo": "B-"}'),
    ('Andrés', 'Flores', '38901234', '+54 9 3415569019', 'andres.flores@email.com', '2008-12-07', 'Mendoza 3233, Rosario, Santa Fe', '{"obra_social": "OSDE", "numero_afiliado": "5-3890123-4", "grupo_sanguineo": "O+", "plan": "210"}'),
    ('Natalia', 'Romero', '19012345', '+54 9 3415570020', 'natalia.romero@email.com', '1958-04-15', 'San Luis 3435, Rosario, Santa Fe', '{"obra_social": "PAMI", "numero_afiliado": "190123-45", "grupo_sanguineo": "A+"}')
) AS pacientes(nombre, apellido, dni, telefono, email, fecha_nacimiento, direccion, metadata);

-- Historias clínicas para pacientes 6-20
INSERT INTO setubalai.historia_clinica (empresa_id, paciente_id, grupo_sanguineo)
SELECT 
    current_setting('app.empresa_demo_id')::INTEGER,
    c.id,
    (c.metadata->>'grupo_sanguineo')
FROM setubalai.clientes c
WHERE c.empresa_id = current_setting('app.empresa_demo_id')::INTEGER
  AND c.dni IN ('29876543', '31234567', '27654321', '33456789', '26789012', 
                '34567890', '24567890', '35678901', '23456789', '36789012',
                '21234567', '37890123', '20123456', '38901234', '19012345');

COMMIT;

-- Verificación
SELECT 
    'empresa' AS tabla, COUNT(*) AS registros FROM setubalai.empresa WHERE nombre = 'Centro Médico Santa Clara'
UNION ALL
SELECT 'usuarios', COUNT(*) FROM setubalai.usuarios WHERE email LIKE '%centromedicosantaclara%'
UNION ALL
SELECT 'medicos', COUNT(*) FROM setubalai.medicos WHERE empresa_id = (SELECT id FROM setubalai.empresa WHERE nombre = 'Centro Médico Santa Clara')
UNION ALL
SELECT 'clientes', COUNT(*) FROM setubalai.clientes WHERE empresa_id = (SELECT id FROM setubalai.empresa WHERE nombre = 'Centro Médico Santa Clara')
UNION ALL
SELECT 'historia_clinica', COUNT(*) FROM setubalai.historia_clinica WHERE empresa_id = (SELECT id FROM setubalai.empresa WHERE nombre = 'Centro Médico Santa Clara');
