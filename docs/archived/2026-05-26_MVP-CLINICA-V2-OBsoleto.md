# MVP: Clínica Médica V2 — CORRECCIÓN CONCEPTUAL

⚠️ **VERSIÓN CORREGIDA** ⚠️

**Cambio crítico:** Separación de conceptos VISITA → ATENCIÓN → PRÁCTICAS

---

## PROBLEMA IDENTIFICADO (2026-05-26)

La tabla `consultas` mezclaba 3 conceptos distintos:
1. **VISITA** (turno agendado)
2. **ATENCIÓN MÉDICA** (lo que pasa en consultorio)
3. **PRÁCTICA MÉDICA** (acto facturable)

Esto generaba problemas:
- ❌ No se podían registrar múltiples prácticas en una visita
- ❌ Confusión entre "turno agendado" y "atención realizada"
- ❌ Dificulta facturación (obras sociales requieren código de práctica)
- ❌ No alineado con nomencladores médicos (NABONs)

---

## SOLUCIÓN: NUEVO MODELO EN 3 CAPAS

### 1. VISITAS (Turnos/Citas Agendadas)

**Concepto:** Evento agendado en la agenda del médico.

```sql
CREATE TABLE setubalai.visitas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    -- Fecha y hora del turno
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    
    -- Estado del TURNO (no de la atención)
    estado VARCHAR(50) DEFAULT 'pendiente',
    -- Estados: 'pendiente', 'confirmado', 'en_curso', 'realizado', 'cancelado', 'ausente', 'reprogramado'
    
    -- Motivo de consulta (lo dice el paciente al pedir turno)
    motivo_consulta TEXT,
    tipo_visita VARCHAR(50) DEFAULT 'consulta',  -- 'consulta', 'control', 'procedimiento', 'urgencia'
    
    -- Control de recordatorios
    recordatorio_enviado BOOLEAN DEFAULT false,
    recordatorio_fecha TIMESTAMPTZ,
    
    -- Si fue cancelado o reprogramado
    cancelacion_motivo TEXT,
    fecha_cancelacion TIMESTAMPTZ,
    cancelado_por_usuario_id INTEGER REFERENCES setubalai.usuarios(id),
    
    reprogramado_a_visita_id INTEGER REFERENCES setubalai.visitas(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitas_empresa ON setubalai.visitas(empresa_id);
CREATE INDEX idx_visitas_paciente ON setubalai.visitas(paciente_id);
CREATE INDEX idx_visitas_medico ON setubalai.visitas(medico_id);
CREATE INDEX idx_visitas_fecha ON setubalai.visitas(fecha_hora);
CREATE INDEX idx_visitas_estado ON setubalai.visitas(estado);
```

**Relación con agenda:**
- Una VISITA ocupa un SLOT de disponibilidad
- Si se cancela → slot se libera
- Si se reprograma → crea nueva visita + marca slot original como libre

---

### 2. ATENCIONES_MEDICAS (Lo que pasa en consultorio)

**Concepto:** Registro de lo que sucede cuando el paciente ES ATENDIDO por el médico.

```sql
CREATE TABLE setubalai.atenciones_medicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    visita_id INTEGER NOT NULL UNIQUE REFERENCES setubalai.visitas(id) ON DELETE CASCADE,
    
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    -- Fecha y hora REAL de inicio y fin de la atención
    fecha_hora_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_hora_fin TIMESTAMPTZ,
    
    -- Estado de la ATENCIÓN (no del turno)
    estado VARCHAR(50) DEFAULT 'en_curso',
    -- Estados: 'en_curso', 'finalizada', 'interrumpida'
    
    -- Registro de la atención médica
    anamnesis TEXT,  -- Historia del paciente (síntomas, evolución)
    examen_fisico TEXT,  -- Resultado del examen físico
    diagnostico TEXT,  -- Diagnóstico médico
    plan_tratamiento TEXT,  -- Plan de acción
    observaciones TEXT,  -- Notas adicionales
    
    -- Signos vitales
    presion_arterial VARCHAR(20),  -- "120/80"
    frecuencia_cardiaca INTEGER,   -- latidos/min
    frecuencia_respiratoria INTEGER, -- respiraciones/min
    temperatura DECIMAL(4,2),      -- 36.5
    saturacion_oxigeno INTEGER,    -- % (SpO2)
    peso DECIMAL(5,2),             -- kg
    altura DECIMAL(5,2),           -- cm
    imc DECIMAL(5,2),              -- Calculado automáticamente
    
    -- Evolución del paciente
    evolucion TEXT,  -- Cambios desde la última visita
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_atenciones_medicas_empresa ON setubalai.atenciones_medicas(empresa_id);
CREATE INDEX idx_atenciones_medicas_paciente ON setubalai.atenciones_medicas(paciente_id);
CREATE INDEX idx_atenciones_medicas_medico ON setubalai.atenciones_medicas(medico_id);
CREATE INDEX idx_atenciones_medicas_visita ON setubalai.atenciones_medicas(visita_id);
CREATE INDEX idx_atenciones_medicas_fecha_inicio ON setubalai.atenciones_medicas(fecha_hora_inicio);
```

