# ANÁLISIS INTEGRAL — Refactorización del Sistema Clínico

**Fecha:** 2026-06-03  
**Propósito:** Preservar TODO el análisis previo a la refactorización para NO perder contexto.

---

## 1. MAPEO DEL SISTEMA ACTUAL (VERIFICADO)

### 1.1 Jerarquía (DNA del sistema)
```
empresa_id=16 (Centro Médico Santa Clara)
├── especialidades_medicas (5): Cardiología(1), Traumatología(2), Pediatría(3), Dermatología(4), Clínica Médica(7)
├── medicos (5): cada uno con 1 especialidad vía M:N
│   ├── María García(1) → Clínica Médica
│   ├── Carlos Rodríguez(2) → Cardiología
│   ├── Juan Martínez(3) → Traumatología
│   ├── Ana López(4) → Dermatología
│   └── Roberto Fernández(5) → Pediatría
├── grillas_medicas (12): horarios semanales por médico
├── visitas (47): 31 pendiente, 8 cancelado, 5 completado, 2 en-curso, 1 en_curso
├── pacientes (21): 6-9 únicos por médico
│   ├── atenciones_medicas (12)
│   ├── historia_clinica (35)
│   ├── practicas_medicas (31)
│   ├── recetas (8)
│   └── estudios_adjuntos (10)
└── nomenclador_practicas (18)
```

### 1.2 Regla de Oro
```
especialidad_id → filtra médicos → filtra turnos/pacientes de ESOS médicos
TODO filtro clínico DEBE seguir esta jerarquía
```

---

## 2. BACKEND — Endpoints Alineados

| Endpoint | Filtros | Estado |
|----------|---------|--------|
| GET /especialidades/ | empresa_id | ✅ |
| GET /medicos/ | especialidad_id | ✅ |
| GET /pacientes/ | esp_id + med_id + buscar | ✅ FIX hoy |
| GET /turnos/ | esp_id + med_id + estado | ✅ FIX hoy |
| GET /calendario | mes + esp_id + med_id + estado | ✅ FIX hoy |
| GET /agenda/slots-libres | esp_id + med_id + fechas | ✅ FIX hoy |
| GET /agenda/timeline | fecha + esp_id + med_id | ✅ |

---

## 3. FRONTEND — Páginas con Context

| Página | Ruta | Context? | Problemas detectados |
|--------|------|----------|---------------------|
| Agenda del Día | /agenda/slots-libres | ✅ | ⚠️ Loop en mobile (deps duplicados FIXED pero UI pesada) |
| Calendario | /turnos/calendario | ✅ | ✅ Funciona bien, pero NO tiene crear turno |
| Pacientes | /pacientes | ✅ | ✅ |
| Turnos | /turnos | ✅ | ✅ |
| Profesionales | /medicos | ✅ | ✅ Simple lista |

### FIXs aplicados hoy:
1./backend `/pacientes/` → agregados filtros especialidad_id + medico_id (subquery via visitas)
2. `/backend /turnos/` → agregados filtros esp_id + med_id + estado
3. `/backend /calendario` → agregados filtros esp_id + med_id + estado
4. `/frontend agenda/slots-libres` → eliminados deps duplicados en useCallback (causaba loop)
5. `/frontend agenda/slots-libres` → eliminada referencia circular de fetchSlots en useEffect

---

## 4. PROBLEMAS IDENTIFICADOS — A REFACTORIZAR

### 4.1 "Agenda del Día" no funciona en celular
- **Causa:** deps duplicados en useCallback → loop infinito (YA FIXED en código)
- **Problema adicional:** UI pesada en mobile (selects + fechas + slots agrupados)
- **Conclusión del usuario:** FUSIONAR con Calendario

### 4.2 Calendario NO tiene "crear turno"
- Tiene: grilla mensual + panel lateral con turnos del día
- Le falta: botón para crear turno con flujo de slots visuales
- El flujo PROBADo del bot es: especialidad → médico → slots → elegir → confirmar

### 4.3 Dashboard es inútil
- Muestra datos CRM (cobros, clientes) que están vacíos
- Decisión del usuario: ocultar o renombrar a "Reportes"

### 4.4 "Profesionales" está mal ubicado
- Está en menú principal como item operativo
- Debería estar en Configuración (es entidad de configuración)

### 4.5 CRUD Configuración NO tiene Context
- Especialidades, Profesionales, Agenda, Obras Sociales → no filtran por especialidad seleccionada
- Para clínicas con 15+ especialidades → lista TODOS mezclados = caos

### 4.6 Cascade de borrados — Peligroso
```
Si borrás un MÉDICO (CASCADE):
  → visitas SE BORRAN
  → atenciones SE BORRAN
  → prácticas SE BORRAN
  → recetas SE BORRAN
  → grillas SE BORRAN
  ⚠️ Se pierde TODA la historia

Si borrás una ESPECIALIDAD:
  → medico_especialidades SE BORRAN
  → duracion_prestaciones SE BORRAN
  → visitas tiene RESTRICT → ERROR si tiene turnos
  ⚠️ No se puede borrar si tiene turnos
```

