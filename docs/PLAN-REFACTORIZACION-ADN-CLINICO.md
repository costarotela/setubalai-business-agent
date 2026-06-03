# Plan de Refactorización: ADN Clínico del Sistema

**Fecha:** 2026-06-03  
**Branch:** `feature/adn-clinico-refactor` (desde `feature/context-provider-filtros`)  
**Objetivo:** Eliminar duplicidad, establecer flujo clínico global, hacer el sistema verdaderamente reactivo

---

## 📊 DIAGNÓSTICO COMPLETO (28 páginas analizadas)

### Dominios identificados

| Dominio | Páginas | Necesita Filtros Clínicos | Estado actual |
|---------|---------|---------------------------|---------------|
| **Clínico** | 7 | ✅ SÍ, ADN obligatorio | Inconsistente |
| **Configuración** | 7 | ❌ No (admin puro) | CRUD ok |
| **Gestión negocio** | 10 | ❌ No (CRM/cobros) | CRUD ok |
| **Auth** | 3 | ❌ No | OK |

### Las 7 páginas del DOMINIO CLÍNICO (requieren ADN):

| # | Página | Filtros actuales | Faltante | Reactividad |
|---|--------|-----------------|----------|-------------|
| 1 | `/agenda/slots-libres` | ✅ Esp+Med+Fechas | OK | ❌ No navega a paciente/médico |
| 2 | `/turnos` | ❌ Solo estado | Esp+Med+Fecha | ❌ Sin link a paciente, sin filtro |
| 3 | `/turnos/calendario` | ⚠️ Solo esp (string) | Médico, fechas | ❌ Sin link a paciente, filtro roto |
| 4 | `/pacientes` | 🔍 Buscador texto | Filtro esp/med | ❌ Click → historial pero no desde otros lados |
| 5 | `/pacientes/[id]/historial` | N/A (single) | Migas pan, contexto | ❌ Aislado, no navegable desde turnos |
| 6 | `/historia-clinica` | 🔍 Buscador texto | Contexto clínico | ⚠️ Vista maestra duplicada con [id]/historial |
| 7 | `/medicos` | ❌ Ninguno | Filtro esp | ❌ Sin link a agenda/pacientes |

### El Dashboard es especial
- `/dashboard` → métricas de negocio, NO clínico puro
- PUEDE beneficiarse de filtro por esp/med para ver KPIs segmentados
- Pero NO es obligatorio en V1

### Historial duplicado
- `/historia-clinica` → busca paciente y muestra detalle inline
- `/pacientes/[id]/historial` → vista dedicada con URL RESTful
- **Problema:** la primera nunca recibe params → no funciona nunca
- **Solución:** `/historia-clinica` redirige o se elimina, queda solo `/pacientes/[id]/historial`

---

## 🔍 PROBLEMAS ESTRUCTURALES RAÍZ

### P1: Context tiene dos estados (global + local) que NUNCA se sincronizan

```
FiltrosClinicaContext: selectedEspecialidadId = Cardiología (global)
  ↳ /agenda → usa callbacks → escribe en Context ✅
  ↳ /turnos → ignora Context → usa formMedico local ❌
  ↳ /calendario → ignora Context → usa filtroEspecialidad STRING ❌
Result: seleccionar en una página = no se refleja en las demás
```

### P2: SelectEspecialidadMedico escribe en Context Y devuelve callbacks

El componente hace dos cosas incompatible:
- Escribe en `f.setEspecialidadId()` → cambia el estado GLOBAL
- Devuelve `onEspecialidadChange` → cada página maneja respuesta local
- Consecuencia: las páginas que usan callbacks creen que controlan el filtro, pero en realidad cambian el Context de TODA la app sin saberlo

### P3: No hay navegación clínica reactiva

**Flujos que DEBERÍAN existir pero NO existen:**
- Click en paciente en lista de turnos → ir a su historial clínico
- Click en médico en calendario → ver su agenda
- Click en especialidad en turnos → filtrar todo
- Click en paciente en historial clínico → crear turno para ese paciente
- Click en médico en ficha paciente → ver otros turnos de ese médico
- Migas de pan (breadcrumbs) en TODAS las vistas de detalle

