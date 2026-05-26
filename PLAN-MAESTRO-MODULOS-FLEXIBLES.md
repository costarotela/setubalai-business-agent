# 🎯 PLAN MAESTRO: SETUBALAI AGENTE MULTIRUBRO FLEXIBLE

**Proyecto:** Agente IA con Módulos Especializados por Rubro  
**Objetivo:** Transformar SetubalAI en la primera agencia IA capaz de operar empresas de servicios Y productos con flexibilidad total  
**Fecha Inicio:** 26 Mayo 2026  
**Owner:** Pablo Costa Rotela  
**Ubicación:** `/home/admin/setubalai-agente/`

---

## 📊 VISIÓN GENERAL DEL PLAN

### **ARQUITECTURA FINAL (3 CAPAS):**

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 1: NÚCLEO UNIVERSAL                                        │
│ ✓ empresas, usuarios, clientes                                  │
│ ✓ profesionales (NUEVO)                                         │
│ ✓ productos/servicios (EXTENDIDA)                               │
│ ✓ facturas, proveedores                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 2: MÓDULOS ESPECIALIZADOS                                  │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ MÓDULO SALUD  │  │ MÓDULO        │  │ MÓDULO        │      │
│  │               │  │ LOGÍSTICA     │  │ EDUCACIÓN*    │      │
│  │ • sedes       │  │               │  │               │      │
│  │ • equipos     │  │ • órdenes     │  │ • cursos      │      │
│  │ • turnos      │  │ • vehículos   │  │ • asistencias │      │
│  │ • estudios    │  │ • GPS         │  │ • notas       │      │
│  │ • recetas     │  │ • evidencias  │  │               │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                    (*Futuro)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 3: CONFIGURACIÓN FLEXIBLE (empresa_config)                 │
│ • modulo_salud: ON/OFF                                          │
│ • modulo_logistica: ON/OFF                                      │
│ • campos_custom: JSONB libre                                    │
│ • ui_config: colores, logos, flujos personalizados              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 OBJETIVOS DE NEGOCIO

1. **DiagCentro Santa Fe:** Agente puede agendar turnos verificando disponibilidad de equipos + profesionales + requisitos documentales
2. **CentroMedicIntegral:** Agente puede agendar consultas médicas, generar recetas, pedir estudios complementarios
3. **AsistenciaLogística SA:** Agente puede asignar grúas según GPS, coordinar servicios, generar evidencias
4. **Escalabilidad:** Cualquier empresa nueva puede activar módulos según su rubro

---

## 📅 CRONOGRAMA GENERAL

| FASE | DESCRIPCIÓN | DURACIÓN | ENTREGABLE |
|------|-------------|----------|------------|
| **0** | Preparación y Auditoría | 2 días | Estado actual documentado |
| **1** | Núcleo Universal | 5 días | BD extendida + API base |
| **2** | Módulo Salud | 7 días | DiagCentro + CentroMédico operativos |
| **3** | Módulo Logística | 5 días | AsistenciaLogística operativa |
| **4** | Frontend Adaptativo | 7 días | UI dinámica según módulos |
| **5** | Agente IA Multi-Rubro | 5 días | Skills especializados + comandos NL |

**TOTAL:** 31 días laborables (~6 semanas)

---

# FASE 0: PREPARACIÓN Y AUDITORÍA
**Duración:** 2 días  
**Objetivo:** Validar estado actual, preparar entorno, congelar datos demo

## ✅ PASO 0.1: Auditoría de Base de Datos Actual
**Tiempo estimado:** 1 hora

### Tareas:
```bash
# 1. Listar todas las tablas actuales
docker exec paperclip-db psql -U paperclip -d business -c "\dt setubalai.*"

# 2. Verificar datos de empresas demo
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT id, nombre, rubro 
  FROM setubalai.empresa 
  WHERE id IN (12, 13, 14);
"

# 3. Contar registros por tabla
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT 
    (SELECT COUNT(*) FROM setubalai.clientes) as clientes,
    (SELECT COUNT(*) FROM setubalai.productos) as productos,
    (SELECT COUNT(*) FROM setubalai.facturas) as facturas,
    (SELECT COUNT(*) FROM setubalai.profesionales) as profesionales;
"

# 4. Exportar backup ANTES de cualquier cambio
docker exec paperclip-db pg_dump -U paperclip -d business -n setubalai \
  > /home/admin/setubalai-agente/backups/backup-pre-modulos-$(date +%Y%m%d).sql
```

