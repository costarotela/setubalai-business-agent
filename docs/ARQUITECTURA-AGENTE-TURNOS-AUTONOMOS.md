# Arquitectura: Agente Autónomo de Turnos Médicos

**Fecha:** 2026-05-27
**Estado:** Fase de diseño — pendiente implementación
**Documento de referencia para implementación**

---

## 1. VISION GENERAL

El paciente escribe por Telegram/WhatsApp → el agente IA resuelve TODO automáticamente:
- Detecta si es paciente existente (por DNI)
- Si es nuevo → alta automática con datos mínimos
- Busca disponibilidad por especialidad
- Muestra opciones reales (huecos libres en la grilla)
- Confirma turno → envía confirmación
- Envía recordatorio automático (24hs antes)

**NO hay persona cargando datos. NO hay formularios manuales.**

---

## 2. FLUJO COMPLETO DEL PACIENTE

### 2.1 Paciente existente (ya tiene DNI registrado)
```
Paciente: "Quiero turno con cardiólogo"
  ↓
Agente: reconoce por DNI → busca en DB pacientes (dni = teléfono/dni asociado)
  ↓
Agente: "Hola María! Para cardiólogo tengo disponible:
         - Dr. Martínez: Lunes 9:30, 11:00, 15:00
         - Dra. López: Martes 10:00, 14:30
         ¿Cuál te conviene?"
  ↓
Paciente: "El lunes con Martínez a las 9:30"
  ↓
Agente: reserva → POST /turnos/ → confirma
         "✅ Turno confirmado: Lunes 9:30 con Dr. Martínez (Cardiología)
          Direccción: Av. San Martín 1234, 2do piso
          Traiga su DNI y obra social
          Le recordaremos 24hs antes. Cancelar: responder 'cancelar'"
```

### 2.2 Paciente nuevo (primera vez)
```
Paciente: "Necesito un turno para cardiología"
  ↓
Agente: "Bienvenido! Primero necesito algunos datos.
         Por favor escribí tu número de DNI:"
  ↓
Paciente: "28345678"
  ↓
Agente: verifica → no existe → procede con alta
         "Perfecto! Ahora tu nombre completo:"
  ↓
Paciente: "María García"
  ↓
Agente: "¿Tenés obra social? (escribí el nombre o 'particular' si no tenés)"
  ↓
Paciente: "OSDE"
  ↓
Agente: "¿Teléfono de contacto?" (ya lo tiene de Telegram/WhatsApp pero confirma)
  ↓
Paciente: "3425291558"
  ↓
Agente: crea paciente → POST /pacientes/
         "✅ Ya te registramos!
          Ahora busco disponibilidad para cardiología..."
         [continúa como paciente existente]
```

---

## 3. BASE DE DATOS — NUEVAS TABLAS / MODIFICACIONES

### 3.1 Nueva tabla: `grillas_medicas`
Define la disponibilidad base de cada médico.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | |
| `medico_id` | INT FK → medicos | |
| `empresa_id` | INT FK → empresa | Multi-tenant |
| `dia_semana` | INT (1-7) | 1=Lunes, 7=Domingo |
| `hora_inicio` | TIME | Ej: '09:00' |
| `hora_fin` | TIME | Ej: '13:00' |
| `activo` | BOOL | Para pausas/vacaciones |

**Ejemplo:** Dr. Martínez → Lunes, 9:00-13:00 y 15:00-19:00
→ El agente genera huecos automáticamente según duración de la prestación.

### 3.2 Nueva tabla: `bloqueos_grilla`
Franjas que el admin bloquea manualmente (vacaciones, congresos, feriados).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | |
| `medico_id` | INT FK → medicos | |
| `fecha` | DATE | Día específico |
| `motivo` | VARCHAR | Vacaciones, congreso, etc. |

### 3.3 Modificación: `turnos` (ya existe como `visitas` o `turnos`)
Agregar:
- `canal_reserva` VARCHAR ('telegram', 'whatsapp', 'web')
- `recordatorio_enviado` BOOL (default False)
- `telefono_contacto` VARCHAR (para el recordatorio)

### 3.4 Nueva tabla: `duracion_prestaciones`
Duración por tipo de prestación/specialidad.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | |
| `empresa_id` | INT FK → empresa | |
| `especialidad` | VARCHAR | Cardiología, etc. |
| `duracion_minutos` | INT | Default 30 |
| `sobre_turnos_permitidos` | INT | Default 3 |

---

## 4. BACKEND — NUEVOS ENDPOINTS (salud.py)