**Flujos que SI existen (bien):**
- `/pacientes` → click en fila → `/pacientes/[id]/historial` ✅

### P4: Duplicación de fetches y lógica

| Duplicación | Dónde |
|-------------|-------|
| Fetch pacientes | `/turnos` Y `/historia-clinica` Y `/pacientes` |
| Fetch médicos | `/agenda` (via context) Y `/turnos` (local) Y `/medicos` (local) |
| Fetch especialidades | `/agenda` (via context) Y `/turnos` (local en form Tipo) |
| Estado "todos/pendiente/etc" | `/turnos` Y `/calendario` |

---

## 🏗️ ARQUITECTURA OBJETIVO

### Capa 1: Context (única fuente de verdad)

```
FiltrosClinicaContext:
  ├─ Datos cacheados (cargar UNA VEZ al login)
  │   ├─ especialidades
  │   ├─ practicas (nomenclador)
  │   └─ medicos (todos, no por especialidad)
  │
  ├─ Selección global (persiste entre páginas)
  │   ├─ selectedEspecialidadId
  │   ├─ selectedMedicoId
  │   └─ selectedRangoFecha {desde, hasta}
  │
  ├─ Filtros por dominio (agrupados)
  │   ├─ turno: {estado, tipo}
  │   └─ calendario: {mes, vista}
  │
  └─ Derived data
      ├─ practicasFiltradas (nomenclador × especialidad)
      ├─ medicosFiltrados (doctores × especialidad)
      └─ medicosAll (todos los doctores, sin filtro)
```

**Cambio clave:** `selectedEspecialidadId` y `selectedMedicoId` son la selección global de toda la app clínica. No se duplican en las páginas.

### Capa 2: Componentes compartidos

| Componente | Uso | Descripción |
|------------|-----|-------------|
| `ClinicaFilterBar` | Todas 7 páginas clínicas | Panel unificado de filtros (esp+med) con mismo estilo visual |
| `SelectEspecialidadMedico` | Dentro de ClinicaFilterBar, forms | Solo lee/escribe Context, NO callbacks redundantes |
| `PatientLink` | Turnos, Calendario, Agenda | Renderiza nombre de paciente como link a `/pacientes/[id]/historial` |
| `MedicoLink` | Turnos, Calendario, Agenda | Renderiza nombre de médico como link a agenda filtrada |
| `BreadcrumbNav` | Todas las vistas detalle | Migas de pan: `Inicio > Pacientes > García, Juan > Historial` |
| `EstadoBadge` | Todas las páginas clínicas | Badge de estado con colores consistentes |

### Capa 3: Flujo de navegación reactiva

```
/agenda → ver slot → "Reservar para paciente?" → link a /pacientes/[id]/historial
/turnos → click paciente → /pacientes/[id]/historial
/turnos → click médico → filtro médico en /agenda (mismo Context)
/calendario → click paciente → /pacientes/[id]/historial
/calendario → click médico → filtro médico en /agenda
/pacientes/[id]/historial → "Ver turnos pendientes" → /turnos filtrado por paciente
/pacientes/[id]/historial → "Agendar turno" → /agenda con paciente preseleccionado
/medicos → click médico → /agenda con médico preseleccionado
/dashboard → click KPI → página correspondiente filtrada
```

### Capa 4: Reglas de comportamiento

1. **Selección global**: cambiar especialidad/médico en CUALQUIER página → se refleja en TODAS
2. **Filtros de dominio**: estado del turno, fecha, mes → específicos de cada página
3. **Navegación clínica**: todo nombre de paciente/médico es clicable
4. **Breadcrumb**: toda vista detalle tiene migas de pan
5. **Dedup**: nada se fetcha dos veces — solo el Context fetch, las páginas consumen

---

## 📋 PLAN DE IMPLEMENTACIÓN (8 pasos secuenciales)