### Criterios de Validación:
- ✅ Backup generado (tamaño > 100KB)
- ✅ 3 empresas demo presentes (IDs 12, 13, 14)
- ✅ Tabla `profesionales` NO existe aún (si existe, hay conflicto)

### Entregable:
- `backups/backup-pre-modulos-YYYYMMDD.sql`
- `docs/AUDITORIA-ESTADO-ACTUAL.md` (snapshot de tablas + conteos)

---

## ✅ PASO 0.2: Crear Estructura de Proyecto
**Tiempo estimado:** 30 min

### Tareas:
```bash
cd /home/admin/setubalai-agente

# Crear directorios de migraciones
mkdir -p backend/migrations/{fase1,fase2,fase3}

# Crear directorios de validación
mkdir -p validation/{fase1,fase2,fase3}

# Crear directorio de SQL modular
mkdir -p backend/sql/modules/{core,salud,logistica}

# Crear directorio de seeds por módulo
mkdir -p backend/seeds/{core,salud,logistica}
```

### Criterios de Validación:
- ✅ Directorios creados
- ✅ Estructura visible con `tree backend/migrations`

### Entregable:
- Estructura de directorios preparada

---

## ✅ PASO 0.3: Congelar Datos Demo Actuales
**Tiempo estimado:** 1 hora

### Tareas:
```bash
# Exportar datos de las 3 empresas demo en formato JSON
docker exec paperclip-db psql -U paperclip -d business -t -A -c "
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT * FROM setubalai.empresa WHERE id IN (12, 13, 14)
  ) t
" > backend/seeds/core/empresas-demo.json

# Exportar productos de las 3 empresas
docker exec paperclip-db psql -U paperclip -d business -t -A -c "
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT * FROM setubalai.productos WHERE empresa_id IN (12, 13, 14)
  ) t
" > backend/seeds/core/productos-demo.json

# Exportar clientes
docker exec paperclip-db psql -U paperclip -d business -t -A -c "
  SELECT json_agg(row_to_json(t))
  FROM (
    SELECT * FROM setubalai.clientes WHERE empresa_id IN (12, 13, 14)
  ) t
" > backend/seeds/core/clientes-demo.json
```

### Criterios de Validación:
- ✅ 3 archivos JSON generados
- ✅ Cada archivo tiene contenido válido (no null)
- ✅ Total de productos exportados = 66 (suma de las 3 empresas)

### Entregable:
- `backend/seeds/core/empresas-demo.json`
- `backend/seeds/core/productos-demo.json`
- `backend/seeds/core/clientes-demo.json`

---

## 🚦 CHECKPOINT FASE 0 → FASE 1

### Verificación GO/NO-GO:
```bash
# Ejecutar script de validación
cd /home/admin/setubalai-agente
bash validation/check-fase0.sh
```

**Criterios para avanzar:**
- ✅ Backup existente y reciente
- ✅ Datos demo exportados
- ✅ Estructura de proyecto creada
- ✅ No hay conflictos de tablas (profesionales NO existe)

**SI FALLA:** Resolver antes de continuar.

---

# FASE 1: NÚCLEO UNIVERSAL
**Duración:** 5 días  
**Objetivo:** Extender BD con tablas core necesarias para todos los módulos

## ✅ PASO 1.1: Extender Tabla `productos` con Campos de Servicios
**Tiempo estimado:** 2 horas

### SQL a Ejecutar:
**Archivo:** `backend/migrations/fase1/01-extend-productos.sql`