**Relación con visita:**
- 1 VISITA → 0 o 1 ATENCIÓN MÉDICA
- Si paciente no viene → visita queda sin atención (estado='ausente')
- Si paciente viene → se crea atención médica

---

### 3. PRACTICAS_MEDICAS (Actos médicos facturables)

**Concepto:** Cada procedimiento/práctica realizada durante la atención.

```sql
CREATE TABLE setubalai.practicas_medicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    atencion_medica_id INTEGER NOT NULL REFERENCES setubalai.atenciones_medicas(id) ON DELETE CASCADE,
    
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    -- Tipo de práctica
    tipo_practica VARCHAR(100) NOT NULL,
    -- Ejemplos: 'Consulta clínica médica', 'Electrocardiograma', 'PAP', 'Curación', 'Inyección IM'
    
    -- Nomenclador (para facturación)
    codigo_nomenclador VARCHAR(50),  -- Código NABONs, etc.
    descripcion_nomenclador TEXT,
    
    -- Costos y facturación
    precio_practica DECIMAL(10,2),
    coseguro_paciente DECIMAL(10,2),  -- Lo que paga el paciente
    cobertura_obra_social DECIMAL(10,2),  -- Lo que paga la obra social
    
    -- Estado de facturación
    estado_facturacion VARCHAR(50) DEFAULT 'pendiente',
    -- Estados: 'pendiente', 'facturada', 'cobrada', 'rechazada'
    
    fecha_facturacion DATE,
    numero_factura VARCHAR(100),
    
    -- Autorización de obra social (si aplica)
    requiere_autorizacion BOOLEAN DEFAULT false,
    numero_autorizacion VARCHAR(100),
    fecha_autorizacion DATE,
    
    -- Detalles
    observaciones TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practicas_medicas_empresa ON setubalai.practicas_medicas(empresa_id);
CREATE INDEX idx_practicas_medicas_atencion ON setubalai.practicas_medicas(atencion_medica_id);
CREATE INDEX idx_practicas_medicas_paciente ON setubalai.practicas_medicas(paciente_id);
CREATE INDEX idx_practicas_medicas_tipo ON setubalai.practicas_medicas(tipo_practica);
CREATE INDEX idx_practicas_medicas_estado_facturacion ON setubalai.practicas_medicas(estado_facturacion);
```

**Relación con atención:**
- 1 ATENCIÓN MÉDICA → 1 o MÁS PRÁCTICAS
- Ejemplo: Visita por control → Atención médica → Prácticas: (1) Consulta clínica + (2) ECG + (3) Análisis de glucemia

---

## 📋 TABLA: NOMENCLADORES / PRESTACIONES

Para estandarizar las prácticas disponibles:

```sql
CREATE TABLE setubalai.nomenclador_practicas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    
    -- Código estándar
    codigo VARCHAR(50) NOT NULL,  -- Código NABONs, COSENA, etc.
    descripcion TEXT NOT NULL,
    tipo VARCHAR(100),  -- 'Consulta', 'Procedimiento', 'Estudio', 'Cirugía'
    
    -- Especialidad requerida
    especialidad_requerida VARCHAR(100),  -- 'Cardiología', 'Clínica Médica'
    
    -- Costos base
    precio_particular DECIMAL(10,2),  -- Si paga el paciente
    valor_modulo DECIMAL(10,2),  -- Valor en módulos para obras sociales
    
    -- Duración estimada
    duracion_minutos INTEGER,
    
    -- Requiere autorización previa de obra social?
    requiere_autorizacion BOOLEAN DEFAULT false,
    
    -- Activo/inactivo
    activo BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_nomenclador_practicas_empresa ON setubalai.nomenclador_practicas(empresa_id);
CREATE INDEX idx_nomenclador_practicas_codigo ON setubalai.nomenclador_practicas(codigo);
CREATE INDEX idx_nomenclador_practicas_tipo ON setubalai.nomenclador_practicas(tipo);
CREATE INDEX idx_nomenclador_practicas_activo ON setubalai.nomenclador_practicas(activo);
```