> Cada paso: 1 cambio → build → verificar 200 → siguiente. NUNCA "listo" sin curl→200.

### Paso 1: Preparar branch + refactorizar Context

**Branch:** `feature/adn-clinico-refactor` (desde `feature/context-provider-filtros`)

**Cambios en `FiltrosClinicaContext.tsx`:**
- Cargar TODOS los médicos al montar (no filtrados por especialidad) → así cualquier página puede acceder a cualquier médico
- Agregar campo `selectedRangoFecha` con defaults
- Agregar filtros por dominio: `filtroEstadoTurno`, `filtroMesCalendario`
- Simplificar: las páginas LEEN la selección global, escriben via `setEspecialidadId`/`setMedicoId`
- El Context es la ÚNICA fuente de truth para esp/med

**Archivo afectado:** `web/src/contexts/FiltrosClinicaContext.tsx`

### Paso 2: Refactorizar `SelectEspecialidadMedico` → modo "puro contexto"

**Cambios:**
- Eliminar los callbacks `onEspecialidadChange` y `onMedicoChange` (redundantes si el Context YA tiene el estado)
- El componente SOLO lee y escribe el Context directamente
- Para formularios (nuevo turno) donde se necesita estado local separado, crear `SelectEspecialidadMedicoLocal` (versión con state propio)
- `SelectSoloEspecialidad` → mismo patrón
- Agregar props: `variant="global" | "local"` para distinguir

**Archivos afectados:** `web/src/components/SelectEspecialidadMedico.tsx`

### Paso 3: Crear `ClinicaFilterBar` (componente unificado de filtros)

**Nuevo componente:** `web/src/components/ClinicaFilterBar.tsx`

Panel visual consistente para las 7 páginas clínicas:
- Header con ícono filtro + título "Filtros Clínicos"
- `SelectEspecialidadMedico` (lee escribe Context global)
- Slots para filtros adicionales por página (fechas, estado, etc.)
- Badge de filtros activos + botón "Limpiar filtros"

**Estilo visual:** mismo que `/agenda/slots-libres` (card oscura con borde sutil)

**Archivos:** 1 archivo nuevo + export en components

### Paso 4: Crear componentes de navegación reactiva

**Nuevos componentes:**

`web/src/components/PatientLink.tsx`:
```tsx
// Usa: <PatientLink id={t.paciente_id} nombre={t.paciente_nombre} />
// Output: <Link href={`/pacientes/${id}/historial`}>{nombre}</Link>
```

`web/src/components/MedicoLink.tsx`:
```tsx
// Usa: <MedicoLink id={t.medico_id} nombre={t.medico_nombre} />
// Output: click → filtra Context por médico, navega a /agenda
```

`web/src/components/BreadcrumbNav.tsx`:
```tsx
// Usa: <BreadcrumbNav items={[
//   { label: "Pacientes", href: "/pacientes" },
//   { label: "García, Juan" },
//   { label: "Historial" }
// ]} />
```

**Archivos:** 3 archivos nuevos

### Paso 5: Aplicar a `/turnos` (la que más necesita)

**Cambios en `web/src/app/turnos/page.tsx`:**
- Agregar `ClinicaFilterBar` arriba con filtros: estado del turno (existente), + esp+med (nuevo)
- Filtrar tabla de turnos por la selección global del Context
- Cada nombre de paciente → `<PatientLink>`
- Cada nombre de médico → `<MedicoLink>`
- Agregar `<BreadcrumbNav items={[{label: "Turnos"}]} />`
- Form "Nuevo Turno" → usar `SelectEspecialidadMedico` con `variant="local"` (no afecta selección global)
- Eliminar estado local de médico redundante

**Verificación:** `curl http://localhost:3013/turnos` → 200

### Paso 6: Aplicar a `/turnos/calendario`