```sql
-- ===========================================================
-- MIGRACIÓN FASE 1.1: EXTENDER productos PARA SERVICIOS
-- ===========================================================

BEGIN;

-- Agregar columnas nuevas para servicios
ALTER TABLE setubalai.productos 
  ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requiere_turno BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requiere_profesional BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS requiere_equipo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_resultado VARCHAR(50),
  ADD COLUMN IF NOT EXISTS instrucciones_cliente TEXT,
  ADD COLUMN IF NOT EXISTS tiempo_preparacion INTEGER DEFAULT 0;

-- Comentarios de documentación
COMMENT ON COLUMN setubalai.productos.duracion_minutos IS 
  'Duración estimada del servicio en minutos (para agendar bloques)';
COMMENT ON COLUMN setubalai.productos.requiere_turno IS 
  'TRUE si el servicio necesita agendamiento previo';
COMMENT ON COLUMN setubalai.productos.requiere_profesional IS 
  'TRUE si el servicio debe ser ejecutado por un profesional específico';
COMMENT ON COLUMN setubalai.productos.requiere_equipo IS 
  'TRUE si el servicio depende de equipamiento específico (resonadores, grúas)';
COMMENT ON COLUMN setubalai.productos.tipo_resultado IS 
  'Tipo de entregable: pdf, fisico, digital, zip, dicom';
COMMENT ON COLUMN setubalai.productos.instrucciones_cliente IS 
  'Instrucciones que el cliente debe seguir (ej: ayuno 8hs, traer DNI)';
COMMENT ON COLUMN setubalai.productos.tiempo_preparacion IS 
  'Minutos antes del turno que el cliente debe llegar';

-- Actualizar productos existentes de DiagCentro (empresa_id=12)
UPDATE setubalai.productos 
SET 
  requiere_turno = true,
  requiere_profesional = true,
  requiere_equipo = true,
  tipo_resultado = 'pdf,dicom',
  duracion_minutos = CASE 
    WHEN nombre ILIKE '%resonancia%' THEN 45
    WHEN nombre ILIKE '%tomografia%' THEN 30
    WHEN nombre ILIKE '%ecografia%' THEN 20
    WHEN nombre ILIKE '%rayos%' THEN 10
    ELSE 30
  END,
  tiempo_preparacion = 20,
  instrucciones_cliente = '• DNI original y fotocopia\n• Pedido médico\n• Bonos asistenciales\n• $2,500 para estampillado'
WHERE empresa_id = 12 AND tipo = 'servicio';

-- Actualizar productos de CentroMedicIntegral (empresa_id=13)
UPDATE setubalai.productos 
SET 
  requiere_turno = true,
  requiere_profesional = true,
  requiere_equipo = false,
  tipo_resultado = 'receta',
  duracion_minutos = CASE 
    WHEN nombre ILIKE '%consulta%pediatria%' THEN 15
    WHEN nombre ILIKE '%consulta%cirugia%' THEN 30
    WHEN nombre ILIKE '%ecocardiograma%' THEN 40
    WHEN nombre ILIKE '%holter%' THEN 20
    ELSE 20
  END,
  tiempo_preparacion = 10
WHERE empresa_id = 13 AND tipo = 'servicio';

-- Actualizar productos de AsistenciaLogística (empresa_id=14)
UPDATE setubalai.productos 
SET 
  requiere_turno = false,          -- Servicios bajo demanda (siniestros)
  requiere_profesional = true,
  requiere_equipo = true,          -- Grúas
  tipo_resultado = 'evidencias',   -- Fotos + actas
  duracion_minutos = CASE 
    WHEN nombre ILIKE '%auxilio%' THEN 60
    WHEN nombre ILIKE '%grua%' THEN 120
    WHEN nombre ILIKE '%pericia%' THEN 90
    ELSE 60
  END
WHERE empresa_id = 14 AND tipo = 'servicio';

COMMIT;

-- Verificación
SELECT 
  empresa_id,
  COUNT(*) as total_productos,
  COUNT(*) FILTER (WHERE requiere_turno) as con_turno,
  COUNT(*) FILTER (WHERE requiere_profesional) as con_profesional
FROM setubalai.productos
WHERE empresa_id IN (12, 13, 14)
GROUP BY empresa_id;
```

### Ejecutar Migración:
```bash
docker exec paperclip-db psql -U paperclip -d business \
  -f /home/admin/setubalai-agente/backend/migrations/fase1/01-extend-productos.sql
```

### Criterios de Validación:
```bash
# Verificar que las columnas existen
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_schema='setubalai' 
    AND table_name='productos' 
    AND column_name IN ('duracion_minutos', 'requiere_turno', 'requiere_profesional');
"

# Verificar que los datos se actualizaron
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT nombre, duracion_minutos, requiere_turno 
  FROM setubalai.productos 
  WHERE empresa_id=12 
  LIMIT 5;
"
```

**Criterios GO/NO-GO:**
- ✅ 7 columnas nuevas creadas
- ✅ Productos de DiagCentro tienen `duracion_minutos` > 0
- ✅ Productos de CentroMédico tienen `requiere_turno = true`

---

## ✅ PASO 1.2: Crear Tabla `profesionales`
**Tiempo estimado:** 1.5 horas

### SQL:
**Archivo:** `backend/migrations/fase1/02-create-profesionales.sql`

