# FLUJO COMPLETO: Turnos Médicos vía Telegram

**Creado:** 2026-05-27
**Propósito:** Flujo completo y sin lagunas para que pacientes agenden turnos por Telegram usando el agente IA autónomo.

---

## 0. PRINCIPIO FUNDAMENTAL
**El agente resuelve TODO automáticamente. Sin intervención humana NUNCA.**
Flujo: Paciente escribe en Telegram → agente identifica → busca disponibilidad → ofrece → confirma → registra en DB → notifica.

---

## 1. COMPONENTES DEL ECOSISTEMA

| Componente | Ubicación | Función |
|------------|-----------|---------|
| **Telegram Bot** | Bot gratuito creado para setubalai.org | Recibe mensajes del paciente |
| **Hermes Gateway** | hermes-gateway-local.service | Conecta Telegram con el agente |
| **MCP Server** | services/api/mcp_server.py | Expone herramientas médicas como MCP tools |
| **API Backend** | FastAPI :3010 (salud.py) | CRUD médico completo (22 endpoints) |
| **PostgreSQL** | Docker paperclip-db | Base de datos multi-tenant (empresa_id=16) |
| **Web App** | Next.js :3011 | Dashboard para que la clínica vea turnos, pacientes, etc. |

---

## 2. ESTADO ACTUAL (2026-05-27)

### ✅ Funcionando:
- **API Backend**: 22 endpoints médicos funcionales
  - `/pacientes/`, `/medicos/`, `/turnos/`, `/historia_clinica/`, `/practicas_medicas/`, `/recetas/`, `/estudios_adjuntos/`, `/nomenclador_practicas/`
  - Multi-tenant isolation por empresa_id
  - JWT auth con roles (admin, medico, operador)
- **DB Demo**: Empresa 16 "Centro Médico Santa Clara" con datos realistas
  - 20 pacientes, 5 médicos, 39 turnos, 35 historias clínicas, 31 prácticas, 18 nomencladores
- **MCP Server**: Actualmente solo tiene tools de facturación/CRM (**NO TIENE TOOLS MÉDICAS**)
- **Hermes Gateway**: Activo y funcionando

### ❌ FALTA CREAR:
- **MCP Tools médicas**: Para que el agente pueda agendar turnos
- **Bot de Telegram**: Crear y vincular con Hermes Gateway
- **Skill `turnos-telegram-v1`**: Instrucciones específicas para el flujo de turnos

---

## 3. FLUJO COMPLETO DE AGENDAMIENTO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE AGENDAMIENTO POR TELEGRAM                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. PACIENTE INICIA CONVERSACIÓN
   └─ Paciente envía: "Hola, quiero sacar turno"
   └─ Agente responde: "¡Hola! ¿Es tu primera vez en el centro médico?"

2. IDENTIFICACIÓN DEL PACIENTE
   ├─ SI NUEVO:
   │  └─ Agente pide: nombre, apellido, DNI, obra social, teléfono
   │  └─ MCP: `crear_paciente(datos)` → POST /pacientes/
   │  └─ Verificar: GET /pacientes/ → confirmar creado
   │  └─ Continuar a paso 3
   └─ SI EXISTENTE:
      └─ Agente busca por DNI: MCP `buscar_paciente(dni)`
      └─ Verificar: GET /pacientes/ → confirmar datos correctos
      └─ Continuar a paso 3

3. SELECCIÓN DE ESPECIALIDAD Y MÉDICO
   ├─ Agente lista especialidades disponibles (extraídas de médicos activos)
   ├─ PACIENTE ELIGE: "Cardiología"
   └─ Agente filtra médicos: MCP `buscar_medicos_por_especialidad("Cardiología")`
      └─ Lista médicos disponibles: Dr. García, Dra. López, etc.
      └─ PACIENTE ELIGE: "Dr. García"

