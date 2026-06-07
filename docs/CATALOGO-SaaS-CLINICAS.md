# SetubalAI — Catálogo Comercial: Sistema Integral de Gestión Clínica

**Versión:** 1.0 — Junio 2026
**Producto:** SaaS para Clínicas Multiespecialidad
**Sitio comercial:** setubalai.org
**Demo en vivo:** dev.setubalai.org
**Bot demo:** @SetubalClibot en Telegram

---

## 🏥 QUÉ ES SETUBALAI PARA CLÍNICAS

**Un agente de inteligencia artificial + plataforma web completa** que automatiza la gestión de turnos, atiende pacientes 24/7 por Telegram, y digitaliza toda la operación de una clínica multiespecialidad: desde la primera llamada del paciente hasta la historia clínica, las recetas y las métricas del negocio.

> **La propuesta:** "Hoy tenés 2-3 personas tomando turnos por teléfono, WhatsApp y mostrador. SetubalAI reemplaza esa operación con un agente IA que funciona solo, 24 horas, y le dá a la clínica datos reales para gestionar."

---

## 📦 QUÉ INCLUYE (PAQUETE COMPLETO)

El sistema es **DOS productos integrados** que funcionan como uno solo:

### 1️⃣ BOT AGENTE IA (Telegram) — El recepcionista 24/7
### 2️⃣ WEB APP DE GESTIÓN — El panel de la clínica

---

## 🤖 MÓDULO 1: BOT AGENTE IA POR TELEGRAM

El paciente interactúa con el bot como si hablara con una recepcionista real. **Sin formularios, sin apps, sin web.** Solo escribe por Telegram.

### ✅ Funcionalidades del Bot

| Función | Descripción |
|---------|-------------|
| **Identificación automática** | Reconoce al paciente por su chat de Telegram. Si ya es paciente, salta directo al menú. Si es nuevo, le pide datos y lo registra automáticamente. |
| **Vinculación manual** | Comando `/vincular DNI` — vincula un chat existente con un paciente de la clínica. |
| **Agendar turno** | Flujo completo: elegir especialidad → elegir médico → ver horarios disponibles → confirmar turno. Todo con botones inline. |
| **Crear paciente nuevo** | Si el paciente no existe, el bot le pide nombre, DNI, obra social y teléfono durante el flujo de agendado. |
| **Cancelar turno** | El paciente ve sus turnos futuros y puede cancelar con un clic. |
| **Reprogramar turno** | Muestra el turno a reprogramar, busca nuevos slots disponibles y confirma el cambio. |
| **Ver mis turnos** | Lista todos los turnos pendientes del paciente. |
| **Detección de intención** | El bot entiende si el paciente quiere agendar, cancelar, reprogramar o ver sus turnos — sin necesidad de usar el menú. |
| **Anti-duplicados** | Un paciente NO puede tener 2 turnos pendientes para la misma especialidad. |
| **Menú principal** | 5 opciones claras con botones inline: Agendar turno, Cancelar turno, Reprogramar, Ver mis turnos, Ayuda. |
| **Auto-vinculación** | Al identificarse por DNI, el bot guarda automáticamente el chat_id del paciente para futuras interacciones. |

### 🔧 Tecnologías del Bot
- Framework: python-telegram-bot v21+
- State machine con tracking por chat_id
- Integración directa con MCP tools del backend
- Botones inline para interacción sin tipeo
- Compatible con cualquier idioma

---

## 🖥️ MÓDULO 2: WEB APP DE GESTIÓN CLÍNICA

Panel web completo para el personal de la clínica (recepcionistas, médicos, administradores).

### 📊 Dashboard Principal
- **Resumen del día:** Turnos de hoy, por estado, por especialidad
- **Métricas en vivo:** Total pacientes, turnos del mes, obras sociales
- **Acceso rápido** a las secciones más usadas

### 📅 Gestión de Turnos

| Función | Detalle |
|---------|---------|
| **Lista de turnos** | Todos los turnos con filtros por especialidad, médico y estado |
| **Calendario mensual** | Vista tipo calendario con turnos coloreados por especialidad. Panel lateral con detalles del día seleccionado |
| **Agenda del día (timeline)** | Línea de tiempo visual del día — quién viene, a qué hora, en qué estado está cada turno |
| **Crear turno** | Formulario completo con selección de paciente, especialidad, médico, fecha/hora |
| **Cambiar estado del turno** | Botones para marcar: Confirmado → En espera → En consulta → Completado → Cancelado |
| **Cancelar turno** | Con registro de cancelación |
| **Slots libres** | Visualización de horarios disponibles por médico para asignar turnos |

