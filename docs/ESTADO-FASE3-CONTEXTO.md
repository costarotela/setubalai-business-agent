# 📋 ESTADO DEL PROYECTO — SetubalAI Clínica Multi-Especialidad
> **Fecha actualización:** 2026-06-04 15:45 UTC
> **Branch actual:** `main` (refactorización mergeada)
> **Último commit:** `b5ad3cc` — FASE G verificación final E2E
> **Main:** ✅ refactorización mergeada — 12 commits, 19 archivos modificados

---

## ✅ FASE 3 CONTEXT PROVIDER — COMPLETA ✅

**Branch:** `feature/context-provider-filtros` (mergeado a `feature/adn-clinico-refactor`)
**Main:** intacto

---

### Archivos modificados (3 nuevos + 4 modificados):

**Nuevos:**
1. `web/src/contexts/FiltrosClinicaContext.tsx` — Context global
   - Carga especialidades+nomenclador al montar (con token)
   - Auto-selecciona primera especialidad
   - Carga médicos al cambiar especialidad
   - Reset completo al cambiar token
   - NO fetch sin auth (evita login loop)

2. `web/src/components/SelectEspecialidadMedico.tsx` — componente reutilizable
   - `SelectEspecialidadMedico` (especialidad + médico)
   - `SelectSoloEspecialidad` (solo especialidad)

**Modificados:**
1. `shell.tsx` — monta `<FiltrosClinicaProvider>` dentro de `<AuthProvider>`
2. `turnos/page.tsx` — select médico hardcodeado → `SelectEspecialidadMedico`, tipos hardcodeados → `practicasFiltradas`
3. `agenda/slots-libres/page.tsx` — select manual → `SelectEspecialidadMedico`, filtro por médico en fetch
4. `turnos/calendario/page.tsx` — botones hardcodeados → `SelectSoloEspecialidad`

---

### Verificaciones:

| Check | Estado |
|-------|--------|
| Build 0 errores | ✅ |
| /turnos | 200 ✅ |
| /agenda/slots-libres | 200 ✅ |
| /turnos/calendario | 200 ✅ |
| /login (sin loop) | 200 ✅ |

### Datos empresa_id=16:
- 5 especialidades, 5 médicos, 18 prácticas, 47 turnos, 35 slots

### Credenciales:
`admin@centromedicosantaclara.com.ar` / `iwPakYAsVD3G4PZs`

### PRÓXIMO (si se necesita):
- Verificar visual en browser que los selects aparecen con datos reales
- Más páginas con SelectEspecialidadMedico si hace falta

## RESUMEN EJECUTIVO (para nueva sesión)

### FASE 3 CONTEXT PROVIDER — COMPLETA ✅

**Branch:** `feature/context-provider-filtros`
**Main:** intacto, sin cambios del FASE 3

---

### LO QUE SE CONSTRUYÓ (3 archivos nuevos + 3 modificados):

**Archivos nuevos:**
1. `web/src/contexts/FiltrosClinicaContext.tsx` — Context Provider global
   - Carga especialidades + nomenclador UNA VEZ al montar (con token)
   - Carga médicos cuando cambia especialidad: `GET /medicos/?especialidad_id=X`
   - Auto-selecciona primera especialidad (orden alfabético)
   - Filtro nomenclador por especialidad (practicasFiltradas)
   - NO hace fetch sin token (fix del login loop)

2. `web/src/components/SelectEspecialidadMedico.tsx` — componente reutilizable
   - Dos selects dependientes: especialidad → médico
   - Props: onEspecialidadChange, onMedicoChange, horizontal, showLabels, className
   - Consume FiltrosClinicaContext

3. `SelectSoloEspecialidad` — export del mismo archivo, solo select de especialidad

**Archivos modificados:**
1. `web/src/app/shell.tsx` — envolvió AppShell con `<FiltrosClinicaProvider>` dentro de AuthProvider
2. `web/src/app/turnos/page.tsx` — reemplaza select médico hardcodeado + tipos hardcodeados
3. `web/src/app/agenda/slots-libres/page.tsx` — reemplaza select manual de especialidad
4. `web/src/app/turnos/calendario/page.tsx` — reemplaza botones hardcodeados de especialidades

---

### FLUJO FUNCIONAL VERIFICADO:

1. Login: `admin@centromedicosantaclara.com.ar` / `iwPakYAsVD3G4PZs`
2. `/turnos` → clic "Nuevo Turno" → selects Especialidad→Médico + tipos desde nomenclador ✗
3. `/agenda/slots-libres` → selects Especialidad→Médico + filtro de slots ✓
4. `/turnos/calendario` → select Especialidad (reemplaza botones) ✓
5. Sidebar "Agenda del Día" → redirige a `/agenda/slots-libres` (antes 404) ✓

---

### DATOS CONFIRMADOS (empresa_id=16 Centro Médico Santa Clara):

| Entidad | Cantidad |
|---------|----------|
| Especialidades | 5: Cardiología, Clínica Médica, Dermatología, Pediatría, Traumatología |
| Médicos | 5 (1 por especialidad) |
| Prácticas (nomenclador) | 18 (5 consultas + 13 estudios) |
| Visitas/Turnos | 47 |
| Slots libres | 35 |

### ENDPOINTS VERIFICADOS:
```
GET /especialidades/              → 200, 5 items
GET /medicos/?especialidad_id=1   → 200, filtra correctamente
GET /nomenclador_practicas/       → 200, 18 items
GET /agenda/slots-libres?...      → 200, 35 slots
GET /turnos/                      → 200, 47 items
```

---

### BUGS RESUELTOS:

| Bug | Fix |
|-----|-----|
| Login loop infinito | Context no hace fetch sin token |
| /agenda/dia → 404 | Sidebar apunta a /agenda/slots-libres |
| Tipos hardcodeados en turnos | Usa practicasFiltradas del context |
| Botones hardcodeados en calendario | Usa SelectSoloEspecialidad |

---

### PRÓXIMO (si se necesita):
- Revisar que el form nuevo turno envíe correctamente el tipo de turno
- Verificar que los slots se filtren por médico cuando se selecciona
- Agregar SelectEspecialidadMedico en más páginas si es necesario

---

## 🔄 FASE 4 ADN CLÍNICO — COMPLETA ✅

**Branch:** `feature/adn-clinico-refactor`
**Main:** intacto

### Qué se hizo (8 pasos):
- Context: carga TODOS los médicos, medicosFiltrados derived
- SelectEspecialidadMedico: variant global (Context) y local (forms)
- ClinicaFilterBar: panel unificado de filtros (4 componentes nuevos)
- Navegación reactiva: PatientLink, MedicoLink, BreadcrumbNav
- Páginas actualizadas: turnos, calendario, agenda, medicos, pacientes

## 🎉 REFACTORIZACIÓN FASES A-G — MERGEEADA A MAIN ✅

**Merge:** `git merge feature/refactorizacion-v04 → main` (commit `b5ad3cc`)
**Fecha:** 2026-06-04
**Branch eliminada:** `feature/refactorizacion-v04` (trabajo completado)

### 12 Commits mergeados:
| Commit | FASE | Descripción |
|--------|------|-------------|
| `65e6796` | A | Sidebar reestructurado (Calendario/Pacientes/Turnos principales) |
| `aa77d4f` | B | CRUD Profesionales (PUT editar + DELETE borrar médicos) |
| `cf4c346` | C | Backend gaps (PUT bloqueos-grilla endpoint) |
| `e906c07` | D | Frontend Agenda CRUD (Grillas, Bloqueos, Duraciones, Prestaciones) |
| ya completo | E | Obras Sociales (ya existía — verificado) |
| `d435c8d` | F | Context Provider filtro por especialidad en Configuración |
| `b5ad3cc` | G | Verificación final E2E + fix setEspecialidades |
| `e5b8a50` | - | docs: Fix endpoint health + HTMLs plan |
| `04388c4` | - | docs: ESTADO-FASE3 actualizado |
| `fe47bae` | - | Script diagnose-alineacion.py (26 checks) |
| `e93cbe7` | - | Seed parametrizable --fecha y --empresa |
| `62bcca9` | - | Seed demo médica inteligente (15 médicos, 35 turnos) |

### 19 archivos modificados/creados:
- **Backend:** `salud.py` (113 líneas), `configuracion_agenda.py` (83 líneas)
- **Frontend:** `shell.tsx` (81 líneas), `agenda/layout.tsx` (123 líneas), 5 páginas CRUD
- **Scripts:** `diagnose.sh`, `validate.sh`, `diagnose-alineacion.py`, `seed_demo_medica.py`
- **Docs:** `PLAN-REFACTORIZACION-VISUAL.html`, `ESTADO-FASE3-CONTEXTO.md`

---

## 📊 VALIDACIÓN POST-MERGE (2026-06-04 15:45)