```sql
-- ===========================================================
-- MIGRACIÓN FASE 1.2: CREAR TABLA profesionales
-- ===========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS setubalai.profesionales (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  -- Datos personales
  nombre VARCHAR(200) NOT NULL,
  apellido VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefono VARCHAR(50),
  documento VARCHAR(20),
  
  -- Datos profesionales
  especialidad VARCHAR(100),
  matricula_profesional VARCHAR(100),
  
  -- Disponibilidad
  activo BOOLEAN DEFAULT true,
  fecha_alta DATE DEFAULT CURRENT_DATE,
  fecha_baja DATE,
  
  -- Configuración
  tarifa_hora NUMERIC(15,2),
  moneda VARCHAR(10) DEFAULT 'USD',
  
  -- Metadata
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profesionales_empresa ON setubalai.profesionales(empresa_id);
CREATE INDEX idx_profesionales_activo ON setubalai.profesionales(empresa_id, activo);
CREATE INDEX idx_profesionales_especialidad ON setubalai.profesionales(especialidad);

-- Comentarios
COMMENT ON TABLE setubalai.profesionales IS 
  'Médicos, técnicos, choferes, peritos - ejecutan servicios';
COMMENT ON COLUMN setubalai.profesionales.especialidad IS 
  'Cardiología, Traumatología, Técnico RMN, Chofer Grúa, etc.';
COMMENT ON COLUMN setubalai.profesionales.matricula_profesional IS 
  'Matrícula médica, registro profesional, licencia conducir';

COMMIT;
```

### Seed de Datos Demo:
**Archivo:** `backend/seeds/core/profesionales-demo.sql`

```sql
-- Profesionales DiagCentro Santa Fe (empresa_id=12)
INSERT INTO setubalai.profesionales (empresa_id, nombre, apellido, especialidad, matricula_profesional, email, tarifa_hora, activo) VALUES
(12, 'Roberto', 'García', 'Médico Radiólogo', 'MN-45123', 'r.garcia@diagcentro.com.ar', 5000, true),
(12, 'Laura', 'Fernández', 'Técnica en RMN', 'TEC-8891', 'l.fernandez@diagcentro.com.ar', 2500, true),
(12, 'Martín', 'López', 'Técnico en Tomografía', 'TEC-7734', 'm.lopez@diagcentro.com.ar', 2500, true),
(12, 'Sofía', 'Ruiz', 'Ecografista', 'TEC-9012', 's.ruiz@diagcentro.com.ar', 2200, true);

-- Profesionales CentroMedicIntegral (empresa_id=13)
INSERT INTO setubalai.profesionales (empresa_id, nombre, apellido, especialidad, matricula_profesional, email, tarifa_hora, activo) VALUES
(13, 'Ana', 'Martínez', 'Cardiología', 'MN-32456', 'a.martinez@centromedic.com.ar', 6000, true),
(13, 'Diego', 'Pérez', 'Traumatología', 'MN-41289', 'd.perez@centromedic.com.ar', 5500, true),
(13, 'Carla', 'González', 'Pediatría', 'MN-38901', 'c.gonzalez@centromedic.com.ar', 5000, true),
(13, 'Javier', 'Rodríguez', 'Dermatología', 'MN-44567', 'j.rodriguez@centromedic.com.ar', 5200, true);

-- Profesionales AsistenciaLogística (empresa_id=14)
INSERT INTO setubalai.profesionales (empresa_id, nombre, apellido, especialidad, matricula_profesional, email, tarifa_hora, activo) VALUES
(14, 'Juan', 'Gómez', 'Chofer Grúa Clase A', 'LIC-D2-45678', 'j.gomez@asislog.com.ar', 1800, true),
(14, 'Pedro', 'Sánchez', 'Chofer Grúa Clase B', 'LIC-D3-88912', 'p.sanchez@asislog.com.ar', 2000, true),
(14, 'Lucía', 'Torres', 'Perito Automotor', 'REG-PA-3345', 'l.torres@asislog.com.ar', 3500, true),
(14, 'Ricardo', 'Morales', 'Gestor de Siniestros', 'REG-GS-1123', 'r.morales@asislog.com.ar', 2800, true);
```

### Ejecutar:
```bash
# Crear tabla
docker exec paperclip-db psql -U paperclip -d business \
  -f /home/admin/setubalai-agente/backend/migrations/fase1/02-create-profesionales.sql

# Cargar datos demo
docker exec paperclip-db psql -U paperclip -d business \
  -f /home/admin/setubalai-agente/backend/seeds/core/profesionales-demo.sql
```

