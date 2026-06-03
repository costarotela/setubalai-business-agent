# SETUBALAI - SISTEMA CLÍNICO MULTIESPECIALIDAD

**Última actualización:** 2026-06-03  
**Propósito:** Mapeo integral del sistema — DB, Backend, Frontend, Context Provider — UNA sola fuente de verdad.

---

## 1. PRINCIPIO ARQUITECTÓNICO

```
empresa_id=16 (Centro Médico Santa Clara)
    │
    ├── especialidades_medicas (5 filas)        ← Jerarquía NIVEL 1
    │   └── medico_especialidades (M:N)         ← Jerarquía NIVEL 2
    │       └── medicos (5 filas)               ← Jerarquía NIVEL 3
    │           ├── grillas_medicas (12 filas)   ← Horarios
    │           └── visitas (47 filas)           ← Turnos
    │               └── pacientes (9 por médico)  ← Pacientes atendidos
    │
    └── obras_sociales (8 filas)
        └── pacientes (21 filas)
```

### Regla de Oro Reactiva
```
especialidad_id seleccionado → filtra médicos de ESA especialidad → filtra turnos/pacientes de ESOS médicos
```

**NUNCA filtrar sin pasar por esta jerarquía.** Cada componente clínico lee del `FiltrosClinicaContext`, NO hace su propio fetch.

---

## 2. BASE DE DATOS (31 tablas, 25 con datos)

### 2.1 Dominio Clínico (MÉDICO) — CON DATOS

| Tabla | Filas | Propósito | FK clave |
|-------|-------|-----------|----------|
| `empresa` | 15+ | Empresas/clínicas (SaaS) | — |
| `usuarios` | 6 | Auth (admin, médico, superadmin) | empresa_id |
| `especialidades_medicas` | 5 | Cardiología, Traumatología, Pediatría, Dermatología, Clínica Médica | empresa_id |
| `medicos` | 5 | Profesionales (nombre, apellido, JSONB horarios) | empresa_id, usuario_id |
| `medico_especialidades` | 5 | M:N — link médico→especialidad | medico_id + especialidad_id |
| `grillas_medicas` | 12 | Horarios semanales (dia, hora_inicio, hora_fin) | medico_id, empresa_id |
| `duracion_prestaciones` | 5 | Minutos de turno por especialidad | especialidad_id, empresa_id |
| `bloqueos_grilla` | 0 | Vacaciones/congresos | medico_id, empresa_id |
| `pacientes` | 21 | Personas atendidas (DNI, datos, obra_social) | empresa_id, obra_social_id, telegram_chat_id |
| `visitas` | 47 | Turnos/consultas (31 pendientes, 8 cancelados, 5 completados, 2 en-curso, 1 en_curso) | medico_id, paciente_nuevo_id, especialidad_id, empresa_id |
| `obras_sociales` | 8 | OSDE, Swiss Medical, PAMI, IOMA, Particular, Galeno, Medifé, IAPOS | empresa_id |
| `atenciones_medicas` | 12 | Registro consulta médica (diagnóstico, signos vitales) | visita_id, medico_id, paciente_nuevo_id |
| `historia_clinica` | 35 | Historia clínica por paciente | paciente_nuevo_id, empresa_id |
| `practicas_medicas` | 31 | Prácticas/estudios facturables | paciente_nuevo_id, medico_id, visita_id |
| `nomenclador_practicas` | 18 | Catálogo de prácticas (códigos NABON) | especialidad_requerida |
| `recetas` | 8 | Recetas médicas (JSONB medicamentos) | paciente_nuevo_id, medico_id |
| `estudios_adjuntos` | 10 | Archivos de estudios vinculados | paciente_nuevo_id, consulta_id |

### 2.2 Dominio CRM (COMERCIAL) — MAYORMENTE VACÍO (NO MVP)

| Tabla | Filas | Estado |
|-------|-------|--------|
| `clientes` | 20 | ⚠️ Legado CRM — NO usar para pacientes |
| `categorias_productos` | 0 | Inactivo |
| `productos` | 0 | Inactivo |
| `proveedores` | 0 | Inactivo |
| `facturas` | 0 | Inactivo |
| `ordenes_compra` | 0 | Inactivo |
| `tickets` | 0 | Inactivo |
| `interacciones` | 0 | Inactivo |
| `contactos` | 0 | Inactivo |
| `notificaciones_programadas` | 0 | Sin usar |
| `audit_log` | 0 | Sin usar |

### 2.3 Datos de Ejemplo

