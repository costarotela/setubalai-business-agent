# GOAL — SetubalAI Agent IA para Clínicas Médicas Multiespecialidad
**Producto:** Agente IA especializado para gestionar logística y administración de clínicas médicas multiespecialidad
**Owner:** Pablo (@pcostarotela) — SetubalAI
**Inicio:** 2026-05-21
**Pivote estratégico:** 2026-05-26 — De "agente genérico" → "agente para clínicas médicas"
**Estado:** MVP CLÍNICA MÉDICA EN CONSTRUCCIÓN

---

## VISION

**OBJETIVO DEFINITIVO:** Todas las clínicas médicas de multiespecialidad necesitan un agente especializado para resolver la logística y administración de toda la información relacionada con los pacientes que se atienden en la clínica.

El centro de todo es el **PACIENTE** y su **HISTORIA CLÍNICA**. De ahí derivan todas las relaciones: agendar turnos, atención médica, prácticas, recetas, estudios, seguimientos.

**Modelo: SaaS Multi-Tenant.** Una infraestructura, N clínicas clientes.
Cada mejora se despliega una vez y llega a todos. Cada clínica ve solo sus datos.

Ver diagrama visual completo: `docs/FLUJO-CENTRO-MEDICO.html`

Ver arquitectura completa: `docs/ARQUITECTURA-SAAS.md`

---

## INTERFACES

```
📱 TELEGRAM          🌐 WEB APP (Next.js)      📊 DASHBOARD
Operación diaria     Control visual completo   KPIs en tiempo real
lenguaje natural     ABM + formularios         Gráficos gerenciales
```

---

## STACK TECNOLOGICO DEFINITIVO

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Base de datos | PostgreSQL 17 | Ya existe en Docker, escala, multi-tenant |
| Backend API | FastAPI (Python) | Async, rápido, auto-documentado |
| Frontend | Next.js 14 + shadcn/ui | Full-stack moderno, deploy simple |
| Gráficos | Recharts | Componentes listos para dashboards |
| Memoria AI | Noxem | Memoria semántica persistente |
| Agente AI | Hermes Agent | Motor de lenguaje natural |
| **Mensajería** | **WhatsApp (Evolution API)** | **Canal principal — 95% clientes Latam** |
| Containerización | Docker + docker-compose | Replicable, escalable |
| Hosting | Hetzner VPS | SaaS compartido hasta ~50 clientes |
| DNS/Proxy | Cloudflare Tunnel | Ya configurado, HTTPS automático |
| Auth | JWT + roles | Dueño, operador, contador |

---

## MODULOS DEL SISTEMA

### CRM
- [ ] Alta/baja/modificación clientes
- [ ] Estados: prospecto → activo → inactivo → moroso
- [ ] Historial completo por cliente
- [ ] Importar desde CSV/Excel
- [ ] Exportar a Excel/PDF

### Cobros y Facturación
- [ ] CRUD facturas
- [ ] Estados: borrador → enviada → pendiente → pagada → vencida
- [ ] Recordatorios automáticos (3 días antes, vencimiento, después)
- [ ] Reporte morosos con aging (0-30, 31-60, 61+ días)
- [ ] Proyección flujo de caja 30/60/90 días
- [ ] Exportar facturas a PDF

### Productos y Servicios
- [ ] Catálogo dual (productos físicos + servicios)
- [ ] Control de stock con alertas
- [ ] Precios: unitario, por hora, suscripción
- [ ] Historial de ventas por producto

### Proveedores
- [ ] CRUD proveedores
- [ ] Órdenes de compra
- [ ] Pagos pendientes a proveedores

### Atención al Cliente
- [ ] Sistema de tickets
- [ ] Estados: abierto → en proceso → resuelto
- [ ] Prioridades
- [ ] Tiempo de resolución

### Dashboard y Reportes
- [ ] KPIs en tiempo real
- [ ] Ventas del período (vs anterior)
- [ ] Top clientes y productos
- [ ] Gráficos interactivos
- [ ] Reportes custom exportables

### Memoria AI (Noxem)
- [ ] Instalación y configuración
- [ ] Integración con Hermes
- [ ] Persistencia entre sesiones
- [ ] Búsqueda semántica del historial

