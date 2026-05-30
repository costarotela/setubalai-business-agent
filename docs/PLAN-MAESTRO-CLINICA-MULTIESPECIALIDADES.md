# 🏥 PLAN MAESTRO: CLÍNICA MULTIESPECIALIDADES CON AGENTE IA AUTÓNOMO

**Proyecto:** SetubalAI Business Agent — Vertical Clínica Médica  
**Objetivo:** Sistema COMPLETO configurable para clínicas de múltiples especialidades con bot autónomo de turnos  
**Fecha:** 2026-05-29  
**Estado:** 📋 DOCUMENTACIÓN MAESTRA — Implementación pendiente  
**Owner:** Pablo Costa Rotela

---

## 📑 TABLA DE CONTENIDOS

1. [Visión General](#1-visión-general)
2. [Arquitectura Completa](#2-arquitectura-completa)
3. [Base de Datos — Schema Completo](#3-base-de-datos--schema-completo)
4. [Backend FastAPI — Endpoints](#4-backend-fastapi--endpoints)
5. [Frontend Next.js — Componentes Reactivos](#5-frontend-nextjs--componentes-reactivos)
6. [Bot Telegram/WhatsApp — MCP Tools](#6-bot-telegramwhatsapp--mcp-tools)
7. [Seed Datos Consistentes](#7-seed-datos-consistentes)
8. [Plan de Implementación](#8-plan-de-implementación)
9. [Trazabilidad — Qué está hecho y qué falta](#9-trazabilidad--qué-está-hecho-y-qué-falta)

---

## 1. VISIÓN GENERAL

### 1.1 ¿Qué es este sistema?

Un **sistema integral para clínicas médicas** con:

✅ **Configuración flexible** — Desde `/configuracion/` se parametriza TODO (especialidades, profesionales, horarios, obras sociales)  
✅ **Sistema reactivo** — Componentes se reutilizan en múltiples vistas (`<HistoriaClinica />` se usa en paciente, en turno, en agenda médico)  
✅ **Bot autónomo** — Paciente escribe por Telegram/WhatsApp → bot agenda turno automáticamente  
✅ **Multi-clínica** — El mismo sistema sirve para 1000 clínicas diferentes (multi-tenant)  
✅ **Historia clínica completa** — Recetas, prácticas, estudios adjuntos, todo vinculado al paciente

---

### 1.2 Jerarquía del Sistema

```
🏥 EMPRESA (Centro Médico Santa Clara)
   │
   ├─ ⚙️ CONFIGURACIÓN (subsección más importante)
   │   ├─ Especialidades Médicas (tabla maestra: Cardiología, Pediatría, etc.)
   │   ├─ Profesionales (médicos con N especialidades asignadas)
   │   ├─ Grillas Médicas (horarios semanales por médico)
   │   ├─ Bloqueos (vacaciones, congresos)
   │   ├─ Duraciones (minutos por especialidad)
   │   ├─ Prestaciones/Prácticas (nomenclador nacional)
   │   └─ Obras Sociales
   │
   ├─ 👥 PACIENTES
   │   └─ Vista integral del paciente:
   │       ├─ Datos personales
   │       ├─ Historia clínica
   │       ├─ Turnos (próximos + pasados)
   │       ├─ Atenciones médicas
   │       ├─ Recetas
   │       ├─ Prácticas médicas realizadas
   │       └─ Estudios adjuntos (RX, laboratorio, etc.)
   │
   ├─ 📅 TURNOS
   │   └─ Calendario con slots libres/ocupados (algoritmo de disponibilidad)
   │
   └─ 👨‍⚕️ PROFESIONALES
       └─ Vista del médico:
           ├─ Turnos asignados
           ├─ Estadísticas
           ├─ Agenda personal
           └─ Pacientes frecuentes
```

---

### 1.3 Flujo Completo — Paciente Agenda Turno por Bot

```
1. Paciente: "Quiero turno con cardiólogo"
   ↓
2. Bot identifica paciente por teléfono (Telegram/WhatsApp)
   ↓
3. Si NO existe → pide DNI + nombre + obra social → crea paciente
   ↓
4. Bot llama POST /turnos/slots-libres {"especialidad_id": 1, "fecha_desde": "2026-06-01"}
   ↓
5. ALGORITMO backend:
   - Busca médicos con especialidad Cardiología
   - Obtiene grillas semanales de cada médico
   - Verifica bloqueos (vacaciones)
   - Genera slots cada 30min (según duración_especialidad)
   - Descarta ocupados (JOIN con turnos existentes)
   - Retorna lista de huecos libres
   ↓
6. Bot: "Para Cardiología tengo:
         • Dr. Martínez: Lunes 9:30, 11:00, 15:00
         • Dra. López: Martes 10:00, 14:30
         ¿Cuál te conviene?"
   ↓
7. Paciente: "Lunes 9:30 con Martínez"
   ↓
8. Bot reserva → POST /turnos/ → confirma
   ↓
9. Bot: "✅ Turno confirmado: Lunes 1 Jun 9:30 con Dr. Martínez
         📍 Av. San Martín 1234, 2do piso
         Traé DNI y obra social. Te recordamos 24hs antes."
   ↓
10. Cron automático envía recordatorio 24hs antes
```

---

## 2. ARQUITECTURA COMPLETA

### 2.1 Stack Tecnológico

| Capa | Tecnología | Puerto | Estado |
|------|-----------|--------|--------|
| **Base de Datos** | PostgreSQL 17 | 5434 (Docker) | ✅ Tablas creadas |
| **Backend** | FastAPI + Python | 3010 | 🔄 Parcial (falta algoritmo slots) |
| **Frontend** | Next.js 15 + TypeScript | 3011 (prod) / 3000 (dev) | 🔄 Parcial (falta componentes reactivos) |
| **Bot** | Hermes Agent + MCP | - | ❌ Pendiente (falta MCP tools) |
| **Mensajería** | Telegram (✅) / WhatsApp (❌) | - | 🔄 Solo Telegram |
| **Memoria** | Noxem Brain-1 + Brain-2 | 3001 | ✅ Activo |

---

### 2.2 Principios de Diseño

**1. CONFIGURABLE** — Todo parametrizable desde `/configuracion/`:
- Puedo agregar/editar/eliminar especialidades
- Puedo asignar/desasignar médicos a especialidades
- Puedo modificar horarios sin tocar código

**2. REACTIVO** — Componentes embebibles:
```tsx
// Mismo componente <HistoriaClinica /> se usa en:
<HistoriaClinica paciente_id={123} modo="completo" />       // En /pacientes/123/historial
<HistoriaClinica paciente_id={123} modo="resumen" />        // En modal de turno
<HistoriaClinica paciente_id={123} modo="mini" />           // En sidebar de agenda médico
```

**3. MULTI-TENANT** — Cada empresa ve solo sus datos:
- Usuario con `empresa_id=16` solo ve pacientes de empresa 16
- Filtro automático en TODOS los endpoints: `WHERE empresa_id = current_user.empresa_id`

**4. ESCALABLE** — Mismo sistema para 1000 clínicas:
- Clínica A: 5 especialidades, 10 médicos
- Clínica B: 20 especialidades, 50 médicos
- NO requiere customización de código

---

## 3. BASE DE DATOS — SCHEMA COMPLETO

### 3.1 Tablas Existentes (28 tablas en `setubalai` schema)

✅ **CORE:**
- `empresa` — Clientes del sistema (multi-tenant)
- `usuarios` — Login (médicos, admins, secretarias)
- `pacientes` — Pacientes de la clínica

✅ **CONFIGURACIÓN:**
- `medicos` — Profesionales médicos
- `grillas_medicas` — Horarios semanales por médico
- `bloqueos_grilla` — Vacaciones, congresos
- `duracion_prestaciones` — Minutos por especialidad

✅ **OPERACIÓN:**
- `visitas` — Turnos agendados
- `atenciones_medicas` — Consultas realizadas
- `practicas_medicas` — Prácticas realizadas (facturables)
- `recetas` — Recetas emitidas
- `historia_clinica` — Historial médico del paciente
- `estudios_adjuntos` — Archivos subidos (RX, laboratorio, etc.)

✅ **SOPORTE:**
- `nomenclador_practicas` — Códigos nacionales
- `obras_sociales` (pendiente crear)

---

### 3.2 NUEVA TABLA: `especialidades_medicas` ⭐ (tabla maestra configurable)

```sql
CREATE TABLE setubalai.especialidades_medicas (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,              -- "Cardiología"
  codigo VARCHAR(20) UNIQUE,                 -- "CARDIO" (para nomencladores)
  descripcion TEXT,
  duracion_turno_default INT DEFAULT 30,     -- Minutos por defecto para esta especialidad
  color_hex VARCHAR(7) DEFAULT '#3B82F6',    -- Color para calendario
  requiere_equipos BOOLEAN DEFAULT FALSE,    -- Para diagnóstico por imágenes (futuro)
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_empresa_especialidad UNIQUE (empresa_id, nombre)
);

CREATE INDEX idx_especialidades_empresa ON setubalai.especialidades_medicas(empresa_id);
CREATE INDEX idx_especialidades_activa ON setubalai.especialidades_medicas(activa);
```

---

### 3.3 NUEVA TABLA: `medico_especialidades` (many-to-many)

```sql
CREATE TABLE setubalai.medico_especialidades (
  medico_id INT NOT NULL REFERENCES setubalai.medicos(id) ON DELETE CASCADE,
  especialidad_id INT NOT NULL REFERENCES setubalai.especialidades_medicas(id) ON DELETE CASCADE,
  fecha_desde DATE DEFAULT CURRENT_DATE,     -- Desde cuándo atiende esta especialidad
  fecha_hasta DATE,                          -- NULL = activo, fecha = dejó de atender
  PRIMARY KEY (medico_id, especialidad_id)
);

CREATE INDEX idx_medico_esp_medico ON setubalai.medico_especialidades(medico_id);
CREATE INDEX idx_medico_esp_especialidad ON setubalai.medico_especialidades(especialidad_id);
```

---

### 3.4 MODIFICAR TABLAS EXISTENTES

```sql
-- 1. QUITAR columna especialidades TEXT[] de medicos (ahora es relación)
ALTER TABLE setubalai.medicos
  DROP COLUMN IF EXISTS especialidades;

-- 2. AGREGAR especialidad_id a duracion_prestaciones
ALTER TABLE setubalai.duracion_prestaciones
  DROP COLUMN IF EXISTS especialidad,
  ADD COLUMN especialidad_id INT REFERENCES setubalai.especialidades_medicas(id) ON DELETE CASCADE;

-- 3. AGREGAR especialidad_id a visitas (turnos)
ALTER TABLE setubalai.visitas
  ADD COLUMN IF NOT EXISTS especialidad_id INT REFERENCES setubalai.especialidades_medicas(id),
  ADD COLUMN IF NOT EXISTS canal_reserva VARCHAR(20) DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS recordatorio_enviado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50);

CREATE INDEX idx_visitas_especialidad ON setubalai.visitas(especialidad_id);

-- 4. AGREGAR especialidad_id a atenciones_medicas
ALTER TABLE setubalai.atenciones_medicas
  ADD COLUMN IF NOT EXISTS especialidad_id INT REFERENCES setubalai.especialidades_medicas(id);
```

---

### 3.5 Relaciones BD — Diagrama Conceptual

```
especialidades_medicas (tabla maestra configurable)
   ↓ (many-to-many)
medico_especialidades
   ↓
medicos
   ↓
grillas_medicas (horarios semanales por médico)
bloqueos_grilla (excepciones: vacaciones)
   ↓
visitas (turnos) → algoritmo slots libres
   ↓
pacientes
   ↓
   ├─ historia_clinica (1:1)
   ├─ atenciones_medicas (1:N)
   │   ├─ recetas (1:N)
   │   └─ practicas_medicas (1:N)
   └─ estudios_adjuntos (1:N)
```

---

## 4. BACKEND FASTAPI — ENDPOINTS

### 4.1 CRUD Especialidades (nuevo router)

**Archivo:** `/services/api/routers/especialidades.py`

```python
GET    /especialidades/                    # Listar especialidades activas de la empresa
POST   /especialidades/                    # Crear nueva especialidad
GET    /especialidades/{id}                # Obtener una especialidad
PUT    /especialidades/{id}                # Actualizar especialidad
DELETE /especialidades/{id}                # Desactivar especialidad (soft delete)
GET    /especialidades/{id}/medicos        # Médicos que atienden esta especialidad
```

---

### 4.2 Algoritmo Slots Libres ⭐ (endpoint crítico)

**Archivo:** `/services/api/routers/turnos.py`

```python
POST /turnos/slots-libres
```

**Input:**
```json
{
  "especialidad_id": 1,           // Cardiología
  "medico_id": null,              // Opcional: buscar solo este médico
  "fecha_desde": "2026-06-01",
  "fecha_hasta": "2026-06-07",
  "empresa_id": 16                // Auto-inyectado desde token JWT
}
```

**Output:**
```json
{
  "slots_libres": [
    {
      "medico_id": 5,
      "medico_nombre": "Dr. Roberto Martínez",
      "especialidad": "Cardiología",
      "fecha": "2026-06-02",
      "hora": "09:30:00",
      "duracion_minutos": 30,
      "disponible": true
    },
    {
      "medico_id": 5,
      "medico_nombre": "Dr. Roberto Martínez",
      "especialidad": "Cardiología",
      "fecha": "2026-06-02",
      "hora": "10:00:00",
      "duracion_minutos": 30,
      "disponible": true
    }
    // ... más slots
  ],
  "total_slots": 42
}
```

**Algoritmo (pseudocódigo):**

```python
def calcular_slots_libres(especialidad_id, fecha_desde, fecha_hasta, empresa_id, medico_id=None):
    # 1. Buscar médicos con esa especialidad
    medicos = db.query(Medico)\
        .join(MedicoEspecialidades)\
        .filter(
            MedicoEspecialidades.especialidad_id == especialidad_id,
            Medico.empresa_id == empresa_id,
            Medico.activo == True
        )
    
    if medico_id:
        medicos = medicos.filter(Medico.id == medico_id)
    
    medicos = medicos.all()
    
    # 2. Obtener duración de turno para esta especialidad
    duracion_config = db.query(DuracionPrestacion)\
        .filter(especialidad_id == especialidad_id, empresa_id == empresa_id)\
        .first()
    
    duracion_minutos = duracion_config.duracion_minutos if duracion_config else 30
    
    slots_libres = []
    
    # 3. Para cada médico
    for medico in medicos:
        # Obtener grillas del médico
        grillas = db.query(GrillaMedica)\
            .filter(
                GrillaMedica.medico_id == medico.id,
                GrillaMedica.activo == True
            ).all()
        
        # 4. Para cada día en el rango
        fecha_actual = fecha_desde
        while fecha_actual <= fecha_hasta:
            dia_semana = fecha_actual.weekday() + 1  # 1=Lunes, 7=Domingo
            
            # Buscar grilla para este día
            grillas_dia = [g for g in grillas if g.dia_semana == dia_semana]
            
            # 5. Verificar si hay bloqueo para este día
            bloqueo = db.query(BloqueoGrilla)\
                .filter(
                    BloqueoGrilla.medico_id == medico.id,
                    BloqueoGrilla.fecha_desde <= fecha_actual,
                    BloqueoGrilla.fecha_hasta >= fecha_actual
                ).first()
            
            if bloqueo:
                fecha_actual += timedelta(days=1)
                continue  # Saltar este día
            
            # 6. Para cada franja horaria del día
            for grilla in grillas_dia:
                hora_actual = grilla.hora_inicio
                
                while hora_actual < grilla.hora_fin:
                    # 7. Verificar si este slot está ocupado
                    turno_existente = db.query(Visita)\
                        .filter(
                            Visita.medico_id == medico.id,
                            Visita.fecha == fecha_actual,
                            Visita.hora == hora_actual,
                            Visita.estado.in_(['confirmado', 'pendiente'])
                        ).first()
                    
                    if not turno_existente:
                        slots_libres.append({
                            "medico_id": medico.id,
                            "medico_nombre": f"Dr. {medico.apellido}",
                            "especialidad": especialidad_nombre,
                            "fecha": str(fecha_actual),
                            "hora": str(hora_actual),
                            "duracion_minutos": duracion_minutos,
                            "disponible": True
                        })
                    
                    # Avanzar al siguiente slot
                    hora_actual = (datetime.combine(date.today(), hora_actual) + timedelta(minutes=duracion_minutos)).time()
            
            fecha_actual += timedelta(days=1)
    
    return {"slots_libres": slots_libres, "total_slots": len(slots_libres)}
```

---

### 4.3 Otros Endpoints Críticos

```python
# Turnos
POST   /turnos/                            # Crear turno (usado por bot)
GET    /turnos/                            # Listar turnos (filtros: fecha, médico, estado)
PUT    /turnos/{id}/cancelar               # Cancelar turno
PUT    /turnos/{id}/confirmar              # Confirmar turno
POST   /turnos/{id}/enviar-recordatorio    # Enviar recordatorio manual

# Pacientes
GET    /pacientes/buscar-por-dni           # Buscar paciente por DNI (usado por bot)
POST   /pacientes/                         # Crear paciente (usado por bot)
GET    /pacientes/{id}/historia-completa   # Historia + turnos + recetas + estudios

# Estudios adjuntos
POST   /estudios/upload                    # Subir archivo (RX, laboratorio, etc.)
GET    /estudios/{id}/download             # Descargar archivo
```

---

## 5. FRONTEND NEXT.JS — COMPONENTES REACTIVOS

### 5.1 Estructura de Carpetas

```
/web/src/app/
├─ configuracion/
│  ├─ especialidades/page.tsx          # CRUD especialidades ⭐
│  ├─ profesionales/page.tsx           # CRUD médicos + asignar especialidades
│  ├─ grillas/page.tsx                 # Horarios semanales
│  ├─ bloqueos/page.tsx                # Vacaciones
│  ├─ duraciones/page.tsx              # Minutos por especialidad
│  ├─ prestaciones/page.tsx            # Nomenclador
│  └─ obras-sociales/page.tsx
│
├─ pacientes/
│  ├─ page.tsx                         # Listado
│  └─ [id]/
│      ├─ page.tsx                     # Vista integral del paciente
│      ├─ historial/page.tsx           # Historia clínica
│      ├─ turnos/page.tsx              # Turnos del paciente
│      ├─ recetas/page.tsx
│      └─ estudios/page.tsx
│
├─ turnos/
│  └─ calendario/page.tsx              # Calendario con algoritmo slots
│
├─ profesionales/
│  ├─ page.tsx                         # Listado
│  └─ [id]/
│      ├─ page.tsx                     # Vista del médico
│      └─ agenda/page.tsx              # Agenda personal
│
└─ components/                          # Componentes reactivos ⭐
   ├─ HistoriaClinica.tsx              # Embebible (3 modos: completo/resumen/mini)
   ├─ TurnosDelPaciente.tsx
   ├─ EstudiosDelPaciente.tsx
   ├─ RecetasDelPaciente.tsx
   ├─ CalendarioSlots.tsx              # Calendario interactivo
   └─ SelectorEspecialidad.tsx         # Dropdown especialidades
```

---

### 5.2 Componente Reactivo — Ejemplo: `<HistoriaClinica />`

```tsx
// /web/src/app/components/HistoriaClinica.tsx

interface HistoriaClinicaProps {
  paciente_id: number;
  modo: "completo" | "resumen" | "mini";
  editable?: boolean;
}

export function HistoriaClinica({ paciente_id, modo, editable = false }: HistoriaClinicaProps) {
  const authFetch = useAuthFetch();
  const [historia, setHistoria] = useState(null);
  
  useEffect(() => {
    authFetch(`/pacientes/${paciente_id}/historia-clinica`)
      .then(res => res.json())
      .then(setHistoria);
  }, [paciente_id]);
  
  if (modo === "mini") {
    return (
      <div className="p-2 text-sm">
        <p>🩸 {historia?.grupo_sanguineo || "N/A"}</p>
        <p>⚠️ Alergias: {historia?.alergias?.join(", ") || "Ninguna"}</p>
      </div>
    );
  }
  
  if (modo === "resumen") {
    return (
      <div className="p-4">
        <h3>Historia Clínica</h3>
        <div>Grupo sanguíneo: {historia?.grupo_sanguineo}</div>
        <div>Alergias: {historia?.alergias?.join(", ")}</div>
        <div>Medicación: {historia?.medicacion_habitual?.join(", ")}</div>
      </div>
    );
  }
  
  // modo === "completo"
  return (
    <div className="p-6">
      {/* Vista completa con formularios editables */}
    </div>
  );
}
```

**Uso en múltiples lugares:**

```tsx
// En /pacientes/[id]/historial
<HistoriaClinica paciente_id={123} modo="completo" editable={true} />

// En modal de turno
<HistoriaClinica paciente_id={123} modo="resumen" />

// En sidebar de agenda médico
<HistoriaClinica paciente_id={123} modo="mini" />
```

---

### 5.3 Sidebar Unificado (configurado por empresa)

```tsx
// /web/src/app/shell.tsx

const menuItems = [
  { icon: "📊", label: "Dashboard", href: "/dashboard" },
  {
    icon: "⚙️",
    label: "Configuración",
    children: [
      { label: "Especialidades", href: "/configuracion/especialidades" },
      { label: "Profesionales", href: "/configuracion/profesionales" },
      { label: "Grillas Médicas", href: "/configuracion/grillas" },
      { label: "Bloqueos", href: "/configuracion/bloqueos" },
      { label: "Duraciones", href: "/configuracion/duraciones" },
      { label: "Prestaciones", href: "/configuracion/prestaciones" },
      { label: "Obras Sociales", href: "/configuracion/obras-sociales" },
    ]
  },
  { icon: "👥", label: "Pacientes", href: "/pacientes" },
  { icon: "📅", label: "Turnos", href: "/turnos/calendario" },
  { icon: "👨‍⚕️", label: "Profesionales", href: "/profesionales" },
];
```

---

## 6. BOT TELEGRAM/WHATSAPP — MCP TOOLS

### 6.1 MCP Tools Necesarias

**Archivo:** `/services/api/mcp_server.py` (extender con tools médicas)

```python
@mcp.tool()
async def buscar_paciente_por_dni(dni: str, empresa_id: int) -> dict:
    """Busca un paciente por DNI en la empresa"""
    paciente = db.query(Paciente).filter(dni == dni, empresa_id == empresa_id).first()
    if paciente:
        return {"existe": True, "paciente": paciente.to_dict()}
    return {"existe": False}

@mcp.tool()
async def crear_paciente(dni: str, nombre: str, apellido: str, telefono: str, obra_social: str, empresa_id: int) -> dict:
    """Crea un nuevo paciente"""
    paciente = Paciente(
        empresa_id=empresa_id,
        dni=dni,
        nombre=nombre,
        apellido=apellido,
        telefono=telefono,
        # obra_social se guarda en metadata JSONB
    )
    db.add(paciente)
    db.commit()
    return {"success": True, "paciente_id": paciente.id}

@mcp.tool()
async def consultar_disponibilidad(especialidad_id: int, fecha_desde: str, fecha_hasta: str, empresa_id: int) -> dict:
    """Obtiene slots libres para una especialidad"""
    # Llama a la función calcular_slots_libres()
    return calcular_slots_libres(especialidad_id, fecha_desde, fecha_hasta, empresa_id)

@mcp.tool()
async def reservar_turno(paciente_id: int, medico_id: int, especialidad_id: int, fecha: str, hora: str, canal: str, empresa_id: int) -> dict:
    """Reserva un turno"""
    turno = Visita(
        empresa_id=empresa_id,
        paciente_id=paciente_id,
        medico_id=medico_id,
        especialidad_id=especialidad_id,
        fecha=fecha,
        hora=hora,
        estado="confirmado",
        canal_reserva=canal
    )
    db.add(turno)
    db.commit()
    return {"success": True, "turno_id": turno.id}

@mcp.tool()
async def cancelar_turno(turno_id: int, empresa_id: int) -> dict:
    """Cancela un turno"""
    turno = db.query(Visita).filter(id == turno_id, empresa_id == empresa_id).first()
    if turno:
        turno.estado = "cancelado"
        db.commit()
        return {"success": True}
    return {"success": False, "error": "Turno no encontrado"}
```

---

### 6.2 Skill Hermes — `turnos-autonomos`

**Archivo:** `~/.hermes/profiles/local/skills/turnos-autonomos/SKILL.md`

```markdown
---
name: turnos-autonomos
description: Gestiona turnos médicos via Telegram/WhatsApp de forma autónoma
tags: [clinica, turnos, bot, mcp]
---

# Turnos Autónomos — Skill Hermes

## Cuándo usar

Usuario escribe en Telegram/WhatsApp pidiendo turno médico.

## Flujo

1. Identificar paciente por teléfono → `buscar_paciente_por_dni()`
2. Si NO existe → pedir DNI + nombre + obra social → `crear_paciente()`
3. Identificar especialidad solicitada (NLP)
4. `consultar_disponibilidad(especialidad_id, fecha_desde, fecha_hasta)`
5. Presentar opciones al paciente
6. Cuando confirma → `reservar_turno()`
7. Enviar confirmación con detalles (dirección, qué traer, etc.)

## Ejemplo

```
Usuario: "Quiero turno con cardiólogo"
Bot: "Hola! Para buscar tu historial, ¿me das tu DNI?"
Usuario: "28345678"
Bot: [buscar_paciente_por_dni(28345678)]
     → No existe
     "Perfecto! Ahora tu nombre completo:"
Usuario: "María García"
Bot: "¿Tenés obra social?"
Usuario: "OSDE"
Bot: [crear_paciente(dni=28345678, nombre="María García", obra_social="OSDE")]
     [consultar_disponibilidad(especialidad_id=1, fecha_desde=hoy, fecha_hasta=+7días)]
     
     "Para Cardiología tengo:
      • Dr. Martínez: Lunes 9:30, 11:00, 15:00
      • Dra. López: Martes 10:00, 14:30
      ¿Cuál te conviene?"
      
Usuario: "Lunes 9:30 con Martínez"
Bot: [reservar_turno(paciente_id=123, medico_id=5, fecha="2026-06-02", hora="09:30", canal="telegram")]
     
     "✅ Turno confirmado:
      📅 Lunes 2 de Junio - 9:30hs
      👨‍⚕️ Dr. Roberto Martínez (Cardiología)
      📍 Av. San Martín 1234, 2do piso
      
      Traé tu DNI y credencial de OSDE.
      Te recordaremos 24hs antes.
      
      Para cancelar, respondé 'cancelar turno'"
```
```

---

## 7. SEED DATOS CONSISTENTES

**Archivo:** `/services/api/migrations/007_seed_clinica_completa.sql`

```sql
-- ============================================================
-- SEED COMPLETO: CLÍNICA MULTIESPECIALIDADES
-- Empresa ID: 16 (Centro Médico Santa Clara - Demo)
-- ============================================================

BEGIN;

-- 1. ESPECIALIDADES MÉDICAS (3 especialidades demo)
INSERT INTO setubalai.especialidades_medicas (empresa_id, nombre, codigo, duracion_turno_default, color_hex) VALUES
(16, 'Cardiología', 'CARDIO', 30, '#EF4444'),
(16, 'Traumatología', 'TRAUMA', 45, '#3B82F6'),
(16, 'Pediatría', 'PEDIATRIA', 20, '#10B981');

-- 2. MEDICOS (5 médicos demo)
-- Dr. Roberto Martínez - Cardiólogo
-- Dra. María García - Traumatóloga
-- Dr. Carlos Rodríguez - Dermatólogo
-- Dra. Ana López - Pediatra
-- Dr. Roberto Fernández - Clínico
(ya existen en setubalai.medicos, ids 1-5)

-- 3. ASIGNAR ESPECIALIDADES A MÉDICOS (many-to-many)
INSERT INTO setubalai.medico_especialidades (medico_id, especialidad_id) VALUES
(1, 1),  -- Dr. Martínez → Cardiología
(2, 2),  -- Dra. García → Traumatología
(4, 3),  -- Dra. López → Pediatría
(5, 1);  -- Dr. Fernández → Cardiología (2do cardiólogo)

-- 4. GRILLAS MÉDICAS (8 grillas demo)
INSERT INTO setubalai.grillas_medicas (empresa_id, medico_id, dia_semana, hora_inicio, hora_fin, activo) VALUES
-- Dr. Martínez (Cardio): Lunes y Miércoles
(16, 1, 1, '09:00', '13:00', TRUE),  -- Lunes mañana
(16, 1, 1, '15:00', '19:00', TRUE),  -- Lunes tarde
(16, 1, 3, '09:00', '13:00', TRUE),  -- Miércoles mañana

-- Dra. García (Trauma): Martes y Jueves
(16, 2, 2, '08:00', '13:00', TRUE),  -- Martes
(16, 2, 4, '08:00', '13:00', TRUE),  -- Jueves

-- Dra. López (Pediatría): Lunes, Miércoles, Viernes
(16, 4, 1, '14:00', '18:00', TRUE),  -- Lunes tarde
(16, 4, 3, '14:00', '18:00', TRUE),  -- Miércoles tarde
(16, 4, 5, '09:00', '13:00', TRUE);  -- Viernes mañana

-- 5. BLOQUEOS (1 bloqueo demo)
INSERT INTO setubalai.bloqueos_grilla (empresa_id, medico_id, fecha_desde, fecha_hasta, motivo) VALUES
(16, 2, '2026-06-15', '2026-06-20', 'Congreso de Traumatología - Buenos Aires');

-- 6. DURACIONES POR ESPECIALIDAD
INSERT INTO setubalai.duracion_prestaciones (empresa_id, especialidad_id, duracion_minutos) VALUES
(16, 1, 30),  -- Cardiología: 30min
(16, 2, 45),  -- Traumatología: 45min
(16, 3, 20);  -- Pediatría: 20min

-- 7. PACIENTES DEMO (2 pacientes)
INSERT INTO setubalai.pacientes (empresa_id, nombre, apellido, dni, fecha_nacimiento, telefono, email) VALUES
(16, 'Juan', 'Pérez', '28345678', '1985-03-15', '3425291558', 'juan.perez@email.com'),
(16, 'María', 'González', '32456789', '1990-07-22', '3426123456', 'maria.gonzalez@email.com');

-- 8. HISTORIA CLÍNICA (2 historias)
INSERT INTO setubalai.historia_clinica (empresa_id, paciente_id, grupo_sanguineo, alergias, medicacion_habitual) VALUES
(16, 1, 'A+', ARRAY['Penicilina'], ARRAY['Losartán 50mg']),
(16, 2, 'O-', ARRAY[], ARRAY[]);

-- 9. TURNOS DEMO (3 turnos: 2 confirmados, 1 pendiente)
INSERT INTO setubalai.visitas (empresa_id, paciente_id, medico_id, especialidad_id, fecha, hora, estado, motivo, canal_reserva) VALUES
(16, 1, 1, 1, '2026-06-02', '09:30', 'confirmado', 'Control cardiológico', 'telegram'),
(16, 1, 2, 2, '2026-06-10', '10:00', 'confirmado', 'Dolor rodilla', 'web'),
(16, 2, 4, 3, '2026-06-05', '14:30', 'pendiente', 'Control pediátrico', 'whatsapp');

-- 10. ATENCION MEDICA (1 atención pasada)
INSERT INTO setubalai.atenciones_medicas (empresa_id, paciente_id, medico_id, especialidad_id, visita_id, fecha_atencion, diagnostico, tratamiento, presion_arterial, peso) VALUES
(16, 1, 1, 1, NULL, '2026-05-15', 'Hipertensión arterial leve', 'Continuar con Losartán 50mg diario. Control en 3 meses.', '140/90', 78.5);

-- 11. RECETA (1 receta demo)
INSERT INTO setubalai.recetas (empresa_id, atencion_medica_id, paciente_id, medico_id, medicamentos, indicaciones, valida_hasta) VALUES
(16, 1, 1, 1, 
 '[{"nombre": "Losartán", "dosis": "50mg", "frecuencia": "1 vez al día"}]'::jsonb,
 'Tomar en ayunas por la mañana. No suspender sin consultar.',
 '2026-08-15');

-- 12. ESTUDIO ADJUNTO (1 estudio demo)
INSERT INTO setubalai.estudios_adjuntos (empresa_id, paciente_id, tipo_estudio, descripcion, fecha_estudio, archivo_nombre, archivo_url, archivo_tipo) VALUES
(16, 1, 'Electrocardiograma', 'ECG de control', '2026-05-15', 'ecg_perez_20260515.pdf', '/estudios/16/ecg_perez_20260515.pdf', 'application/pdf');

COMMIT;
```

---

## 8. PLAN DE IMPLEMENTACIÓN

### Fase 1: Base de Datos (1 día)

**Tareas:**
1. ✅ Crear tabla `especialidades_medicas`
2. ✅ Crear tabla `medico_especialidades`
3. ✅ Modificar `medicos` (quitar especialidades TEXT[])
4. ✅ Modificar `duracion_prestaciones` (agregar especialidad_id FK)
5. ✅ Modificar `visitas` (agregar especialidad_id, canal_reserva, recordatorio_enviado)
6. ✅ Seed datos consistentes (script SQL completo)

**Validación:**
```bash
docker exec paperclip-db psql -U paperclip -d business -c "
  SELECT e.nombre, COUNT(me.medico_id) as total_medicos
  FROM setubalai.especialidades_medicas e
  LEFT JOIN setubalai.medico_especialidades me ON e.id = me.especialidad_id
  WHERE e.empresa_id = 16
  GROUP BY e.nombre;
"
# Debe retornar:
#  nombre       | total_medicos
# --------------+--------------
#  Cardiología  | 2
#  Traumatología| 1
#  Pediatría    | 1
```

---

### Fase 2: Backend FastAPI (2 días)

**Tareas:**
1. ✅ Router `/especialidades/` (CRUD completo)
2. ✅ Endpoint `/turnos/slots-libres` (algoritmo slots)
3. ✅ Modificar `/medicos/` para usar many-to-many con especialidades
4. ✅ Endpoint `/pacientes/buscar-por-dni`
5. ✅ MCP tools médicas (6 tools)

**Validación:**
```bash
# Test algoritmo slots libres
curl -X POST "http://localhost:3010/turnos/slots-libres" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"especialidad_id": 1, "fecha_desde": "2026-06-01", "fecha_hasta": "2026-06-07"}'

# Debe retornar 20-30 slots libres para Cardiología
```

---

### Fase 3: Frontend (3 días)

**Tareas:**
1. ✅ CRUD `/configuracion/especialidades`
2. ✅ Modificar `/configuracion/profesionales` (asignar especialidades con dropdown)
3. ✅ Componente reactivo `<HistoriaClinica modo="completo|resumen|mini" />`
4. ✅ Componente reactivo `<TurnosDelPaciente />`
5. ✅ Componente reactivo `<EstudiosDelPaciente />`
6. ✅ Vista `/pacientes/[id]/` con tabs (datos, historia, turnos, recetas, estudios)
7. ✅ Calendario `/turnos/calendario` con slots verdes/rojos
8. ✅ Sidebar unificado (quitar Productos, Servicios, Proveedores, Cobros, Reportes)

**Validación:**
- Login como admin@centromedicosantaclara.com.ar
- `/configuracion/especialidades` → ver 3 especialidades
- Agregar nueva especialidad "Oftalmología" → guardar → refrescar → debe aparecer
- `/profesionales/` → ver 5 médicos con especialidades asignadas
- `/pacientes/1/` → ver tabs completos con datos del seed

---

### Fase 4: Bot Telegram/WhatsApp (2 días)

**Tareas:**
1. ✅ Skill `turnos-autonomos` en Hermes
2. ✅ MCP Server con 6 tools médicas
3. ✅ Test flujo completo: "Quiero turno con cardiólogo" → reserva exitosa
4. ✅ Cron recordatorios 24hs antes (cronjob action='create')

**Validación:**
- Enviar mensaje Telegram a bot: "Quiero turno con cardiólogo"
- Bot debe pedir DNI → nombre → obra social → mostrar slots libres
- Confirmar slot → bot reserva → verificar en `/turnos/`

---

## 9. TRAZABILIDAD — QUÉ ESTÁ HECHO Y QUÉ FALTA

### ✅ COMPLETADO (28 tablas BD + backend parcial)

| Componente | Estado | Detalles |
|------------|--------|----------|
| **PostgreSQL 17** | ✅ COMPLETO | 28 tablas en schema `setubalai` |
| **Tablas core** | ✅ COMPLETO | empresa, usuarios, pacientes, medicos |
| **Grillas + bloqueos** | ✅ COMPLETO | grillas_medicas, bloqueos_grilla, duracion_prestaciones |
| **Operación clínica** | ✅ COMPLETO | visitas, atenciones_medicas, recetas, practicas_medicas, historia_clinica, estudios_adjuntos |
| **Backend FastAPI** | 🔄 PARCIAL | CRUD médicos, pacientes, turnos (SIN algoritmo slots) |
| **Auth JWT** | ✅ COMPLETO | Login multi-tenant, roles, token validation |
| **Frontend Next.js** | 🔄 PARCIAL | Login, dashboard, listados (SIN componentes reactivos) |
| **Seed datos** | 🔄 PARCIAL | 5 médicos, 2 pacientes (SIN especialidades ni grillas consistentes) |

---

### ❌ FALTANTE (crítico para que funcione)

| Componente | Prioridad | Estimado |
|------------|-----------|----------|
| **Tabla `especialidades_medicas`** | 🔴 CRÍTICA | 1 hora |
| **Tabla `medico_especialidades`** | 🔴 CRÍTICA | 30 min |
| **Modificar tablas existentes** (medicos, duracion_prestaciones, visitas) | 🔴 CRÍTICA | 1 hora |
| **Seed completo consistente** | 🔴 CRÍTICA | 2 horas |
| **Algoritmo `/turnos/slots-libres`** | 🔴 CRÍTICA | 4 horas |
| **CRUD `/especialidades/`** | 🔴 CRÍTICA | 3 horas |
| **Frontend `/configuracion/especialidades`** | 🟡 ALTA | 3 horas |
| **Componentes reactivos** (HistoriaClinica, TurnosDelPaciente, etc.) | 🟡 ALTA | 8 horas |
| **MCP tools médicas** | 🟡 ALTA | 4 horas |
| **Skill `turnos-autonomos`** | 🟡 ALTA | 3 horas |
| **Sidebar unificado** (quitar secciones comerciales) | 🟢 MEDIA | 1 hora |
| **Cron recordatorios** | 🟢 MEDIA | 2 horas |

**TOTAL ESTIMADO:** ~32 horas de desarrollo (~4 días laborables)

---

### 📊 PROGRESO VISUAL

```
FASE A: BASE DE DATOS
[███████░░░] 70% — Tablas existen, falta especialidades + relaciones

FASE B: BACKEND
[████░░░░░░] 40% — CRUD básico funciona, falta algoritmo slots

FASE C: FRONTEND
[███░░░░░░░] 30% — Login + listados OK, falta componentes reactivos

FASE D: BOT
[░░░░░░░░░░]  0% — No empezado
```

---

## 📝 DOCUMENTOS DE REFERENCIA

### Alineados (mantener como base)
1. ✅ `ARQUITECTURA-AGENTE-TURNOS-AUTONOMOS.md` — Algoritmo slots, bot
2. ✅ `ANALISIS_PACIENTES_VS_CLIENTES.md` — Diferencia conceptual
3. ✅ `PLAN-CALENDARIO-GRILLAS.md` — Grillas, bloqueos, duraciones
4. ✅ `FLUJO-TELEGRAM-TURNOS-COMPLETO.md` — Bot Telegram turnos
5. ✅ `FLUJO-E2E-TELEGRAM-CLINICA.html` — Flujo paciente completo
6. ✅ `FLUJO-CENTRO-MEDICO.html` — Diagrama flujo clínica
7. ✅ `mockup-historia-clinica-paciente.html` — Vista historia clínica

### Actualizar (tienen valor pero desalineados)
1. 🔄 `PLAN-MAESTRO-ARQUITECTURA-MODULAR.md` — Actualizar a solo CLÍNICA
2. 🔄 `ANALISIS-SERVICIOS-FLEXIBILIDAD.md` — Extraer solo clínica
3. 🔄 `ARQUITECTURA-SAAS.md` — Quitar productos comerciales
4. 🔄 `PROGRESO-MVP-CENTRO-MEDICO.md` — Actualizar estado actual

### Archivados (obsoletos o desalineados)
📦 `/docs/archived/2026-05-29-pre-unificacion/` (9 documentos movidos)

---

## 🎯 PRÓXIMOS PASOS

### INMEDIATO (antes de codear)
1. ✅ **Auditar documentación** — Mover desalineados a archived
2. ✅ **Crear documento maestro unificado** — Este archivo
3. ⏳ **Confirmar con Pablo** — Aprobar antes de tocar código

### DESPUÉS (orden de ejecución)
1. **Fase 1: BD** — Especialidades + relaciones (1 día)
2. **Fase 2: Backend** — Algoritmo slots + MCP (2 días)
3. **Fase 3: Frontend** — Componentes reactivos (3 días)
4. **Fase 4: Bot** — Skill Hermes + tests (2 días)

---

**FIN DEL PLAN MAESTRO**

_Última actualización: 2026-05-29_  
_Autor: Hermes Agent (aprobado por Pablo)_