---

## 🔄 FLUJO COMPLETO CORREGIDO

### Caso 1: Paciente solicita turno (WhatsApp)

```
Paciente: "Hola, quiero turno con la Dra. García"

Hermes:
1. Busca médico "García"
2. Consulta disponibilidad (slots libres)
3. Crea VISITA con estado='pendiente'
4. Marca SLOT como ocupado
5. Responde: "✅ Turno reservado: Lunes 3/06 a las 10:00hs"
```

**Base de datos:**
```sql
INSERT INTO visitas (
    empresa_id, paciente_id, medico_id,
    fecha_hora, duracion_minutos,
    estado, motivo_consulta, tipo_visita
) VALUES (
    1, 123, 2,
    '2026-06-03 10:00:00', 30,
    'pendiente', 'Control de presión', 'control'
);
```

---

### Caso 2: Paciente llega a la clínica

```
Secretaria: Actualiza estado de visita a 'en_curso'
```

**Base de datos:**
```sql
UPDATE visitas SET estado = 'en_curso' WHERE id = 456;
```

---

### Caso 3: Médico atiende al paciente

```
Médico completa la atención en el sistema:
- Signos vitales
- Anamnesis
- Diagnóstico
- Plan de tratamiento
```

**Base de datos:**
```sql
INSERT INTO atenciones_medicas (
    empresa_id, visita_id, paciente_id, medico_id,
    fecha_hora_inicio,
    anamnesis,
    examen_fisico,
    diagnostico,
    plan_tratamiento,
    presion_arterial, peso, altura,
    estado
) VALUES (
    1, 456, 123, 2,
    '2026-06-03 10:05:00',
    'Paciente refiere cefaleas matutinas desde hace 3 días...',
    'Presión arterial elevada, resto del examen físico normal',
    'Hipertensión arterial estadio 1',
    'Inicio de tratamiento con enalapril 10mg...',
    '150/95', 78.5, 170,
    'finalizada'
);
```

---

### Caso 4: Se registran las prácticas realizadas

```
Durante la atención se realizaron:
1. Consulta clínica médica
2. Electrocardiograma
```

**Base de datos:**
```sql
-- Práctica 1: Consulta
INSERT INTO practicas_medicas (
    empresa_id, atencion_medica_id, paciente_id, medico_id,
    tipo_practica, codigo_nomenclador,
    precio_practica, coseguro_paciente, cobertura_obra_social,
    estado_facturacion
) VALUES (
    1, 789, 123, 2,
    'Consulta clínica médica', '010101',
    15000, 3000, 12000,
    'pendiente'
);

-- Práctica 2: ECG
INSERT INTO practicas_medicas (
    empresa_id, atencion_medica_id, paciente_id, medico_id,
    tipo_practica, codigo_nomenclador,
    precio_practica, coseguro_paciente, cobertura_obra_social,
    estado_facturacion
) VALUES (
    1, 789, 123, 2,
    'Electrocardiograma', '020305',
    8000, 1600, 6400,
    'pendiente'
);
```

---

### Caso 5: Finalización y facturación

```sql
-- 1. Marcar visita como realizada
UPDATE visitas SET estado = 'realizado' WHERE id = 456;

-- 2. Finalizar atención
UPDATE atenciones_medicas 
SET estado = 'finalizada', fecha_hora_fin = NOW() 
WHERE id = 789;

-- 3. Al final del mes: facturar prácticas
UPDATE practicas_medicas 
SET estado_facturacion = 'facturada', 
    fecha_facturacion = CURRENT_DATE,
    numero_factura = 'FC-0001234'
WHERE atencion_medica_id = 789;
```

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

### ❌ MODELO ANTERIOR (INCORRECTO)

```
consultas
  ├── fecha_hora (¿turno o atención?)
  ├── estado (¿del turno o de la atención?)
  ├── motivo_consulta (antes)
  ├── sintomas (durante)
  ├── diagnostico (después)
  └── tratamiento (después)
```

**Problema:** Todo mezclado en 1 tabla

---

### ✅ MODELO NUEVO (CORRECTO)