4. BÚSQUEDA DE DISPONIBILIDAD
   ├─ Paciente sugiere fecha: "La próxima semana"
   ├─ MCP: `buscar_slots_disponibles(medico_id=3, fecha_desde="2026-06-02", fecha_hasta="2026-06-06")`
   │  └─ GET /turnos/ → filtra por medico_id
   │  └─ Genera slots basado en horarios_atencion del médico
   │  └─ Excluye slots ya ocupados
   │  └─ Retorna: [{"slot": "2026-06-03 09:00", "disponible": true}, ...]
   └─ Agente presenta 3-5 opciones al paciente

5. CONFIRMACIÓN Y CREACIÓN DE TURNO
   ├─ PACIENTE ELIGE: "El miércoles 3 a las 9"
   └─ Agente verifica última disponibilidad: MCP `verificar_slot_disponible(medico_id, fecha_hora)`
      └─ SI disponible:
         └─ MCP: `crear_turno(datos)` → POST /turnos/
            │  {
            │    "paciente_nuevo_id": 123,
            │    "medico_id": 3,
            │    "fecha_hora": "2026-06-03T09:00:00",
            │    "duracion_minutos": 30,
            │    "estado": "pendiente",
            │    "motivo_consulta": "Consulta general",
            │    "tipo_visita": "consulta"
            │  }
         └─ Verificar: GET /turnos/ → confirmar turno creado
         └─ MCP: `verificar_turno_creado(turno_id)` → confirma existencia en DB
      └─ SI NO disponible (race condition):
         └─ Agente: "Ups, ese horario se ocupó. Te ofrezco alternativas..."

6. NOTIFICACIÓN DE CONFIRMACIÓN
   └─ Agente envía a paciente por Telegram:
      "✅ Tu turno está confirmado:
         🗓️ Miércoles 3 de junio - 09:00
         👨‍⚣️ Dr. García - Cardiología
         🏥 Centro Médico Santa Clara
         
         Recordá traer DNI y carnet de obra social."

7. RECORDATORIO AUTOMÁTICO (T-24h)
   └─ MCP: `programar_recordatorio(turno_id, canal="telegram", antes_horas=24)`
      └─ Crea notificacion_programada en DB
      └─ Cron job o Hermes scheduled task envía recordatorio

8. POST-ATENCIÓN (Opcional, futuro)
   └─ After turno completado: agendar follow-up si es necesario
```

---

## 4. MCP TOOLS MÉDICAS A CREAR

Estas tools NO existen aún en `mcp_server.py`. Se deben agregar para que Hermes pueda operar el flujo:

```python
@mcp.tool()
def buscar_paciente(
    dni: Optional[str] = None,
    nombre: Optional[str] = None,
    apellido: Optional[str] = None,
    telefono: Optional[str] = None,
    empresa_id: int = 16  # Centro Médico Santa Clara (demo)
) -> dict:
    """Busca pacientes por criterios. Retorna lista de coincidencias."""

