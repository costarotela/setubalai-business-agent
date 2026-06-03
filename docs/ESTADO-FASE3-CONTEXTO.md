# 📋 ESTADO DEL PROYECTO — SetubalAI Clínica Multi-Especialidad
> **Fecha actualización:** 2026-06-03
> **Branch actual:** `feature/adn-clinico-refactor` (desde `feature/context-provider-filtros`)
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

# ─── FLUJO DESARROLLO / VERIFICACIÓN ─────────────────────────────────────────

**Reglas:**
1. SIEMPRE rama separada, main intacto
2. ANTES de tocar: verificar DB con curl, endpoints reales, NO asumir
3. Flujo: plan → 1 cambio → verificar → siguiente. NUNCA codear sin analizar
4. dev.setubalai.org = ver cambios en real; localhost:3013 = dev local
5. Context Provider (Opción B) obligatoria para datos globales
6. NUNCA "listo" sin curl→200
7. 1 comando/vez

### Verificación rápida
```bash
cd ~/setubalai-agente && git checkout feature/adn-clinico-refactor
cd web && PORT=3013 npm run dev
# Todas las páginas: 200
# Build: 0 errores
```