```
visitas (turnos)
  ├── fecha_hora
  ├── estado (pendiente, confirmado, cancelado, realizado, ausente)
  ├── motivo_consulta
  └── tipo_visita

atenciones_medicas (lo que pasa en consultorio)
  ├── visita_id (1:1)
  ├── fecha_hora_inicio / fin
  ├── anamnesis
  ├── examen_fisico
  ├── diagnostico
  ├── plan_tratamiento
  └── signos_vitales

practicas_medicas (actos facturables)
  ├── atencion_medica_id (1:N)
  ├── tipo_practica
  ├── codigo_nomenclador
  ├── precio_practica
  └── estado_facturacion

nomenclador_practicas (catálogo de prestaciones)
  ├── codigo
  ├── descripcion
  ├── tipo
  ├── precio_particular
  └── valor_modulo
```

**Ventaja:** Separación clara de responsabilidades

---

## 🎯 BENEFICIOS DEL NUEVO MODELO

### 1. ✅ Terminología médica correcta
- "Visita" en lugar de "consulta" (más preciso)
- "Atención médica" (lo que hace el médico)
- "Práctica médica" (acto facturable)

### 2. ✅ Permite múltiples prácticas por visita
```
Visita → Atención → Prácticas:
                     ├── Consulta
                     ├── ECG
                     └── Análisis glucemia
```

### 3. ✅ Facturación profesional
- Cada práctica tiene código de nomenclador
- Diferencia coseguro vs cobertura
- Estado de facturación independiente

### 4. ✅ Estadísticas precisas
```sql
-- Visitas canceladas por mes
SELECT COUNT(*) FROM visitas 
WHERE estado = 'cancelado' 
AND EXTRACT(MONTH FROM created_at) = 5;

-- Pacientes ausentes
SELECT COUNT(*) FROM visitas 
WHERE estado = 'ausente';

-- Prácticas más realizadas
SELECT tipo_practica, COUNT(*) 
FROM practicas_medicas 
GROUP BY tipo_practica 
ORDER BY COUNT(*) DESC;

-- Facturación pendiente
SELECT SUM(precio_practica) 
FROM practicas_medicas 
WHERE estado_facturacion = 'pendiente';
```

### 5. ✅ Integración con obras sociales
- Campo `codigo_nomenclador` permite envío automático
- `requiere_autorizacion` para prácticas especiales
- `cobertura_obra_social` vs `coseguro_paciente`

---

## 📝 MIGRACIÓN DEL MODELO ANTERIOR

**Script de migración:**

```sql
-- 1. Crear nuevas tablas
CREATE TABLE setubalai.visitas (...);
CREATE TABLE setubalai.atenciones_medicas (...);
CREATE TABLE setubalai.practicas_medicas (...);
CREATE TABLE setubalai.nomenclador_practicas (...);

-- 2. Migrar datos de consultas → visitas
INSERT INTO setubalai.visitas (
    empresa_id, paciente_id, medico_id,
    fecha_hora, duracion_minutos, estado,
    motivo_consulta, tipo_visita,
    created_at, updated_at
)
SELECT 
    empresa_id, paciente_id, medico_id,
    fecha_hora, duracion_minutos, estado,
    motivo_consulta, 'consulta',
    created_at, updated_at
FROM setubalai.consultas;

-- 3. Migrar consultas realizadas → atenciones_medicas
INSERT INTO setubalai.atenciones_medicas (
    empresa_id, visita_id, paciente_id, medico_id,
    fecha_hora_inicio, fecha_hora_fin,
    anamnesis, diagnostico, plan_tratamiento,
    presion_arterial, frecuencia_cardiaca, temperatura, peso, altura,
    observaciones, estado,
    created_at, updated_at
)
SELECT 
    c.empresa_id, v.id, c.paciente_id, c.medico_id,
    c.fecha_hora, c.fecha_hora + (c.duracion_minutos || ' minutes')::interval,
    c.sintomas, c.diagnostico, c.tratamiento,
    c.presion_arterial, c.frecuencia_cardiaca, c.temperatura, c.peso, c.altura,
    c.observaciones, 'finalizada',
    c.created_at, c.updated_at
FROM setubalai.consultas c
JOIN setubalai.visitas v ON v.paciente_id = c.paciente_id 
    AND v.medico_id = c.medico_id 
    AND v.fecha_hora = c.fecha_hora
WHERE c.estado IN ('realizado', 'en_curso');

-- 4. Crear práctica médica para cada atención (por defecto: consulta)
INSERT INTO setubalai.practicas_medicas (
    empresa_id, atencion_medica_id, paciente_id, medico_id,
    tipo_practica, precio_practica,
    estado_facturacion,
    created_at
)
SELECT 
    a.empresa_id, a.id, a.paciente_id, a.medico_id,
    'Consulta médica', 15000,
    'pendiente',
    a.created_at
FROM setubalai.atenciones_medicas a;

-- 5. Opcional: Mantener tabla consultas como VIEW (compatibilidad)
CREATE VIEW setubalai.consultas AS
SELECT 
    v.id,
    v.empresa_id,
    v.paciente_id,
    v.medico_id,
    v.fecha_hora,
    v.duracion_minutos,
    v.estado,
    v.motivo_consulta,
    a.anamnesis AS sintomas,
    a.diagnostico,
    a.plan_tratamiento AS tratamiento,
    a.observaciones,
    a.presion_arterial,
    a.frecuencia_cardiaca,
    a.temperatura,
    a.peso,
    a.altura,
    v.recordatorio_enviado,
    v.recordatorio_fecha,
    v.created_at,
    v.updated_at
FROM setubalai.visitas v
LEFT JOIN setubalai.atenciones_medicas a ON a.visita_id = v.id;
```

