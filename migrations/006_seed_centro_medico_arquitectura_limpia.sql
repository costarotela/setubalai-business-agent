-- ============================================================
-- MIGRACIÓN 006: Datos Demo Centro Médico (arquitectura limpia)
-- USA tabla PACIENTES (no clientes)
-- ============================================================

BEGIN;

-- ============================================================
-- EMPRESA
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
ON CONFLICT DO NOTHING
RETURNING id;

-- Variable
DO $$
DECLARE
    empresa_id_var INTEGER;
BEGIN
    SELECT id INTO empresa_id_var FROM setubalai.empresa WHERE cuit = '30-71234567-8';
    PERFORM set_config('app.empresa_id', empresa_id_var::text, false);
    RAISE NOTICE 'Empresa ID: %', empresa_id_var;
END $$;

-- ============================================================
-- USUARIO ADMIN
-- ============================================================

INSERT INTO setubalai.usuarios (empresa_id, nombre, email, password_hash, rol, activo)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    'Admin Centro Médico',
    'admin@centromedicosantaclara.com.ar',
    '$2b$12$WI9awUEzY5OpKU788V5DtOgNjL0yyLaDM4HEmLg3LTlZyHnIXgOre',
    'admin',
    true
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 5 MÉDICOS
-- ============================================================

INSERT INTO setubalai.medicos (empresa_id, nombre, apellido, matricula_provincial, matricula_nacional, especialidades, duracion_turno_minutos, horarios_atencion, activo)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    nombre, apellido, mat_prov, mat_nac, esp, duracion, horarios::jsonb, true
FROM (VALUES
    ('María', 'García', 'MP-15234', 'MN-89234', ARRAY['Clínica Médica'], 30, '{"lunes": ["09:00-13:00", "15:00-19:00"], "martes": ["09:00-13:00"]}'),
    ('Carlos', 'Rodríguez', 'MP-18567', 'MN-92341', ARRAY['Cardiología'], 45, '{"lunes": ["14:00-20:00"], "miércoles": ["14:00-20:00"]}'),
    ('Juan', 'Martínez', 'MP-16789', 'MN-88123', ARRAY['Traumatología'], 30, '{"martes": ["10:00-14:00"], "jueves": ["10:00-14:00"]}'),
    ('Ana', 'López', 'MP-19234', 'MN-95678', ARRAY['Dermatología'], 20, '{"lunes": ["08:00-12:00"], "miércoles": ["08:00-12:00"]}'),
    ('Roberto', 'Fernández', 'MP-17891', 'MN-90456', ARRAY['Pediatría'], 25, '{"lunes": ["15:00-19:00"], "martes": ["15:00-19:00"]}')
) AS m(nombre, apellido, mat_prov, mat_nac, esp, duracion, horarios)
ON CONFLICT (empresa_id, matricula_provincial) DO NOTHING;

-- ============================================================
-- 20 PACIENTES (tabla PACIENTES, NO clientes)
-- ============================================================

INSERT INTO setubalai.pacientes (
    empresa_id, nombre, apellido, dni, fecha_nacimiento, sexo,
    telefono, email, direccion, ciudad, provincia,
    obra_social, numero_afiliado, plan, activo
)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    nombre, apellido, dni, fecha_nac::date, sexo,
    telefono, email, direccion, 'Rosario', 'Santa Fe',
    obra_social, num_afiliado, plan, true