### Validación:
```bash
# Contar profesionales por empresa
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT 
    e.nombre as empresa,
    COUNT(p.id) as total_profesionales,
    string_agg(DISTINCT p.especialidad, ', ') as especialidades
  FROM setubalai.profesionales p
  JOIN setubalai.empresa e ON p.empresa_id = e.id
  WHERE e.id IN (12, 13, 14)
  GROUP BY e.nombre;
"
```

**Esperado:**
- DiagCentro: 4 profesionales
- CentroMedicIntegral: 4 profesionales
- AsistenciaLogística: 4 profesionales

---

## ✅ PASO 1.3: Crear Tabla `empresa_config`
**Tiempo estimado:** 1 hora

### SQL:
**Archivo:** `backend/migrations/fase1/03-create-empresa-config.sql`

```sql
-- ===========================================================
-- MIGRACIÓN FASE 1.3: TABLA empresa_config (FLEXIBILIDAD)
-- ===========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS setubalai.empresa_config (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL UNIQUE REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  -- Módulos activados
  modulo_salud BOOLEAN DEFAULT false,
  modulo_logistica BOOLEAN DEFAULT false,
  modulo_educacion BOOLEAN DEFAULT false,
  
  -- Configuraciones JSONB por módulo
  config_salud JSONB DEFAULT '{}',
  config_logistica JSONB DEFAULT '{}',
  config_educacion JSONB DEFAULT '{}',
  
  -- Campos personalizados del cliente
  campos_custom JSONB DEFAULT '{}',
  
  -- UI personalizada
  ui_config JSONB DEFAULT '{"color_primario": "#1e40af", "color_secundario": "#34d399"}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_empresa_config_empresa ON setubalai.empresa_config(empresa_id);

-- Insertar configuración para empresas demo
INSERT INTO setubalai.empresa_config (empresa_id, modulo_salud, modulo_logistica, config_salud, config_logistica) VALUES
(12, true, false, 
  '{"multisede": true, "portal_resultados": true, "tipo_centro": "diagnostico"}',
  '{}'
),
(13, true, false,
  '{"multisede": false, "portal_resultados": false, "tipo_centro": "consultas"}',
  '{}'
),
(14, false, true,
  '{}',
  '{"gps_tracking": true, "evidencias_obligatorias": ["foto", "firma"], "tipo_servicio": "gruas_seguros"}'
);

COMMIT;

-- Verificar
SELECT 
  e.nombre,
  c.modulo_salud,
  c.modulo_logistica,
  c.config_salud->>'tipo_centro' as tipo_centro
FROM setubalai.empresa_config c
JOIN setubalai.empresa e ON c.empresa_id = e.id
WHERE e.id IN (12, 13, 14);
```

### Ejecutar:
```bash
docker exec paperclip-db psql -U paperclip -d business \
  -f /home/admin/setubalai-agente/backend/migrations/fase1/03-create-empresa-config.sql
```

### Validación:
```bash
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT 
    empresa_id,
    modulo_salud,
    modulo_logistica
  FROM setubalai.empresa_config
  WHERE empresa_id IN (12, 13, 14);
"
```

**Esperado:**
- Empresa 12 y 13: `modulo_salud = true`
- Empresa 14: `modulo_logistica = true`

---

## ✅ PASO 1.4: Actualizar API FastAPI con Nuevos Endpoints
**Tiempo estimado:** 3 horas

### Tareas:

1. **Crear modelo Pydantic para `profesionales`:**

**Archivo:** `backend/app/models/profesionales.py`

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class ProfesionalBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    apellido: str = Field(..., max_length=200)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=50)
    documento: Optional[str] = Field(None, max_length=20)
    especialidad: Optional[str] = Field(None, max_length=100)
    matricula_profesional: Optional[str] = Field(None, max_length=100)
    tarifa_hora: Optional[Decimal] = None
    moneda: str = Field("USD", max_length=10)
    activo: bool = True
    notas: Optional[str] = None

class ProfesionalCreate(ProfesionalBase):
    empresa_id: int

class ProfesionalUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=200)
    apellido: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    especialidad: Optional[str] = None
    activo: Optional[bool] = None
    tarifa_hora: Optional[Decimal] = None
    notas: Optional[str] = None

class ProfesionalResponse(ProfesionalBase):
    id: int
    empresa_id: int
    fecha_alta: Optional[date]
    fecha_baja: Optional[date]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

2. **Crear endpoint GET `/profesionales/`:**

