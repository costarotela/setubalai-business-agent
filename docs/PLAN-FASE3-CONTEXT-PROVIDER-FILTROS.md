# FASE 3 — Context Provider: Especialidad → Médico

**Fecha:** 2026-06-03
**Estado:** PLAN — esperar aprobación antes de ejecutar
**Arquitectura:** Opción B — Context Provider (fetch UNA VEZ, compartido)

---

## DIAGNÓSTICO VERIFICADO EN DB (empresa_id=16 — Centro Médico Santa Clara)

### Especialidades (5 registradas):
| id | nombre | codigo | color | dur_default |
|----|--------|--------|-------|-------------|
| 1 | Cardiología | CARDIO | #EF4444 | 30 |
| 2 | Traumatología | TRAUMA | #3B82F6 | 45 |
| 3 | Pediatría | PEDIATRIA | #10B981 | 20 |
| 4 | Dermatología | DERMA | #F59E0B | 30 |
| 7 | Clínica Médica | CLINICA | #8B5CF6 | 30 |

### Médicos (5, cada uno con UNA especialidad):
| id | nombre | especialidades |
|----|--------|----------------|
| 1 | María García | ['Clínica Médica'] |
| 2 | Carlos Rodríguez | ['Cardiología'] |
| 3 | Juan Martínez | ['Traumatología'] |
| 4 | Ana López | ['Dermatología'] |
| 5 | Roberto Fernández | ['Pediatría'] |

### Nomenclador (18 prácticas):
- 5 Consultas (una por especialidad)
- 13 Estudios (ECG, Ecocardiograma, Dermatoscopia, Biopsia, Audiometría, etc.)
- Cada práctica tiene `especialidad_requerida` (string, ej: "Cardiología")

### TURNOS: 47 registrados

---

## ENDPOINTS VERIFICADOS (funcionan):
```
GET /especialidades/              → { total: 5, especialidades: [...] }
GET /medicos/?especialidad_id=1   → [ { id, nombre, apellido, especialidades: [...] } ]  ← YA FILTRA
GET /nomenclador_practicas/       → [ { id, descripcion, tipo, especialidad_requerida, precio_particular } ]
```

**NO hace falta modificar el backend** — el filtro `?especialidad_id=X` en `/medicos/` ya funciona con JOIN a `medico_especialidades`.

---

## PLAN — 5 PASOS (uno a la vez, validar cada uno)

### PASO 1: Crear `FiltrosClinicaContext` — Provider + Hook
**Archivo nuevo:** `web/src/contexts/FiltrosClinicaContext.tsx`

**Arquitectura:**
```tsx
// Context que envuelve toda la app clínica
// Fetch UNA VEZ al montar
// Cachea especialidades + nomenclador
// Fetch médicos SOLO cuando se cambia especialidad

export interface FiltrosClinicaState {
  // Datos cargados UNA VEZ
  especialidades: Especialidad[];
  nomenclador: NomencladorPractica[];
  
  // Datos dependientes
  medicos: Medico[];           // se recarga al cambiar especialidad
  
  // Selecciones
  selectedEspecialidadId: number | null;
  selectedMedicoId: number | null;
  
  // Actions
  setEspecialidadId: (id: number | null) => void;
  setMedicoId: (id: number | null) => void;
  
  // UI state
  loading: boolean;
  error: string | null;
}
```

**Donde montar:** `web/src/app/shell.tsx` — dentro del componente `AppShell`, después de verificar que `user` existe (así el token está disponible).

**Lógica de carga:**
1. `useEffect` al montar → `GET /especialidades/` + `GET /nomenclador_practicas/` (en paralelo)
2. `useEffect` cuando `selectedEspecialidadId` cambia → `GET /medicos/?especialidad_id=X`
3. Reset `selectedMedicoId` al cambiar especialidad
4. **NO auto-seleccionar primera especialidad** — dejar que el usuario elija. Evita fetch innecesarios.

### PASO 2: Crear `<SelectEspecialidadMedico />` — Componente UI reutilizable
**Archivo nuevo:** `web/src/components/SelectEspecialidadMedico.tsx`

**Props:**
```tsx
interface Props {
  onEspecialidadChange?: (id: number | null) => void;
  onMedicoChange?: (id: number | null) => void;
  horizontal?: boolean;      // true = grid 1fr 1fr, false = columna vertical
  showLabels?: boolean;      // mostrar labels "Especialidad" / "Médico"
  className?: string;
}
```