```
Especialidades (ID → Nombre → Color → Duración):
  1 → Cardiología    → #EF4444 → 30min
  2 → Traumatología  → #3B82F6 → 45min
  3 → Pediatría      → #10B981 → 20min
  4 → Dermatología   → #F59E0B → 30min
  7 → Clínica Médica → #8B5CF6 → 30min

Médicos (ID → Especialidad → Grilla → Pacientes atendidos → Turnos):
  1 → María García      → Clínica Médica    → Lun/Mar 09-13,15-19  → 9 pacientes → 13 turnos
  2 → Carlos Rodríguez  → Cardiología       → Lun/Mié 14-20        → 9 pacientes → 12 turnos
  3 → Juan Martínez     → Traumatología     → Mar/Jue 10-14        → 7 pacientes →  8 turnos
  4 → Ana López         → Dermatología      → Lun/Mié 08-12        → 6 pacientes →  7 turnos
  5 → Roberto Fernández → Pediatría         → Lun/Mar 15-19        → 6 pacientes →  7 turnos
```

---

## 3. BACKEND (FastAPI :3010)

### 3.1 Endpoints con Filtros Reactivos (ALINEADOS)

| Método | Endpoint | Filtros | Usa Context? | Estado |
|--------|----------|---------|-------------|--------|
| GET | `/especialidades/?empresa_id=` | — | ✅ (carga inicial) | ✅ |
| GET | `/medicos/` | `?especialidad_id=` | ✅ | ✅ |
| GET | `/pacientes/` | `?especialidad_id=&medico_id=&buscar=&obra_social=` | ✅ | ✅ |
| GET | `/turnos/` | `?especialidad_id=&medico_id=&estado=` | ✅ | ✅ |
| GET | `/calendario?mes=` | `?especialidad_id=&medico_id=&estado=` | ✅ | ✅ |
| GET | `/agenda/slots-libres` | `?empresa_id=&especialidad_id=&medico_id=&fecha_desde=&fecha_hasta=` | ✅ | ✅ |
| GET | `/agenda/timeline?fecha=` | `?especialidad_id=&medico_id=` | ✅ | ✅ |

### 3.2 Endpoints CRUD (NO requieren filtros)

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/pacientes/` | Crear paciente |
| GET | `/pacientes/{id}` | Detalle paciente |
| GET | `/pacientes/{id}/historial` | Todo: datos + HC + atenciones + prácticas + turnos |
| GET | `/pacientes/{id}/recetas/` | Recetas del paciente |
| GET | `/pacientes/{id}/estudios/` | Estudios del paciente |
| POST | `/turnos/` | Crear turno |
| PUT | `/turnos/{id}` | Editar turno |
| PUT | `/turnos/{id}/estado` | Cambiar estado |
| POST | `/turnos/{id}/cancelar` | Cancelar turno |
| DELETE | `/turnos/{id}` | Eliminar turno |
| GET | `/mis_pacientes/` | Médicos ven SOLO sus pacientes |
| GET | `/practicas_medicas/` | Listar prácticas |
| POST | `/practicas_medicas/` | Crear práctica |
| GET | `/historia_clinica/` | Listar HC |
| GET | `/nomenclador_practicas/` | Catálogo prácticas |
| POST | `/recetas/` | Crear receta |
| GET | `/recetas/{id}` | Detalle receta |
| GET | `/estudios_adjuntos/` | Listar estudios |

### 3.3 Endpoints Configuración

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| CRUD | `/configuracion-agenda/especialidades/` | Especialidades CRUD |
| CRUD | `/configuracion-agenda/profesionales/` | Médicos CRUD |
| CRUD | `/configuracion-agenda/grillas/` | Grillas CRUD |
| CRUD | `/configuracion-agenda/bloqueos/` | Bloqueos CRUD |
| CRUD | `/configuracion-agenda/duraciones/` | Duraciones CRUD |
| CRUD | `/configuracion-agenda/prestaciones/` | Prestaciones CRUD |

### 3.4 Auth

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/auth/login` | Login (form data: `username=&password=`) |
| — | `resolve_empresa_id()` | Extrae empresa_id de JWT → Header → Query → Default |

### 3.5 Routers

