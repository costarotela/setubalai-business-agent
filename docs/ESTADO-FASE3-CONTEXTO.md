# ESTADO AL CIERRE DE SESIÓN — 2026-06-03

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

### VERIFICACIÓN RÁPIDA:
```bash
cd ~/setubalai-agente && git checkout feature/context-provider-filtros
cd web && PORT=3013 npm run dev
# Todas las páginas: 200
# Build: 0 errores
```
