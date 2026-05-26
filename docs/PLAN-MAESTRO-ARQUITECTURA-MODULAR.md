# PLAN MAESTRO: Arquitectura Modular Multi-Vertical para SetubalAI Business Agent

⚠️ **ESTADO: DISEÑO Y PLANIFICACIÓN - NADA IMPLEMENTADO** ⚠️

Este documento define la **arquitectura flexible y modular** que permitirá al agente SetubalAI adaptarse a diferentes tipos de servicios complejos. Consolida los aprendizajes de 3 verticales relevados:
1. Clínica Médica
2. Diagnóstico por Imágenes  
3. Logística de Seguros

**TODO LO AQUÍ DESCRITO ES PROPUESTA DE DISEÑO PENDIENTE DE IMPLEMENTACIÓN.**

---

**Fecha:** 2026-05-26  
**Versión:** 1.0 - Draft Inicial  
**Mantenido por:** SetubalAI Business Agent Development

---

## TABLA DE CONTENIDOS

1. [Visión General](#1-visión-general)
2. [Verticales Relevados](#2-verticales-relevados)
3. [Patrones Comunes Identificados](#3-patrones-comunes-identificados)
4. [Arquitectura de Base de Datos](#4-arquitectura-de-base-de-datos)
5. [Arquitectura de Backend (FastAPI)](#5-arquitectura-de-backend-fastapi)
6. [Arquitectura de Frontend](#6-arquitectura-de-frontend)
7. [Sistema de Activación de Verticales](#7-sistema-de-activación-de-verticales)
8. [Skills de Hermes por Vertical](#8-skills-de-hermes-por-vertical)
9. [Integraciones Externas](#9-integraciones-externas)
10. [Roadmap de Implementación](#10-roadmap-de-implementación)
11. [Métricas de Éxito](#11-métricas-de-éxito)

---

## 1. VISIÓN GENERAL

### 1.1 Objetivo del Plan Maestro

Diseñar una **arquitectura única, flexible y modular** que permita a SetubalAI:

✅ **Soportar múltiples verticales de servicios complejos** sin reescribir el core  
✅ **Activar/desactivar verticales por empresa cliente**  
✅ **Agregar nuevos verticales** sin romper los existentes  
✅ **Compartir código común** (autenticación, WhatsApp, facturación, etc.)  
✅ **Configurar cada vertical independientemente** (campos personalizados, workflows, integraciones)

---

### 1.2 Principios de Diseño

1. **DRY (Don't Repeat Yourself)**  
   - Un solo sistema de autenticación  
   - Una sola API de mensajería (WhatsApp, Telegram)  
   - Una sola lógica de facturación  
   - Reutilizar componentes entre verticales

2. **Modularidad**  
   - Cada vertical es un "módulo" independiente  
   - Se puede instalar/desinstalar sin afectar otros  
   - Schemas de BD aislados pero interconectados

3. **Configurabilidad**  
   - Cada empresa puede tener 1 o N verticales activos  
   - Campos personalizados por empresa/vertical  
   - Workflows configurables via YAML

4. **Escalabilidad**  
   - Base de datos PostgreSQL con particionamiento  
   - API REST con paginación y filtros  
   - Caché Redis para consultas frecuentes

5. **Hermes-First**  
   - Todo operable via WhatsApp (sin frontend obligatorio)  
   - Skills específicos por vertical  
   - Lenguaje natural adaptado al dominio

---

## 2. VERTICALES RELEVADOS

### 2.1 Clínica Médica

**Documentación:** (pendiente ubicación)  
**Cliente:** Clínica/consultorio médico  
**Agente hace:**
- Gestión de turnos (agenda de médicos)
- Historia clínica de pacientes
- Emisión de recetas
- Recordatorios de turnos

**Actores:**
- Paciente (solicita turno, consulta historial)
- Médico (consulta, prescribe, actualiza historia clínica)
- Secretaria/Admin (gestiona agenda, facturación)

**Complejidad:**
- Múltiples especialidades/médicos
- Historias clínicas longitudinales
- Integración con obras sociales/prepagas

---

### 2.2 Diagnóstico por Imágenes

**Documentación:** `/home/admin/setubalai-agente/docs/ANALISIS-CLINICA-DIAGNOSTICO-IMAGENES.md`  
**Cliente:** Centro de diagnóstico por imágenes (DXI, radiología)  
**Agente hace:**
- Gestión de turnos para estudios
- Integración con sistema PACS (visor de imágenes médicas)
- Gestión de informes médicos
- Facturación a obras sociales

**Actores:**
- Paciente (solicita turno, consulta resultados)
- Técnico (realiza estudio, sube imágenes a PACS)
- Médico Radiólogo (interpreta imágenes, emite informe)
- Administrativo (facturación, autorizaciones)

**Complejidad:**
- Study UIDs (identificadores DICOM)
- Múltiples modalidades (RX, TC, RM, ECO, MAMOGRAFÍA)
- Integración PACS (Weasis, Orthanc)
- Autorizaciones de obras sociales

---

### 2.3 Logística de Seguros

**Documentación:** `/home/admin/setubalai-agente/docs/ANALISIS-LOGISTICA-SEGUROS.md`  
**Cliente:** Empresa de logística vehicular (Assist North, grueros)  
**Agente hace:**
- Atención de asegurados via WhatsApp
- Verificación de pólizas
- Despacho automático de unidades (grúas, auxilio)
- Tracking en tiempo real
- Facturación a aseguradoras

**Actores:**
- Asegurado (solicita asistencia)
- Chofer/Operario (recibe asignación, actualiza estado)
- Empresa de Logística (admin, gestiona flota)
- Aseguradora (recibe factura mensual)

**Complejidad:**
- Múltiples aseguradoras (contratos B2B)
- Geolocalización en tiempo real
- Asignación automática por proximidad
- Facturación consolidada por aseguradora

---

## 3. PATRONES COMUNES IDENTIFICADOS

### 3.1 Entidades Core Compartidas

**TODAS las verticales comparten:**

| Entidad | Descripción | Campos Comunes |
|---------|-------------|----------------|
| **empresas** | Cliente que usa SetubalAI | id, nombre, CUIT, email, plan |
| **usuarios** | Personas con acceso al sistema | id, nombre, email, rol, empresa_id |
| **clientes** | Usuarios finales del servicio | id, nombre, DNI, teléfono, email |
| **servicios** | Evento/transacción principal | id, cliente_id, tipo, estado, fecha |
| **facturacion** | Cobros y pagos | id, empresa_id, periodo, monto, estado |

---

### 3.2 Flujos Comunes

#### A) Solicitud de Servicio
```
1. Cliente contacta via WhatsApp
2. Hermes identifica cliente (teléfono/DNI)
3. Hermes verifica elegibilidad/cobertura
4. Hermes crea registro de servicio
5. Hermes asigna recurso (médico/técnico/unidad)
6. Notificación a recurso asignado
7. Seguimiento de estado (pendiente → en curso → completado)
8. Registro para facturación
```

#### B) Gestión de Turnos/Agenda
- Disponibilidad de slots
- Reserva/cancelación
- Recordatorios automáticos
- Reprogramación

#### C) Facturación
- Registro de servicios realizados
- Consolidación mensual
- Generación de PDF
- Envío por email

---

### 3.3 Diferencias Clave por Vertical

| Aspecto | Clínica Médica | Diagnóstico Imágenes | Logística Seguros |
|---------|----------------|----------------------|-------------------|
| **Recurso principal** | Médico | Técnico + Radiólogo | Chofer + Vehículo |
| **Agenda** | Por médico/especialidad | Por sala/equipo | Por unidad (grúa, auxilio) |
| **Resultado** | Receta, orden estudios | Informe médico + imágenes PACS | Estado del servicio (completado/no) |
| **Integración crítica** | Obras sociales | PACS (DICOM) | Google Maps (tracking) |
| **Facturación** | Por consulta/práctica | Por estudio (DICOM) | Por servicio a aseguradora |
| **Datos sensibles** | Historia clínica completa | Imágenes médicas (DICOM) | Ubicación GPS en tiempo real |

---

## 4. ARQUITECTURA DE BASE DE DATOS

### 4.1 Filosofía: Schemas Separados con Core Compartido

```sql
-- Schema CORE (compartido por todos los verticales)
CREATE SCHEMA core;

-- Schemas ESPECÍFICOS por vertical
CREATE SCHEMA clinica;
CREATE SCHEMA diagnostico_imagenes;
CREATE SCHEMA logistica_seguros;
```

---

### 4.2 Tablas del Schema CORE

```sql
-- ============================================================
-- SCHEMA: core (compartido por todos los verticales)
-- ============================================================

-- Empresas (clientes de SetubalAI)
CREATE TABLE core.empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    cuit VARCHAR(13) UNIQUE,
    
    -- Contacto
    email VARCHAR(200),
    telefono VARCHAR(50),
    direccion TEXT,
    
    -- Plan y Configuración
    plan VARCHAR(50) DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
    verticales_activos VARCHAR(50)[], -- ['clinica', 'diagnostico', 'logistica']
    
    -- Estado
    activa BOOLEAN DEFAULT true,
    fecha_alta DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuarios (personas con acceso al sistema)
CREATE TABLE core.usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Identidad
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200),
    email VARCHAR(200) UNIQUE,
    telefono VARCHAR(50),
    dni VARCHAR(20),
    
    -- Autenticación
    password_hash VARCHAR(255),
    email_verificado BOOLEAN DEFAULT false,
    telefono_verificado BOOLEAN DEFAULT false,
    
    -- Rol y Permisos
    rol VARCHAR(50) NOT NULL, -- 'admin', 'operador', 'medico', 'tecnico', 'chofer', etc.
    permisos JSONB DEFAULT '{}', -- Permisos específicos por rol
    verticales_acceso VARCHAR(50)[], -- A qué verticales tiene acceso
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    ultimo_acceso TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes/Pacientes/Asegurados (usuarios finales del servicio)
CREATE TABLE core.clientes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Identidad
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200),
    dni VARCHAR(20),
    fecha_nacimiento DATE,
    
    -- Contacto
    email VARCHAR(200),
    telefono VARCHAR(50) NOT NULL, -- Principal para WhatsApp
    telefono_alternativo VARCHAR(50),
    direccion TEXT,
    
    -- Ubicación
    provincia VARCHAR(100),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    
    -- Metadata por vertical (JSONB flexible)
    metadata JSONB DEFAULT '{}',
    -- Ejemplos:
    -- Clínica: {"obra_social": "OSDE", "numero_afiliado": "12345"}
    -- Logística: {"aseguradora": "La Caja", "poliza": "ABC123", "vehiculo_patente": "AA123BB"}
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicios (tabla genérica para todos los verticales)
CREATE TABLE core.servicios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    cliente_id INTEGER NOT NULL REFERENCES core.clientes(id),
    
    -- Tipo de Servicio (depende del vertical)
    vertical VARCHAR(50) NOT NULL, -- 'clinica', 'diagnostico', 'logistica'
    tipo_servicio VARCHAR(100) NOT NULL, -- 'consulta', 'estudio_rx', 'grua', etc.
    
    -- Estado General
    estado VARCHAR(50) DEFAULT 'pendiente', 
    -- Estados posibles: 'pendiente', 'confirmado', 'en_curso', 'completado', 'cancelado'
    
    -- Fecha y Hora
    fecha_solicitado TIMESTAMPTZ DEFAULT NOW(),
    fecha_programado TIMESTAMPTZ,
    fecha_iniciado TIMESTAMPTZ,
    fecha_completado TIMESTAMPTZ,
    
    -- Asignación de Recurso
    usuario_asignado_id INTEGER REFERENCES core.usuarios(id),
    
    -- Metadata Específica del Vertical (JSONB flexible)
    metadata JSONB DEFAULT '{}',
    -- Ejemplos:
    -- Clínica: {"especialidad": "cardiologia", "motivo_consulta": "dolor pecho"}
    -- Diagnóstico: {"modalidad": "RX", "study_uid": "1.2.840..."}
    -- Logística: {"ubicacion_lat": -34.603, "ubicacion_lng": -58.381, "vehiculo_id": 5}
    
    -- Observaciones
    notas TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facturación (consolidado mensual por empresa)
CREATE TABLE core.facturacion (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Periodo
    periodo_mes INTEGER NOT NULL, -- 1-12
    periodo_anio INTEGER NOT NULL,
    
    -- Totales
    total_servicios INTEGER DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    descuentos DECIMAL(12,2) DEFAULT 0.00,
    impuestos DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) DEFAULT 0.00,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'emitida', 'pagada', 'vencida'
    fecha_emision DATE,
    fecha_vencimiento DATE,
    fecha_pago DATE,
    
    -- Archivos
    archivo_pdf_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de Verticales (qué verticales tiene activos cada empresa)
CREATE TABLE core.verticales_config (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    vertical VARCHAR(50) NOT NULL, -- 'clinica', 'diagnostico', 'logistica'
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    fecha_activacion DATE DEFAULT CURRENT_DATE,
    fecha_desactivacion DATE,
    
    -- Configuración Específica del Vertical (JSONB)
    config JSONB DEFAULT '{}',
    -- Ejemplos:
    -- Clínica: {"especialidades": ["cardiologia", "traumatologia"]}
    -- Diagnóstico: {"modalidades": ["RX", "TC", "RM"], "pacs_url": "https://..."}
    -- Logística: {"aseguradoras": [1,2,3], "cobertura_radio_km": 50}
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(empresa_id, vertical)
);

-- Índices para optimización
CREATE INDEX idx_servicios_empresa ON core.servicios(empresa_id);
CREATE INDEX idx_servicios_cliente ON core.servicios(cliente_id);
CREATE INDEX idx_servicios_estado ON core.servicios(estado);
CREATE INDEX idx_servicios_vertical ON core.servicios(vertical);
CREATE INDEX idx_servicios_fecha ON core.servicios(fecha_solicitado);
CREATE INDEX idx_clientes_telefono ON core.clientes(telefono);
CREATE INDEX idx_clientes_dni ON core.clientes(dni);
CREATE INDEX idx_usuarios_email ON core.usuarios(email);
```

---

### 4.3 Tablas Específicas por Vertical

#### A) Schema CLÍNICA

```sql
-- ============================================================
-- SCHEMA: clinica (consultorio/clínica médica)
-- ============================================================

-- Médicos (extiende core.usuarios con rol='medico')
CREATE TABLE clinica.medicos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES core.usuarios(id) UNIQUE,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Datos Profesionales
    matricula_provincial VARCHAR(50),
    matricula_nacional VARCHAR(50),
    especialidades VARCHAR(100)[], -- ['cardiologia', 'clinica_medica']
    
    -- Disponibilidad
    horario_atencion JSONB, -- {"lunes": ["09:00-13:00", "15:00-19:00"], ...}
    duracion_turno_min INTEGER DEFAULT 30,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historia Clínica (registro longitudinal por paciente)
CREATE TABLE clinica.historia_clinica (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES core.clientes(id),
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Información Médica
    grupo_sanguineo VARCHAR(10),
    alergias TEXT[],
    medicacion_habitual TEXT[],
    antecedentes_personales TEXT,
    antecedentes_familiares TEXT,
    
    -- Metadata
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultas (extiende core.servicios)
CREATE TABLE clinica.consultas (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES core.servicios(id) UNIQUE,
    medico_id INTEGER NOT NULL REFERENCES clinica.medicos(id),
    
    -- Datos de la Consulta
    motivo_consulta TEXT,
    sintomas TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    
    -- Signos Vitales
    presion_arterial VARCHAR(20),
    frecuencia_cardiaca INTEGER,
    temperatura DECIMAL(4,2),
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recetas
CREATE TABLE clinica.recetas (
    id SERIAL PRIMARY KEY,
    consulta_id INTEGER NOT NULL REFERENCES clinica.consultas(id),
    
    -- Medicamento
    medicamento VARCHAR(200) NOT NULL,
    dosis VARCHAR(100),
    frecuencia VARCHAR(100),
    duracion VARCHAR(100),
    indicaciones TEXT,
    
    -- Archivo
    pdf_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### B) Schema DIAGNÓSTICO POR IMÁGENES

```sql
-- ============================================================
-- SCHEMA: diagnostico_imagenes
-- ============================================================

-- Modalidades (tipos de estudios disponibles)
CREATE TABLE diagnostico_imagenes.modalidades (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    codigo VARCHAR(20) NOT NULL, -- 'RX', 'TC', 'RM', 'ECO', 'MAMOGRAFIA'
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    duracion_estimada_min INTEGER,
    
    activa BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Salas/Equipos
CREATE TABLE diagnostico_imagenes.salas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    nombre VARCHAR(100) NOT NULL,
    modalidad_id INTEGER NOT NULL REFERENCES diagnostico_imagenes.modalidades(id),
    
    -- Disponibilidad
    horario_disponible JSONB, -- {"lunes": ["08:00-20:00"], ...}
    activa BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estudios (extiende core.servicios)
CREATE TABLE diagnostico_imagenes.estudios (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES core.servicios(id) UNIQUE,
    modalidad_id INTEGER NOT NULL REFERENCES diagnostico_imagenes.modalidades(id),
    sala_id INTEGER REFERENCES diagnostico_imagenes.salas(id),
    
    -- Identificador DICOM
    study_uid VARCHAR(100) UNIQUE, -- UID del PACS
    accession_number VARCHAR(50),
    
    -- Técnico que realizó
    tecnico_id INTEGER REFERENCES core.usuarios(id),
    
    -- Médico que informa
    radiologo_id INTEGER REFERENCES core.usuarios(id),
    
    -- Indicación médica
    indicacion_medica TEXT,
    
    -- Informe
    informe_texto TEXT,
    informe_pdf_url TEXT,
    fecha_informe TIMESTAMPTZ,
    
    -- Links PACS
    pacs_viewer_url TEXT, -- Link al visor (Weasis, Orthanc)
    
    -- Obra Social / Cobertura
    obra_social VARCHAR(100),
    numero_autorizacion VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

#### C) Schema LOGÍSTICA DE SEGUROS

```sql
-- ============================================================
-- SCHEMA: logistica_seguros
-- ============================================================

-- Aseguradoras (contratos B2B)
CREATE TABLE logistica_seguros.aseguradoras (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    nombre_comercial VARCHAR(200) NOT NULL,
    cuit VARCHAR(13),
    email_contacto VARCHAR(200),
    telefono VARCHAR(50),
    
    -- Tarifas (por tipo de servicio)
    tarifas JSONB DEFAULT '{}',
    -- Ejemplo: {"grua_liviana": 15000, "auxilio_bateria": 8000}
    
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pólizas (asegurados con cobertura)
CREATE TABLE logistica_seguros.polizas (
    id SERIAL PRIMARY KEY,
    aseguradora_id INTEGER NOT NULL REFERENCES logistica_seguros.aseguradoras(id),
    cliente_id INTEGER NOT NULL REFERENCES core.clientes(id),
    
    numero_poliza VARCHAR(100) NOT NULL,
    
    -- Vehículo
    vehiculo_patente VARCHAR(20),
    vehiculo_marca VARCHAR(100),
    vehiculo_modelo VARCHAR(100),
    vehiculo_anio INTEGER,
    vehiculo_categoria VARCHAR(50), -- 'liviano', 'semipesado', 'pesado'
    
    -- Cobertura
    tiene_cobertura_grua BOOLEAN DEFAULT true,
    tiene_cobertura_auxilio BOOLEAN DEFAULT true,
    max_servicios_anio INTEGER, -- Límite de servicios por año
    servicios_usados_anio INTEGER DEFAULT 0,
    
    -- Vigencia
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'activa', -- 'activa', 'suspendida', 'vencida'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unidades (flota de vehículos de la empresa)
CREATE TABLE logistica_seguros.unidades (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES core.empresas(id),
    
    -- Identificación
    patente VARCHAR(20) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'grua_liviana', 'grua_pesada', 'auxilio_mecanico', 'gomeria_movil'
    marca VARCHAR(100),
    modelo VARCHAR(100),
    anio INTEGER,
    
    -- Chofer asignado
    chofer_id INTEGER REFERENCES core.usuarios(id),
    
    -- Capacidad
    capacidad_carga_kg INTEGER,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'disponible', -- 'disponible', 'en_servicio', 'taller', 'baja'
    ubicacion_actual_lat DECIMAL(10, 8),
    ubicacion_actual_lng DECIMAL(11, 8),
    ultima_actualizacion_gps TIMESTAMPTZ,
    
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asistencias (extiende core.servicios)
CREATE TABLE logistica_seguros.asistencias (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES core.servicios(id) UNIQUE,
    poliza_id INTEGER NOT NULL REFERENCES logistica_seguros.polizas(id),
    aseguradora_id INTEGER NOT NULL REFERENCES logistica_seguros.aseguradoras(id),
    unidad_id INTEGER REFERENCES logistica_seguros.unidades(id),
    
    -- Tipo de Asistencia
    tipo VARCHAR(50) NOT NULL, -- 'grua', 'auxilio_bateria', 'cambio_neumatico', 'combustible'
    descripcion_problema TEXT,
    
    -- Ubicación Origen
    ubicacion_lat DECIMAL(10, 8) NOT NULL,
    ubicacion_lng DECIMAL(11, 8) NOT NULL,
    ubicacion_calle VARCHAR(200),
    ubicacion_altura VARCHAR(20),
    ubicacion_localidad VARCHAR(100),
    ubicacion_referencia TEXT,
    
    -- Destino (opcional, para grúas)
    destino_calle VARCHAR(200),
    destino_altura VARCHAR(20),
    destino_localidad VARCHAR(100),
    distancia_km INTEGER,
    
    -- Tiempos
    tiempo_estimado_arribo_min INTEGER,
    fecha_arribo_real TIMESTAMPTZ,
    
    -- Precio
    precio_servicio DECIMAL(10,2),
    
    -- Calificación
    calificacion_asegurado INTEGER, -- 1-5
    comentario_asegurado TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seguimiento en Tiempo Real (log de estados)
CREATE TABLE logistica_seguros.seguimiento (
    id SERIAL PRIMARY KEY,
    asistencia_id INTEGER NOT NULL REFERENCES logistica_seguros.asistencias(id),
    
    estado VARCHAR(50) NOT NULL, -- 'pendiente', 'asignado', 'en_camino', 'en_lugar', 'completado'
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    comentario TEXT,
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_polizas_numero ON logistica_seguros.polizas(numero_poliza);
CREATE INDEX idx_polizas_cliente ON logistica_seguros.polizas(cliente_id);
CREATE INDEX idx_unidades_estado ON logistica_seguros.unidades(estado);
CREATE INDEX idx_asistencias_servicio ON logistica_seguros.asistencias(servicio_id);
```

---

### 4.4 Estrategia de Migración

**Fase 1: Core Schema**
1. Crear schema `core` con tablas base
2. Migrar empresas existentes a `core.empresas`
3. Migrar usuarios a `core.usuarios`

**Fase 2: Vertical por Vertical**
1. Crear schema específico (ej: `clinica`)
2. Crear tablas del vertical
3. Configurar `core.verticales_config` para empresas piloto
4. Pruebas de integración

**Fase 3: Consolidación**
1. Migrar datos históricos
2. Validar integridad referencial
3. Optimización de índices
4. Backups y plan de rollback

---

## 5. ARQUITECTURA DE BACKEND (FastAPI)

### 5.1 Estructura de Directorios

```
backend/
├── main.py                    # Entry point
├── core/                      # Código compartido
│   ├── auth.py               # Autenticación JWT
│   ├── database.py           # Conexión PostgreSQL
│   ├── models.py             # SQLAlchemy models (core schema)
│   ├── schemas.py            # Pydantic schemas
│   ├── dependencies.py       # Dependencias comunes
│   └── config.py             # Configuración (env vars)
│
├── routers/                   # Endpoints por vertical
│   ├── core_router.py        # Endpoints compartidos (auth, empresas, usuarios)
│   ├── clinica_router.py
│   ├── diagnostico_router.py
│   └── logistica_router.py
│
├── verticales/                # Lógica de negocio por vertical
│   ├── clinica/
│   │   ├── models.py         # SQLAlchemy (schema clinica)
│   │   ├── schemas.py        # Pydantic
│   │   ├── service.py        # Lógica de negocio
│   │   └── utils.py          # Utilidades específicas
│   │
│   ├── diagnostico/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── service.py
│   │   └── pacs_integration.py  # Integración con PACS
│   │
│   └── logistica/
│       ├── models.py
│       ├── schemas.py
│       ├── service.py
│       ├── tracking.py       # Geolocalización
│       └── facturacion.py    # Facturación por aseguradora
│
├── integrations/              # Integraciones externas
│   ├── whatsapp.py
│   ├── telegram.py
│   ├── google_maps.py
│   ├── mercadopago.py
│   └── pacs/
│       ├── weasis.py
│       └── orthanc.py
│
├── tasks/                     # Tareas asíncronas (Celery)
│   ├── notifications.py
│   ├── facturacion.py
│   └── reports.py
│
└── tests/
    ├── test_core.py
    ├── test_clinica.py
    ├── test_diagnostico.py
    └── test_logistica.py
```

---

### 5.2 Endpoints Comunes (Core Router)

```python
# routers/core_router.py

# ============================================================
# AUTENTICACIÓN
# ============================================================
POST   /api/auth/register          # Registro de empresa
POST   /api/auth/login             # Login (JWT)
POST   /api/auth/refresh           # Refresh token
POST   /api/auth/logout            # Logout

# ============================================================
# EMPRESAS
# ============================================================
GET    /api/empresas/              # Listar empresas (solo superadmin)
GET    /api/empresas/{id}          # Detalle de empresa
PUT    /api/empresas/{id}          # Actualizar empresa
GET    /api/empresas/{id}/verticales  # Verticales activos

# ============================================================
# USUARIOS
# ============================================================
POST   /api/usuarios/              # Crear usuario
GET    /api/usuarios/              # Listar usuarios de la empresa
GET    /api/usuarios/{id}          # Detalle de usuario
PUT    /api/usuarios/{id}          # Actualizar usuario
DELETE /api/usuarios/{id}          # Eliminar usuario

# ============================================================
# CLIENTES (genérico, todos los verticales)
# ============================================================
POST   /api/clientes/              # Crear cliente
GET    /api/clientes/              # Listar clientes
GET    /api/clientes/{id}          # Detalle de cliente
GET    /api/clientes/buscar        # Buscar por DNI/teléfono/email
PUT    /api/clientes/{id}          # Actualizar cliente
DELETE /api/clientes/{id}          # Eliminar cliente

# ============================================================
# SERVICIOS (genérico, cross-vertical)
# ============================================================
GET    /api/servicios/             # Listar servicios (filtros: vertical, estado, fecha)
GET    /api/servicios/{id}         # Detalle de servicio
PUT    /api/servicios/{id}/estado  # Actualizar estado

# ============================================================
# FACTURACIÓN
# ============================================================
GET    /api/facturacion/           # Facturas de la empresa
GET    /api/facturacion/{id}       # Detalle de factura
POST   /api/facturacion/generar    # Generar factura mensual
GET    /api/facturacion/{id}/pdf   # Descargar PDF

# ============================================================
# WEBHOOKS (para integraciones)
# ============================================================
POST   /api/webhooks/whatsapp      # Webhook de WhatsApp Business API
POST   /api/webhooks/telegram      # Webhook de Telegram
POST   /api/webhooks/hermes        # Webhook para Hermes Agent
```

---

### 5.3 Endpoints por Vertical (Ejemplos)

#### A) Clínica Router

```python
# routers/clinica_router.py

# ============================================================
# MÉDICOS
# ============================================================
POST   /api/clinica/medicos/                # Crear médico
GET    /api/clinica/medicos/                # Listar médicos
GET    /api/clinica/medicos/{id}            # Detalle médico
PUT    /api/clinica/medicos/{id}            # Actualizar médico
GET    /api/clinica/medicos/{id}/agenda     # Ver agenda del médico
PUT    /api/clinica/medicos/{id}/horarios   # Configurar horarios

# ============================================================
# HISTORIA CLÍNICA
# ============================================================
GET    /api/clinica/historia-clinica/{cliente_id}  # HC completa
PUT    /api/clinica/historia-clinica/{cliente_id}  # Actualizar HC

# ============================================================
# CONSULTAS (TURNOS)
# ============================================================
POST   /api/clinica/consultas/              # Crear turno/consulta
GET    /api/clinica/consultas/              # Listar consultas
GET    /api/clinica/consultas/{id}          # Detalle consulta
PUT    /api/clinica/consultas/{id}          # Actualizar consulta
DELETE /api/clinica/consultas/{id}          # Cancelar turno

# ============================================================
# RECETAS
# ============================================================
POST   /api/clinica/consultas/{id}/recetas  # Emitir receta
GET    /api/clinica/recetas/{id}/pdf        # Descargar PDF receta
```

#### B) Diagnóstico Router

```python
# routers/diagnostico_router.py

# ============================================================
# MODALIDADES
# ============================================================
POST   /api/diagnostico/modalidades/        # Crear modalidad (RX, TC, etc.)
GET    /api/diagnostico/modalidades/        # Listar modalidades
PUT    /api/diagnostico/modalidades/{id}    # Actualizar modalidad

# ============================================================
# SALAS / EQUIPOS
# ============================================================
POST   /api/diagnostico/salas/              # Crear sala
GET    /api/diagnostico/salas/              # Listar salas
GET    /api/diagnostico/salas/{id}/agenda   # Ver agenda de sala
PUT    /api/diagnostico/salas/{id}          # Actualizar sala

# ============================================================
# ESTUDIOS
# ============================================================
POST   /api/diagnostico/estudios/           # Crear turno de estudio
GET    /api/diagnostico/estudios/           # Listar estudios
GET    /api/diagnostico/estudios/{id}       # Detalle estudio
PUT    /api/diagnostico/estudios/{id}       # Actualizar estudio
GET    /api/diagnostico/estudios/{id}/pacs  # Link al visor PACS

# ============================================================
# INFORMES
# ============================================================
PUT    /api/diagnostico/estudios/{id}/informe     # Subir informe médico
GET    /api/diagnostico/estudios/{id}/informe/pdf # Descargar PDF informe
```

#### C) Logística Router

```python
# routers/logistica_router.py

# ============================================================
# ASEGURADORAS
# ============================================================
POST   /api/logistica/aseguradoras/         # Crear aseguradora
GET    /api/logistica/aseguradoras/         # Listar aseguradoras
PUT    /api/logistica/aseguradoras/{id}     # Actualizar aseguradora

# ============================================================
# PÓLIZAS
# ============================================================
POST   /api/logistica/polizas/              # Crear póliza
GET    /api/logistica/polizas/              # Listar pólizas
GET    /api/logistica/polizas/buscar        # Buscar por número/patente/DNI
PUT    /api/logistica/polizas/{id}          # Actualizar póliza

# ============================================================
# UNIDADES (FLOTA)
# ============================================================
POST   /api/logistica/unidades/             # Crear unidad
GET    /api/logistica/unidades/             # Listar unidades
GET    /api/logistica/unidades/mapa         # Ver mapa con unidades activas
PUT    /api/logistica/unidades/{id}         # Actualizar unidad
PUT    /api/logistica/unidades/{id}/ubicacion  # Actualizar GPS

# ============================================================
# ASISTENCIAS
# ============================================================
POST   /api/logistica/asistencias/          # Crear solicitud
GET    /api/logistica/asistencias/          # Listar asistencias
GET    /api/logistica/asistencias/{id}      # Detalle
PUT    /api/logistica/asistencias/{id}/asignar  # Asignar unidad
GET    /api/logistica/asistencias/{id}/tracking  # Tracking público (link)
PUT    /api/logistica/asistencias/{id}/estado   # Actualizar estado

# ============================================================
# SEGUIMIENTO (TRACKING)
# ============================================================
GET    /api/logistica/asistencias/{id}/seguimiento  # Historial de estados
POST   /api/logistica/asistencias/{id}/seguimiento  # Registrar nuevo estado
```

---

### 5.4 Middleware de Activación de Verticales

```python
# core/middleware.py

from fastapi import Request, HTTPException
from core.database import get_db
from core.models import Empresa, VerticalConfig

async def check_vertical_enabled(request: Request, vertical: str):
    """
    Middleware que verifica si el vertical está activo para la empresa.
    
    Se usa como dependencia en routers específicos:
    
    @router.get("/api/clinica/consultas")
    async def listar_consultas(
        empresa: Empresa = Depends(get_current_empresa),
        _: None = Depends(lambda: check_vertical_enabled("clinica"))
    ):
        ...
    """
    empresa_id = request.state.empresa_id  # Del JWT
    
    db = next(get_db())
    vertical_config = db.query(VerticalConfig).filter(
        VerticalConfig.empresa_id == empresa_id,
        VerticalConfig.vertical == vertical,
        VerticalConfig.activo == True
    ).first()
    
    if not vertical_config:
        raise HTTPException(
            status_code=403,
            detail=f"El vertical '{vertical}' no está activo para esta empresa."
        )
    
    # Inyectar config del vertical en el request para uso posterior
    request.state.vertical_config = vertical_config.config
    
    return True
```

---

## 6. ARQUITECTURA DE FRONTEND

### 6.1 Filosofía: Dashboard Dinámico por Verticales

**Opción A: Next.js con Renderizado Dinámico**

```
frontend/
├── app/
│   ├── layout.tsx                # Layout global
│   ├── page.tsx                  # Landing
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard principal (detecta verticales activos)
│   │   ├── layout.tsx            # Sidebar dinámico
│   │   │
│   │   ├── clinica/              # Rutas de clínica (solo si vertical activo)
│   │   │   ├── page.tsx          # Vista general clínica
│   │   │   ├── medicos/
│   │   │   ├── consultas/
│   │   │   └── pacientes/
│   │   │
│   │   ├── diagnostico/          # Rutas de diagnóstico
│   │   │   ├── page.tsx
│   │   │   ├── estudios/
│   │   │   ├── agenda/
│   │   │   └── informes/
│   │   │
│   │   └── logistica/            # Rutas de logística
│   │       ├── page.tsx
│   │       ├── asistencias/
│   │       ├── unidades/
│   │       └── facturacion/
│   │
│   └── admin/                    # Administración (solo superadmin)
│       ├── empresas/
│       └── verticales/
│
├── components/
│   ├── shared/                   # Componentes compartidos
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── Table.tsx
│   │   └── Modal.tsx
│   │
│   ├── clinica/
│   │   ├── AgendaMedicos.tsx
│   │   ├── FormConsulta.tsx
│   │   └── HistoriaClinica.tsx
│   │
│   ├── diagnostico/
│   │   ├── AgendaSalas.tsx
│   │   ├── ViewerPACS.tsx
│   │   └── FormInforme.tsx
│   │
│   └── logistica/
│       ├── MapaUnidades.tsx
│       ├── FormAsistencia.tsx
│       └── TrackingPublico.tsx
│
├── lib/
│   ├── api.ts                    # Cliente API (Axios/Fetch)
│   ├── auth.ts                   # Contexto de autenticación
│   └── verticales.ts             # Hook useVerticalesActivos()
│
└── hooks/
    ├── useAuth.ts
    ├── useVerticales.ts          # Detecta qué verticales tiene activos
    └── useApi.ts
```

---

### 6.2 Sidebar Dinámico

```tsx
// components/shared/Sidebar.tsx

import { useVerticales } from '@/hooks/useVerticales';

export default function Sidebar() {
  const { verticalesActivos, loading } = useVerticales();
  
  if (loading) return <SidebarSkeleton />;
  
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/dashboard/clientes">Clientes</Link></li>
          
          {/* Solo mostrar si vertical está activo */}
          {verticalesActivos.includes('clinica') && (
            <li>
              <Link href="/dashboard/clinica">Clínica</Link>
              <ul>
                <li><Link href="/dashboard/clinica/medicos">Médicos</Link></li>
                <li><Link href="/dashboard/clinica/consultas">Consultas</Link></li>
                <li><Link href="/dashboard/clinica/pacientes">Pacientes</Link></li>
              </ul>
            </li>
          )}
          
          {verticalesActivos.includes('diagnostico') && (
            <li>
              <Link href="/dashboard/diagnostico">Diagnóstico</Link>
              <ul>
                <li><Link href="/dashboard/diagnostico/estudios">Estudios</Link></li>
                <li><Link href="/dashboard/diagnostico/agenda">Agenda</Link></li>
                <li><Link href="/dashboard/diagnostico/informes">Informes</Link></li>
              </ul>
            </li>
          )}
          
          {verticalesActivos.includes('logistica') && (
            <li>
              <Link href="/dashboard/logistica">Logística</Link>
              <ul>
                <li><Link href="/dashboard/logistica/asistencias">Asistencias</Link></li>
                <li><Link href="/dashboard/logistica/unidades">Unidades</Link></li>
                <li><Link href="/dashboard/logistica/mapa">Mapa en Vivo</Link></li>
              </ul>
            </li>
          )}
          
          <li><Link href="/dashboard/facturacion">Facturación</Link></li>
          <li><Link href="/dashboard/configuracion">Configuración</Link></li>
        </ul>
      </nav>
    </aside>
  );
}
```

---

### 6.3 Hook de Verticales Activos

```tsx
// hooks/useVerticales.ts

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useVerticales() {
  const [verticalesActivos, setVerticalesActivos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchVerticales() {
      try {
        // Endpoint que devuelve verticales activos de la empresa logueada
        const response = await api.get('/api/empresas/me/verticales');
        setVerticalesActivos(response.data.verticales);  // ['clinica', 'logistica']
      } catch (error) {
        console.error('Error fetching verticales:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVerticales();
  }, []);
  
  return { verticalesActivos, loading };
}
```

---

## 7. SISTEMA DE ACTIVACIÓN DE VERTICALES

### 7.1 Configuración por Empresa

**Tabla:** `core.verticales_config`

**Ejemplo de configuración:**

```json
{
  "empresa_id": 1,
  "vertical": "logistica",
  "activo": true,
  "config": {
    "aseguradoras": [1, 2, 3],           // IDs de aseguradoras con contrato
    "cobertura_radio_km": 50,             // Radio máximo de operación
    "tiempo_max_respuesta_min": 90,       // SLA de tiempo de arribo
    "tipos_servicio": [
      "grua_liviana",
      "grua_pesada",
      "auxilio_bateria",
      "cambio_neumatico"
    ],
    "integraciones": {
      "google_maps_api_key": "AIza...",
      "whatsapp_phone": "+54911555512345"
    }
  }
}
```

---

### 7.2 Proceso de Activación de Vertical (Admin)

**Flujo:**

1. **Admin SetubalAI** accede a `/admin/empresas/{id}/verticales`
2. Selecciona vertical a activar (ej: "Logística de Seguros")
3. Completa formulario de configuración:
   - Aseguradoras con las que trabaja
   - Radio de cobertura
   - Tipos de servicio que ofrece
   - API keys necesarias (Google Maps, etc.)
4. Sistema:
   - Crea registro en `core.verticales_config`
   - Crea tablas específicas del vertical (si no existen)
   - Asigna permisos a usuarios de la empresa
   - Envía notificación por email/Telegram
5. Empresa puede empezar a usar el vertical inmediatamente

---

### 7.3 Desactivación de Vertical

**Flujo:**

1. Admin marca vertical como `activo = false`
2. Sistema:
   - NO elimina datos históricos
   - Deshabilita endpoints del vertical (403 Forbidden)
   - Oculta secciones del frontend
   - Pausa cron jobs asociados (si los hay)
3. Datos siguen disponibles readonly para consulta

---

## 8. SKILLS DE HERMES POR VERTICAL

### 8.1 Skill: `clinica-consultas`

```yaml
---
name: clinica-consultas
description: |
  Gestión de turnos y consultas médicas para clínicas y consultorios.
  Agenda médicos, turnos, historia clínica, recetas.
  
triggers:
  - "turno"
  - "consulta médica"
  - "agendar con el doctor"
  - "cancelar turno"
  - "ver mi historia clínica"
  
tools_required:
  - terminal
---

# Clínica: Gestión de Consultas

## Comandos Disponibles

### 1. Crear Turno
```bash
curl -X POST http://localhost:3010/api/clinica/consultas/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "medico_id": 2,
    "fecha_programado": "2026-05-30T10:00:00",
    "motivo_consulta": "Control de rutina"
  }'
```

### 2. Listar Turnos del Día
```bash
curl "http://localhost:3010/api/clinica/consultas/?fecha=2026-05-30" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Ver Historia Clínica
```bash
curl "http://localhost:3010/api/clinica/historia-clinica/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Casos de Uso del Agente

### Caso 1: Paciente Solicita Turno via WhatsApp
```
Paciente: "Quiero turno con la Dra. García para la semana que viene"

Agente:
1. Identifica paciente por teléfono
2. Busca médico "García" en base de datos
3. Consulta agenda disponible próxima semana
4. Responde: "La Dra. García tiene disponibles:
   - Lunes 2/06 a las 10:00
   - Miércoles 4/06 a las 16:00
   ¿Cuál preferís?"
5. Paciente elige: "Miércoles 16hs"
6. Agente crea turno y confirma:
   "✅ Turno confirmado:
   Dra. García
   Miércoles 4/06 a las 16:00
   Clínica San Juan, Av. Corrientes 1234
   Te envío recordatorio 24hs antes."
```

---

## Pitfalls y Consideraciones

### Problema: Doble Reserva (Race Condition)
**Solución:** Lock optimista en BD al crear turno. Si slot ya fue tomado, ofrecer siguiente disponible.

### Problema: Paciente No Llega (Ausentismo)
**Solución:** Registro de "ausente" en tabla consultas. Después de 3 ausencias sin aviso, requerir confirmación telefónica.
```

---

### 8.2 Skill: `diagnostico-estudios`

```yaml
---
name: diagnostico-estudios
description: |
  Gestión de turnos para estudios de diagnóstico por imágenes.
  RX, tomografía, resonancia, ecografía, mamografía.
  Integración con PACS para visualización de imágenes.
  
triggers:
  - "turno para radiografía"
  - "resonancia magnética"
  - "ver mis estudios"
  - "informe de tomografía"
  
tools_required:
  - terminal
---

# Diagnóstico por Imágenes: Gestión de Estudios

## Comandos Disponibles

### 1. Crear Turno de Estudio
```bash
curl -X POST http://localhost:3010/api/diagnostico/estudios/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "modalidad_id": 2,
    "sala_id": 1,
    "fecha_programado": "2026-06-01T14:00:00",
    "indicacion_medica": "RX tórax frente y perfil",
    "obra_social": "OSDE",
    "numero_autorizacion": "AUTH123456"
  }'
```

### 2. Ver Estudio con Link al PACS
```bash
curl "http://localhost:3010/api/diagnostico/estudios/123" \
  -H "Authorization: Bearer $TOKEN"

# Response incluye:
{
  "id": 123,
  "study_uid": "1.2.840.113619.2.55.3...",
  "pacs_viewer_url": "https://pacs.dxi.com.ar/viewer/?study=1.2.840..."
}
```

### 3. Subir Informe Médico
```bash
curl -X PUT http://localhost:3010/api/diagnostico/estudios/123/informe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "radiologo_id": 5,
    "informe_texto": "No se observan alteraciones patológicas...",
    "informe_pdf_url": "https://s3.../informe-123.pdf"
  }'
```

---

## Casos de Uso del Agente

### Caso 1: Paciente Solicita Turno
```
Paciente: "Necesito una resonancia de rodilla"

Agente:
1. Identifica paciente
2. Busca modalidad "RM" (Resonancia Magnética)
3. Verifica si tiene orden médica (requerido para RM)
4. Paciente adjunta foto de orden médica (OCR lee indicación)
5. Agente busca slots disponibles en salas de RM
6. Responde: "Tengo disponibles:
   - Viernes 6/06 a las 08:00
   - Lunes 9/06 a las 14:00"
7. Paciente elige
8. Agente solicita: "¿Tenés obra social? ¿Número de autorización?"
9. Paciente: "OSDE, autorización AUTH789"
10. Agente crea turno y envía confirmación + indicaciones pre-estudio
```

### Caso 2: Paciente Consulta Resultados
```
Paciente: "Ya tengo los resultados de la resonancia?"

Agente:
1. Busca último estudio del paciente
2. Verifica si tiene informe médico
3. Si está listo:
   "✅ Tu informe está listo. Te envío el link para ver las imágenes:
   [Link al visor PACS]
   
   También podés descargar el informe en PDF:
   [Link PDF]"
4. Si no está listo:
   "El estudio se realizó el 6/06. El informe suele estar en 48-72hs.
   Te avisamos cuando esté listo."
```

---

## Integración con PACS

### Weasis Viewer (Open Source)
```bash
# Generar link público al visor Weasis
https://pacs.clinica.com/weasis-pacs-connector/viewer?studyUID=1.2.840.113619...
```

### Orthanc PACS Server
```bash
# API REST de Orthanc
curl "https://pacs.clinica.com/studies/1.2.840..." \
  -H "Authorization: Basic base64(user:pass)"
```
```

---

### 8.3 Skill: `logistica-asistencias`

```yaml
---
name: logistica-asistencias
description: |
  Gestión de asistencias vehiculares para empresas de logística de seguros.
  Grúas, auxilio mecánico, verificación de pólizas, tracking en tiempo real.
  
triggers:
  - "me quedé sin batería"
  - "necesito grúa"
  - "tengo un pinchazo"
  - "me chocaron"
  
tools_required:
  - terminal
---

# Logística de Seguros: Asistencias Vehiculares

## Comandos Disponibles

### 1. Crear Solicitud de Asistencia
```bash
curl -X POST http://localhost:3010/api/logistica/asistencias/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente_id": 1,
    "poliza_id": 5,
    "tipo": "auxilio_bateria",
    "descripcion_problema": "Vehículo no arranca",
    "ubicacion_lat": -34.603722,
    "ubicacion_lng": -58.381592,
    "ubicacion_calle": "Av. Corrientes",
    "ubicacion_altura": "3500",
    "ubicacion_localidad": "CABA"
  }'
```

### 2. Asignar Unidad Más Cercana
```bash
# Buscar unidades disponibles cercanas
curl "http://localhost:3010/api/logistica/unidades/?cercanas=true&lat=-34.603&lng=-58.381&radio_km=10&estado=disponible" \
  -H "Authorization: Bearer $TOKEN"

# Asignar unidad
curl -X PUT http://localhost:3010/api/logistica/asistencias/123/asignar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "unidad_id": 7,
    "tiempo_estimado_arribo_min": 35
  }'
```

### 3. Actualizar Estado (Chofer)
```bash
curl -X POST http://localhost:3010/api/logistica/asistencias/123/seguimiento \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estado": "en_camino",
    "latitud": -34.600,
    "longitud": -58.385,
    "comentario": "Saliendo de base, ETA 30 min"
  }'
```

### 4. Link de Tracking Público
```bash
# Endpoint sin autenticación para asegurado
curl "http://localhost:3010/api/logistica/asistencias/123/tracking"

# Response:
{
  "asistencia_id": 123,
  "estado": "en_camino",
  "unidad": {
    "patente": "AA123BB",
    "tipo": "Grúa Liviana",
    "chofer": "Carlos"
  },
  "ubicacion_actual": {
    "lat": -34.600,
    "lng": -58.385
  },
  "tiempo_estimado_arribo_min": 25,
  "mapa_url": "https://maps.google.com/..."
}
```

---

## Casos de Uso del Agente

### Caso 1: Asegurado Solicita Asistencia
```
(Ver flujo completo en doc ANALISIS-LOGISTICA-SEGUROS.md sección 2.1)
```

### Caso 2: Chofer Actualiza Estado via WhatsApp
```
Chofer: "Llegué"

Agente:
1. Identifica chofer por teléfono
2. Busca asistencia activa asignada a él (servicio #123)
3. Actualiza estado a "en_lugar"
4. Notifica a asegurado:
   "✅ Carlos llegó a tu ubicación (Av. Corrientes 3500).
   En breve iniciará el servicio."
5. Registra timestamp de arribo real
```

### Caso 3: Asegurado No Tiene Cobertura
```
Asegurado: "Necesito grúa, estoy en Av. Santa Fe 2000"

Agente:
1. Identifica asegurado por teléfono
2. Busca póliza activa
3. NO encuentra póliza o póliza vencida
4. Responde:
   "Hola Juan, verifico que tu póliza con La Caja Seguros venció el 15/05/2026.
   
   Para recibir asistencia necesitás renovarla.
   
   ¿Querés que te pase los datos de contacto de La Caja para renovar?"
5. Si acepta, envía contacto de aseguradora
6. Si es urgente, ofrece servicio particular (sin cobertura, con costo)
```

---

## Pitfalls y Consideraciones

### Problema: Ubicación GPS Incorrecta
**Solución:** 
- Validar coordenadas (Argentina: lat -55/-22, lng -73/-53)
- Si fuera de rango, solicitar dirección manual
- Chofer puede reportar "ubicación incorrecta" y pedir confirmación

### Problema: Asegurado Canceló Pero Unidad Ya Salió
**Solución:**
- Si estado = "en_camino", cobrar penalidad (configurable por aseguradora)
- Compensar al chofer por viaje en vano
- Registrar cancelación tardía para estadísticas

### Problema: Múltiples Solicitudes Simultáneas en Misma Zona
**Solución:**
- Algoritmo de asignación inteligente:
  1. Prioridad: urgencias (accidentes) > averías
  2. Cercanía + disponibilidad + tipo de unidad necesaria
  3. Balanceo de carga (no siempre el más cercano si está sobrecargado)
```

---

## 9. INTEGRACIONES EXTERNAS

### 9.1 WhatsApp Business API

**Propósito:** Canal principal de comunicación con usuarios finales (pacientes, asegurados, clientes)

**Endpoints necesarios:**
- Enviar mensaje de texto
- Enviar mensaje con botones
- Enviar ubicación (para tracking)
- Enviar archivo PDF (recetas, informes, facturas)
- Recibir webhook con mensajes entrantes

**Ejemplo de integración:**

```python
# integrations/whatsapp.py

import requests
from core.config import settings

WHATSAPP_API_URL = settings.WHATSAPP_API_URL
WHATSAPP_TOKEN = settings.WHATSAPP_TOKEN

def send_message(phone: str, message: str):
    """Enviar mensaje de texto simple"""
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message}
    }
    response = requests.post(
        f"{WHATSAPP_API_URL}/messages",
        json=payload,
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    )
    return response.json()

def send_location(phone: str, latitude: float, longitude: float, name: str):
    """Enviar ubicación (tracking de unidad)"""
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "location",
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "name": name
        }
    }
    response = requests.post(
        f"{WHATSAPP_API_URL}/messages",
        json=payload,
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    )
    return response.json()

def send_document(phone: str, pdf_url: str, caption: str):
    """Enviar documento PDF (receta, informe, factura)"""
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "document",
        "document": {
            "link": pdf_url,
            "caption": caption
        }
    }
    response = requests.post(
        f"{WHATSAPP_API_URL}/messages",
        json=payload,
        headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"}
    )
    return response.json()
```

---

### 9.2 Google Maps API

**Propósito:** Geocodificación, cálculo de distancias, routing, mapas de tracking

**APIs necesarias:**
- Geocoding API (dirección → coordenadas)
- Distance Matrix API (calcular distancia y tiempo entre puntos)
- Maps JavaScript API (frontend: mapa interactivo)
- Directions API (ruta óptima)

**Ejemplo de integración:**

```python
# integrations/google_maps.py

import googlemaps
from core.config import settings

gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

def geocode_address(address: str):
    """Convertir dirección a coordenadas"""
    result = gmaps.geocode(address)
    if result:
        location = result[0]['geometry']['location']
        return location['lat'], location['lng']
    return None, None

def calculate_distance(origin_lat, origin_lng, dest_lat, dest_lng):
    """Calcular distancia y tiempo entre dos puntos"""
    result = gmaps.distance_matrix(
        origins=[(origin_lat, origin_lng)],
        destinations=[(dest_lat, dest_lng)],
        mode="driving"
    )
    
    if result['rows'][0]['elements'][0]['status'] == 'OK':
        distance_km = result['rows'][0]['elements'][0]['distance']['value'] / 1000
        duration_min = result['rows'][0]['elements'][0]['duration']['value'] / 60
        return distance_km, duration_min
    
    return None, None

def find_closest_unit(units: list, target_lat: float, target_lng: float):
    """Encontrar unidad más cercana a un punto"""
    origins = [(u['lat'], u['lng']) for u in units]
    destinations = [(target_lat, target_lng)]
    
    result = gmaps.distance_matrix(
        origins=origins,
        destinations=destinations,
        mode="driving"
    )
    
    closest_unit = None
    min_duration = float('inf')
    
    for i, row in enumerate(result['rows']):
        if row['elements'][0]['status'] == 'OK':
            duration = row['elements'][0]['duration']['value']
            if duration < min_duration:
                min_duration = duration
                closest_unit = units[i]
    
    return closest_unit
```

---

### 9.3 PACS (Picture Archiving and Communication System)

**Propósito:** Almacenar y visualizar imágenes médicas (DICOM)

**Opciones:**
- **Orthanc** (open source, REST API)
- **dcm4chee** (open source, Java)
- **Weasis** (visor open source)
- **PACS comerciales** (con API REST)

**Ejemplo de integración con Orthanc:**

```python
# integrations/pacs/orthanc.py

import requests
from core.config import settings

ORTHANC_URL = settings.ORTHANC_URL
ORTHANC_USER = settings.ORTHANC_USER
ORTHANC_PASSWORD = settings.ORTHANC_PASSWORD

def upload_dicom(dicom_file_path: str):
    """Subir archivo DICOM al PACS"""
    with open(dicom_file_path, 'rb') as f:
        response = requests.post(
            f"{ORTHANC_URL}/instances",
            data=f,
            auth=(ORTHANC_USER, ORTHANC_PASSWORD)
        )
    return response.json()

def get_study(study_uid: str):
    """Obtener metadata de un estudio"""
    response = requests.get(
        f"{ORTHANC_URL}/studies/{study_uid}",
        auth=(ORTHANC_USER, ORTHANC_PASSWORD)
    )
    return response.json()

def generate_viewer_link(study_uid: str):
    """Generar link al visor Weasis"""
    # Weasis puede abrir estudios via URL
    return f"{ORTHANC_URL}/wado?studyUID={study_uid}&requestType=WADO"
```

---

### 9.4 Mercado Pago (Facturación y Pagos)

**Propósito:** Generar links de pago, cobrar facturas, gestionar suscripciones

**Ejemplo de integración:**

```python
# integrations/mercadopago.py

import mercadopago
from core.config import settings

mp = mercadopago.SDK(settings.MERCADOPAGO_ACCESS_TOKEN)

def create_payment_link(factura_id: int, monto: float, descripcion: str):
    """Crear link de pago para una factura"""
    preference_data = {
        "items": [
            {
                "title": descripcion,
                "quantity": 1,
                "unit_price": monto,
                "currency_id": "ARS"
            }
        ],
        "external_reference": str(factura_id),
        "notification_url": f"{settings.API_URL}/api/webhooks/mercadopago",
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/facturacion/{factura_id}/success",
            "failure": f"{settings.FRONTEND_URL}/facturacion/{factura_id}/failure",
            "pending": f"{settings.FRONTEND_URL}/facturacion/{factura_id}/pending"
        }
    }
    
    result = mp.preference().create(preference_data)
    return result["response"]["init_point"]  # URL del checkout
```

---

## 10. ROADMAP DE IMPLEMENTACIÓN

### FASE 1: CORE + PRIMER VERTICAL (8-10 semanas)

**Semana 1-2: Setup Inicial**
- ✅ Crear repositorio monorepo (backend + frontend)
- ✅ Setup PostgreSQL con schema `core`
- ✅ Setup FastAPI con estructura modular
- ✅ Setup Next.js con TypeScript
- ✅ Autenticación JWT
- ✅ CRUD básico de empresas y usuarios

**Semana 3-4: Core Funcional**
- ✅ Tabla `core.clientes` y endpoints
- ✅ Tabla `core.servicios` (genérica)
- ✅ Tabla `core.verticales_config`
- ✅ Middleware de activación de verticales
- ✅ Integración WhatsApp Business API (recibir/enviar mensajes)

**Semana 5-6: Primer Vertical (Logística)**
- ✅ Schema `logistica_seguros` completo
- ✅ Endpoints de logística (aseguradoras, pólizas, unidades, asistencias)
- ✅ Integración Google Maps (geocoding, distance matrix)
- ✅ Sistema de tracking en tiempo real
- ✅ Skill Hermes: `logistica-asistencias`

**Semana 7-8: Frontend Logística**
- ✅ Dashboard principal con sidebar dinámico
- ✅ Mapa de unidades en tiempo real
- ✅ CRUD de pólizas y aseguradoras
- ✅ Formulario de creación de asistencia
- ✅ Vista de tracking público (sin login)

**Semana 9-10: Testing y Deploy**
- ✅ Tests unitarios (core + logística)
- ✅ Tests de integración
- ✅ Deploy en VPS (Docker Compose)
- ✅ Pruebas con cliente piloto (1 empresa logística)

---

### FASE 2: SEGUNDO VERTICAL (6-8 semanas)

**Semana 11-12: Vertical Diagnóstico por Imágenes**
- ✅ Schema `diagnostico_imagenes`
- ✅ Endpoints de estudios, modalidades, salas
- ✅ Integración PACS (Orthanc o Weasis)
- ✅ Sistema de agendas por sala/equipo

**Semana 13-14: Frontend Diagnóstico**
- ✅ CRUD de estudios y turnos
- ✅ Agenda de salas
- ✅ Visor de imágenes DICOM (iframe o integración Weasis)
- ✅ Carga de informes médicos

**Semana 15-16: Skill Hermes + Testing**
- ✅ Skill `diagnostico-estudios`
- ✅ Testing con cliente piloto (1 centro diagnóstico)
- ✅ Ajustes y correcciones

---

### FASE 3: TERCER VERTICAL (6-8 semanas)

**Semana 17-18: Vertical Clínica Médica**
- ✅ Schema `clinica`
- ✅ Endpoints de médicos, consultas, historia clínica
- ✅ Sistema de recetas

**Semana 19-20: Frontend Clínica**
- ✅ CRUD de médicos y especialidades
- ✅ Agenda de turnos por médico
- ✅ Visualización de historia clínica longitudinal
- ✅ Generación de recetas PDF

**Semana 21-22: Skill Hermes + Testing**
- ✅ Skill `clinica-consultas`
- ✅ Testing con cliente piloto (1 clínica)

---

### FASE 4: FACTURACIÓN Y REPORTES (4 semanas)

**Semana 23-24: Facturación Automática**
- ✅ Generación automática de facturas mensuales
- ✅ PDF de facturas con detalle
- ✅ Integración Mercado Pago (links de pago)
- ✅ Webhook de pagos

**Semana 25-26: Reportes y Dashboards**
- ✅ Dashboard con métricas por vertical
- ✅ Reportes descargables (CSV, PDF)
- ✅ Gráficos de facturación y servicios
- ✅ Heatmaps de demanda (logística)

---

### FASE 5: OPTIMIZACIÓN Y ESCALABILIDAD (4 semanas)

**Semana 27-28: Performance**
- ✅ Redis para caché de consultas frecuentes
- ✅ Paginación optimizada en todas las tablas
- ✅ Índices adicionales en BD
- ✅ Load testing (Apache Bench, k6)

**Semana 29-30: DevOps y Monitoreo**
- ✅ CI/CD con GitHub Actions
- ✅ Logs centralizados (ELK stack o similar)
- ✅ Monitoreo (Prometheus + Grafana)
- ✅ Alertas automáticas (errores, caídas)

---

## 11. MÉTRICAS DE ÉXITO

### 11.1 Métricas Técnicas

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| **Uptime** | >99.5% | UptimeRobot, Pingdom |
| **Response Time API** | <500ms (p95) | Prometheus |
| **Error Rate** | <1% | Sentry |
| **Test Coverage** | >80% | pytest-cov |
| **Lighthouse Score** | >90 | Lighthouse CI |

---

### 11.2 Métricas de Producto

| Métrica | Objetivo Mes 1 | Objetivo Mes 6 |
|---------|----------------|----------------|
| **Empresas activas** | 3 | 20 |
| **Usuarios activos** | 50 | 500 |
| **Servicios procesados/mes** | 500 | 10.000 |
| **Mensajes WhatsApp/día** | 100 | 2.000 |
| **Satisfacción cliente (NPS)** | >8/10 | >9/10 |

---

### 11.3 Métricas de Negocio

| Métrica | Objetivo Año 1 |
|---------|----------------|
| **MRR (Monthly Recurring Revenue)** | $50k USD |
| **CAC (Customer Acquisition Cost)** | <$2k USD |
| **LTV (Lifetime Value)** | >$20k USD |
| **Churn Rate** | <5% mensual |
| **Tiempo de Onboarding** | <7 días |

---

## 12. PRÓXIMOS PASOS INMEDIATOS

**ESTADO ACTUAL:** ✅ Relevamiento completo de 3 verticales  
**SIGUIENTE HITO:** Aprobar Plan Maestro y arrancar Fase 1

### Checklist Pre-Implementación:

- [ ] **Revisar y aprobar** este Plan Maestro con Pablo
- [ ] **Definir prioridad** de verticales (¿empezar con Logística o Diagnóstico?)
- [ ] **Conseguir cliente piloto** dispuesto a testear (1 empresa por vertical)
- [ ] **Validar integraciones críticas:**
  - [ ] WhatsApp Business API (cuenta activa)
  - [ ] Google Maps API (billing activado)
  - [ ] PACS (acceso a Orthanc o Weasis)
  - [ ] Mercado Pago (credenciales de producción)
- [ ] **Setup de infraestructura:**
  - [ ] VPS Hetzner o AWS (specs: 4 CPU, 8GB RAM, 100GB SSD)
  - [ ] PostgreSQL 15
  - [ ] Redis
  - [ ] Docker + Docker Compose
- [ ] **Contratar diseñador UI/UX** (opcional, para pulir frontend)
- [ ] **Crear repositorio privado** en GitHub
- [ ] **Kickoff meeting** para arrancar Fase 1

---

**Última actualización:** 2026-05-26  
**Versión:** 1.0 - Draft Inicial  
**Próxima revisión:** Después de aprobación de Pablo

**Mantenido por:** SetubalAI Business Agent Development