### 4.1 `POST /turnos/disponibilidad`
**Input:** `{especialidad?: str, medico_id?: int, fecha?: str}`
**Lógica:**
1. Consulta `grillas_medicas` para el médico/especialidad
2. Para la fecha solicitada → genera huecos de N minutos
3. Descarta los ocupados (JOIN con `turnos` activos)
4. Descarta bloqueados (`bloqueos_grilla`)
5. Retorna `{medico: str, especialidad: str, huecos: [{hora, disponible: bool}]}`

### 4.2 `GET /grillas_medicas/` (CRUD para admin)
Lista, crear, editar grillas de cada médico

### 4.3 `POST /pacientes/buscar_por_dni`
**Input:** `{dni: str}` → `{existe: bool, paciente?: {...}}`

### 4.4 `POST /turnos/enviar_recordatorio/{id}`
Envía recordatorio por el canal (Telegram/WhatsApp)

---

## 5. AGENTE IA — HABILIDADES MCP

El agente (Hermes) necesita estas habilidades para funcionar autónomo:

### 5.1 Skill: `turnos-autonomos`
Prompt completo que el agente ejecuta para gestionar turnos.

### 5.2 MCP Tools necesarias:
- `buscar_paciente(dni)` → verifica existencia
- `crear_paciente(datos)` → alta automática
- `consultar_disponibilidad(especialidad, fecha)` → huecos libres
- `reservar_turno(paciente_id, medico_id, fecha_hora, canal)` → crea turno
- `enviar_mensaje(telefono, mensaje)` → Telegram/WhatsApp

### 5.3 Flujo de decisión del agente:
```
1. Recibir mensaje del paciente
2. Identificar por telefono/contact → buscar DNI asociado
3. Si no tiene DNI → pedirlo → buscar_paciente(dni)
4. Si no existe → pedir datos → crear_paciente()
5. Entender intención (especialidad, médico, fecha)
6. consultar_disponibilidad()
7. Presentar opciones
8. reservar_turno() cuando confirma
9. Recordatorio programado (cron o schedule)
```

---

## 6. CANALES DE COMUNICACIÓN

### 6.1 Telegram (ya funcionando)
- Hermes Gateway ya activo
- Recibe mensajes → procesa con agente IA → responde
- Teléfono ya disponible via chat_id

### 6.2 WhatsApp (pendente)
- Skill `whatsapp-cloud-api-bot` disponible
- Números del cliente → registrar en sistema

---

## 7. CONFIGURACIÓN INICIAL PARA DEMO

Para la demo del Centro Médico Santa Clara (empresa 16):

### Grillas predefinidas:
```
Dr. Roberto Fernández (Cardiología):
  Lunes y Miércoles: 09:00-13:00, 15:00-18:00
  
Dra. María García (Traumatología):
  Martes y Jueves: 08:00-13:00
  
Dr. Carlos Rodríguez (Dermatología):
  Lunes, Miércoles, Viernes: 09:00-14:00
  
Dra. Ana López (ORL):
  Martes y Jueves: 10:00-14:00, 15:00-18:00
  
Dr. Luis Sánchez (Clínica Médica):
  Lunes a Viernes: 08:00-12:00
```

### Duraciones por especialidad:
```
Cardiología: 30 min
Traumatología: 30 min  
Dermatología: 20 min
ORL: 25 min
Clínica Médica: 20 min
Estudios (ecocardiograma, etc.): 45 min
```

---

## 8. ORDEN DE IMPLEMENTACIÓN

1. **DB:** Crear tablas nuevas (grillas_medicas, bloqueos_grilla, duracion_prestaciones)
2. **DB:** Seed datos demo de grillas para empresa 16
3. **Backend:** Nuevo endpoint `/turnos/disponibilidad`
4. **Backend:** Endpoint `/pacientes/buscar_por_dni`
5. **Agente:** Skill `turnos-autonomos` con prompt completo
6. **Telegram:** Integrar gateway con skill de turnos
7. **Frontend:** Panel para ver/editar grillas médicas (admin web)
8. **Cron:** Job de recordatorios automáticos

---

## 9. REGLAS DE NEGOCIO

1. **DNI es la clave única** de identificación del paciente
2. **Máximo 3 sobre-turnos** por médico → si hay doble turno acumulado, redirigir a otra fecha
3. **Obra social se solicita** en alta, "particular" por defecto
4. **Recordatorio 24hs antes** al teléfono registrado
5. **El agente siempre verifica disponibilidad** antes de reservar
6. **Turnos pasados** no se pueden cancelar ni editar
7. **Multi-tenant estricto:** cada clínica ve solo sus propios datos