### 👥 Gestión de Pacientes

| Función | Detalle |
|---------|---------|
| **Lista de pacientes** | Todos los pacientes con búsqueda |
| **Ficha del paciente** | Datos personales, obra social, teléfono |
| **Historial completo** | Todas las consultas, prácticas, recetas y estudios del paciente en una sola vista |
| **Historia clínica** | Registro médico acumulativo: diagnósticos, síntomas, observaciones, signos vitales. Crece con cada consulta |
| **Filtro por especialidad/médico** | Ver pacientes que fueron atendidos por un profesional o especialidad específica |

### 👨‍⚕️ Gestión de Profesionales (Médicos)

| Función | Detalle |
|---------|---------|
| **Lista de médicos** | Todos los profesionales con sus especialidades |
| **Datos del médico** | Nombre, matrícula provincial y nacional, especialidades, duración de turno |
| **Filtro por especialidad** | Ver médicos de una especialidad específica |
| **Mis pacientes (vista médico)** | Un médico ve solo los pacientes que ya atendió |

### 🏥 Prácticas Médicas

| Función | Detalle |
|---------|---------|
| **Lista de prácticas** | Todas las prácticas realizadas, vinculadas a consultas |
| **Nomenclador** | Catálogo de prácticas con códigos (NABON), descripción, tipo, precio y duración |
| **CRUD completo** | Agregar, editar, eliminar prácticas del catálogo |

### 📝 Recetas Médicas

| Función | Detalle |
|---------|---------|
| **Lista de recetas** | Todas las recetas emitidas |
| **Recetas por paciente** | Historial de recetas de un paciente |
| **Detalle de receta** | Contenido completo de cada receta |

### 🔬 Estudios Adjuntos

| Función | Detalle |
|---------|---------|
| **Lista de estudios** | Todos los estudios/imágenes adjuntos |
| **Estudios por paciente** | Historial de estudios de un paciente |
| **Metadata completa** | Tipo de estudio, fecha, nombre de archivo, URL, tipo MIME, tamaño |

---

## ⚙️ MÓDULO 3: CONFIGURACIÓN DE LA CLÍNICA

**Todo es configurable.** Cada clínica personaliza su sistema sin tocar código.

### 🕐 Configuración de Agenda

| Entidad | Funcionalidades |
|---------|----------------|
| **Grillas horarias** | Definir horarios semanales por médico (ej: lunes 8:00-14:00, miércoles 14:00-20:00). CRUD completo con modales |
| **Bloqueos de agenda** | Marcar días/horas como no disponibles (vacaciones, congresos, feriados). CRUD completo |
| **Duraciones por prestación** | Cuánto dura cada tipo de consulta por especialidad (ej: Cardiología = 30 min, Dermatología = 20 min). CRUD completo |
| **Prestaciones / Nomenclador** | Catálogo de prácticas médicas con código, descripción, tipo, precio particular, duración, si requiere autorización. CRUD + búsqueda |

### 🏥 Configuración de Especialidades

| Función | Detalle |
|---------|---------|
| **Alta/Baja/Modificación** | CRUD completo de especialidades médicas |
| **Asignación a médicos** | Relación M:N — un médico puede tener múltiples especialidades |
| **Catálogo de la clínica** | Cada clínica define QUÉ especialidades ofrece |

### 👨‍⚕️ Configuración de Profesionales

| Función | Detalle |
|---------|---------|
| **Alta de médico** | Nombre, apellido, matrículas, especialidades, duración de turno, activo/inactivo |
| **Edición completa** | Modificar datos, especialidades, horarios |
| **Eliminación segura** | Con verificación de registros afectados (turnos, pacientes, atenciones) |

### 🏛️ Obras Sociales

| Función | Detalle |
|---------|---------|
| **CRUD completo** | Alta, edición, eliminación de obras sociales |
| **8 obras de ejemplo** | OSDE, Swiss Medical, PAMI, IOMA, Particular, Galeno, Medifé, IAPOS |
| **Vinculación a paciente** | Cada paciente tiene su obra social asignada |