```
services/api/
├── main.py              # Punto de entrada — registra todos los routers
├── tenancy.py           # resolve_empresa_id (multitenant)
├── auth.py              # JWT sign/verify
├── database.py          # SQLAlchemy session
├── models.py            # ORM models
├── mcp_server.py        # MCP tools (9 médicas)
├── routers/
│   ├── salud.py         # ★ VERTICAL MÉDICO (47+ endpoints)
│   ├── turnos.py        # Slots-libres (/agenda/slots-libres)
│   ├── configuracion_agenda.py  # CRUD agenda
│   ├── especialidades.py        # CRUD especialidades
│   ├── obras_sociales.py        # CRUD obras sociales
│   └── ... otros CRM (no activos)
├── utils/
│   ├── slots_calculator.py     # Algoritmo de slots libres
│   └── ...
```

---

## 4. FRONTEND (Next.js :3013 dev)

### 4.1 Context Provider — ÚNICA Fuente de Verdad

**Archivo:** `src/contexts/FiltrosClinicaContext.tsx`

```
Carga UNA VEZ al montar (post-login):
  1. GET /especialidades/ → especialidades[]
  2. GET /medicos/        → medicos[]
  3. GET /nomenclador_practicas/ → practicas[]

Expone:
  - selectedEspecialidadId (nullable)
  - selectedMedicoId (nullable)
  - medicosFiltrados[] (= medicos filtrados por especialidad seleccionada)
  - practicasFiltradas[] (= prácticas filtradas por especialidad seleccionada)
```

**Ubicación:** `FiltrosClinicaProvider` envuelve toda la app en `shell.tsx` (dentro de `AuthProvider`).

**Jerarquía aplicada:**
```
1er select: especialidad (todas las 5)
2do select: médicos → SOLO los de esa especialidad (medicosFiltrados)
Todo lo demás se filtra en cascada
```

### 4.2 Páginas Clínicas (USAN FiltrosClinicaContext)

| Página | Ruta | Usa Context? | Usa ClinicaFilterBar? | Fetch con filtros? |
|--------|------|-------------|----------------------|-------------------|
| Agenda del Día | `/agenda/slots-libres` | ✅ | ❌ (tiene selects propios) | ✅ |
| Dashboard | `/dashboard` | ❌ | ❌ | N/A |
| Pacientes | `/pacientes` | ✅ | ✅ | ✅ |
| Turnos | `/turnos` | ✅ | ✅ | ✅ |
| Calendario | `/turnos/calendario` | ✅ | ✅ | ✅ |
| Profesionales | `/medicos` | ✅ | ❌ | ❌ (solo muestra lista) |

### 4.3 Páginas de Configuración (NO usan Context)

| Página | Ruta | Propósito |
|--------|------|-----------|
| Configuración | `/configuracion` | Empresa, categorías (CRM) |
| Especialidades | `/configuracion/especialidades` | CRUD especialidades |
| Agenda | `/configuracion/agenda` | Landing de config de agenda |
| Profesionales | `/configuracion/agenda/profesionales` | CRUD médicos |
| Grillas | `/configuracion/agenda/grillas` | CRUD horarios |
| Bloqueos | `/configuracion/agenda/bloqueos` | CRUD bloqueos |
| Duraciones | `/configuracion/agenda/duraciones` | CRUD duraciones |
| Prestaciones | `/configuracion/agenda/prestaciones` | CRUD prácticas |
| Obras Sociales | `/obras-sociales` | CRUD obras sociales |

### 4.4 Páginas NO CLÍNICAS (NO usan Context — legado CRM)

| Página | Ruta | Estado |
|--------|------|--------|
| Inicio | `/` (redirige) | CRM legacy |
| Clientes | `/clientes` | CRM legacy |
| Cobros | `/cobros` | CRM legacy |
| Productos | `/productos` | CRM legacy |
| Proveedores | `/proveedores` | CRM legacy |
| Servicios | `/servicios` | CRM legacy |
| Reportes | `/reportes` | CRM legacy |
| Nuevo Cliente | `/nuevo-cliente` | CRM legacy |
| Historia Clínica | `/historia-clinica` | ⚠️ Página suelta, no integrada |
| Nomencladores | `/nomencladores` | ⚠️ Página suelta, no integrada |
| Prácticas | `/practicas` | ⚠️ Página suelta, no integrada |

### 4.5 Componentes Compuestos

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `FiltrosClinicaProvider` | `contexts/FiltrosClinicaContext.tsx` | Context global |
| `ClinicaFilterBar` | `components/ClinicaFilterBar.tsx` | Barra visual de contexto seleccionado |
| `SelectEspecialidadMedico` | `components/SelectEspecialidadMedico.tsx` | Selects anidados (esp → médico) |
| `MedicoLink` | `components/MedicoLink.tsx` | Link a médico que setea contexto |
| `BreadcrumbNav` | `components/BreadcrumbNav.tsx` | Navegación breadcrumbs |
| `auth-context` | `app/auth-context.tsx` | Auth (login, token, user) |
| `shell.tsx` | `app/shell.tsx` | Layout + sidebar + providers |

