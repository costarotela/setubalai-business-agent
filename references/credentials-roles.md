# Credenciales 3 Roles — Centro Médico Santa Clara (empresa_id=16)

**Clave unificada:** `Pablo2024!` (para TODOS los usuarios)
**URL:** `https://dev.setubalai.org/login`

---

## 🔑 CREDENCIALES

| Rol | Email | Clave | medico_id | Qué puede hacer |
|-----|-------|-------|-----------|-----------------|
| **Admin** | `admin@centromedicosantaclara.com.ar` | `Pablo2024!` | NULL | Ve TODO — configura, personaliza, accede a datos clínicos, turnos, pacientes, nomencladores, etc. |
| **Recepcionista** | `recepcion@centromedicosantaclara.com.ar` | `Pablo2024!` | NULL | Turnos, pacientes, agenda, médicos, especialidades. **NO** ve historia clínica, prácticas, recetas, estudios |
| **Médico** | `medico.mara.garca@centromedico.com.ar` (María García, Cardiología) | `Pablo2024!` | 1 | Ve SOLO sus propios pacientes (9), SOLO sus propios turnos (38), SOLO sus atenciones. Puede atender, crear recetas, prácticas, estudios |

---

## 🧪 TESTING DE ROLES (validación)

### Como Admin:
- `/turnos` → ve 200 turnos (todos)
- `/pacientes` → ve 36 pacientes (todos)
- `/configuracion/profesionales` → puede crear/editar/eliminar
- `/historia-clinica` → ve 70 historias (todas)
- `/practicas` → ve 82 prácticas (todas)

### Como Recepcionista:
- `/turnos` → ve 200 turnos (todos ✅)
- `/pacientes` → ve 36 pacientes (todos ✅)
- `/configuracion/profesionales` → puede ver/editar (configuración)
- `/historia-clinica` → **bloqueado 403** (✅ protegido)
- `/practicas` → **bloqueado 403** (✅ protegido)
- `/recetas` → **bloqueado 403** (✅ protegido)

### Como Médico María García:
- `/turnos` → ve 38 turnos (solo los suyos ✅)
- `/pacientes` → ve 9 pacientes (solo los que atendió ✅)
- `/mis_pacientes` → ve 9 pacientes propios
- `/historia-clinica` → ve 28 historias (solo de sus pacientes ✅)
- `/medico/hoy` → ve su agenda del día
- `/medico/atender/` → puede crear atenciones

---

## 🔐 MÉDICO DE PRUEBA (id=1, María García)
- Especialidad: **Cardiología** (id=1)
- Turnos asignados: 38 (de 200 totales)
- Pacientes atendidos: 9

## 📋 OTROS MÉDICOS (todos con misma clave Pablo2024!)
| Email | Nombre | Especialidad | medico_id |
|-------|--------|-------------|-----------|
| medico.carlos.rodrguez@centromedico.com.ar | Carlos Rodríguez | Cardiología (id=1) | 2 |
| medico.juan.martnez@centromedico.com.ar | Juan Martínez | Traumatología (id=3) | 3 |
| medico.ana.lpez@centromedico.com.ar | Ana López | Dermatología (id=4) | 4 |
| medico.roberto.fernndez@centromedico.com.ar | Roberto Fernández | Pediatría (id=5) | 5 |