---

## 🏗️ ARQUITECTURA TÉCNICA (para mostrar solidez)

### Stack tecnológico
| Capa | Tecnología |
|------|-----------|
| Backend | Python + FastAPI (REST API) |
| Frontend | Next.js 15 (React, TypeScript) |
| Base de datos | PostgreSQL 17 (multi-tenant) |
| Bot IA | python-telegram-bot + MCP tools |
| Autenticación | JWT + multi-tenant isolation |
| Deploy | Docker + systemd + Nginx |
| Acceso público | Cloudflare Tunnel |

### Multi-tenant (SaaS real)
- **Cada clínica tiene su propio espacio aislado** (empresa_id)
- Un médico de la Clínica A NO ve datos de la Clínica B
- El superadmin (SetubalAI) ve métricas globales de TODAS las clínicas
- Escala a miles de clínicas sin infraestructura adicional

### Servicios activos (VPS)
| Servicio | Puerto | Función |
|----------|--------|---------|
| API Backend FastAPI | 3010 | Todos los datos y lógica |
| Web App Clínica | 3011 | Panel de gestión |
| Panel Admin (Superadmin) | 3012 | Gestión multi-tenant |
| Clinic Bot Telegram | — | Agente de turnos |
| Infrastructure API | 9993 | Monitoreo del ecosistema |
| DB Explorer | 9991 | Explorador de base de datos |

---

## 📊 DATOS DE LA DEMO (Centro Médico Santa Clara)

La demo en vivo tiene datos ficticios pero **100% funcionales**:

| Entidad | Cantidad |
|---------|----------|
| Especialidades médicas | 5 (Cardiología, Clínica Médica, Pediatría, Dermatología, Traumatología) |
| Médicos | 15 (3 por especialidad) |
| Pacientes | 36 |
| Turnos/Visitas | 158 |
| Historia clínica | 62 registros |
| Atenciones médicas | 31 |
| Prácticas médicas | 65 |
| Recetas | 24 |
| Estudios adjuntos | 20 |
| Nomenclador | 18 prácticas catalogadas |
| Obras sociales | 8 |
| Grillas horarias | 12 |

---

## 💡 QUÉ LO DIFERENCIA DE OTROS SOFTWARE

| SetubalAI | Software Tradicional |
|-----------|---------------------|
| Agente IA atiende pacientes por Telegram | Formularios web o llamada telefónica |
| Identifica paciente automáticamente | La recepcionista pide datos cada vez |
| Crea pacientes nuevos durante el flujo | Hay que cargarlo manualmente después |
| Verifica disponibilidad en tiempo real | Calendario estático, sin prevención de solapamientos |
| Evita turnos duplicados por especialidad | Sin control de duplicados |
| Cancelación y reprogramación automática | El paciente debe llamar para cancelar |
| Historia clínica digital acumulativa | Papeles o archivos sueltos |
| Dashboard con métricas reales | Sin reportes o Excel manual |
| Multi-tenant (miles de clínicas en 1 infra) | 1 instalación por clínica = costoso |
| Configuración 100% personalizable | Software rígido, no se adapta |

---

## 🎯 FLUJO DE VENTA (Cómo mostrarlo a una clínica)

### Demo de 5 minutos:

1. **Abrir Telegram** → buscar @SetubalClibot → escribir "Hola, quiero turno"
   → El bot te identifica, te muestra especialidades, médicos, horarios
   → Confirmás turno → ¡Listo!

2. **Abrir dev.setubalai.org** → login → Dashboard
   → Se ve el turno que acabás de agendar por Telegram
   → Navegás a Pacientes → ves la historia clínica
   → Navegás a Calendario → grilla mensual con colores por especialidad

3. **Mostrar Configuración** → Grillas, Especialidades, Médicos, Obras Sociales
   → "Todo esto se adapta a TU clínica"

### Pitch verbal:
> "Esto no es un software de turnos. Es un **agente inteligente** que trabaja para tu clínica 24 horas, 7 días. Tu recepcionista deja de atender teléfonos y se dedica a atender pacientes. Y vos tenés un dashboard con datos reales de tu negocio."

