---
name: setubalai-project-context
category: devops
description: Complete architecture, DB schema, endpoints, MCP tools, and plan status for SetubalAI Business Agent — Clínica Médica vertical.
author: Pablo (SetubalAI)
created: 2026-05-30
updated: 2026-06-01
tags: [setubalai, architecture, db, api, frontend, plan]
---

# SETUBALAI PROJECT CONTEXT — CLÍNICA MÉDICA

**Actualizado:** 2026-06-01 (auditoría completa)
**DB:** PostgreSQL 17, schema `setubalai`, 30 tablas, empresa_id=16 (Centro Médico Santa Clara)
**Backend:** FastAPI en :3010 (systemd: setubalai-api.service)
**Frontend:** Next.js dev en :3013 (dev.setubalai.org), prod en :3012
**VPS:** 100.72.101.29 | **DB Explorer:** :9991

---

## 1. BASE DE DATOS — ESTADO REAL (Jun 2026)

### ✅ Tablas creadas (30 total)

| Tabla | Registros (empresa_id=16) | Estado |
|-------|--------------------------|--------|
| `empresas` | 1 (id=16) | ✅ |
| `usuarios` | varios | ✅ |
| `medicos` | 5 | ✅ |
| `pacientes` | 5+ | ✅ |
| `visitas` | 44 | ✅ |
| `especialidades_medicas` | 5 | ✅ |
| `medico_especialidades` | 5 (M:N) | ✅ |
| `grillas_medicas` | 12 | ✅ |
| `bloqueos_grilla` | existe | ✅ |
| `duracion_prestaciones` | existe | ✅ |
| `atenciones_medicas` | existe | ✅ |
| `recetas` | existe | ✅ |
| `practicas_medicas` | existe | ✅ |
| `historia_clinica` | existe | ✅ |
| `estudios_adjuntos` | existe | ✅ |
| `nomenclador_practicas` | existe | ✅ |

### ❌ Faltan tablas del plan
- `obras_sociales` — NO existe

## 2. BACKEND ENDPOINTS — ESTADO REAL

### Routers registrados en main.py:

| Router | Prefix | Endpoints clave | Estado |
|--------|--------|-----------------|--------|
| auth | (ninguno) | /auth/login, /auth/me, /auth/users | ✅ |
| salud | (ninguno) | /medicos/, /pacientes/, /calendario, /turnos/ | ✅ |
| especialidades | /especialidades | GET (lista), POST, PUT, DELETE | ✅ |
| configuracion_agenda | /configuracion-agenda | /grillas-medicas/, /bloqueos-grilla/, /duracion-prestaciones/ | ✅ |
| turnos | /agenda | GET /agenda/slots-libres | ✅ |
| empresas | /empresas | CRUD | ✅ |
| productos | /productos | CRUD | ✅ |
| categorias | /categorias | CRUD | ✅ |
| cobros | /cobros | CRUD | ✅ |

### Endpoints que NO existen:
- `/obras-sociales/` — **NO existe** (backend ni frontend)

### Endpoints probados y funcionando:
```
GET /medicos/ → 200 (lista médicos con especialidades via M:N)
GET /especialidades/ → 200 (5 especialidades: Cardiología, Traumatología, Pediatría, Dermatología, Clínica Médica)
GET /pacientes/ → 200
GET /configuracion-agenda/grillas-medicas/ → 200 (con auth)
GET /configuracion-agenda/duracion-prestaciones/ → 200 (con auth)
GET /configuracion-agenda/bloqueos-grilla/ → 200 (con auth)
GET /agenda/slots-libres → 200 (algoritmo implementado)
POST /turnos/ → 200 (desde router salud)
```

## 3. FRONTEND — ESTADO REAL

### Páginas existentes (web/src/app/):