**Cambios en `web/src/app/turnos/calendario/page.tsx`:**
- Reemplazar la zona de filtros actual por `ClinicaFilterBar`
- Agregar `SelectEspecialidadMedico` completo (con médico, no solo especialidad)
- Click en paciente en celda del calendario → `<PatientLink>`
- Click en paciente en panel lateral → `<PatientLink>`
- Agregar `<BreadcrumbNav>`
- `filtroEspecialidad` (string) → usar `selectedEspecialidadId` del Context
- `filtroProfesional` → usar `selectedMedicoId` del Context

**Verificación:** `curl http://localhost:3013/turnos/calendario` → 200

### Paso 7: Aplicar a `/medicos` y `/pacientes`

**Medicos (`/medicos`):**
- Agregar `ClinicaFilterBar` con solo especialidad (no necesita médico, está en lista de médicos)
- Filtrar cards por `selectedEspecialidadId` del Context
- Click en médico → navegar a `/agenda` con médico preseleccionado

**Pacientes (`/pacientes`):**
- Agregar `<BreadcrumbNav items={[{label: "Pacientes"}]} />`
- Mantener buscador de texto existente
- Las filas ya son clicables ✅ (ya van a historial)

### Paso 8: Fixear `/historia-clinica` (duplicado)

**Problema:** `/historia-clinica` es una vista maestra que NUNCA recibe el param `id` del URL:
- Usa `new URL(window.location.href).searchParams.get("id")` → nunca se settea desde ningún link
- `/pacientes/[id]/historial` es el endpoint correcto y RESTful

**Solución:** `/historia-clinica/page.tsx` → redirige a `/pacientes` o muestra el mismo listado de pacientes pero con link a sus historiales

**Adicional:** Agregar migas de pan a `/pacientes/[id]/historial`:
```
Pacientes > García, Juan > Historial Clínico
```

---

## 🎯 CRITERIOS DE ÉXITO

| Criterio | Cómo verificar |
|----------|---------------|
| Build sin errores | `npm run build` → 0 errores |
| Todas las páginas 200 | `curl localhost:3013/{page}` para cada una |
| Filtro global funciona | Seleccionar Cardiología en Agenda → ir a Turnos → está filtrado |
| Click en paciente funciona | Click nombre en Turnos → abre historial del paciente |
| Click en médico funciona | Click nombre en Calendario → filtra agenda por médico |
| Breadcrumbs visibles | Cada vista detalle tiene migas de pan |
| No duplicación de fetches | Network tab: cada endpoint se llama 1 vez por sesión |
| Context no afecta non-clínicas | /clientes, /cobros, /config funcionan igual |

---

## ⚠️ PITFALLS A EVITAR (aprendidos en sesiones previas)

1. **NO tocar main** — solo branch `feature/adn-clinico-refactor`
2. **NO "listo" sin verificar** — curl cada página después de cada cambio
3. **Callback del Context** → recordar que `SelectEspecialidadMedico` escribe en Context global; las páginas que solo quieren filtrar su propia tabla deben usar la selección global como INPUT, no duplicar
4. **Form "Nuevo Turno"** → necesita selects locales que NO afecten la selección global de la app; usar `variant="local"`
5. **Médicos todos vs filtrados** → el Context debe tener TODOS los médicos cargados + una versión filtrada; no cargarlos N veces
6. **Historial duplicado** → no mantener dos vistas de historial clínico con lógica separada
7. **Server vs Client components** → todo lo que use `useFiltrosClinica` DEBE ser `"use client"`
8. **Auth context** → los fetches del Context usan `useAuthFetch`; verificar que no se rompa el login flow

---

## 📐 IMPACTO ESTIMADO

- **Archivos nuevos:** ~6 (ClinicaFilterBar, PatientLink, MedicoLink, BreadcrumbNav, posiblemente componentes auxiliares)
- **Archivos modificados:** ~7 (Context + 7 páginas clínicas)
- **Archivos sin tocar:** ~20 (configuración, negocio, auth, dashboard)
- **Complejidad:** Media-Alta (refactor de arquitectura, no "feature nueva")
- **Riesgo:** Medio (el Context es central; si se rompe, afecta 7 páginas)