**Archivo:** `backend/app/routers/profesionales.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.profesionales import (
    ProfesionalCreate, 
    ProfesionalUpdate, 
    ProfesionalResponse
)
from app.core.tenancy import get_current_empresa_id
import logging

router = APIRouter(prefix="/profesionales", tags=["Profesionales"])
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[ProfesionalResponse])
async def listar_profesionales(
    activo: Optional[bool] = None,
    especialidad: Optional[str] = None,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(get_current_empresa_id)
):
    """Listar profesionales de la empresa."""
    query = db.execute(
        """
        SELECT * FROM setubalai.profesionales
        WHERE empresa_id = :empresa_id
        """ + (
            " AND activo = :activo" if activo is not None else ""
        ) + (
            " AND especialidad ILIKE :especialidad" if especialidad else ""
        ) + " ORDER BY apellido, nombre",
        {
            "empresa_id": empresa_id,
            "activo": activo,
            "especialidad": f"%{especialidad}%" if especialidad else None
        }
    )
    return query.mappings().all()

@router.post("/", response_model=ProfesionalResponse, status_code=201)
async def crear_profesional(
    profesional: ProfesionalCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(get_current_empresa_id)
):
    """Crear nuevo profesional."""
    # Validar que empresa_id del body coincida con el del token
    if profesional.empresa_id != empresa_id:
        raise HTTPException(status_code=403, detail="No puede crear profesionales para otra empresa")
    
    result = db.execute(
        """
        INSERT INTO setubalai.profesionales 
        (empresa_id, nombre, apellido, email, telefono, documento, 
         especialidad, matricula_profesional, tarifa_hora, moneda, activo, notas)
        VALUES 
        (:empresa_id, :nombre, :apellido, :email, :telefono, :documento,
         :especialidad, :matricula_profesional, :tarifa_hora, :moneda, :activo, :notas)
        RETURNING *
        """,
        profesional.dict()
    )
    db.commit()
    return result.mappings().first()

@router.get("/{profesional_id}", response_model=ProfesionalResponse)
async def obtener_profesional(
    profesional_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(get_current_empresa_id)
):
    """Obtener un profesional por ID."""
    result = db.execute(
        """
        SELECT * FROM setubalai.profesionales
        WHERE id = :profesional_id AND empresa_id = :empresa_id
        """,
        {"profesional_id": profesional_id, "empresa_id": empresa_id}
    )
    profesional = result.mappings().first()
    if not profesional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    return profesional

@router.put("/{profesional_id}", response_model=ProfesionalResponse)
async def actualizar_profesional(
    profesional_id: int,
    profesional: ProfesionalUpdate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(get_current_empresa_id)
):
    """Actualizar profesional."""
    # Verificar que existe
    existing = db.execute(
        "SELECT id FROM setubalai.profesionales WHERE id = :id AND empresa_id = :empresa_id",
        {"id": profesional_id, "empresa_id": empresa_id}
    ).first()
    
    if not existing:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    
    # Construir UPDATE dinámico solo con campos enviados
    fields = profesional.dict(exclude_unset=True)
    if not fields:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    
    set_clause = ", ".join([f"{k} = :{k}" for k in fields.keys()])
    fields['profesional_id'] = profesional_id
    fields['empresa_id'] = empresa_id
    
    result = db.execute(
        f"""
        UPDATE setubalai.profesionales
        SET {set_clause}, updated_at = NOW()
        WHERE id = :profesional_id AND empresa_id = :empresa_id
        RETURNING *
        """,
        fields
    )
    db.commit()
    return result.mappings().first()

@router.delete("/{profesional_id}", status_code=204)
async def eliminar_profesional(
    profesional_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(get_current_empresa_id)
):
    """Dar de baja (soft delete) a un profesional."""
    result = db.execute(
        """
        UPDATE setubalai.profesionales
        SET activo = false, fecha_baja = CURRENT_DATE, updated_at = NOW()
        WHERE id = :profesional_id AND empresa_id = :empresa_id
        """,
        {"profesional_id": profesional_id, "empresa_id": empresa_id}
    )
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    
    return None
```

3. **Registrar router en `main.py`:**

```python
# En backend/app/main.py
from app.routers import profesionales

app.include_router(profesionales.router, prefix="/api/v1")
```

### Validación:
```bash
# Reiniciar backend
cd /home/admin/setubalai-agente/backend
systemctl --user restart setubalai-api.service

# Esperar 5 segundos
sleep 5

# Probar endpoint
curl -X GET "http://localhost:3010/api/v1/profesionales/" \
  -H "Authorization: Bearer $(cat ~/.hermes/test-token.txt)" \
  -H "empresa-id: 12" | jq

# Crear un profesional de prueba
curl -X POST "http://localhost:3010/api/v1/profesionales/" \
  -H "Authorization: Bearer $(cat ~/.hermes/test-token.txt)" \
  -H "empresa-id: 12" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": 12,
    "nombre": "TEST",
    "apellido": "VALIDACION",
    "especialidad": "Prueba",
    "activo": true
  }' | jq
```