| Página | Ruta | Estado | Notas |
|--------|------|--------|-------|
| Login | /login | ✅ Funcional | Auth JWT |
| Dashboard | /dashboard | ✅ Shell | Contenedor principal |
| Pacientes | /pacientes | ✅ Listado | Lista de pacientes |
| Turnos | /turnos | ✅ Listado | Lista de turnos |
| Calendario | /turnos/calendario | ✅ Shell | Calendario |
| Profesionales | /medicos | ✅ Listado | Lista médicos |
| Configuración | /configuracion | ✅ CRUD | Empresa, categorías, cobros, catálogo |
| Especialidades | /configuracion/especialidades | ✅ CRUD | ABM especialidades |
| Config Agenda | /configuracion/agenda | ✅ Layout | Con tabs (profesionales, grillas, bloqueos, duraciones, prestaciones) |
| - Profesionales | /configuracion/agenda/profesionales | ✅ Lista médicos | Tema oscuro |
| - Grillas | /configuracion/agenda/grillas | ✅ Lista horarios | Tema oscuro |
| - Bloqueos | /configuracion/agenda/bloqueos | ✅ Lista bloqueos | Tema oscuro |
| - Duraciones | /configuracion/agenda/duraciones | ⚠️ Tema claro | Necesita dark mode |
| - Prestaciones | /configuracion/agenda/prestaciones | ⚠️ Placeholder | Tema claro, sin datos |
| Obras Sociales | /obras-sociales | ❌ No existe | Ni backend ni frontend |

### Sidebar actual (shell.tsx):
```
SetubalAI
├─ Dashboard       (/dashboard)
├─ Pacientes       (/pacientes)
├─ Turnos          (/turnos)
├─ Calendario      (/turnos/calendario)
├─ Profesionales   (/medicos)
│
│ ────────────────── (separator)
├─ CONFIGURACIÓN
│  ├─ Especialidades      (/configuracion/especialidades)
│  ├─ Agenda              (/configuracion/agenda) → redirect a /profesionales
│  └─ Obras Sociales      (/obras-sociales) ← SIN BACKEND
└─ Cerrar sesión
```

## 4. PROXY API (`web/src/app/api/[...path]/route.ts`)

```
Browser: fetch('/api/medicos/') → Next.js proxy → http://127.0.0.1:3010/medicos/
```

**⚠️ BUG CRÍTICO RESUELTO (Jun 2026):** `useAuthFetch` no prependía `/api/` a URLs relativas sin prefix.
- Antes: `authFetch("/medicos/")` → fetch `/medicos/` → Next.js → 308 HTML → JSON.parse falla
- Después: `authFetch("/medicos/")` → fetch `/api/medicos/` → proxy → FastAPI → JSON

Fix: línea en auth-context.tsx:
```ts
const targetUrl = url.startsWith("/") && !url.startsWith("/api") ? `${API}${url}` : url;
```

## 5. DEV FLOW (LEY INQUEBRANTABLE)

```bash
cd /home/admin/setubalai-agente/web && PORT=3013 npm run dev
# Hot reload con Turbopack. F5 = nuevo bundle.
# NUNCA: npm run build, borrar .next, restart sin causa verificada
```

**Flujo obligatorio:**
1. Verificar: `curl localhost:3013` → 200
2. Leer archivo antes de editar
3. UN cambio ≤3 líneas
4. Esperar Turbopack (auto 1-3 seg)
5. Verificar: `curl localhost:3013` → 200
6. Avisar usuario: "F5, debería verse X"

**Skill:** `vps-dev-workflow`

## 6. PLAN DE IMPLEMENTACIÓN — TRAZABILIDAD REAL

### Fase 1: Base de Datos ✅ 90% COMPLETO

| Tarea | Plan | Realidad |
|-------|------|----------|
| Crear especialidades_medicas | ✅ | ✅ 5 especialidades |
| Crear medico_especialidades | ✅ | ✅ M:N funciona |
| Modificar medicos (quitar especialidades TEXT[]) | ✅ | ✅ usa M:N |
| Modificar duracion_prestaciones | ✅ | ✅ tabla existe |
| Modificar visitas | ✅ | ✅ tiene especialidad_id, canal_reserva |
| Seed datos consistentes | ✅ | ✅ 5 médicos, 5 pacientes, 44 visitas, 12 grillas |
| **Crear obras_sociales** | ❌ Plan no incluía | ❌ **FALTA** |