---

## 💰 MODELO SAaaS — Estructura de Precios Sugerida

### Opción 1: Por médico activo (escala con la clínica)
| Plan | Precio/mes | Incluye |
|------|-----------|---------|
| **Starter** | $X/mes | Hasta 3 médicos, 1 especialidad, Bot Telegram, Web App |
| **Professional** | $Y/mes | Hasta 10 médicos, todas especialidades, + HC + Recetas |
| **Enterprise** | $Z/mes | Médicos ilimitados, + Panel admin, + Métricas avanzadas |

### Opción 2: Por volumen de turnos
| Plan | Turnos/mes | Precio |
|------|-----------|--------|
| Básico | Hasta 500 | $X |
| Estándar | Hasta 2,000 | $Y |
| Premium | Ilimitado | $Z |

### Opción 3: Setup + Mensualidad fija
- **Setup inicial:** $X (configuración de la clínica, carga de datos, capacitación)
- **Mensualidad:** $Y/mes todo incluido

### Servicios adicionales (upsell)
- WhatsApp Business API (además de Telegram)
- Recordatorios automáticos de turnos
- Facturación electrónica / integración con obras sociales
- Módulo de cobros y facturación
- Portal de paciente (ver turnos, descargar recetas)
- Integración con sistemas de laboratorio/imágenes

---

## 🚀 PRÓXIMOS PASOS PARA COMERCIALIZAR

1. **Documento existente:** Crear landing page en setubalai.org/especialidad/clínicas
2. **Video demo:** Grabar un video de 3 minutos mostrando el flujo completo (bot → web → dashboard)
3. **PDF comercial:** Exportar este catálogo como PDF profesional con branding
4. **Primer cliente piloto:** Ofrecer gratis o a costo a un conocido que tenga clínica
5. **Testimonios:** Con el piloto, documentar resultados reales (reducción de no-show, tiempo ahorrado)
6. **Escalamiento:** Con 1-2 casos de éxito, outreach activo a clínicas de la zona

---

## 📋 RESUMEN: TODO LO QUE HACE EL SISTEMA

### ✅ COMPLETO Y FUNCIONAL
- [x] Bot Telegram con flujo completo de turnos (agendar, cancelar, reprogramar, ver)
- [x] Identificación automática de pacientes por Telegram
- [x] Creación de pacientes nuevos durante el flujo
- [x] Dashboard con métricas del día
- [x] Lista de turnos con filtros (especialidad, médico, estado)
- [x] Calendario mensual con grilla visual
- [x] Agenda del día (timeline)
- [x] CRUD de pacientes
- [x] Historia clínica del paciente
- [x] CRUD de médicos/profesionales
- [x] CRUD de especialidades
- [x] CRUD de obras sociales
- [x] CRUD de grillas horarias
- [x] CRUD de bloqueos de agenda
- [x] CRUD de duraciones por prestación
- [x] CRUD de nomenclador/prácticas
- [x] Gestión de recetas
- [x] Gestión de estudios adjuntos
- [x] Gestión de atenciones médicas
- [x] Prácticas médicas
- [x] Multi-tenant (múltiples clínicas aisladas)
- [x] Autenticación JWT con 3 roles (superadmin, admin, médico)
- [x] Context Provider y filtros reactivos
- [x] 19 funciones API de configuración (CRUD completo)
- [x] 31 endpoints de la API médica
- [x] 9 MCP tools médicas
- [x] 10 MCP tools CRM
- [x] 6 servicios systemd activos
- [x] Sistema de monitoreo de infraestructura
- [x] Explorador de base de datos
- [x] Seed parametrizable para demos
- [x] Diagnóstico de alineación (26 checks)
- [x] Validator (27 checks)

### 🔄 EN DESARROLLO / MEJORABLE
- [ ] Página dedicada de recetas (frontend)
- [ ] Formularios de carga de atenciones (frontend)
- [ ] Recordatorios automáticos (cron)
- [ ] Integración con WhatsApp
- [ ] Módulo de facturación/cobros
- [ ] Portal de paciente
- [ ] PDF de recetas para descargar
- [ ] Notificaciones push

---

*Documento generado: Junio 2026 | SetubalAI — Agencia de IA para PYMES | setubalai.org*