---

## 5. FLUJO DE DATOS COMPLETO

```
┌──────────────────────────────────────────────────────────────────┐
│  LOGIN                                                           │
│  POST /auth/login → JWT {empresa_id:16, usuario, rol}           │
│  Token → localStorage → todos los fetch llevan Authorization    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  FiltrosClinicaProvider (shell.tsx) — CARGA ÚNICA               │
│  1. GET /especialidades/?empresa_id=16 → 5 especialidades       │
│  2. GET /medicos/ → 5 médicos (sin filtro)                      │
│  3. GET /nomenclador_practicas/ → 18 prácticas                  │
│                                                                  │
│  Estado global expuesto a TODAS las páginas:                    │
│    selectedEspecialidadId: null | 1 | 2 | 3 | 4 | 7             │
│    selectedMedicoId: null | 1 | 2 | 3 | 4 | 5                    │
│    medicosFiltrados[] → filtrados por especialidad              │
│    practicasFiltradas[] → filtradas por especialidad            │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  PACIENTES    │ │    TURNOS     │ │  CALENDARIO   │
│  /pacientes   │ │   /turnos     │ │ /turnos/cal   │
│               │ │               │ │               │
│ ClinicaFilter │ │ ClinicaFilter │ │ ClinicaFilter │
│ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │
│ │ Select Esp│ │ │ │ Select Esp│ │ │ │ Select Esp│ │
│ │ Select Med│ │ │ │ Select Med│ │ │ │ Select Med│ │
│ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │
│               │ │               │ │               │
│ fetch:        │ │ fetch:        │ │ fetch:        │
│ /pacientes/   │ │ /turnos/      │ │ /calendario   │
│   ?esp_id=X   │ │   ?esp_id=X   │ │   ?esp_id=X   │
│   ?med_id=Y   │ │   ?med_id=Y   │ │   ?med_id=Y   │
│   ?buscar=Z   │ │   ?estado=Z   │ │   ?mes=YYYY-MM│
│               │ │               │ │   ?estado=Z   │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND FastAPI :3010                                           │
│                                                                  │
│  resolve_empresa_id() → extrae empresa_id=16 de JWT              │
│                                                                  │
│  TODOS los endpoints filtrados por empresa_id=16                 │
│  + filtros adicionales: especialidad_id, medico_id, estado       │
│                                                                  │
│  Jerarquía aplicada en TODOS:                                    │
│    especialidad_id → JOIN medico_especialidades                  │
│                    → filtra médicos de ESA especialidad          │
│                    → filtra datos de ESOS médicos                │
│    medico_id → filtro directo en WHERE                           │
└───────┬──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│  PostgreSQL Docker: paperclip-db                                 │
│  DB: business, Schema: setubalai                                 │
│  Auth: paperclip / eoescp1441                                   │
│                                                                  │
│  31 tablas, 25 con datos                                        │
│  Empresa demo: ID 16 = Centro Médico Santa Clara                │
│  47 turnos, 21 pacientes, 5 médicos, 5 especialidades           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. HIERARQUÍA DE FILTROS (DNA DEL SISTEMA)

### Patrón para TODOS los endpoints clínicos

```python
# 1. SIEMPRE filtrar por empresa_id (vía resolve_empresa_id)
# 2. ESPECIALIDAD → va por M:N (medico_especialidades)
# 3. MÉDICO → filtro directo
# 4. ESTADO → filtro directo (solo turnos)

# PATRÓN CORRECTO (ejemplo turnos):
q = db.query(Visita).filter(Visita.empresa_id == empresa_id)
if especialidad_id:
    q = q.join(MedicoEspecialidades).filter(
        MedicoEspecialidades.especialidad_id == especialidad_id
    )
if medico_id:
    q = q.filter(Visita.medico_id == medico_id)
if estado:
    q = q.filter(Visita.estado == estado)

# PATRÓN CORRECTO (ejemplo pacientes):
q = db.query(Paciente).filter(Paciente.empresa_id == empresa_id)
if especialidad_id:
    # Pacientes que tienen visitas con médicos de ESA especialidad
    medico_ids = subquery de MedicoEspecialidades
    paciente_ids = subquery de Visitas con esos médicos
    q = q.filter(Paciente.id.in_(paciente_ids))
