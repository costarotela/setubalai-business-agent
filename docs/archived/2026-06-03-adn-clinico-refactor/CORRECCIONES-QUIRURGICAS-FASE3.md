# Correcciones Quirúrgicas FASE 3 — Jerarquía Multi-Clínica

**Fecha:** 2026-06-02 18:00 UTC  
**Estado:** Plan aprobado, listo para ejecutar  
**Principio:** CADA clínica tiene sus propias especialidades, médicos, pacientes y servicios.

---

## JERARQUÍA SAGRADA (NO negociable)

```
empresa_id (clínica)
  └─ especialidades → SOLO las de ESA clínica
       └─ médicos → SOLO los que atienden ESA especialidad en ESA clínica
            └─ turnos/slots → SOLO de ESE médico
```

El sistema es un **SaaS MULTI-CLÍNICA**. No es para UNA clínica demo.

---

## PROBLEMAS DETECTADOS

### 1. `turnos/page.tsx` línea 333 — Tipos de turno HARDCODEADOS ❌
```tsx
["Consulta General", "Consulta Cardiología", "Consulta Traumatología", 
 "Consulta Dermatología", "Consulta ORL", "Estudio Radiografía", 
 "Estudio Ecocardiograma", "Estudio Anatomía Patológica"]
```
**Problema:** Solo funciona para la clínica demo (empresa_id=16).  
**Fix:** Reemplazar por `GET /nomenclador_practicas/` → retorna servicios de ESA clínica.

### 2. `turnos/page.tsx` filtro médicos — carga TODOS al inicio ⚠️
```tsx
// Carga TODOS los médicos al montar (línea 66)
af("/api/medicos/").then(r => r.json())
// Filtra por string match (línea 276-279)
medicos.filter(m => (m.especialidades || []).includes(formEspecialidad))
```
**Problema:** En clínicas con 50+ médicos → lento.  
**Fix:** Fetch médicos solo cuando se selecciona especialidad → `GET /medicos/?especialidad_id=X`.

---

## PLAN DE CORRECCIONES

### Corrección 1: Tipos desde nomenclador
- Montar componente → `GET /nomenclador_practicas/` → llena dropdown de tipos
- Filtra por `tipo` ("Consulta" vs "Estudio") para agrupar visualmente
- CADA clínica ve SOLO sus propios servicios

### Corrección 2: Hook reutilizable `useFiltrosClinica`
```
useFiltrosClinica(empresa_id) → 
  { especialidades[], medicos[], nomenclador[], 
    selectedEspecialidadId, selectedMedicoId,
    setEspecialidad, setMedico }
```

**Flujo de carga:**
1. Montar → `GET /especialidades/` → especialidades de ESA clínica
2. Auto-select especialidad con mayor prioridad (campo `prioridad`)
3. Auto-fetch `GET /medicos/?especialidad_id=X` → médicos de ESA especialidad
4. Usuario cambia especialidad → re-fetch médicos
5. `GET /nomenclador_practicas/` → servicios/tipos de ESA clínica

**Reutilizable en:**
- `turnos/page.tsx` (crear turno)
- `agenda/slots-libres/page.tsx`
- Futuros modulos que necesiten filtros clínicos

### Corrección 3: Componentes existentes que NO necesitan cambio
- `calendario/page.tsx` → ✅ botones dinámicos desde turnos existentes
- `agenda/dia/page.tsx` → ✅ solo muestra datos del día
- `medicos/page.tsx` → ✅ lista todos los médicos de la clínica
- `historia-clinica/page.tsx` → ✅ solo lectura

---

## ENDPOINTS INVOLUCRADOS

| Endpoint | Uso | Filtro |
|---|---|---|
| `GET /especialidades/` | Lista de especialidades | empresa_id (auto) |
| `GET /medicos/?especialidad_id=X` | Médicos por especialidad | empresa_id + especialidad_id |
| `GET /nomenclador_practicas/` | Servicios/tipos de turno | empresa_id |
| `GET /agenda/slots-libres?medico_id=X&fecha=Y` | Slots disponibles | medico_id + fecha |

Todos los endpoints ya filtran por `empresa_id` automáticamente via `resolve_empresa_id` en el backend.

---

## EJECUCIÓN

1. Crear hook `useFiltrosClinica` en `src/hooks/`
2. Patch `turnos/page.tsx` → usa el hook + nomenclador
3. Verificar en dev.setubalai.org
4. Documentar en Obsidian (CONTEXTO-SESION.md)