### Notificaciones
- [ ] Telegram (principal)
- [ ] Email automático
- [ ] Push en navegador (futuro)

### Onboarding
- [ ] Wizard guiado primer uso (5 pasos)
- [ ] Datos de prueba opcionales
- [ ] Conexión Telegram en onboarding

### Seguridad y Administración
- [ ] Login JWT
- [ ] Roles: admin, operador, solo lectura
- [ ] Audit log (quién hizo qué y cuándo)
- [ ] Backup automático
- [ ] Exportar todos los datos del cliente

### Integraciones (Fase futura)
- [ ] MercadoPago
- [ ] Stripe
- [ ] Google Calendar
- [ ] WhatsApp Business API
- [ ] Multi-idioma (ES/EN)

---

## FASES Y TRAZABILIDAD

### FASE 1 — CORE BACKEND + TELEGRAM
**Meta:** Pablo gestiona SetubalAI 100% por Telegram

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 1.1 | Instalar Noxem en VPS | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | `hermes memory status` muestra Noxem activo |
| 1.2 | Integrar Noxem con Hermes | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | `noxem (local) ← active` + servidor v2.1.0 corriendo en puerto 3001 |
| 1.3 | Schema PostgreSQL completo | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | 16 tablas en schema `setubalai`, datos SetubalAI cargados, DB `business` en Docker |
| 1.4 | FastAPI con módulo CRM | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | CRUD clientes funciona, crear/listar validado |
| 1.5 | FastAPI módulo Cobros | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | FAC-001-0001 creada $99, pendientes, vencidas |
| 1.6 | FastAPI módulo Productos | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | 7 productos SetubalAI listados correctamente |
| 1.7 | FastAPI módulo Proveedores | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Schema y modelo creados en BD |
| 1.8 | FastAPI módulo Reportes | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Dashboard KPIs, resumen semanal, top clientes |
| 1.9 | Skills Hermes para Telegram | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | 4 skills instaladas: setubalai-crm, cobros, productos, reportes — enabled en perfil local |
| 1.10 | Crons automáticos | ⏳ PENDIENTE | — | — | Recordatorio llega a Telegram |
| 1.11 | TEST COMPLETO FASE 1 | ⏳ PENDIENTE | — | — | Checklist 8 items aprobado por Pablo |

### FASE 2 — WEB APP
**Meta:** Dashboard accesible en suempresa.setubalai.org

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 2.1 | Setup Next.js + shadcn/ui | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | App construida, corriendo en puerto 3011 via systemd |
| 2.2 | Dashboard KPIs | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | 4 KPI cards + facturas recientes + clientes activos |
| 2.3 | Página Clientes | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | CRUD completo, búsqueda, filtros, formulario nuevo |
| 2.4 | Página Cobros | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Stats, pendientes, vencidas, marcar pagada |
| 2.5 | Página Productos | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Catálogo, stock crítico, tarjetas visuales |
| 2.6 | Página Reportes | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Barras facturación, resumen semanal, top clientes |
| 2.13 | TEST COMPLETO FASE 2 | ⏳ PENDIENTE | — | — | Pablo aprueba la web app |

### FASE 3 — DOCKERIZAR
**Meta:** Nuevo cliente instalado en menos de 5 minutos

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 3.1 | Dockerfile API | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Imagen setubalai/agent-api:latest (327MB) |
| 3.2 | Dockerfile Web | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Imagen setubalai/agent-web:latest (305MB) |
| 3.3 | docker-compose completo | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | db + api + web, config validado |
| 3.4 | .env.example documentado | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Plantilla con todas las variables |
| 3.5 | install.sh de 1 comando | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Script verifica Docker, build, up |
| 3.6 | README.md del producto | ✅ COMPLETADO | 2026-05-21 | 2026-05-21 | Documentación completa para clientes |

### FASE 4 — SAAS MULTI-TENANT (REFORMULADA 2026-05-22)
**Meta:** Producto vendible a múltiples empresas desde una sola infraestructura
**Decisión:** SaaS compartido (NO instancia por cliente). Ver docs/ARQUITECTURA-SAAS.md