**Comportamiento:**
- Consume `FiltrosClinicaContext`
- Select especialidad: muestra todas las especialidades de la clínica
- Select médico: se habilita SOLO cuando hay especialidad seleccionada
- Muestra los nombres reales de médicos (ej: "Dr/a. María García")
- Usa `<select>` nativos consistentes con el estilo actual del sistema

### PASO 3: Integrar en `turnos/page.tsx` (form "Nuevo Turno")
**Archivo:** `web/src/app/turnos/page.tsx`

**Cambios concretos:**
1. Reemplazar select de médico (línea 202-214) por `<SelectEspecialidadMedico />`
2. Reemplazar tipos hardcodeados (línea 246 — array de 8 strings) por selección desde `nomenclador` del context
3. El form queda: Paciente → Especialidad → Médico → Fecha/Hora → Tipo (desde nomenclador) → Motivo

### PASO 4: Integrar en `agenda/slots-libres/page.tsx` (filtros)
**Archivo:** `web/src/app/agenda/slots-libres/page.tsx`

**Cambios concretos:**
1. Reemplazar select manual de especialidad por `<SelectEspecialidadMedico horizontal />`
2. El médico seleccionado del context se usa como filtro en la búsqueda de slots
3. La grilla de filtros tiene espacio para ambos selects (ya usa grid)

### PASO 5: Registrar en `layout.tsx` o `shell.tsx`
**Archivo:** `web/src/app/shell.tsx`

Envolver `AppShell` children con `FiltrosClinicaProvider`:
```tsx
<FiltrosClinicaProvider>
  {/* sidebar + children */}
</FiltrosClinicaProvider>
```

Solo se activa en rutas de clínica (no en rutas de business general).

---

## FLUJO DE INTEGRACIÓN

```
layout.tsx
  └─ ShellProvider              ← envuelve toda la app
       └─ AuthProvider           ← restaura sesión JWT
            └─ AppShell          ← sidebar + layout
                 └─ FiltrosClinicaProvider   ← NUEVO: carga datos UNA VEZ
                      └─ {children}          ← todas las páginas
```

**Páginas que consumen el context:**
- `turnos/page.tsx` → form nuevo turno
- `agenda/slots-libres/page.tsx` → filtros

**Páginas que NO necesitan cambios:**
- `turnos/calendario/page.tsx` → usa datos de turnos existentes
- `configuracion/especialidades/` → CRUD independiente
- `medicos/page.tsx` → CRUD independiente
- `pacientes/`, `dashboard/`, `configuracion/agenda/*` → no usan filtros dependientes

---

## DETALLES TÉCNICOS CLAVE

### Matching especialidad → médico:
Los médicos retornan `especialidades: ['Cardiología']` (array de strings, NO IDs).
El Context filtra:
```ts
// Cuando GET /medicos/?especialidad_id=1 retorna médicos de Cardiología
// El select de médico muestra: ["María García", "Juan Pérez", etc.]
// No necesita matching adicional — el backend ya filtra
```

### Nomenclador:
`especialidad_requerida` es string ("Cardiología"), NO FK numérica.
Filtrar nomenclador por especialidad:
```ts
const nomenclFiltrado = nomenclador.filter(n => 
  !n.especialidad_requerida || n.especialidad_requerida === espNombre
);
```

### Colores de especialidades:
Ya existen en DB (`color_hex`). Usarlos en el select de especialidad:
```tsx
<option value={esp.id} style={{ color: esp.color_hex }}>
  {esp.nombre}
</option>
```

### Datos de prueba:
- admin email: `admin@centromedicosantaclara.com.ar`
- password temporal: `iwPakYAsVD3G4PZs`
- empresa_id: 16

---

## RIESGOS

1. **ShellProvider ya crea AuthProvider internamente** — hay que verificar que `FiltrosClinicaProvider` pueda usar `useAuthFetch()` (que depende de `useAuth()`). Si AuthProvider está dentro de ShellProvider, el context debe estar al mismo nivel o dentro.

2. **nomenclador.especialidad_requerida como string** — matching por nombre textual, si hay typos en la DB no va a matchear. Verificar que los nombres coincidan exactamente con los de EspecialidadMedica.

3. **Credenciales hardcodeadas no se usan en prod** — el Context usa el JWT del usuario logueado, no credenciales fijas. La empresa_id viene del token.