if medico_id:
    # Pacientes que tienen visitas con ESE médico
    paciente_ids = subquery de Visitas con ese médico
    q = q.filter(Paciente.id.in_(paciente_ids))
```

### Lo que NO hacer (anti-patrones)
1. ❌ Filtrar pacientes directamente por FK `pacientes.medico_id` — NO existe esa FK
2. ❌ Harcodear especialidad_id en el backend — debe ser query param
3. ❌ Hacer fetch duplicado en cada página — usar Context Provider
4. ❌ Filtrar en frontend después de obtener toda la data — filtrar en backend
5. ❌ Ignorar la jerarquía especialidad→médico→datos

---

## 7. INFRAESTRUCTURA

| Servicio | Puerto | Acceso | Estado |
|----------|--------|--------|--------|
| API Backend (FastAPI) | 3010 | localhost:3010 | ✅ `setubalai-api.service` |
| Web App (Next.js dev) | 3013 | dev.setubalai.org | ✅ Docker `web-clinica-dev` |
| Panel Admin | 3012 | admin.setubalai.org | ✅ `setubalai-admin.service` |
| PostgreSQL | Docker:5432 | Tailscale 100.72.101.29 | ✅ `paperclip-db` |
| Cloudflare Tunnel | — | expone dev/admin | ✅ `cloudflared` |

### Credenciales
```
Clínica: admin@centromedicosantaclara.com.ar / Pablo2024!
DB: paperclip / eoescp1441 @ localhost:5432/business
```

### Directorios
```
/home/admin/setubalai-agente/
├── services/api/              # Backend FastAPI
├── web/                       # Frontend Next.js
├── web-admin/                 # Panel Admin
├── docker-compose.dev.yml     # Compose para dev
├── migrations/                # Migraciones DB
├── scripts/                   # Utilidades (deploy, validate)
└── docs/                      # Documentación
```

---

## 8. GAP ACTUAL — Lo que falta

### 8.1 Frontend sin ClinicaFilterBar (deberían tenerla)
- **Profesionales** `/medicos` — solo muestra lista, no filtra
- **Agenda del Día** `/agenda/slots-libres` — tiene selects propios (repetición)

### 8.2 Páginas sueltas (no integradas al sidebar clínico)
- **Historia Clínica** `/historia-clinica` — debería estar dentro de Pacientes
- **Nomencladores** `/nomencladores` — módulo pendiente
- **Prácticas** `/practicas` — módulo pendiente

### 8.3 Endpoints sin filtros reactivos (NO bloquean pero deberían)
- `/mis_pacientes/` — ya filtra por médico autenticado (correcto)
- `/practicas_medicas/` — podría filtrar por especialidad/medico
- `/historia_clinica/` — podría filtrar por especialidad/medico
- `/recetas/` — podría filtrar por médico
- `/estudios_adjuntos/` — podría filtrar por médico

### 8.4 CRM Legacy (NO tocar para MVP)
Todas las páginas CRM (`/clientes`, `/cobros`, `/productos`, etc.) + tablas correspondientes. Existen pero no son parte del MVP clínico. NO BORRAR.

---

## 9. FLUJO DE DESARROLLO (REGLAS)

1. **DB → Backend → Frontend** — SIEMPRE en ese orden
2. **Context Provider primero** — antes de tocar cualquier página clínica
3. **1 cambio → curl verify → siguiente** — NUNCA batch sin validar
4. **NUNCA "listo" sin curl→200** — verificar con auth + filtros
5. **Rama separada** — main intacto siempre
6. **dev.setubalai.org = real** — NO asumir, verificar en browser
7. **NO tocar CRM legacy** — está suspendido, NO es MVP

---

## 10. CHECKLIST DE VERIFICACIÓN POR ENDPOINT

Cuando modifiques cualquier endpoint que lista datos clínicos, verificar:

```bash
# 1. Login → obtener token
curl -s -X POST http://localhost:3010/auth/login \
  -d "username=admin@centromedicosantaclara.com.ar&password=Pablo2024!"

# 2. Sin filtros → devuelve TODOS los de empresa_id=16
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3010/ENDPOINT/

# 3. Con especialidad_id → filtra por médicos de esa especialidad
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3010/ENDPOINT/?especialidad_id=1"

# 4. Con medico_id → filtra por médico directo
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3010/ENDPOINT/?medico_id=2"

# 5. Combinado → ambos filtros simultáneos
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3010/ENDPOINT/?especialidad_id=1&medico_id=2"
```

Cada test debe retornar menos o igual registros que el anterior (nunca más).