@mcp.tool()
def crear_paciente(
    nombre: str,
    apellido: str,
    dni: str,
    fecha_nacimiento: Optional[str] = None,
    obra_social: Optional[str] = None,
    telefono: Optional[str] = None,
    email: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Crea un nuevo paciente. Retorna datos del paciente creado."""

@mcp.tool()
def listar_medicos(
    especialidad: Optional[str] = None,
    activo: bool = True,
    empresa_id: int = 16
) -> dict:
    """Lista médicos activos, opcionalmente filtrados por especialidad."""

@mcp.tool()
def buscar_slots_disponibles(
    medico_id: int,
    fecha_desde: str,  # YYYY-MM-DD
    fecha_hasta: str,
    duracion_minutos: int = 30,
    empresa_id: int = 16
) -> dict:
    """Busca slots disponibles para un médico en un rango de fechas.
    Considera turnos existentes, horarios de atención, y duración."""

@mcp.tool()
def crear_turno(
    paciente_nuevo_id: int,
    medico_id: int,
    fecha_hora: str,  # ISO format YYYY-MM-DDTHH:MM:SS
    duracion_minutos: int = 30,
    motivo_consulta: Optional[str] = None,
    tipo_visita: str = "consulta",
    empresa_id: int = 16
) -> dict:
    """Crea un turno (visita) en la DB. Retorna confirmación."""

@mcp.tool()
def verificar_turno(turno_id: int, empresa_id: int = 16) -> dict:
    """Verifica que un turno existe y está correctamente registrado."""

@mcp.tool()
def listar_turnos(
    medico_id: Optional[int] = None,
    paciente_id: Optional[int] = None,
    fecha: Optional[str] = None,
    estado: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Lista turnos con filtros. Útil para dashboard del día."""
```

---

## 5. CUESTIONARIO DE VALIDACIÓN (Verificar cada paso)

Antes de considerar el flujo "completo", verificar cada punto:

- [ ] **V01**: Paciente nuevo puede ser creado via MCP tool → DB
- [ ] **V02**: Paciente existente se puede buscar por DNI via MCP
- [ ] **V03**: Especialidades se pueden extraer de los médicos activos
- [ ] **V04**: Slots disponibles se calculan correctamente (excluye ocupados)
- [ ] **V05**: Creación de turno via POST /turnos/ funciona con datos válidos
- [ ] **V06**: Turno creado aparece en GET /turnos/ con datos correctos
- [ ] **V07**: Multi-tenant funciona (empresa_id=16 aislado)
- [ ] **V08**: JWT auth para usuario de empresa 16 funciona
- [ ] **V09**: Bot de Telegram vinculado a Hermes Gateway
- [ ] **V10**: Agente puede interactuar via Telegram con flujo completo
- [ ] **V11**: Recordatorios programados funcionan
- [ ] **V12**: Panel web muestra los turnos creados por Telegram

---

## 6. ENDPOINTS API NECESARIOS

### Ya implementados en `salud.py`:

| Endpoint | Método | Función | Estado |
|----------|--------|---------|--------|
| `/pacientes/` | GET | Lista pacientes | ✅ |
| `/pacientes/` | POST | Crea paciente | ✅ |
| `/pacientes/{id}/historial` | GET | Historial completo | ✅ |
| `/medicos/` | GET | Lista médicos | ✅ |
| `/medicos/` | POST | Crea médico | ✅ |
| `/turnos/` | GET | Lista turnos | ✅ |
| `/turnos/` | POST | Crea turno | ✅ |
| `/turnos/{id}` | PUT | Edita turno | ✅ |
| `/turnos/{id}/cancelar` | POST | Cancela turno | ✅ |
| `/nomenclador_practicas/` | GET | Lista nomenclador | ✅ |
| `/historia_clinica/` | GET | Lista historias | ✅ |
| `/practicas_medicas/` | GET | Lista prácticas | ✅ |
| `/practicas_medicas/` | POST | Crea práctica | ✅ |
| `/mis_pacientes/` | GET | Pacientes del médico | ✅ |
| `/recetas/` | GET | Lista recetas | ✅ |
| `/estudios_adjuntos/` | GET | Lista estudios | ✅ |

---

## 7. PRÓXIMOS PASOS INMEDIATOS

1. **Crear MCP tools médicas** en `mcp_server.py`
2. **Crear bot de Telegram** y vincular con Hermes Gateway
3. **Crear skill `turnos-telegram-v1`** con instrucciones del flujo
4. **Testear flujo E2E**: Paciente nuevo → Telegram → Agente → DB → Verificación
5. **Validar V01-V12** del cuestionario
6. **Documentar en SNAPSHOT** para referencia futura

---

**NOTA IMPORTANTE**: Todo el trabajo es **DEMO con empresa_id=16**. Estos datos NO son reales. La empresa "Centro Médico Santa Clara" es ficticia.

**ARCHIVOS CLAVE:**
- `services/api/mcp_server.py` → MCP tools a crear
- `services/api/routers/salud.py` → Endpoints ya funcionando
- `services/api/models.py` → Modelos SQLAlchemy alineados con DB
- `docs/FLUJO-TELEGRAM-TURNOS-COMPLETO.md` → Este documento
- `.hermes/profiles/local/skills/setubalai-project-context/SKILL.md` → Skill maestro con todo el contexto