**Criterios GO:**
- ✅ GET devuelve lista de profesionales
- ✅ POST crea profesional correctamente
- ✅ Status code 200/201

---

## 🚦 CHECKPOINT FASE 1 → FASE 2

### Script de Validación:
**Archivo:** `validation/check-fase1.sh`

```bash
#!/bin/bash
echo "🔍 VALIDANDO FASE 1: NÚCLEO UNIVERSAL"
echo "======================================"

# Test 1: Tabla productos extendida
echo "✓ Test 1: Columnas nuevas en productos"
docker exec paperclip-db psql -U paperclip -d business -t -c "
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema='setubalai' 
    AND table_name='productos' 
    AND column_name IN ('duracion_minutos', 'requiere_turno', 'requiere_profesional')
" | grep -q "3" && echo "  ✅ PASS" || echo "  ❌ FAIL"

# Test 2: Tabla profesionales existe
echo "✓ Test 2: Tabla profesionales creada"
docker exec paperclip-db psql -U paperclip -d business -t -c "
  SELECT COUNT(*) FROM setubalai.profesionales
" | grep -qE "[0-9]+" && echo "  ✅ PASS" || echo "  ❌ FAIL"

# Test 3: Tabla empresa_config existe
echo "✓ Test 3: Tabla empresa_config creada"
docker exec paperclip-db psql -U paperclip -d business -t -c "
  SELECT COUNT(*) FROM setubalai.empresa_config WHERE empresa_id IN (12,13,14)
" | grep -q "3" && echo "  ✅ PASS" || echo "  ❌ FAIL"

# Test 4: API responde
echo "✓ Test 4: API endpoint /profesionales/"
curl -s -X GET "http://localhost:3010/api/v1/profesionales/" \
  -H "empresa-id: 12" | jq -e 'length > 0' > /dev/null \
  && echo "  ✅ PASS" || echo "  ❌ FAIL"

echo ""
echo "======================================"
echo "Si todos los tests son ✅, puedes avanzar a FASE 2"
```

```bash
chmod +x validation/check-fase1.sh
bash validation/check-fase1.sh
```

---

# FASE 2: MÓDULO SALUD
**Duración:** 7 días  
**Objetivo:** Implementar tablas y lógica para DiagCentro + CentroMedicIntegral

## ✅ PASO 2.1: Crear Tabla `sedes`
**Tiempo estimado:** 1 hora

### SQL:
**Archivo:** `backend/migrations/fase2/01-create-sedes.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS setubalai.sedes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  nombre VARCHAR(100) NOT NULL,
  direccion TEXT,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefono VARCHAR(50),
  email VARCHAR(200),
  
  horario_atencion JSONB DEFAULT '{}',
  
  activa BOOLEAN DEFAULT true,
  es_principal BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sedes_empresa ON setubalai.sedes(empresa_id);
CREATE INDEX idx_sedes_activa ON setubalai.sedes(empresa_id, activa);

-- Seed demo
INSERT INTO setubalai.sedes (empresa_id, nombre, direccion, ciudad, horario_atencion, activa, es_principal) VALUES
(12, 'Sede Junín 2474', 'Junín 2474', 'Rosario', 
  '{"lunes": "8:00-20:00", "martes": "8:00-20:00", "miércoles": "8:00-20:00", "jueves": "8:00-20:00", "viernes": "8:00-20:00", "sábado": "8:00-13:00"}', 
  true, true),
(12, 'Sede Mendoza 1890', 'Mendoza 1890', 'Rosario',
  '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miércoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-18:00"}',
  true, false),
(13, 'Consultorio Central', 'San Martín 3456', 'Santa Fe',
  '{"lunes": "7:00-21:00", "martes": "7:00-21:00", "miércoles": "7:00-21:00", "jueves": "7:00-21:00", "viernes": "7:00-21:00", "sábado": "8:00-14:00"}',
  true, true);

COMMIT;
```

---

## ✅ PASO 2.2: Crear Tabla `turnos`
**Tiempo estimado:** 2 horas