---

## 5. PROPUESTA DE REFACTORIZACIÓN (ACORDADA)

### 5.1 Nuevo menú
```
┌─────────────────────────────────────┐
│  📅 Calendario                      │ ← fusiona Agenda del Día
│  📋 Pacientes                       │
│  📋 Turnos                          │
├─────────────────────────────────────┤
│  ⚙️ Configuración                   │
│     ├── Clínica                     │ ← ESPECIALIDADES + PROFESIONALES
│     │    ├── Especialidades (CRUD)  │
│     │    └── Profesionales (CRUD)   │
│     ├── Agenda                      │ ← Grillas + Bloqueos (con Context)
│     ├── Obras Sociales              │
│     └── Nomenclador                 │ ← Prácticas
└─────────────────────────────────────┘
```

**Ocultar:** Dashboard, Historia Clínica (acceso desde paciente)

### 5.2 Calendario fusionado
**MANTENER:**
- Grilla mensual con turnos
- Panel lateral con timeline
- Filtros estado + Context Provider

**AGREGAR:**
- Botón "Crear Turno" con flujo del bot: paciente → especialidad → médico → slots → confirmar

### 5.3 Sección "Clínica" (Configuración de especialidades y profesionales)
**Especialidades — CRUD:**
- Alta: nombre, código, color, duración
- Baja: ANÁLISIS PREVIO (¿tiene visitas? → mostrar resumen → backup → confirmación)
- Modificación: todo editable

**Profesionales — CRUD:**
- Alta: datos completos + especialidad(ies) + grilla
- Baja: ANÁLISIS PREVIO (turnos, pacientes, atenciones → resumen → confirmación)
- Context: si tengo esp seleccionada → SOLO veo profesionales de esa esp

### 5.4 Agenda con Context
- Grillas: filtra por esp → solo ve médicos de esa esp → solo ve SU grilla
- Bloqueos: mismo patrón
- Duraciones: filtra por esp

### 5.5 Seguridad ante borrados
```
ANTES DE BORRAR:
1. Contar registros afectados (visitas, pacientes, atenciones, etc.)
2. Mostrar resumen: "⚠️ 12 turnos, 9 pacientes, 3 atenciones serán eliminados"
3. Pedir confirmación explícita
4. Generar backup JSON automático con toda la info
5. Ejecutar CASCADE
6. Registrar en log de eliminaciones
```

---

## 6. RUTAS DEL BACKEND (archivos clave)

```
/home/admin/setubalai-agente/services/api/
├── routers/salud.py           # Endpoints clínicos (FIX: filtros agregados)
├── routers/turnos.py          # Slots-libres
├── routers/configuracion_agenda.py  # CRUD grillas, bloqueos, etc.
├── routers/especialidades.py  # CRUD especialidades
├── routers/obras_sociales.py  # CRUD obras sociales

/home/admin/setubalai-agente/web/src/
├── contexts/FiltrosClinicaContext.tsx  # Context Provider
├── components/ClinicaFilterBar.tsx     # Barra visual
├── components/SelectEspecialidadMedico.tsx  # Selects dependientes
├── app/shell.tsx             # Menú sidebar (modificar aquí)
├── app/turnos/calendario/page.tsx  # Calendario (fusionar aquí)
├── app/pacientes/page.tsx    # Pacientes
├── app/turnos/page.tsx       # Turnos
├── app/medicos/page.tsx      # Mover → configuración
├── app/agenda/slots-libres/page.tsx  # Eliminar (absorber en calendario)
├── app/configuracion/         # Páginas CRUD (agregar Context)
```

---

## 7. FLUJO DEL BOT (REFERENCIA)

```
1. Paciente escribe → identifica por chat_id → muestra menú
2. "Sacar turno" → mostrar especialidades (botones inline)
3. Elige especialidad → mostrar médicos de esa especialidad
4. Elige médico → buscar slots (próximos 7 días) → mostrar agrupados por fecha
5. Elige slot → crear turno → confirmar con datos completos
6. Recordatorio T-24h (futuro)
```

**El flujo web debe ser IDENTICO** pero con UI visual en lugar de botones.

---

## 8. PENDIENTES — Próximos pasos

1. Crear rama `feature/refactorizacion-v04` desde main (la main es la versión funcional actual)
2. Reorganizar sidebar según nuevo menú
3. Fusionar Agenda del Día → Calendario (eliminar página duplicada)
4. Agregar "Crear Turno" al Calendario
5. Reubicar Profesionales → Configuración → Clínica
6. Agregar Context a TODAS las páginas de Configuración
7. Implementar seguridad ante borrados (backup + confirmación)
8. Ocultar Dashboard

---

*Este documento preserva TODO el análisis. NO PERDER ANTES DE REFACTORIZAR.*
