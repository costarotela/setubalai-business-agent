# 📋 ESTADO DEL PROYECTO — SetubalAI Clínica Multi-Especialidad
> **Fecha actualización:** 2026-06-04
> **Branch actual:** `feature/refactorizacion-v04` (desde main)
> **Último commit:** `e9ceecb` — FASE3: Scripts diagnose.sh + validate.sh refactor
> **Main:** intacto, sin cambios de FASE 3+

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

# ─── PENDIENTE (Jun 4 2026) ──────────────────────────────────────────────────

### 🔥 PRIORIDAD 1: Sembrado Inteligente de Demo

**Problema:** Solo 1 médico por especialidad (5 médicos / 5 especialidades). No se puede demostrar escalabilidad ni interacción real.

**Lo que se necesita:**
- Varios médicos por especialidad (3-5 por cada una = ~20-25 médicos)
- Turnos generados automáticamente para mostrar agendas llenas
- Información relacionada completa: estudios adjuntos, recetas, historia clínica, atenciones médicas
- Datos que reflejen una clínica SaaS real donde pueda escalar a cualquier otra clínica

### PRIORIDAD 2: Refactorización de páginas FASE 3/4

- /turnos — ClinicaFilterBar crashea en runtime (solo en esta página)
- /agenda/slots-libres — verificar interacción completa E2E
- /turnos/calendario — agregar componente de filtro consistente con Agenda del Día
- Componentes: ClinicaFilterBar, SelectEspecialidadMedico — asegurar consistencia en todas las páginas

### PRIORIDAD 3: Mejorar scripts de diagnóstico

- diagnose.sh — mejorar output de secciones de puertos y procesos
- validate.sh — ya funciona (27 PASS), los scripts deben dar información valiosa, no solo PASS/FAIL

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