### Fase 2: Backend FastAPI ✅ 80% COMPLETO

| Tarea | Plan | Realidad |
|-------|------|----------|
| Router /especialidades/ CRUD | ✅ Plan | ✅ Implementado |
| Endpoint /turnos/slots-libres | ✅ Plan | ✅ Implementado (en /agenda/slots-libres) |
| Modificar /medicos/ con M:N | ✅ Plan | ✅ usa M:N |
| Endpoint /pacientes/buscar-por-dni | ✅ Plan | ⚠️ Existe pero da 422 (validación) |
| MCP tools médicas | ✅ Plan | ? (verificar mcp_server.py) |
| **Endpoint /obras-sociales/** | ❌ No estaba | ❌ **FALTA** |

### Fase 3: Frontend 🔄 40% COMPLETO

| Tarea | Plan | Realidad |
|-------|------|----------|
| CRUD /configuracion/especialidades | ✅ | ✅ Funcional |
| Configuracion/profesionales con dropdown especialidades | ✅ | ✅ Lista médicos con especialidades |
| Componente HistoriaClinica reactivo | ✅ Plan | ? (existe HistoriaClinica.tsx?) |
| Componente TurnosDelPaciente | ✅ Plan | ❌ No encontrado |
| Componente EstudiosDelPaciente | ✅ Plan | ❌ No encontrado |
| Vista /pacientes/[id]/ con tabs | ✅ Plan | ❌ No encontrada |
| Calendario /turnos/calendario | ✅ Plan | ⚠️ Existe pero contenido? |
| Sidebar unificado | ✅ Plan | ✅ Hecho + fix flex:1 (Jun 2026) |

### Fase 4: Bot IA ❌ 0% COMPLETO

| Tarea | Plan | Realidad |
|-------|------|----------|
| Skill turnos-autonomos | ✅ Plan | ❌ No encontrada |
| MCP Server con 6 tools | ✅ Plan | ? (mcp_server.py existe) |
| Test flujo completo | ✅ Plan | ❌ No probado |
| Cron recordatorios | ✅ Plan | ❌ No configurado |

## 7. PRIORIDADES (Pablo: funcionalidad > visual)

### 🔴 CRÍTICO (bloquea funcionalidad)
1. **Obras Sociales** — backend + frontend (tabla no existe, endpoint no existe)
2. **authFetch bug** — ✅ RESUELTO (Jun 2026)
3. **Sidebar Configuración** — ✅ RESUELTO (Jun 2026)

### 🟡 ALTA (funcionalidad existente pero incompleta)
1. `/configuracion/agenda/duraciones` — tema claro, necesita dark mode
2. `/configuracion/agenda/prestaciones` — placeholder, sin datos reales
3. Componentes reactivos (HistoriaClinica, TurnosDelPaciente, EstudiosDelPaciente)
4. Vista paciente completa con tabs

### 🟢 MEDIA (mejoras)
1. Sidebar colapsable para Configuración
2. Unificar tema oscuro en todas las páginas de agenda
3. Bot IA autónomo

## 8. ERRORES CONOCIDOS — YA RESUELTOS

| Fecha | Error | Causa | Fix |
|-------|-------|-------|-----|
| May 2026 | Next.js standalone 404 chunks | output:"standalone" sin CDN | Quitar standalone, npm start |
| May 2026 | Login loop | TOKEN_KEY mismatch | Unificar key en auth-context y login |
| May 2026 | Frontend /salud/medicos/ 404 | Router salud sin prefix → ruta es /medicos/ | Corregir URL en frontend |
| Jun 2026 | Config no visible en sidebar | flex:1 en nav empujaba config fuera | overflowY:auto en aside, quitar flex:1 |
| Jun 2026 | JSON.parse error en Agenda | authFetch sin /api/ prefix → HTML en vez JSON | Auto-prepend /api/ en useAuthFetch |