FROM (VALUES
    ('Juan', 'Pérez', '25678234', '1975-03-15', 'Masculino', '+54 9 3415551001', 'juan.perez@email.com', 'San Martín 1234', 'OSDE', '5-2567823-4', '310'),
    ('María', 'González', '30123456', '1982-07-22', 'Femenino', '+54 9 3415552002', 'maria.gonzalez@email.com', 'Córdoba 567', 'Swiss Medical', '3012345-6', 'SMG20'),
    ('Carlos', 'Rodríguez', '28456789', '1985-11-10', 'Masculino', '+54 9 3415553003', 'carlos.rodriguez@email.com', 'Mitre 890', 'Particular', '', ''),
    ('Ana', 'Torres', '32567890', '1990-05-18', 'Femenino', '+54 9 3415554004', 'ana.torres@email.com', 'San Juan 2345', 'OSDE', '5-3256789-0', '410'),
    ('Roberto', 'Sánchez', '22345678', '1968-01-30', 'Masculino', '+54 9 3415555005', 'roberto.sanchez@email.com', 'Alem 4567', 'PAMI', '2234567-8', 'PAMI'),
    ('Laura', 'Martínez', '29876543', '1988-09-12', 'Femenino', '+54 9 3415556006', 'laura.martinez@email.com', 'Sarmiento 456', 'Galeno', '298765-43', 'Galeno'),
    ('Diego', 'Fernández', '31234567', '1992-12-05', 'Masculino', '+54 9 3415557007', 'diego.fernandez@email.com', 'Belgrano 789', 'Particular', '', ''),
    ('Sofía', 'Gómez', '27654321', '1983-04-20', 'Femenino', '+54 9 3415558008', 'sofia.gomez@email.com', 'Rivadavia 1011', 'OSDE', '5-2765432-1', '210'),
    ('Pablo', 'Ramírez', '33456789', '1995-08-14', 'Masculino', '+54 9 3415559009', 'pablo.ramirez@email.com', 'Moreno 1213', 'Swiss Medical', '334567-89', 'SMG10'),
    ('Claudia', 'Díaz', '26789012', '1980-02-28', 'Femenino', '+54 9 3415560010', 'claudia.diaz@email.com', 'Urquiza 1415', 'OSDE', '5-2678901-2', '310'),
    ('Fernando', 'Castro', '34567890', '1998-06-17', 'Masculino', '+54 9 3415561011', 'fernando.castro@email.com', 'Laprida 1617', 'Particular', '', ''),
    ('Valeria', 'Morales', '24567890', '1972-10-03', 'Femenino', '+54 9 3415562012', 'valeria.morales@email.com', 'Oroño 1819', 'PAMI', '245678-90', 'PAMI'),
    ('Martín', 'Silva', '35678901', '2000-01-25', 'Masculino', '+54 9 3415563013', 'martin.silva@email.com', 'Santa Fe 2021', 'OSDE', '5-3567890-1', '410'),
    ('Gabriela', 'Ortiz', '23456789', '1970-07-08', 'Femenino', '+54 9 3415564014', 'gabriela.ortiz@email.com', 'Entre Ríos 2223', 'Swiss Medical', '234567-89', 'SMG20'),
    ('Hernán', 'Ruiz', '36789012', '2003-11-22', 'Masculino', '+54 9 3415565015', 'hernan.ruiz@email.com', 'Tucumán 2425', 'OSDE', '5-3678901-2', '210'),
    ('Lucía', 'Vega', '21234567', '1965-03-30', 'Femenino', '+54 9 3415566016', 'lucia.vega@email.com', 'Corrientes 2627', 'PAMI', '212345-67', 'PAMI'),
    ('Javier', 'Mendoza', '37890123', '2005-05-19', 'Masculino', '+54 9 3415567017', 'javier.mendoza@email.com', 'Salta 2829', 'Particular', '', ''),
    ('Carolina', 'Gutiérrez', '20123456', '1962-09-11', 'Femenino', '+54 9 3415568018', 'carolina.gutierrez@email.com', 'Jujuy 3031', 'PAMI', '201234-56', 'PAMI'),
    ('Andrés', 'Flores', '38901234', '2008-12-07', 'Masculino', '+54 9 3415569019', 'andres.flores@email.com', 'Mendoza 3233', 'OSDE', '5-3890123-4', '210'),
    ('Natalia', 'Romero', '19012345', '1958-04-15', 'Femenino', '+54 9 3415570020', 'natalia.romero@email.com', 'San Luis 3435', 'PAMI', '190123-45', 'PAMI')
) AS p(nombre, apellido, dni, fecha_nac, sexo, telefono, email, direccion, obra_social, num_afiliado, plan)
ON CONFLICT (empresa_id, dni) DO NOTHING;

-- ============================================================
-- HISTORIAS CLÍNICAS (usando paciente_nuevo_id)
-- ============================================================

-- HC: Juan Pérez (Hipertenso)
INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_nuevo_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares, cirugias_previas
)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    p.id, 'O+',
    ARRAY['Penicilina'],
    ARRAY['Enalapril 10mg (1/día)', 'Atorvastatina 20mg (noche)'],
    'HTA desde 2018. Dislipemia.',
    'Padre IAM 55 años',
    ARRAY['Apendicetomía (1995)']
FROM setubalai.pacientes p
WHERE p.dni = '25678234' AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