---

## 🚀 IMPACTO EN EL MVP

### Backend (FastAPI)

**Nuevos routers:**
```
/api/clinica/visitas/          (antes: /consultas/)
/api/clinica/atenciones/       (nuevo)
/api/clinica/practicas/        (nuevo)
/api/clinica/nomenclador/      (nuevo)
```

**Modelos SQLAlchemy:**
```python
class Visita(Base):
    __tablename__ = 'visitas'
    ...

class AtencionMedica(Base):
    __tablename__ = 'atenciones_medicas'
    visita = relationship("Visita", back_populates="atencion")
    practicas = relationship("PracticaMedica", back_populates="atencion")
    ...

class PracticaMedica(Base):
    __tablename__ = 'practicas_medicas'
    atencion = relationship("AtencionMedica", back_populates="practicas")
    ...
```

---

### Frontend (Next.js)

**Cambio en vocabulario:**
```tsx
// ANTES
<h1>Consultas</h1>
<button>Nueva Consulta</button>

// DESPUÉS
<h1>Visitas (Turnos)</h1>
<button>Agendar Visita</button>

// Cuando se hace clic en una visita realizada:
<h2>Atención Médica</h2>
<section>
  <h3>Signos Vitales</h3>
  <h3>Diagnóstico</h3>
  <h3>Prácticas Realizadas</h3>
  <ul>
    <li>Consulta clínica médica - $15,000</li>
    <li>Electrocardiograma - $8,000</li>
  </ul>
</section>
```

---

### Skills de Hermes

**Actualización del skill `clinica-turnos`:**

```yaml
name: setubalai-clinica-turnos-v2
description: |
  Gestión de visitas médicas (turnos) y atenciones.
  Terminología corregida: VISITA → ATENCIÓN → PRÁCTICAS
```

**Comandos actualizados:**
```bash
# Agendar visita
curl -X POST /api/clinica/visitas/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "paciente_id": 1,
    "medico_id": 2,
    "fecha_hora": "2026-06-03T10:00:00",
    "motivo_consulta": "Control de presión",
    "tipo_visita": "control"
  }'

# Registrar atención médica
curl -X POST /api/clinica/atenciones/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "visita_id": 456,
    "anamnesis": "Paciente refiere...",
    "diagnostico": "Hipertensión arterial...",
    "presion_arterial": "150/95",
    "peso": 78.5
  }'

# Registrar prácticas realizadas
curl -X POST /api/clinica/practicas/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "atencion_medica_id": 789,
    "tipo_practica": "Consulta clínica médica",
    "codigo_nomenclador": "010101",
    "precio_practica": 15000
  }'
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Antes de continuar con implementación:

- [ ] Pablo valida que la terminología es correcta
- [ ] Pablo confirma que el flujo VISITA → ATENCIÓN → PRÁCTICAS tiene sentido
- [ ] Nomenclador de prácticas es necesario para facturación
- [ ] El modelo permite facturar a obras sociales (coseguro + cobertura)
- [ ] El modelo permite múltiples prácticas en una visita
- [ ] La migración de datos existentes es viable

---

## 📌 PRÓXIMO PASO

**¿Aprobás este nuevo modelo?**

Si sí, procedo a:
1. Actualizar MVP-CLINICA-MEDICA.md con el nuevo modelo
2. Reescribir scripts de migración
3. Actualizar modelos SQLAlchemy
4. Actualizar routers FastAPI
5. Actualizar componentes frontend

**¿PROCEDO CON LA CORRECCIÓN COMPLETA DEL DOCUMENTO MVP?**
