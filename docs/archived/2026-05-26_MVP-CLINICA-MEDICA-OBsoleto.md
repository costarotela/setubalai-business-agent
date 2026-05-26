# MVP: Clínica Médica — Plan de Implementación con Validación Obligatoria

⚠️ **ESTADO: DOCUMENTO DE TRABAJO — NADA IMPLEMENTADO** ⚠️

Este documento define el **MVP (Producto Mínimo Viable)** para el vertical de **Clínica Médica** del agente SetubalAI.

**Cada fase tiene CHECKPOINT DE VALIDACIÓN obligatorio. NO se avanza sin aprobar tests.**

---

**Fecha de creación:** 2026-05-26  
**Versión:** 1.0  
**Vertical:** Clínica Médica  
**Duración estimada:** 6 semanas  
**Equipo:** 1 desarrollador + Hermes Agent

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance del MVP](#2-alcance-del-mvp)
3. [Arquitectura de Base de Datos](#3-arquitectura-de-base-de-datos)
4. [Roadmap de Implementación (6 semanas)](#4-roadmap-de-implementación-6-semanas)
5. [Backend: FastAPI](#5-backend-fastapi)
6. [Frontend: Next.js](#6-frontend-nextjs)
7. [Skills de Hermes](#7-skills-de-hermes)
8. [Storage de Archivos Médicos](#8-storage-de-archivos-médicos)
9. [Testing y QA](#9-testing-y-qa)
10. [Anexo: Diagnóstico y Logística](#10-anexo-diagnóstico-y-logística)

---

## 1. RESUMEN EJECUTIVO

### 1.1 ¿Qué es este MVP?

**Sistema de gestión para clínicas y consultorios médicos** que permite:

1. ✅ Gestión de pacientes
2. ✅ Gestión de médicos y especialidades
3. ✅ Agenda de turnos/consultas
4. ✅ Historia clínica con archivos adjuntos (estudios médicos)
5. ✅ Recetas médicas (PDF)
6. ✅ WhatsApp para turnos y recordatorios
7. ✅ Dashboard web para administración

### 1.2 Cliente Objetivo

**Clínicas pequeñas/medianas:**
- 1-5 médicos
- 50-200 pacientes/mes
- Sin sistema (usan Excel + WhatsApp caótico)
- Quieren profesionalizar atención

### 1.3 Propuesta de Valor

| Antes (sin SetubalAI) | Después (con MVP) |
|----------------------|-------------------|
| Agenda en papel/Excel | Agenda digital con slots |
| Llamadas telefónicas 24/7 | WhatsApp automatizado |
| Historia clínica en papel | Historia clínica digital + adjuntos |
| Sin recordatorios | Recordatorios automáticos 24hs antes |
| Recetas manuscritas | Recetas PDF con firma digital |

**ROI:** Ahorro de 1 secretaria = $500k/mes ARS  
**Tiempo de implementación:** 6 semanas

---

## 2. ALCANCE DEL MVP

### 2.1 ✅ Funcionalidades INCLUIDAS (MVP)

**Gestión de Pacientes:**
- [x] CRUD pacientes (nombre, DNI, teléfono, email, obra social)
- [x] Búsqueda por DNI/nombre/teléfono
- [x] Historia clínica básica (alergias, medicación habitual, antecedentes)
- [x] **Adjuntar estudios médicos** (RX, laboratorio, resonancia, etc.)
- [x] Visualizar historial de consultas

**Gestión de Médicos:**
- [x] CRUD médicos (nombre, matrícula, especialidades)
- [x] Configuración de horarios de atención (lunes 9-13, etc.)
- [x] Duración de turnos por médico (15min, 30min)

**Turnos y Consultas:**
- [x] Agenda visual por médico/día
- [x] Reserva de turnos (fecha + hora + médico + paciente)
- [x] Estados: pendiente, confirmado, realizado, cancelado
- [x] Motivo de consulta
- [x] Diagnóstico y tratamiento (después de consulta)
- [x] Signos vitales (presión, peso, temperatura)

**Recetas Médicas:**
- [x] Crear receta con medicamentos
- [x] Generar PDF descargable
- [x] Enviar por WhatsApp al paciente

**WhatsApp:**
- [x] Paciente solicita turno
- [x] Agente busca disponibilidad y confirma
- [x] Recordatorio automático 24hs antes
- [x] Envío de receta por WhatsApp

**Dashboard Web:**
- [x] Vista de turnos del día
- [x] Gestión de pacientes
- [x] Gestión de médicos
- [x] Historia clínica por paciente

### 2.2 ❌ Funcionalidades NO INCLUIDAS (Fase 2)

**Fuera del alcance inicial:**
- ❌ Integración con obras sociales (APIs externas)
- ❌ Facturación electrónica AFIP
- ❌ Visor DICOM (eso era para diagnóstico por imágenes)
- ❌ Múltiples sedes físicas
- ❌ Sistema de autorizaciones de estudios
- ❌ Reportes avanzados/estadísticas
- ❌ Telemedicina/videollamadas
- ❌ App móvil nativa

---

## 3. ARQUITECTURA DE BASE DE DATOS

### 3.1 Filosofía de Diseño

**Extensión del schema `setubalai` existente:**
- **NO creamos schema separado** (evitar complejidad)
- **Reutilizamos tablas core:** `empresas`, `usuarios`, `clientes`
- **Agregamos 7 tablas nuevas** para funcionalidad médica
- **Campo JSONB flexible** para extensibilidad futura

### 3.2 Tablas EXISTENTES (Core)

Estas tablas YA EXISTEN en DB `business`, schema `setubalai`:

```sql
-- ============================================================
-- TABLAS CORE (YA EXISTEN, NO TOCAR)
-- ============================================================

setubalai.empresas
  - id, nombre, cuit, email, telefono, direccion, estado

setubalai.usuarios
  - id, empresa_id, email, password_hash, rol, nombre, activo

setubalai.clientes (RENOMBRAR conceptualmente a "pacientes")
  - id, empresa_id, nombre, apellido, dni, telefono, email, direccion
  - metadata JSONB ← Aquí guardaremos: {obra_social, numero_afiliado, grupo_sanguineo}
```

**⚠️ IMPORTANTE:** NO renombramos físicamente la tabla. En código se llamará "Paciente" pero en BD sigue siendo `clientes`.

---

### 3.3 Tablas NUEVAS (Vertical Clínica)

```sql
-- ============================================================
-- VERTICAL: CLÍNICA MÉDICA (7 TABLAS NUEVAS)
-- ============================================================

-- 1. MÉDICOS
CREATE TABLE setubalai.medicos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES setubalai.usuarios(id) ON DELETE SET NULL,
    
    -- Datos profesionales
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    matricula_provincial VARCHAR(50),
    matricula_nacional VARCHAR(50),
    especialidades TEXT[] DEFAULT '{}',  -- ['cardiología', 'clínica_médica']
    
    -- Configuración de atención
    duracion_turno_minutos INTEGER DEFAULT 30,
    horarios_atencion JSONB DEFAULT '{}',  
    -- Ejemplo: {"lunes": ["09:00-13:00", "15:00-19:00"], "martes": ["09:00-13:00"]}
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT medicos_unique_matricula_prov UNIQUE(empresa_id, matricula_provincial)
);

CREATE INDEX idx_medicos_empresa ON setubalai.medicos(empresa_id);
CREATE INDEX idx_medicos_activo ON setubalai.medicos(activo);


-- 2. HISTORIA CLÍNICA (1 por paciente)
CREATE TABLE setubalai.historia_clinica (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    
    -- Información médica base
    grupo_sanguineo VARCHAR(10),  -- O+, A-, etc.
    alergias TEXT[] DEFAULT '{}',  -- ['penicilina', 'mariscos']
    medicacion_habitual TEXT[] DEFAULT '{}',  -- ['losartan 50mg', 'atorvastatina 20mg']
    
    -- Antecedentes
    antecedentes_personales TEXT,  -- Texto libre
    antecedentes_familiares TEXT,  -- Texto libre
    cirugias_previas TEXT[] DEFAULT '{}',
    
    -- Metadata flexible
    notas_adicionales TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(empresa_id, paciente_id)
);

CREATE INDEX idx_historia_clinica_paciente ON setubalai.historia_clinica(paciente_id);


-- 3. CONSULTAS (turnos + registro de consulta médica)
CREATE TABLE setubalai.consultas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    -- Fecha y hora del turno
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    
    -- Estado del turno
    estado VARCHAR(50) DEFAULT 'pendiente',
    -- Estados: 'pendiente', 'confirmado', 'en_curso', 'realizado', 'cancelado', 'ausente'
    
    -- Motivo de consulta (lo dice el paciente al pedir turno)
    motivo_consulta TEXT,
    
    -- Registro de la consulta médica (lo completa el médico)
    sintomas TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    
    -- Signos vitales
    presion_arterial VARCHAR(20),  -- "120/80"
    frecuencia_cardiaca INTEGER,   -- latidos/min
    temperatura DECIMAL(4,2),      -- 36.5
    peso DECIMAL(5,2),             -- kg
    altura DECIMAL(5,2),           -- cm
    
    -- Control de recordatorios
    recordatorio_enviado BOOLEAN DEFAULT false,
    recordatorio_fecha TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultas_empresa ON setubalai.consultas(empresa_id);
CREATE INDEX idx_consultas_paciente ON setubalai.consultas(paciente_id);
CREATE INDEX idx_consultas_medico ON setubalai.consultas(medico_id);
CREATE INDEX idx_consultas_fecha ON setubalai.consultas(fecha_hora);
CREATE INDEX idx_consultas_estado ON setubalai.consultas(estado);


-- 4. RECETAS
CREATE TABLE setubalai.recetas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    consulta_id INTEGER NOT NULL REFERENCES setubalai.consultas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    -- Medicamentos prescritos (array JSON)
    medicamentos JSONB NOT NULL,
    -- Ejemplo: [
    --   {"nombre": "Ibuprofeno 600mg", "dosis": "1 comprimido", "frecuencia": "cada 8 horas", "duracion": "5 días"},
    --   {"nombre": "Omeprazol 20mg", "dosis": "1 cápsula", "frecuencia": "en ayunas", "duracion": "30 días"}
    -- ]
    
    -- Indicaciones generales
    indicaciones TEXT,
    
    -- Validez
    valida_hasta DATE,
    
    -- Archivo PDF generado
    archivo_pdf_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recetas_consulta ON setubalai.recetas(consulta_id);
CREATE INDEX idx_recetas_paciente ON setubalai.recetas(paciente_id);


-- 5. ESTUDIOS MÉDICOS ADJUNTOS (archivos subidos por paciente/médico)
CREATE TABLE setubalai.estudios_adjuntos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    
    -- Qué tipo de estudio es
    tipo_estudio VARCHAR(100) NOT NULL,  -- "Radiografía", "Laboratorio", "Resonancia", "Tomografía", "Electrocardiograma"
    descripcion TEXT,  -- "RX de tórax - 15/03/2026"
    fecha_estudio DATE,  -- Cuándo se realizó
    
    -- Archivo
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_url TEXT NOT NULL,  -- Ruta en filesystem o S3
    archivo_tipo VARCHAR(50),  -- "application/pdf", "image/jpeg"
    archivo_tamano_bytes BIGINT,
    
    -- Relación opcional con una consulta (si se subió durante una consulta)
    consulta_id INTEGER REFERENCES setubalai.consultas(id) ON DELETE SET NULL,
    
    -- Quién lo subió
    subido_por_usuario_id INTEGER REFERENCES setubalai.usuarios(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_estudios_adjuntos_paciente ON setubalai.estudios_adjuntos(paciente_id);
CREATE INDEX idx_estudios_adjuntos_tipo ON setubalai.estudios_adjuntos(tipo_estudio);
CREATE INDEX idx_estudios_adjuntos_fecha ON setubalai.estudios_adjuntos(fecha_estudio);


-- 6. SLOTS DE DISPONIBILIDAD (pre-calculados para UI rápida)
CREATE TABLE setubalai.slots_disponibilidad (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    -- Estado
    disponible BOOLEAN DEFAULT true,
    consulta_id INTEGER REFERENCES setubalai.consultas(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint única: un médico no puede tener dos slots en la misma hora
    UNIQUE(medico_id, fecha, hora_inicio)
);

CREATE INDEX idx_slots_medico_fecha ON setubalai.slots_disponibilidad(medico_id, fecha);
CREATE INDEX idx_slots_disponible ON setubalai.slots_disponibilidad(disponible);


-- 7. CONFIGURACIÓN DE VERTICAL CLÍNICA (por empresa)
CREATE TABLE setubalai.config_clinica (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE UNIQUE,
    
    -- Configuración general
    duracion_turno_default INTEGER DEFAULT 30,  -- minutos
    recordatorio_horas_antes INTEGER DEFAULT 24,
    
    -- WhatsApp
    whatsapp_activo BOOLEAN DEFAULT true,
    whatsapp_numero VARCHAR(50),  -- Número de la clínica
    
    -- Storage
    storage_tipo VARCHAR(20) DEFAULT 'filesystem',  -- 'filesystem' o 's3'
    storage_path TEXT,  -- Ruta local o bucket S3
    
    -- UI
    color_primario VARCHAR(7) DEFAULT '#3b82f6',  -- Azul
    logo_url TEXT,
    
    -- Metadata flexible
    configuracion_adicional JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.4 Script de Migración

**Archivo:** `/home/admin/setubalai-agente/migrations/001_create_clinica_tables.sql`

```sql
-- ============================================================
-- MIGRACIÓN 001: Vertical Clínica Médica
-- Fecha: 2026-05-26
-- Autor: Hermes Agent + Pablo
-- ============================================================

BEGIN;

-- 1. MÉDICOS
CREATE TABLE IF NOT EXISTS setubalai.medicos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES setubalai.usuarios(id) ON DELETE SET NULL,
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    matricula_provincial VARCHAR(50),
    matricula_nacional VARCHAR(50),
    especialidades TEXT[] DEFAULT '{}',
    duracion_turno_minutos INTEGER DEFAULT 30,
    horarios_atencion JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT medicos_unique_matricula_prov UNIQUE(empresa_id, matricula_provincial)
);

CREATE INDEX IF NOT EXISTS idx_medicos_empresa ON setubalai.medicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_medicos_activo ON setubalai.medicos(activo);

-- 2. HISTORIA CLÍNICA
CREATE TABLE IF NOT EXISTS setubalai.historia_clinica (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    grupo_sanguineo VARCHAR(10),
    alergias TEXT[] DEFAULT '{}',
    medicacion_habitual TEXT[] DEFAULT '{}',
    antecedentes_personales TEXT,
    antecedentes_familiares TEXT,
    cirugias_previas TEXT[] DEFAULT '{}',
    notas_adicionales TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(empresa_id, paciente_id)
);

CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente ON setubalai.historia_clinica(paciente_id);

-- 3. CONSULTAS
CREATE TABLE IF NOT EXISTS setubalai.consultas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMPTZ NOT NULL,
    duracion_minutos INTEGER DEFAULT 30,
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_consulta TEXT,
    sintomas TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    presion_arterial VARCHAR(20),
    frecuencia_cardiaca INTEGER,
    temperatura DECIMAL(4,2),
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    recordatorio_enviado BOOLEAN DEFAULT false,
    recordatorio_fecha TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_empresa ON setubalai.consultas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON setubalai.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON setubalai.consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_fecha ON setubalai.consultas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_consultas_estado ON setubalai.consultas(estado);

-- 4. RECETAS
CREATE TABLE IF NOT EXISTS setubalai.recetas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    consulta_id INTEGER NOT NULL REFERENCES setubalai.consultas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    medicamentos JSONB NOT NULL,
    indicaciones TEXT,
    valida_hasta DATE,
    archivo_pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recetas_consulta ON setubalai.recetas(consulta_id);
CREATE INDEX IF NOT EXISTS idx_recetas_paciente ON setubalai.recetas(paciente_id);

-- 5. ESTUDIOS ADJUNTOS
CREATE TABLE IF NOT EXISTS setubalai.estudios_adjuntos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    paciente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
    tipo_estudio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_estudio DATE,
    archivo_nombre VARCHAR(255) NOT NULL,
    archivo_url TEXT NOT NULL,
    archivo_tipo VARCHAR(50),
    archivo_tamano_bytes BIGINT,
    consulta_id INTEGER REFERENCES setubalai.consultas(id) ON DELETE SET NULL,
    subido_por_usuario_id INTEGER REFERENCES setubalai.usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_paciente ON setubalai.estudios_adjuntos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_tipo ON setubalai.estudios_adjuntos(tipo_estudio);
CREATE INDEX IF NOT EXISTS idx_estudios_adjuntos_fecha ON setubalai.estudios_adjuntos(fecha_estudio);

-- 6. SLOTS DISPONIBILIDAD
CREATE TABLE IF NOT EXISTS setubalai.slots_disponibilidad (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE,
    medico_id INTEGER NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    disponible BOOLEAN DEFAULT true,
    consulta_id INTEGER REFERENCES setubalai.consultas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(medico_id, fecha, hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_slots_medico_fecha ON setubalai.slots_disponibilidad(medico_id, fecha);
CREATE INDEX IF NOT EXISTS idx_slots_disponible ON setubalai.slots_disponibilidad(disponible);

-- 7. CONFIG CLÍNICA
CREATE TABLE IF NOT EXISTS setubalai.config_clinica (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id) ON DELETE CASCADE UNIQUE,
    duracion_turno_default INTEGER DEFAULT 30,
    recordatorio_horas_antes INTEGER DEFAULT 24,
    whatsapp_activo BOOLEAN DEFAULT true,
    whatsapp_numero VARCHAR(50),
    storage_tipo VARCHAR(20) DEFAULT 'filesystem',
    storage_path TEXT,
    color_primario VARCHAR(7) DEFAULT '#3b82f6',
    logo_url TEXT,
    configuracion_adicional JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
```

---

### 3.5 ✅ CHECKPOINT 1: VALIDACIÓN DE BASE DE DATOS

**Antes de avanzar, ejecutar estos tests:**

```bash
# 1. Conectar a BD
docker exec -it paperclip-db psql -U postgres -d business

# 2. Verificar que las 7 tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'setubalai' 
  AND table_name IN ('medicos', 'historia_clinica', 'consultas', 'recetas', 'estudios_adjuntos', 'slots_disponibilidad', 'config_clinica');

-- Debe retornar 7 filas

# 3. Verificar integridad referencial
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'setubalai'
  AND tc.table_name IN ('medicos', 'historia_clinica', 'consultas', 'recetas', 'estudios_adjuntos', 'slots_disponibilidad', 'config_clinica')
ORDER BY tc.table_name, tc.constraint_name;

-- Debe retornar todas las foreign keys definidas

# 4. Verificar índices
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE schemaname = 'setubalai' 
  AND tablename IN ('medicos', 'historia_clinica', 'consultas', 'recetas', 'estudios_adjuntos', 'slots_disponibilidad')
ORDER BY tablename, indexname;

-- Debe retornar todos los índices creados
```

**Criterio de aceptación:**  
✅ Las 7 tablas existen  
✅ Todas las foreign keys están correctas  
✅ Todos los índices están creados  
✅ No hay errores de sintaxis SQL

**Si falla:** Revisar y corregir migración antes de continuar.

---

## 4. ROADMAP DE IMPLEMENTACIÓN (6 SEMANAS)

### Filosofía: VERIFY-AS-YOU-GO

**Cada fase tiene:**
1. Objetivos claros
2. Tareas específicas
3. **CHECKPOINT DE VALIDACIÓN** (tests obligatorios)
4. Criterios de aceptación
5. Plan de rollback

**NO se avanza a la siguiente fase sin pasar el checkpoint.**

---

### SEMANA 1: Setup Inicial + Modelos Backend

#### Objetivos
- [x] Migración de BD ejecutada y validada
- [x] Modelos SQLAlchemy creados
- [x] Schemas Pydantic creados
- [x] Tests unitarios de modelos

#### Tareas

**1.1 Ejecutar Migración de BD**
```bash
cd /home/admin/setubalai-agente
docker exec -i paperclip-db psql -U postgres -d business < migrations/001_create_clinica_tables.sql
```

**1.2 Crear Modelos SQLAlchemy**

Archivo: `/home/admin/setubalai/src/backend/models/clinica.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, Date, Time, TIMESTAMP, Text, ARRAY, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .base import Base

class Medico(Base):
    __tablename__ = 'medicos'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    usuario_id = Column(Integer, ForeignKey('setubalai.usuarios.id'))
    
    nombre = Column(String(200), nullable=False)
    apellido = Column(String(200), nullable=False)
    matricula_provincial = Column(String(50))
    matricula_nacional = Column(String(50))
    especialidades = Column(ARRAY(Text), default=[])
    
    duracion_turno_minutos = Column(Integer, default=30)
    horarios_atencion = Column(JSONB, default={})
    
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default='NOW()')
    updated_at = Column(TIMESTAMP, server_default='NOW()', onupdate='NOW()')
    
    # Relationships
    empresa = relationship("Empresa", back_populates="medicos")
    consultas = relationship("Consulta", back_populates="medico")

class HistoriaClinica(Base):
    __tablename__ = 'historia_clinica'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    paciente_id = Column(Integer, ForeignKey('setubalai.clientes.id'), nullable=False)
    
    grupo_sanguineo = Column(String(10))
    alergias = Column(ARRAY(Text), default=[])
    medicacion_habitual = Column(ARRAY(Text), default=[])
    antecedentes_personales = Column(Text)
    antecedentes_familiares = Column(Text)
    cirugias_previas = Column(ARRAY(Text), default=[])
    notas_adicionales = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default='NOW()')
    updated_at = Column(TIMESTAMP, server_default='NOW()', onupdate='NOW()')
    
    # Relationships
    paciente = relationship("Cliente", back_populates="historia_clinica")

class Consulta(Base):
    __tablename__ = 'consultas'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    paciente_id = Column(Integer, ForeignKey('setubalai.clientes.id'), nullable=False)
    medico_id = Column(Integer, ForeignKey('setubalai.medicos.id'), nullable=False)
    
    fecha_hora = Column(TIMESTAMP, nullable=False)
    duracion_minutos = Column(Integer, default=30)
    estado = Column(String(50), default='pendiente')
    
    motivo_consulta = Column(Text)
    sintomas = Column(Text)
    diagnostico = Column(Text)
    tratamiento = Column(Text)
    observaciones = Column(Text)
    
    presion_arterial = Column(String(20))
    frecuencia_cardiaca = Column(Integer)
    temperatura = Column(DECIMAL(4,2))
    peso = Column(DECIMAL(5,2))
    altura = Column(DECIMAL(5,2))
    
    recordatorio_enviado = Column(Boolean, default=False)
    recordatorio_fecha = Column(TIMESTAMP)
    
    created_at = Column(TIMESTAMP, server_default='NOW()')
    updated_at = Column(TIMESTAMP, server_default='NOW()', onupdate='NOW()')
    
    # Relationships
    paciente = relationship("Cliente", back_populates="consultas")
    medico = relationship("Medico", back_populates="consultas")
    recetas = relationship("Receta", back_populates="consulta")

class Receta(Base):
    __tablename__ = 'recetas'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    consulta_id = Column(Integer, ForeignKey('setubalai.consultas.id'), nullable=False)
    paciente_id = Column(Integer, ForeignKey('setubalai.clientes.id'), nullable=False)
    medico_id = Column(Integer, ForeignKey('setubalai.medicos.id'), nullable=False)
    
    medicamentos = Column(JSONB, nullable=False)
    indicaciones = Column(Text)
    valida_hasta = Column(Date)
    archivo_pdf_url = Column(Text)
    
    created_at = Column(TIMESTAMP, server_default='NOW()')
    
    # Relationships
    consulta = relationship("Consulta", back_populates="recetas")

class EstudioAdjunto(Base):
    __tablename__ = 'estudios_adjuntos'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    paciente_id = Column(Integer, ForeignKey('setubalai.clientes.id'), nullable=False)
    
    tipo_estudio = Column(String(100), nullable=False)
    descripcion = Column(Text)
    fecha_estudio = Column(Date)
    
    archivo_nombre = Column(String(255), nullable=False)
    archivo_url = Column(Text, nullable=False)
    archivo_tipo = Column(String(50))
    archivo_tamano_bytes = Column(Integer)
    
    consulta_id = Column(Integer, ForeignKey('setubalai.consultas.id'))
    subido_por_usuario_id = Column(Integer, ForeignKey('setubalai.usuarios.id'))
    
    created_at = Column(TIMESTAMP, server_default='NOW()')

class SlotDisponibilidad(Base):
    __tablename__ = 'slots_disponibilidad'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False)
    medico_id = Column(Integer, ForeignKey('setubalai.medicos.id'), nullable=False)
    
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    
    disponible = Column(Boolean, default=True)
    consulta_id = Column(Integer, ForeignKey('setubalai.consultas.id'))
    
    created_at = Column(TIMESTAMP, server_default='NOW()')

class ConfigClinica(Base):
    __tablename__ = 'config_clinica'
    __table_args__ = {'schema': 'setubalai'}
    
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey('setubalai.empresas.id'), nullable=False, unique=True)
    
    duracion_turno_default = Column(Integer, default=30)
    recordatorio_horas_antes = Column(Integer, default=24)
    
    whatsapp_activo = Column(Boolean, default=True)
    whatsapp_numero = Column(String(50))
    
    storage_tipo = Column(String(20), default='filesystem')
    storage_path = Column(Text)
    
    color_primario = Column(String(7), default='#3b82f6')
    logo_url = Column(Text)
    
    configuracion_adicional = Column(JSONB, default={})
    
    created_at = Column(TIMESTAMP, server_default='NOW()')
    updated_at = Column(TIMESTAMP, server_default='NOW()', onupdate='NOW()')
```

**1.3 Crear Schemas Pydantic**

Archivo: `/home/admin/setubalai/src/backend/schemas/clinica.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time

# ============================================================
# MÉDICOS
# ============================================================

class MedicoBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    apellido: str = Field(..., max_length=200)
    matricula_provincial: Optional[str] = Field(None, max_length=50)
    matricula_nacional: Optional[str] = Field(None, max_length=50)
    especialidades: List[str] = Field(default_factory=list)
    duracion_turno_minutos: int = 30
    horarios_atencion: dict = Field(default_factory=dict)
    activo: bool = True

class MedicoCreate(MedicoBase):
    usuario_id: Optional[int] = None

class MedicoUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    matricula_provincial: Optional[str] = None
    matricula_nacional: Optional[str] = None
    especialidades: Optional[List[str]] = None
    duracion_turno_minutos: Optional[int] = None
    horarios_atencion: Optional[dict] = None
    activo: Optional[bool] = None

class Medico(MedicoBase):
    id: int
    empresa_id: int
    usuario_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================
# HISTORIA CLÍNICA
# ============================================================

class HistoriaClinicaBase(BaseModel):
    grupo_sanguineo: Optional[str] = Field(None, max_length=10)
    alergias: List[str] = Field(default_factory=list)
    medicacion_habitual: List[str] = Field(default_factory=list)
    antecedentes_personales: Optional[str] = None
    antecedentes_familiares: Optional[str] = None
    cirugias_previas: List[str] = Field(default_factory=list)
    notas_adicionales: Optional[str] = None

class HistoriaClinicaCreate(HistoriaClinicaBase):
    paciente_id: int

class HistoriaClinicaUpdate(HistoriaClinicaBase):
    pass

class HistoriaClinica(HistoriaClinicaBase):
    id: int
    empresa_id: int
    paciente_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================
# CONSULTAS
# ============================================================

class ConsultaBase(BaseModel):
    paciente_id: int
    medico_id: int
    fecha_hora: datetime
    duracion_minutos: int = 30
    motivo_consulta: Optional[str] = None

class ConsultaCreate(ConsultaBase):
    pass

class ConsultaUpdate(BaseModel):
    fecha_hora: Optional[datetime] = None
    estado: Optional[str] = None
    sintomas: Optional[str] = None
    diagnostico: Optional[str] = None
    tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    temperatura: Optional[float] = None
    peso: Optional[float] = None
    altura: Optional[float] = None

class Consulta(ConsultaBase):
    id: int
    empresa_id: int
    estado: str
    sintomas: Optional[str]
    diagnostico: Optional[str]
    tratamiento: Optional[str]
    observaciones: Optional[str]
    presion_arterial: Optional[str]
    frecuencia_cardiaca: Optional[int]
    temperatura: Optional[float]
    peso: Optional[float]
    altura: Optional[float]
    recordatorio_enviado: bool
    recordatorio_fecha: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================
# RECETAS
# ============================================================

class Medicamento(BaseModel):
    nombre: str
    dosis: str
    frecuencia: str
    duracion: str

class RecetaBase(BaseModel):
    consulta_id: int
    medicamentos: List[Medicamento]
    indicaciones: Optional[str] = None
    valida_hasta: Optional[date] = None

class RecetaCreate(RecetaBase):
    paciente_id: int
    medico_id: int

class Receta(RecetaBase):
    id: int
    empresa_id: int
    paciente_id: int
    medico_id: int
    archivo_pdf_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================
# ESTUDIOS ADJUNTOS
# ============================================================

class EstudioAdjuntoBase(BaseModel):
    paciente_id: int
    tipo_estudio: str
    descripcion: Optional[str] = None
    fecha_estudio: Optional[date] = None

class EstudioAdjuntoCreate(EstudioAdjuntoBase):
    archivo_nombre: str
    archivo_url: str
    archivo_tipo: Optional[str] = None
    archivo_tamano_bytes: Optional[int] = None
    consulta_id: Optional[int] = None

class EstudioAdjunto(EstudioAdjuntoCreate):
    id: int
    empresa_id: int
    subido_por_usuario_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**1.4 Tests Unitarios de Modelos**

Archivo: `/home/admin/setubalai/src/backend/tests/test_models_clinica.py`

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.clinica import Medico, HistoriaClinica, Consulta, Receta
from models.base import Base
from datetime import datetime, date

# Setup test DB
TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/business_test"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_create_medico(db_session):
    medico = Medico(
        empresa_id=1,
        nombre="Juan",
        apellido="Pérez",
        matricula_provincial="MP12345",
        especialidades=["cardiología", "clínica médica"],
        duracion_turno_minutos=30,
        horarios_atencion={"lunes": ["09:00-13:00"]},
        activo=True
    )
    db_session.add(medico)
    db_session.commit()
    
    assert medico.id is not None
    assert medico.nombre == "Juan"
    assert len(medico.especialidades) == 2

def test_create_historia_clinica(db_session):
    hc = HistoriaClinica(
        empresa_id=1,
        paciente_id=1,
        grupo_sanguineo="O+",
        alergias=["penicilina"],
        medicacion_habitual=["losartan 50mg"]
    )
    db_session.add(hc)
    db_session.commit()
    
    assert hc.id is not None
    assert hc.grupo_sanguineo == "O+"
    assert len(hc.alergias) == 1

def test_create_consulta(db_session):
    consulta = Consulta(
        empresa_id=1,
        paciente_id=1,
        medico_id=1,
        fecha_hora=datetime.now(),
        duracion_minutos=30,
        estado="pendiente",
        motivo_consulta="Dolor de cabeza"
    )
    db_session.add(consulta)
    db_session.commit()
    
    assert consulta.id is not None
    assert consulta.estado == "pendiente"
```

#### ✅ CHECKPOINT SEMANA 1: Validación de Modelos

```bash
# 1. Verificar que modelos se importan sin errores
cd /home/admin/setubalai/src/backend
python3 -c "from models.clinica import Medico, HistoriaClinica, Consulta, Receta, EstudioAdjunto; print('✅ Modelos importados correctamente')"

# 2. Verificar schemas Pydantic
python3 -c "from schemas.clinica import MedicoCreate, ConsultaCreate; print('✅ Schemas importados correctamente')"

# 3. Ejecutar tests unitarios
pytest tests/test_models_clinica.py -v

# 4. Verificar relationships SQLAlchemy
python3 -c "
from models.clinica import Medico, Consulta
from models.core import Cliente
m = Medico.consultas
print('✅ Relationships OK')
"
```

**Criterios de aceptación:**
- ✅ Todos los modelos SQLAlchemy se importan sin errores
- ✅ Todos los schemas Pydantic validan correctamente
- ✅ Tests unitarios pasan (100% coverage)
- ✅ Relationships funcionan

**Si falla:** Corregir modelos/schemas antes de avanzar a Semana 2.

---

### SEMANA 2: Endpoints Backend (CRUD Básico)

#### Objetivos
- [x] Endpoints de Médicos (CRUD)
- [x] Endpoints de Historia Clínica (CRUD)
- [x] Endpoints de Consultas (CRUD + agenda)
- [x] Tests de integración de API

#### Tareas

**2.1 Router de Médicos**

Archivo: `/home/admin/setubalai/src/backend/api/routers/clinica/medicos.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...dependencies import get_db, get_current_user, get_current_empresa
from ...models.clinica import Medico
from ...schemas.clinica import MedicoCreate, MedicoUpdate, Medico as MedicoSchema

router = APIRouter(prefix="/clinica/medicos", tags=["clínica-médicos"])

@router.post("/", response_model=MedicoSchema, status_code=status.HTTP_201_CREATED)
def create_medico(
    medico_data: MedicoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    empresa = Depends(get_current_empresa)
):
    """Crear un nuevo médico"""
    medico = Medico(
        empresa_id=empresa.id,
        **medico_data.model_dump()
    )
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return medico

@router.get("/", response_model=List[MedicoSchema])
def list_medicos(
    activo: bool = None,
    especialidad: str = None,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Listar médicos de la empresa"""
    query = db.query(Medico).filter(Medico.empresa_id == empresa.id)
    
    if activo is not None:
        query = query.filter(Medico.activo == activo)
    
    if especialidad:
        query = query.filter(Medico.especialidades.contains([especialidad]))
    
    return query.all()

@router.get("/{medico_id}", response_model=MedicoSchema)
def get_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Obtener detalle de un médico"""
    medico = db.query(Medico).filter(
        Medico.id == medico_id,
        Medico.empresa_id == empresa.id
    ).first()
    
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    return medico

@router.put("/{medico_id}", response_model=MedicoSchema)
def update_medico(
    medico_id: int,
    medico_data: MedicoUpdate,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Actualizar un médico"""
    medico = db.query(Medico).filter(
        Medico.id == medico_id,
        Medico.empresa_id == empresa.id
    ).first()
    
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    for key, value in medico_data.model_dump(exclude_unset=True).items():
        setattr(medico, key, value)
    
    db.commit()
    db.refresh(medico)
    return medico

@router.delete("/{medico_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Eliminar un médico (soft delete)"""
    medico = db.query(Medico).filter(
        Medico.id == medico_id,
        Medico.empresa_id == empresa.id
    ).first()
    
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    medico.activo = False
    db.commit()
    return None

@router.get("/{medico_id}/agenda")
def get_agenda_medico(
    medico_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Obtener agenda de un médico para una fecha específica"""
    medico = db.query(Medico).filter(
        Medico.id == medico_id,
        Medico.empresa_id == empresa.id
    ).first()
    
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    # Generar slots disponibles basados en horarios_atencion
    # (lógica de generación de slots aquí)
    
    return {
        "medico_id": medico_id,
        "fecha": fecha,
        "slots": []  # Lista de slots disponibles
    }
```

**2.2 Router de Historia Clínica**

*(Código similar al de médicos, CRUD completo)*

**2.3 Router de Consultas**

*(Código similar, incluye lógica de agenda + reserva de turnos)*

**2.4 Tests de Integración**

Archivo: `/home/admin/setubalai/src/backend/tests/test_api_medicos.py`

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_medico():
    response = client.post(
        "/api/clinica/medicos/",
        json={
            "nombre": "Juan",
            "apellido": "Pérez",
            "matricula_provincial": "MP12345",
            "especialidades": ["cardiología"],
            "duracion_turno_minutos": 30,
            "horarios_atencion": {"lunes": ["09:00-13:00"]},
            "activo": True
        },
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["nombre"] == "Juan"
    assert data["id"] is not None

def test_list_medicos():
    response = client.get(
        "/api/clinica/medicos/",
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_medico():
    # Primero crear
    create_response = client.post(...)
    medico_id = create_response.json()["id"]
    
    # Luego obtener
    response = client.get(
        f"/api/clinica/medicos/{medico_id}",
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == medico_id

def test_update_medico():
    # Crear, actualizar, verificar
    ...

def test_delete_medico():
    # Crear, eliminar, verificar que activo=False
    ...
```

#### ✅ CHECKPOINT SEMANA 2: Validación de API Backend

```bash
# 1. Verificar que server arranca sin errores
cd /home/admin/setubalai/src/backend
uvicorn main:app --reload &
sleep 5
curl http://localhost:3010/health
# Debe retornar {"status": "ok"}

# 2. Verificar endpoints con curl (autenticado)
TOKEN=$(curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "test123"}' \
  | jq -r '.access_token')

# Crear médico
curl -X POST http://localhost:3010/api/clinica/medicos/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "matricula_provincial": "MP12345",
    "especialidades": ["cardiología"],
    "duracion_turno_minutos": 30,
    "horarios_atencion": {"lunes": ["09:00-13:00"]},
    "activo": true
  }'
# Debe retornar HTTP 201 + JSON con id

# Listar médicos
curl http://localhost:3010/api/clinica/medicos/ \
  -H "Authorization: Bearer $TOKEN"
# Debe retornar array con 1 médico

# 3. Ejecutar suite de tests
pytest tests/test_api_medicos.py -v
pytest tests/test_api_historia_clinica.py -v
pytest tests/test_api_consultas.py -v

# 4. Verificar integridad de datos
docker exec paperclip-db psql -U postgres -d business -c \
  "SELECT COUNT(*) FROM setubalai.medicos WHERE empresa_id = 1;"
# Debe coincidir con los médicos creados en tests
```

**Criterios de aceptación:**
- ✅ Server arranca sin errores
- ✅ Todos los endpoints responden correctamente
- ✅ Tests de integración pasan (100%)
- ✅ Datos en BD son consistentes

**Si falla:** Corregir endpoints antes de avanzar a Semana 3.

---

### SEMANA 3: Frontend (Dashboard Web)

#### Objetivos
- [x] Layout con sidebar dinámico
- [x] Página de gestión de médicos
- [x] Página de gestión de pacientes
- [x] Página de agenda de turnos
- [x] Componentes reutilizables

#### Tareas

**3.1 Layout con Sidebar**

Archivo: `/home/admin/setubalai/frontend/app/dashboard/layout.tsx`

```tsx
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**3.2 Sidebar con Sección Clínica**

Archivo: `/home/admin/setubalai/frontend/components/shared/Sidebar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  CalendarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname.startsWith(path);
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">SetubalAI</h1>
        <p className="text-sm text-gray-600">Clínica Médica</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
            pathname === '/dashboard' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        
        <div className="pt-4 pb-2">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Clínica
          </h3>
        </div>
        
        <Link
          href="/dashboard/clinica/medicos"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
            isActive('/dashboard/clinica/medicos')
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <UsersIcon className="w-5 h-5" />
          <span>Médicos</span>
        </Link>
        
        <Link
          href="/dashboard/clinica/pacientes"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
            isActive('/dashboard/clinica/pacientes')
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ClipboardDocumentListIcon className="w-5 h-5" />
          <span>Pacientes</span>
        </Link>
        
        <Link
          href="/dashboard/clinica/agenda"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
            isActive('/dashboard/clinica/agenda')
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Agenda</span>
        </Link>
        
        <div className="pt-4 pb-2">
          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Administración
          </h3>
        </div>
        
        <Link
          href="/dashboard/facturacion"
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
            isActive('/dashboard/facturacion')
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CreditCardIcon className="w-5 h-5" />
          <span>Facturación</span>
        </Link>
      </nav>
    </aside>
  );
}
```

**3.3 Página de Médicos**

Archivo: `/home/admin/setubalai/frontend/app/dashboard/clinica/medicos/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthFetch } from '@/lib/auth';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  matricula_provincial: string;
  especialidades: string[];
  activo: boolean;
}

export default function MedicosPage() {
  const authFetch = useAuthFetch();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadMedicos() {
      try {
        const response = await authFetch('/clinica/medicos/');
        const data = await response.json();
        setMedicos(data);
      } catch (error) {
        console.error('Error loading médicos:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadMedicos();
  }, []);
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Médicos</h1>
        <button
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => {/* Abrir modal de crear médico */}}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Médico</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matrícula
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Especialidades
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicos.map((medico) => (
              <tr key={medico.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {medico.nombre} {medico.apellido}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {medico.matricula_provincial}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {medico.especialidades.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    medico.activo 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {medico.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">
                    Editar
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**3.4 Componente de Agenda (Calendario)**

*(TBD Semana 4 - más complejo)*

#### ✅ CHECKPOINT SEMANA 3: Validación de Frontend

```bash
# 1. Build sin errores
cd /home/admin/setubalai/frontend
rm -rf .next
npm run build

# 2. Start en dev mode
npm run dev &
sleep 10

# 3. Verificar que páginas cargan
curl http://localhost:3011/dashboard/clinica/medicos
# Debe retornar HTML sin errores 500

# 4. Tests E2E con Playwright
npx playwright test tests/clinica/medicos.spec.ts

# 5. Lighthouse audit (performance)
npx lighthouse http://localhost:3011/dashboard/clinica/medicos --only-categories=performance --output=json
# Score debe ser >80
```

**Criterios de aceptación:**
- ✅ Build exitoso sin errores
- ✅ Todas las páginas cargan correctamente
- ✅ CRUD de médicos funciona en UI
- ✅ Tests E2E pasan
- ✅ Lighthouse score >80

**Si falla:** Corregir UI antes de avanzar a Semana 4.

---

### SEMANAS 4-6: Funcionalidades Avanzadas

*(Por razones de espacio, resumo. El documento completo incluiría similar nivel de detalle para:)*

**SEMANA 4: Storage de Archivos + Historia Clínica**
- Upload de estudios médicos (PDF, imágenes)
- Visualización de historia clínica con adjuntos
- Tests de upload/download

**SEMANA 5: WhatsApp + Skills Hermes**
- Integración con WhatsApp Business API
- Skill `clinica-turnos` para Hermes
- Recordatorios automáticos

**SEMANA 6: Recetas PDF + Pulido Final**
- Generación de recetas PDF con ReportLab
- Tests end-to-end completos
- Documentación de usuario

---

## 5. BACKEND: FASTAPI

*(Contenido ya incluido en Semana 2)*

---

## 6. FRONTEND: NEXT.JS

*(Contenido ya incluido en Semana 3)*

---

## 7. SKILLS DE HERMES

### Skill: `setubalai-clinica-turnos`

```yaml
---
name: setubalai-clinica-turnos
description: |
  Gestión de turnos médicos para clínicas.
  El agente puede reservar, cancelar, y consultar turnos via WhatsApp.
  
triggers:
  - "quiero un turno"
  - "reservar consulta"
  - "cancelar mi turno"
  
tools_required:
  - terminal
---

# Clínica: Gestión de Turnos via Hermes

## Comandos Disponibles

### 1. Buscar paciente por teléfono
```bash
curl "http://localhost:3010/api/clientes/buscar?telefono=5491155555555" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Listar médicos disponibles
```bash
curl "http://localhost:3010/api/clinica/medicos/?activo=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Consultar agenda de un médico
```bash
curl "http://localhost:3010/api/clinica/medicos/1/agenda?fecha=2026-06-01" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Reservar turno
```bash
curl -X POST http://localhost:3010/api/clinica/consultas/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paciente_id": 1,
    "medico_id": 2,
    "fecha_hora": "2026-06-01T10:00:00",
    "motivo_consulta": "Control de rutina"
  }'
```

---

## Casos de Uso

### Caso 1: Paciente Solicita Turno

```
Paciente (WhatsApp): "Hola, quiero un turno con la Dra. García"

Hermes:
1. Identifica paciente por teléfono de WhatsApp
2. Busca médico "García" en base de datos
3. Consulta agenda disponible próximos 7 días
4. Responde:
   "Hola Juan, la Dra. García tiene disponible:
   - Lunes 3/06 a las 10:00
   - Miércoles 5/06 a las 16:00
   ¿Cuál preferís?"

Paciente: "Lunes 10hs"

Hermes:
1. Crea consulta en BD
2. Marca slot como ocupado
3. Programa recordatorio 24hs antes
4. Responde:
   "✅ Turno confirmado:
   Dra. María García (Cardiología)
   Lunes 3 de junio - 10:00hs
   Clínica SetubalAI, Av. Corrientes 1234
   
   Te enviamos recordatorio 1 día antes."
```

### Caso 2: Recordatorio Automático

```
Hermes (24hs antes, vía WhatsApp):
"Hola Juan, recordamos tu turno:

📅 Mañana 3/06 a las 10:00hs
👨‍⚕️ Dra. María García
📍 Clínica SetubalAI, Av. Corrientes 1234

Si necesitás cancelar, respondé CANCELAR."
```

---

## Pitfalls

### Problema: Doble Reserva (Race Condition)

**Escenario:**  
Dos pacientes solicitan el mismo slot simultáneamente.

**Solución:**  
Lock de BD al crear consulta:
```python
with db.transaction():
    slot = db.query(Slot).filter(
        Slot.medico_id == medico_id,
        Slot.fecha == fecha,
        Slot.hora_inicio == hora,
        Slot.disponible == True
    ).with_for_update().first()
    
    if not slot:
        raise HTTPException(409, "Turno ya reservado")
    
    consulta = Consulta(...)
    slot.disponible = False
    db.add(consulta)
    db.commit()
```

### Problema: Paciente No Se Identifica Correctamente

**Escenario:**  
"Hola, quiero turno" (sin decir su nombre).

**Solución:**  
1. Buscar por teléfono de WhatsApp
2. Si no existe en BD: "No te tenemos registrado. ¿Cómo te llamás?"
3. Crear paciente nuevo y seguir con reserva

---

## 8. STORAGE DE ARCHIVOS MÉDICOS

### 8.1 Estrategia de Storage

**MVP (Semana 4):** Filesystem local  
**Producción (Fase 2):** AWS S3 o compatible

**Ventajas filesystem:**
- ✅ Cero costo
- ✅ Setup instantáneo
- ✅ Fácil de debuggear
- ✅ Migración a S3 después es simple

**Desventajas:**
- ❌ No escalable >10GB
- ❌ Backups manuales
- ❌ Sin CDN

### 8.2 Estructura de Directorios

```
/home/admin/setubalai-storage/
├── empresa-1/
│   ├── estudios/
│   │   ├── paciente-123/
│   │   │   ├── 2026-05-26_rx-torax.pdf
│   │   │   ├── 2026-04-15_laboratorio.pdf
│   │   │   └── 2026-03-10_ecografia.jpg
│   │   └── paciente-456/
│   │       └── ...
│   ├── recetas/
│   │   ├── receta-1.pdf
│   │   ├── receta-2.pdf
│   │   └── ...
│   └── temp/  # Archivos temporales (se limpian después de 24hs)
│
└── empresa-2/
    └── ...
```

### 8.3 Endpoint de Upload

```python
from fastapi import UploadFile, File
import shutil
import os
from datetime import datetime

STORAGE_BASE_PATH = "/home/admin/setubalai-storage"

@router.post("/estudios/upload")
async def upload_estudio(
    paciente_id: int,
    tipo_estudio: str,
    descripcion: str,
    fecha_estudio: date,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Subir archivo de estudio médico"""
    
    # Validar tipo de archivo
    allowed_types = ["application/pdf", "image/jpeg", "image/png"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Tipo de archivo no permitido")
    
    # Validar tamaño (max 50MB)
    file_size = 0
    chunk_size = 1024 * 1024  # 1MB
    temp_path = f"/tmp/{file.filename}"
    
    with open(temp_path, "wb") as buffer:
        while chunk := await file.read(chunk_size):
            file_size += len(chunk)
            if file_size > 50 * 1024 * 1024:  # 50MB
                os.remove(temp_path)
                raise HTTPException(400, "Archivo muy grande (max 50MB)")
            buffer.write(chunk)
    
    # Generar nombre único
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = os.path.splitext(file.filename)[1]
    filename = f"{timestamp}_{tipo_estudio.replace(' ', '_')}{ext}"
    
    # Crear directorio si no existe
    storage_dir = f"{STORAGE_BASE_PATH}/empresa-{empresa.id}/estudios/paciente-{paciente_id}"
    os.makedirs(storage_dir, exist_ok=True)
    
    # Mover archivo
    final_path = f"{storage_dir}/{filename}"
    shutil.move(temp_path, final_path)
    
    # Crear registro en BD
    estudio = EstudioAdjunto(
        empresa_id=empresa.id,
        paciente_id=paciente_id,
        tipo_estudio=tipo_estudio,
        descripcion=descripcion,
        fecha_estudio=fecha_estudio,
        archivo_nombre=filename,
        archivo_url=final_path,
        archivo_tipo=file.content_type,
        archivo_tamano_bytes=file_size,
        subido_por_usuario_id=current_user.id
    )
    db.add(estudio)
    db.commit()
    db.refresh(estudio)
    
    return estudio

@router.get("/estudios/{estudio_id}/download")
async def download_estudio(
    estudio_id: int,
    db: Session = Depends(get_db),
    empresa = Depends(get_current_empresa)
):
    """Descargar archivo de estudio"""
    estudio = db.query(EstudioAdjunto).filter(
        EstudioAdjunto.id == estudio_id,
        EstudioAdjunto.empresa_id == empresa.id
    ).first()
    
    if not estudio:
        raise HTTPException(404, "Estudio no encontrado")
    
    if not os.path.exists(estudio.archivo_url):
        raise HTTPException(404, "Archivo no encontrado en storage")
    
    return FileResponse(
        estudio.archivo_url,
        media_type=estudio.archivo_tipo,
        filename=estudio.archivo_nombre
    )
```

### 8.4 ✅ CHECKPOINT: Validación de Storage

```bash
# 1. Crear directorio de storage
mkdir -p /home/admin/setubalai-storage/empresa-1/estudios/paciente-1
mkdir -p /home/admin/setubalai-storage/empresa-1/recetas
mkdir -p /home/admin/setubalai-storage/empresa-1/temp

# 2. Verificar permisos
ls -la /home/admin/setubalai-storage/
# Debe ser: drwxrwxr-x admin admin

# 3. Test de upload
TOKEN=$(curl -X POST http://localhost:3010/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "test123"}' \
  | jq -r '.access_token')

curl -X POST http://localhost:3010/api/clinica/estudios/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "paciente_id=1" \
  -F "tipo_estudio=Radiografía" \
  -F "descripcion=RX de tórax" \
  -F "fecha_estudio=2026-05-26" \
  -F "file=@/path/to/test.pdf"

# Debe retornar HTTP 200 + JSON con id del estudio

# 4. Verificar que archivo se guardó
ls -lh /home/admin/setubalai-storage/empresa-1/estudios/paciente-1/
# Debe mostrar el archivo subido

# 5. Test de download
curl http://localhost:3010/api/clinica/estudios/1/download \
  -H "Authorization: Bearer $TOKEN" \
  --output descargado.pdf

# 6. Verificar integridad
md5sum /path/to/test.pdf
md5sum descargado.pdf
# Los hashes deben coincidir
```

**Criterios de aceptación:**
- ✅ Upload funciona correctamente
- ✅ Archivo se guarda en directorio correcto
- ✅ Download devuelve archivo intacto
- ✅ Validaciones de tipo y tamaño funcionan
- ✅ Registro en BD coincide con filesystem

---

## 9. TESTING Y QA

### 9.1 Matriz de Tests

| Tipo de Test | Herramienta | Cobertura Objetivo | Frecuencia |
|--------------|-------------|-------------------|------------|
| **Unitarios** | pytest | >90% | En cada commit |
| **Integración API** | pytest + TestClient | 100% endpoints | Antes de cada PR |
| **E2E Frontend** | Playwright | Flujos críticos | Antes de deploy |
| **Performance** | Locust | <500ms (p95) | Semanal |
| **Seguridad** | Bandit + Safety | Sin críticos | Antes de deploy |
| **Accesibilidad** | Lighthouse | >90 score | Antes de deploy |

### 9.2 Tests Obligatorios (NO se puede mergear sin estos)

**Backend:**
```bash
# 1. Tests unitarios de modelos
pytest tests/test_models_clinica.py -v --cov=models/clinica --cov-report=html
# Coverage debe ser >90%

# 2. Tests de API
pytest tests/test_api_medicos.py -v
pytest tests/test_api_consultas.py -v
pytest tests/test_api_historia_clinica.py -v
# Todos deben pasar

# 3. Tests de integridad de datos
pytest tests/test_data_integrity.py -v
# Verifica que FK, constraints y triggers funcionan

# 4. Tests de permisos
pytest tests/test_auth_permissions.py -v
# Verifica que multi-tenant isolation funciona
```

**Frontend:**
```bash
# 1. Build sin errores
npm run build
# Exit code debe ser 0

# 2. Lint
npm run lint
# Sin errores ni warnings

# 3. Tests de componentes
npm run test
# Todos deben pasar

# 4. E2E flujos críticos
npx playwright test tests/clinica/flujo-turno.spec.ts
# Flujo: Login → Buscar médico → Reservar turno → Confirmar
```

### 9.3 ✅ CHECKPOINT FINAL: Pre-Deploy

**Checklist obligatorio antes de poner en producción:**

```bash
# ============================================================
# BACKEND
# ============================================================

# 1. Todas las migraciones ejecutadas
docker exec paperclip-db psql -U postgres -d business -c "SELECT version FROM alembic_version;"
# Debe mostrar última versión

# 2. Tests pasan 100%
cd /home/admin/setubalai/src/backend
pytest tests/ -v --cov=. --cov-report=term-missing
# Coverage >85%, 0 fallos

# 3. Server arranca sin errores
systemctl --user status setubalai-api.service
# Estado: active (running)

# 4. Healthcheck OK
curl http://localhost:3010/health
# {"status": "ok", "database": "connected"}

# 5. Endpoints responden
curl http://localhost:3010/api/clinica/medicos/ -H "Authorization: Bearer $TOKEN"
# HTTP 200

# ============================================================
# FRONTEND
# ============================================================

# 6. Build exitoso
cd /home/admin/setubalai/frontend
npm run build
# Exit code 0

# 7. Sin errores de TypeScript
npm run type-check
# No errors

# 8. Lighthouse audit
npx lighthouse http://localhost:3011/dashboard/clinica/medicos --output=json
# Performance >80, Accessibility >90, Best Practices >90

# 9. Tests E2E pasan
npx playwright test
# 0 fallos

# ============================================================
# BASE DE DATOS
# ============================================================

# 10. Backup reciente existe
ls -lh /home/admin/backups/postgres/
# Debe haber backup de hoy

# 11. Integridad referencial OK
docker exec paperclip-db psql -U postgres -d business -c "
  SELECT COUNT(*) FROM setubalai.consultas c
  LEFT JOIN setubalai.medicos m ON c.medico_id = m.id
  WHERE m.id IS NULL;
"
# Debe retornar 0 (no hay consultas con médicos inexistentes)

# 12. Sin duplicados
docker exec paperclip-db psql -U postgres -d business -c "
  SELECT paciente_id, COUNT(*) FROM setubalai.historia_clinica
  GROUP BY paciente_id HAVING COUNT(*) > 1;
"
# Debe retornar 0 filas

# ============================================================
# STORAGE
# ============================================================

# 13. Directorio de storage existe y tiene permisos correctos
ls -la /home/admin/setubalai-storage/
# drwxrwxr-x admin admin

# 14. Archivos subidos coinciden con BD
docker exec paperclip-db psql -U postgres -d business -c "
  SELECT COUNT(*) FROM setubalai.estudios_adjuntos;
"
# Coincidir con:
find /home/admin/setubalai-storage/ -type f | wc -l

# ============================================================
# SEGURIDAD
# ============================================================

# 15. Sin secretos en código
cd /home/admin/setubalai
git secrets --scan
# No secrets found

# 16. Dependencias actualizadas (sin vulnerabilidades críticas)
cd /home/admin/setubalai/src/backend
safety check
# 0 vulnerabilidades críticas

cd /home/admin/setubalai/frontend
npm audit
# 0 vulnerabilidades críticas

# ============================================================
# DOCUMENTACIÓN
# ============================================================

# 17. README.md actualizado
cat /home/admin/setubalai/README.md
# Debe tener instrucciones de instalación actualizadas

# 18. API docs generadas
curl http://localhost:3010/docs
# Swagger UI debe cargar

# 19. Changelog actualizado
cat /home/admin/setubalai/CHANGELOG.md
# Debe tener entrada para esta versión
```

**Si TODOS los checks pasan → Aprobado para deploy ✅**  
**Si alguno falla → Corregir antes de deploy ❌**

---

## 10. ANEXO: DIAGNÓSTICO Y LOGÍSTICA (REFERENCIA)

### 10.1 Diagnóstico por Imágenes (Referencia Futura)

**Complejidad adicional vs. Clínica:**
- Integración con PACS (DICOM)
- Múltiples modalidades (RX, TC, RM, ECO, MAMOGRAFÍA)
- Informes médicos especializados
- Salas/equipos con disponibilidad independiente

**Tablas adicionales necesarias:**
```sql
CREATE TABLE setubalai.modalidades_diagnostico (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    codigo VARCHAR(20),  -- 'RX', 'TC', 'RM'
    nombre VARCHAR(100),
    precio_base DECIMAL(10,2),
    duracion_minutos INT
);

CREATE TABLE setubalai.salas_equipos (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100),
    modalidad_id INT REFERENCES setubalai.modalidades_diagnostico(id),
    activa BOOLEAN
);

CREATE TABLE setubalai.estudios_diagnostico (
    id SERIAL PRIMARY KEY,
    consulta_id INT REFERENCES setubalai.consultas(id),
    modalidad_id INT REFERENCES setubalai.modalidades_diagnostico(id),
    study_uid VARCHAR(100),  -- UID del PACS
    pacs_viewer_url TEXT,
    informe_texto TEXT,
    radiologo_id INT REFERENCES setubalai.medicos(id)
);
```

**Endpoints adicionales:**
```
POST   /api/diagnostico/modalidades/
GET    /api/diagnostico/modalidades/
POST   /api/diagnostico/salas/
GET    /api/diagnostico/salas/{id}/agenda
POST   /api/diagnostico/estudios/
GET    /api/diagnostico/estudios/{id}/pacs
PUT    /api/diagnostico/estudios/{id}/informe
```

**NO implementar en MVP. Documentar para Fase 2.**

---

### 10.2 Logística de Seguros (Referencia Futura)

**Complejidad adicional vs. Clínica:**
- Geolocalización en tiempo real (GPS)
- Asignación automática por proximidad
- Facturación por aseguradora (B2B)
- Tracking público sin login

**Tablas adicionales necesarias:**
```sql
CREATE TABLE setubalai.aseguradoras (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(200),
    cuit VARCHAR(13),
    tarifas JSONB  -- {"grua_liviana": 15000, "auxilio": 8000}
);

CREATE TABLE setubalai.polizas (
    id SERIAL PRIMARY KEY,
    aseguradora_id INT REFERENCES setubalai.aseguradoras(id),
    cliente_id INT REFERENCES setubalai.clientes(id),
    numero_poliza VARCHAR(100),
    vehiculo_patente VARCHAR(20),
    estado VARCHAR(50)  -- 'activa', 'vencida'
);

CREATE TABLE setubalai.unidades (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    patente VARCHAR(20),
    tipo VARCHAR(50),  -- 'grua_liviana', 'grua_pesada', 'auxilio'
    estado VARCHAR(50),  -- 'disponible', 'en_servicio', 'taller'
    ubicacion_lat DECIMAL(10,8),
    ubicacion_lng DECIMAL(11,8),
    ultima_actualizacion TIMESTAMP
);

CREATE TABLE setubalai.asistencias (
    id SERIAL PRIMARY KEY,
    consulta_id INT REFERENCES setubalai.consultas(id),
    poliza_id INT REFERENCES setubalai.polizas(id),
    unidad_id INT REFERENCES setubalai.unidades(id),
    tipo_servicio VARCHAR(100),
    ubicacion_origen JSONB,
    ubicacion_destino JSONB,
    precio_servicio DECIMAL(10,2),
    calificacion INT
);
```

**Endpoints adicionales:**
```
POST   /api/logistica/aseguradoras/
POST   /api/logistica/polizas/
GET    /api/logistica/polizas/buscar?patente=ABC123
POST   /api/logistica/unidades/
GET    /api/logistica/unidades/mapa
POST   /api/logistica/asistencias/
PUT    /api/logistica/asistencias/{id}/asignar
GET    /api/logistica/asistencias/{id}/tracking  (público)
```

**NO implementar en MVP. Documentar para Fase 2.**

---

## 11. RESUMEN Y PRÓXIMOS PASOS

### ✅ Lo que logramos con este documento:

1. **Arquitectura de BD clara** (7 tablas nuevas + reutilizar 3 existentes)
2. **Roadmap de 6 semanas** con checkpoints de validación obligatorios
3. **Modelos y schemas completos** (SQLAlchemy + Pydantic)
4. **Endpoints documentados** (CRUD completo)
5. **Frontend con componentes** (Next.js + TailwindCSS)
6. **Storage de archivos** (filesystem → S3 después)
7. **Skills de Hermes** (turnos via WhatsApp)
8. **Suite de tests completa** (unitarios, integración, E2E)
9. **Checklist pre-deploy** (25 verificaciones obligatorias)
10. **Referencia de otros verticales** (para DESPUÉS)

### 🚀 Próximos Pasos Inmediatos:

**PASO 1: Validar este documento**
- [ ] Pablo revisa y aprueba arquitectura de BD
- [ ] Pablo valida alcance del MVP (¿algo falta? ¿algo sobra?)
- [ ] Confirmar duración de 6 semanas es realista

**PASO 2: Setup inicial (Semana 1)**
- [ ] Ejecutar migración de BD
- [ ] Crear modelos SQLAlchemy
- [ ] Tests unitarios de modelos
- [ ] ✅ CHECKPOINT 1 aprobado

**PASO 3: Backend (Semana 2)**
- [ ] Crear routers de médicos/historia/consultas
- [ ] Tests de integración de API
- [ ] ✅ CHECKPOINT 2 aprobado

**PASO 4: Frontend (Semana 3)**
- [ ] Layout + sidebar
- [ ] Páginas de médicos/pacientes/agenda
- [ ] ✅ CHECKPOINT 3 aprobado

**PASO 5: Storage + WhatsApp (Semanas 4-5)**
- [ ] Upload de archivos médicos
- [ ] Integración WhatsApp Business API
- [ ] Skill Hermes para turnos
- [ ] ✅ CHECKPOINTS 4-5 aprobados

**PASO 6: Recetas PDF + Testing Final (Semana 6)**
- [ ] Generación de recetas PDF
- [ ] Suite completa de tests
- [ ] ✅ CHECKPOINT FINAL aprobado
- [ ] Deploy a producción

---

**Última actualización:** 2026-05-26  
**Versión:** 1.0  
**Mantenido por:** SetubalAI Development Team

**ESTE DOCUMENTO ES LA FUENTE DE VERDAD PARA EL MVP CLÍNICA MÉDICA.**

**NO se implementa NADA que no esté en este documento.**  
**TODA modificación debe actualizarse AQUÍ primero.**
```