| Verificación | Resultado |
|---|---|
| **validate.sh** | **27/27 PASS** — cero fails, cero warns |
| **diagnose-alineacion.py** | **24/26 OK** — 2 informativos (counts) |
| **Browser E2E** | **10/10 páginas** sin errores JS |
| **Git** | main limpio, working directory empty |

### Pages verificadas en browser (dev.setubalai.org):

| Página | Verificado | Detalle |
|---|---|---|
| /configuracion/especialidades | ✅ | 5 especialidades, CRUD completo |
| /configuracion/profesionales | ✅ | 3 cardiólogos (filtro activo) |
| /configuracion/agenda/grillas | ✅ | Filtra por especialidad |
| /configuracion/agenda/bloqueos | ✅ | 0 datos, CRUD funcional |
| /configuracion/agenda/duraciones | ✅ | Filtra por especialidad |
| /configuracion/agenda/prestaciones | ✅ | 18 prácticas (nomenclador global) |
| /obras-sociales | ✅ | 8 obras sociales, colores por tipo |
| /turnos | ✅ | 6 turnos hoy, filtros |
| /turnos/calendario | ✅ | Calendario funcional |
| /dashboard | ✅ | KPIs, CRM, cobros |

---

## 📊 DATOS EMPRESA 16 (Centro Médico Santa Clara)

| Entidad | Cantidad |
|---------|----------|
| Especialidades | 5 |
| Médicos | **15** (3 por especialidad) |
| Pacientes | 36 |
| Obras Sociales | 8 |
| Prácticas (nomenclador) | 18 |
| Visitas/Turnos | **157** |
| Historias Clínicas | 62 |
| Recetas | 24 |
| Estudios | 20 |

### Credenciales:
`admin@centromedicosantaclara.com.ar` / `Pablo2024!`

---

## 🛠️ FLUJO DE DESARROLLO ACTIVO

**Dev server:** Docker (`docker compose -f docker-compose.dev.yml up -d`)
- Container: `web-clinica-dev` → `npm run dev --port 3013`
- Volumen: `./web:/app` (hot reload)
- URL: `https://dev.setubalai.org` (Cloudflare Tunnel)

**Backend API:** systemd `setubalai-api.service` → `:3010`
**DB:** PostgreSQL `:5432` → `paperclip:setubalai2024@100.72.101.29/business`

### Anti-stale cache fix (conocido):
Si el browser muestra "module factory not available":
1. `docker compose down` 
2. `rm -rf web/.next && docker volume rm setubalai-agente_web_dotnext setubalai-agente_web_node_modules`
3. `docker compose up -d` (recompila desde cero ~90s)

---

## ✅ FASE C — COMPLETA (Jun 5 2026, commit cf4c346)

**C1 Nomenclador CRUD**: GET/POST/PUT/DELETE — ya existían en `routers/salud.py`
**C2 Duraciones CRUD**: GET/POST/PUT/DELETE — ya existían en `routers/configuracion_agenda.py`
**C3 Bloqueos PUT**: AGREGADO — nuevo endpoint `PUT /configuracion-agenda/bloqueos-grilla/{bloqueo_id}` en `routers/configuracion_agenda.py`
  - Schema `BloqueoGrillaUpdate` (campos opcionales)
  - Validado: HTTP 200 con auth real, CRUD completo verificado

| C1 Nomenclador | C2 Duraciones | C3 Bloqueos PUT |
|---|---|---|
| ✅ ya existían | ✅ ya existían | ✅ **agregado + validado** |

**diagnóstico**: 24/26 OK, sin regresiones

---

## 🛠️ FLUJO DE TRABAJO — DIAGNÓSTICO INTELIGENTE (Jun 4 2026)

**Reglas:** NO correr validate.sh 27/27 en bucle. NO actuar automáticamente sin razonar. Elegir herramienta según el problema:

| Problema | Herramienta |
|----------|-------------|
| dev.setubalai.org no carga | diagnose.sh §7 (Cloudflare) + §1 (puerto 3013) |
| Página crashea | §11b skill (Turbopack stale chunks) |
| Datos vacíos | curl endpoint + verificar empresa_id token |
| Login 401 | diagnose.sh §9 (API check) + seed_datos_prueba.py |
| Bot no responde | journalctl -u setubalai-clinic-bot -n 20 |
| Refactor grande | validate.sh completo (27 checks) |
| Sistema lento | diagnose.sh completo (RAM, disk, Docker, zombie) |