-- HC: María González (Diabética)
INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_nuevo_id, grupo_sanguineo, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares
)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    p.id, 'A+',
    ARRAY['Metformina 850mg (2/día)', 'Glibenclamida 5mg'],
    'DBT tipo 2 desde 2015. HbA1c: 7.2%',
    'Madre diabética'
FROM setubalai.pacientes p
WHERE p.dni = '30123456' AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

-- HC: Carlos Rodríguez (Sano)
INSERT INTO setubalai.historia_clinica (empresa_id, paciente_nuevo_id, grupo_sanguineo, antecedentes_personales)
SELECT current_setting('app.empresa_id')::INTEGER, p.id, 'B+', 'Paciente sano'
FROM setubalai.pacientes p
WHERE p.dni = '28456789' AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

-- HC: Ana Torres (Asmática)
INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_nuevo_id, grupo_sanguineo, alergias, medicacion_habitual,
    antecedentes_personales, antecedentes_familiares
)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    p.id, 'AB+',
    ARRAY['Polen', 'Ácaros'],
    ARRAY['Salbutamol SOS', 'Budesonide 200mcg'],
    'Asma bronquial. FEV1: 85%',
    'Madre asmática'
FROM setubalai.pacientes p
WHERE p.dni = '32567890' AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

-- HC: Roberto Sánchez (HTA+DBT)
INSERT INTO setubalai.historia_clinica (
    empresa_id, paciente_nuevo_id, grupo_sanguineo, medicacion_habitual,
    antecedentes_personales, cirugias_previas
)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    p.id, 'O-',
    ARRAY['Enalapril 20mg', 'Metformina 850mg', 'Aspirina 100mg'],
    'HTA 2010. DBT 2015. Angioplastia 2020.',
    ARRAY['Angioplastia stent (2020)']
FROM setubalai.pacientes p
WHERE p.dni = '22345678' AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

-- HC básicas para los 15 restantes
INSERT INTO setubalai.historia_clinica (empresa_id, paciente_nuevo_id, grupo_sanguineo)
SELECT 
    current_setting('app.empresa_id')::INTEGER,
    p.id,
    CASE 
        WHEN p.dni = '29876543' THEN 'A-'
        WHEN p.dni = '31234567' THEN 'O+'
        WHEN p.dni = '27654321' THEN 'B-'
        WHEN p.dni = '33456789' THEN 'A+'
        WHEN p.dni = '26789012' THEN 'O+'
        WHEN p.dni = '34567890' THEN 'AB-'
        WHEN p.dni = '24567890' THEN 'A+'
        WHEN p.dni = '35678901' THEN 'O-'
        WHEN p.dni = '23456789' THEN 'B+'
        WHEN p.dni = '36789012' THEN 'A-'
        WHEN p.dni = '21234567' THEN 'O+'
        WHEN p.dni = '37890123' THEN 'AB+'
        WHEN p.dni = '20123456' THEN 'B-'
        WHEN p.dni = '38901234' THEN 'O+'
        WHEN p.dni = '19012345' THEN 'A+'
    END
FROM setubalai.pacientes p
WHERE p.dni IN ('29876543', '31234567', '27654321', '33456789', '26789012',
                '34567890', '24567890', '35678901', '23456789', '36789012',
                '21234567', '37890123', '20123456', '38901234', '19012345')
  AND p.empresa_id = current_setting('app.empresa_id')::INTEGER
ON CONFLICT (empresa_id, paciente_id) DO NOTHING;

COMMIT;

-- Verificación final
SELECT 
    'Empresa' AS tipo, COUNT(*)::text AS cantidad FROM setubalai.empresa WHERE cuit = '30-71234567-8'
UNION ALL
SELECT 'Usuarios', COUNT(*)::text FROM setubalai.usuarios WHERE email LIKE '%centromedicosantaclara%'
UNION ALL
SELECT 'Médicos', COUNT(*)::text FROM setubalai.medicos WHERE empresa_id = (SELECT id FROM setubalai.empresa WHERE cuit = '30-71234567-8')
UNION ALL
SELECT 'Pacientes', COUNT(*)::text FROM setubalai.pacientes WHERE empresa_id = (SELECT id FROM setubalai.empresa WHERE cuit = '30-71234567-8')
UNION ALL
SELECT 'Historias Clínicas', COUNT(*)::text FROM setubalai.historia_clinica WHERE paciente_nuevo_id IS NOT NULL AND empresa_id = (SELECT id FROM setubalai.empresa WHERE cuit = '30-71234567-8');