### SQL:
**Archivo:** `backend/migrations/fase2/02-create-turnos.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS setubalai.turnos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  -- Referencias
  producto_id INTEGER NOT NULL REFERENCES setubalai.productos(id),
  cliente_id INTEGER NOT NULL REFERENCES setubalai.clientes(id),
  profesional_id INTEGER REFERENCES setubalai.profesionales(id),
  sede_id INTEGER REFERENCES setubalai.sedes(id),
  
  -- Fecha y hora
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'confirmado',
  -- Estados: confirmado, reagendado, cancelado, completado, no_asistio
  
  -- Datos adicionales
  observaciones TEXT,
  recordatorio_enviado BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_turnos_empresa ON setubalai.turnos(empresa_id);
CREATE INDEX idx_turnos_fecha ON setubalai.turnos(fecha_hora);
CREATE INDEX idx_turnos_estado ON setubalai.turnos(empresa_id, estado);
CREATE INDEX idx_turnos_profesional ON setubalai.turnos(profesional_id, fecha_hora);

-- Constraint: No se pueden superponer turnos del mismo profesional
CREATE UNIQUE INDEX idx_turnos_no_overlap ON setubalai.turnos(profesional_id, fecha_hora)
  WHERE estado NOT IN ('cancelado', 'no_asistio');

COMMENT ON COLUMN setubalai.turnos.estado IS 
  'confirmado | reagendado | cancelado | completado | no_asistio';

COMMIT;
```

---

## ✅ PASO 2.3-2.7: [Continúa con más tablas: estudios_realizados, archivos_estudio, portal_resultados, consultorios, recetas]

*(Dado el límite de espacio, estas secciones seguirían el mismo patrón: SQL + Seed + Validación)*

---

# FASE 3: MÓDULO LOGÍSTICA
**Duración:** 5 días

## ✅ PASO 3.1: Crear Tabla `ordenes_servicio`
## ✅ PASO 3.2: Crear Tabla `vehiculos`
## ✅ PASO 3.3: Crear Tabla `evidencias_servicio`
## ✅ PASO 3.4: Crear Tabla `tarifas_servicios`

*(Similar estructura a Fase 2)*

---

# FASE 4: FRONTEND ADAPTATIVO
**Duración:** 7 días

## ✅ PASO 4.1: Componente Dinámico según Módulo
## ✅ PASO 4.2: Calendario de Turnos
## ✅ PASO 4.3: Mapa GPS para Logística
## ✅ PASO 4.4: Portal de Resultados Paciente

---

# FASE 5: AGENTE IA MULTI-RUBRO
**Duración:** 5 días

## ✅ PASO 5.1: Skill `setubalai-modulo-salud`
## ✅ PASO 5.2: Skill `setubalai-modulo-logistica`
## ✅ PASO 5.3: Detección Automática de Módulo
## ✅ PASO 5.4: Comandos NL Contextuales

---

## 📊 TRACKING GENERAL

**Archivo:** `PROGRESS.md`

```markdown
# PROGRESO PLAN MAESTRO

## FASE 0: PREPARACIÓN ⬜
- [ ] 0.1 Auditoría BD
- [ ] 0.2 Estructura proyecto
- [ ] 0.3 Congelar datos demo

## FASE 1: NÚCLEO UNIVERSAL ⬜
- [ ] 1.1 Extender productos
- [ ] 1.2 Crear profesionales
- [ ] 1.3 Crear empresa_config
- [ ] 1.4 API endpoints

## FASE 2: MÓDULO SALUD ⬜
- [ ] 2.1 Sedes
- [ ] 2.2 Turnos
- [ ] 2.3 Estudios realizados
- [ ] 2.4 Portal resultados
- [ ] 2.5 Frontend turnos

## FASE 3: MÓDULO LOGÍSTICA ⬜
- [ ] 3.1 Órdenes servicio
- [ ] 3.2 Vehículos
- [ ] 3.3 Evidencias
- [ ] 3.4 Frontend GPS

## FASE 4: FRONTEND ADAPTATIVO ⬜
- [ ] 4.1 Detección módulo
- [ ] 4.2 UI dinámica
- [ ] 4.3 Componentes especializados

## FASE 5: AGENTE IA ⬜
- [ ] 5.1 Skills por módulo
- [ ] 5.2 Comandos NL
- [ ] 5.3 Testing E2E
```

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Revisar este plan** contigo, Pablo
2. **Ajustar prioridades** si alguna fase debe acelerarse
3. **Ejecutar FASE 0** (auditoría)
4. **Checkpoint GO/NO-GO** antes de empezar modificaciones

**¿Comenzamos con FASE 0 ahora mismo?**