#### NIVEL 1 — BLOQUEANTE PARA VENDER

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 4.1 | Auth JWT + login web | ✅ COMPLETADO | 2026-05-22 | 2026-05-22 | Login funciona via /login, JWT con empresa_id+rol, superadmin Pablo OK |
| 4.2 | Enrutamiento multi-empresa en frontend | ✅ COMPLETADO | 2026-05-22 | 2026-05-22 | tenancy.py: JWT > X-Empresa-ID > query param > default 1 |
| 4.3 | Evolution API (WhatsApp multi-empresa) | ⏳ PENDIENTE | — | — | Mensaje WA → Hermes → respuesta correcta |
| 4.4 | Static file serving (Hermes manda links) | ✅ COMPLETADO | 2026-05-22 | 2026-05-22 | https://demo.setubalai.org/outputs/ activo, 200 OK externo |

#### NIVEL 2 — PERSONALIZACIÓN

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 4.5 | Personalización por empresa (logo, color, nombre) | ⏳ PENDIENTE | — | — | Empresa A y B se ven diferentes |
| 4.6 | Módulos on/off por plan | ⏳ PENDIENTE | — | — | Starter no ve Productos ni Proveedores |

#### NIVEL 3 — ESCALA SIN TRABAJO MANUAL

| Paso | Tarea | Estado | Fecha inicio | Fecha fin | Validación |
|------|-------|--------|-------------|-----------|------------|
| 4.7 | Onboarding automatizado | ⏳ PENDIENTE | — | — | Alta completa <2 min sin tocar servidor |
| 4.8 | DELETE empresa + empresa test end-to-end | ✅ COMPLETADO | 2026-05-22 | 2026-05-22 | Aislamiento multi-tenant OK, DELETE en cascada OK, protección empresa 1 OK |
| 4.9 | Monitoreo automático + alertas | ⏳ PENDIENTE | — | — | Caída detectada → alerta WA <10 min |

---

## CRITERIO DE EXITO FINAL

El producto está listo para vender cuando:

### Por WhatsApp (el cliente de la empresa puede):
- [ ] Consultar datos de clientes
- [ ] Registrar pagos y facturas
- [ ] Pedir reportes
- [ ] Recibir links a documentos generados

### Por WhatsApp o Telegram (Pablo puede):
- [ ] Agregar un cliente nuevo con lenguaje natural
- [ ] Ver todos los clientes morosos
- [ ] Marcar una factura como pagada
- [ ] Ver cuánto facturó este mes
- [ ] Agregar un producto con precio y stock
- [ ] Recibir recordatorios automáticos de cobros
- [ ] Pedir un reporte semanal
- [ ] El agente recuerda contexto entre sesiones (Noxem)

### Por Web App Pablo puede:
- [ ] Ver dashboard con KPIs reales
- [ ] Ver gráfico de ventas del mes
- [ ] Exportar lista de clientes a Excel
- [ ] Exportar factura a PDF
- [ ] Ver audit log de acciones

### Para escalar:
- [ ] Nuevo cliente instalado en menos de 5 minutos
- [ ] Sin intervención manual de Pablo

---

## MODELO DE NEGOCIO

| Plan | Precio/mes | Canal mensajería | Módulos | Costo infra/mes |
|------|-----------|-----------------|---------|-----------------|
| Starter | $99 USD | WhatsApp compartido | CRM + Cobros | ~$2 |
| Business | $249 USD | WhatsApp propio (1 número) | Todo | ~$5 |
| Enterprise | $499 USD | WhatsApp propio + VPS dedicado | Todo + API | ~$20 |

**Proyección conservadora:**
- 10 clientes Business = $2.490/mes ganancia neta
- 50 clientes Business = $12.200/mes (misma VPS)
- 100 clientes = segunda VPS $20/mes, ganancia >$24.000/mes

---

## LEYENDA DE ESTADOS
```
⏳ PENDIENTE    → no iniciado
🔄 EN CURSO     → trabajando
✅ COMPLETADO   → validado y aprobado
❌ BLOQUEADO    → problema, necesita atención
```

---

*Actualizado automáticamente con cada paso completado*
*Validación requerida de Pablo antes de marcar ✅*
