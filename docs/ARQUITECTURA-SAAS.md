# ARQUITECTURA SAAS — SetubalAI Business Agent
**Versión:** 2.0 — SaaS Multi-Tenant
**Fecha:** 2026-05-22
**Aprobado por:** Pablo (@pcostarotela)
**Estado:** PLANIFICACIÓN APROBADA — Fase 4 en ejecución

---

## DECISIÓN ARQUITECTURAL CENTRAL

**Modelo adoptado: SaaS Multi-Tenant (Modelo A)**

Una sola infraestructura, N empresas. Cada empresa ve solo sus datos.
Toda mejora se despliega una sola vez y aplica a todos los clientes.

**Modelos DESCARTADOS:**
- Instancia por cliente (Modelo B): solo para Enterprise $499+ con datos en VPS propio
- NVIDIA OpenShell: alpha, sin soporte producción, resuelve problema diferente (aislamiento de agentes enterprise), no aplica al ecosistema SetubalAI

---

## ESTADO ACTUAL DEL SISTEMA

```
YA CONSTRUIDO (70% del SaaS listo):
  ✅ PostgreSQL 17 — multi-tenant REAL (empresa_id en todas las tablas)
  ✅ FastAPI :3010 — endpoints CRM, Cobros, Productos, Proveedores, Reportes
  ✅ Next.js :3011 — web app con 6 módulos funcionales
  ✅ Panel Maestro — gestión de empresas (GET/POST/PUT /empresas/)
  ✅ Cloudflare Tunnel — HTTPS automático, subdominios sin costo extra
  ✅ Hermes + 4 skills — CRM, cobros, productos, reportes via lenguaje natural
  ✅ Docker + docker-compose — containerización completa

FALTA (30% restante):
  ❌ Auth/Login — no hay sistema de identidad
  ❌ Enrutamiento multi-empresa — app hardcodeada para SetubalAI
  ❌ Canal de mensajería multi-cliente — Telegram/WhatsApp por empresa
  ❌ Personalización por empresa — logo, color, módulos activos
  ❌ Static file serving — Hermes no puede enviar links accesibles
```

---

## STACK TECNOLÓGICO ACTUALIZADO

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Base de datos | PostgreSQL 17 | Multi-tenant real con empresa_id |
| Backend API | FastAPI (Python) | Async, ya construido, escala |
| Frontend | Next.js 14 + shadcn/ui | Ya construido |
| Gráficos | Recharts | Ya integrado |
| Memoria AI | Noxem | Memoria semántica persistente |
| Agente AI | Hermes Agent | Motor de lenguaje natural |
| **Mensajería** | **WhatsApp (Evolution API)** | **Canal principal clientes** |
| **Auth** | **JWT + roles** | **Por empresa, sin cookies** |
| Containerización | Docker + docker-compose | Por servicio |
| Hosting | Hetzner VPS | SaaS compartido hasta ~50 clientes |
| DNS/Proxy | Cloudflare Tunnel | Ya configurado |
| **Static files** | **Cloudflare → /static/outputs/** | **Links directos desde Hermes** |

---

## CANAL DE MENSAJERÍA: DECISIÓN WHATSAPP

### Por qué WhatsApp y no Telegram
- 95%+ de las empresas en Argentina/Latam usan WhatsApp, no Telegram
- Telegram es excelente para Pablo (operación interna de SetubalAI)
- Los clientes del producto necesitan WhatsApp

### Opción seleccionada: Evolution API
**Repositorio:** https://github.com/EvolutionAPI/evolution-api
**Por qué Evolution API sobre alternativas:**
- Open source, auto-hosteable en Docker (sin costos por mensaje)
- Basado en Baileys (la librería más madura de WhatsApp unofficial)
- REST API completa: enviar/recibir mensajes, media, grupos
- Multi-instancia: un servidor Evolution gestiona N números de WhatsApp
- Webhooks nativos: cada mensaje entrante dispara un webhook a Hermes
- Alternativas descartadas:
  - WhatsApp Business API oficial (Meta): $0.07-0.15 por conversación, formulario de aprobación tardío, no viable para Starter/Business
  - WPPConnect: menos mantenido, menos features
  - Baileys directo: requiere código custom, Evolution ya lo encapsula

### Arquitectura WhatsApp multi-empresa
```
Cliente empresa → WhatsApp → Evolution API (VPS)
                                    ↓ webhook
                             Hermes Agent
                                    ↓ empresa_id extraído del número
                             FastAPI backend (datos aislados)
                                    ↓ respuesta
                             Evolution API → WhatsApp → Cliente
```

Cada empresa registra su número de WhatsApp en Evolution API.
Evolution API crea una "instancia" por número (escaneo QR una vez).
Hermes recibe el webhook, identifica empresa por número/instancia, responde.

### Capacidad por VPS
- Evolution API: hasta 50 instancias en 7.6GB RAM sin problema
- Cada instancia = 1 número WhatsApp activo de un cliente

---

## PLAN DE FASES ACTUALIZADO

### FASE 4 — SAAS MULTI-TENANT (REFORMULADA)
**Meta:** Producto vendible a múltiples empresas desde una sola infraestructura

#### NIVEL 1 — BLOQUEANTE PARA VENDER

**4.1 — Auth y sistema de identidad (estimado: 3 días)**
- Login con email + password → JWT con empresa_id + rol
- Roles: admin (dueño), operador, contador (solo lectura)
- Tabla usuarios asociada a empresa_id
- Middleware en FastAPI: todos los endpoints verifican JWT
- Frontend: página de login → redirect al dashboard de la empresa
- Opción de acceso: login único en business.setubalai.org (NO subdominio por empresa)
- Validación: login funciona, empresa A no ve datos de empresa B

**4.2 — Enrutamiento multi-empresa en web app (estimado: 1 día)**
- El JWT lleva empresa_id → todos los fetches del frontend lo incluyen
- Panel Maestro queda reservado para rol "superadmin" (solo Pablo)
- Validación: dos empresas logueadas en paralelo, datos completamente separados

**4.3 — Evolution API: WhatsApp multi-empresa (estimado: 2 días)**
- Deploy Evolution API como contenedor Docker en VPS
- Cada empresa registra su instancia (número WA) via Panel Maestro
- Webhook de Evolution → endpoint FastAPI → Hermes procesa → responde via Evolution
- Hermes identifica empresa por instancia_id del webhook
- Validación: mensaje de WA de empresa A → respuesta correcta con datos de empresa A

**4.4 — Static file serving para Hermes (estimado: 2 horas)**
- Directorio /home/admin/setubalai-agente/static/outputs/
- Cloudflare sirve static.setubalai.org apuntando a ese directorio
- Hermes guarda PDFs/reportes ahí y manda el link en el chat
- Validación: Hermes genera reporte → manda link → abre en celular

#### NIVEL 2 — PERSONALIZACIÓN

**4.5 — Personalización por empresa (estimado: 1 día)**
- Campo `configuracion` JSONB ya existe en tabla empresas
- Agregar: logo_url, color_primario, nombre_app, modulos_activos[]
- Frontend lee configuracion al cargar y aplica tema dinámico
- Panel Maestro: formulario para configurar personalización
- Validación: empresa A se ve con su logo y color, empresa B con el suyo

**4.6 — Módulos on/off por plan (estimado: 1 día)**
- Starter (incluido en plan básico): CRM + Cobros
- Business: + Productos + Reportes + Proveedores
- Enterprise: + API propia + datos en VPS dedicado
- Navbar y menú se generan según modulos_activos[]
- Validación: empresa con plan Starter no ve menú Productos

#### NIVEL 3 — ESCALA SIN TRABAJO MANUAL

**4.7 — Onboarding automatizado (estimado: 2 días)**
- Formulario de alta: nombre empresa, email, plan, número WA
- Al crear: usuario admin generado, instancia Evolution creada, email de bienvenida
- Sin intervención de Pablo para dar de alta un cliente
- Validación: alta completa en menos de 2 minutos sin tocar servidor

**4.8 — DELETE empresa + empresa test (estimado: 4 horas)**
- Endpoint DELETE /empresas/{id} con validación (no borra si tiene datos)
- Botón eliminar en Panel Maestro (solo si 0 clientes y 0 facturas)
- Crear empresa "Empresa Test" → probar flujo completo → eliminar
- Validación: ciclo de vida completo funciona

**4.9 — Monitoreo automático (estimado: 1 día)**
- Cron cada 5 minutos: verifica Evolution API, FastAPI, BD, instancias WA
- Si algo falla → alerta a Pablo por WhatsApp (su número)
- Panel Maestro muestra estado en tiempo real
- Validación: simular caída → alerta llega en menos de 10 min

---

## CRITERIO DE ÉXITO FASE 4

### Pablo puede desde WhatsApp o Telegram:
- [ ] Agregar un cliente nuevo con lenguaje natural → se crea en BD
- [ ] Ver todos los clientes morosos de su empresa
- [ ] Marcar una factura como pagada
- [ ] Recibir link directo a un reporte PDF en el chat

### Empresa cliente puede desde su WhatsApp:
- [ ] Consultar saldo de un cliente
- [ ] Registrar un pago
- [ ] Pedir reporte semanal

### Pablo puede desde Panel Maestro:
- [ ] Ver todas las empresas activas con sus métricas
- [ ] Agregar una empresa nueva (onboarding <2 minutos)
- [ ] Ver estado de salud de todos los servicios
- [ ] Eliminar empresa test

### Para escalar:
- [ ] Alta de nuevo cliente sin intervención manual
- [ ] 50 empresas en la misma VPS sin degradación
- [ ] Toda mejora de código se despliega a todos los clientes a la vez

---

## MODELO DE NEGOCIO ACTUALIZADO

| Plan | Precio/mes | Canal mensajería | Módulos | Costo infra |
|------|-----------|-----------------|---------|-------------|
| Starter | $99 USD | WhatsApp compartido | CRM + Cobros | ~$2/mes |
| Business | $249 USD | WhatsApp propio (1 número) | Todo | ~$5/mes |
| Enterprise | $499 USD | WhatsApp propio + VPS dedicado | Todo + API | ~$20/mes |

**Proyección conservadora:**
- 10 clientes Business = $2.490/mes ganancia neta
- 50 clientes Business = $12.200/mes (misma VPS, sin contratar más infra)
- 100 clientes = segunda VPS $20/mes, ganancia >$24.000/mes

---

## DECISIONES ARQUITECTURALES PENDIENTES

| Decisión | Opciones | Recomendación | Estado |
|----------|---------|---------------|--------|
| WhatsApp | Evolution API vs Meta oficial | Evolution API ✅ | APROBADO |
| Auth | Login único vs subdominio | Login único ✅ | APROBADO |
| Multi-instancia | SaaS compartido vs VPS por cliente | SaaS compartido ✅ | APROBADO |
| OpenShell | Usar vs descartar | Descartar ✅ | APROBADO |
| Inicio Fase 4 | Por qué paso | 4.1 Auth → 4.4 Static → 4.3 WA → 4.5+ | PENDIENTE ejecución |

---

## NOTAS DE IMPLEMENTACIÓN

### Lo que NO se toca (ya funciona bien)
- Schema de BD: multi-tenant real, no necesita cambios
- Endpoints FastAPI existentes: solo se agrega validación JWT
- Docker: se agrega Evolution API como servicio adicional
- Panel Maestro: se extiende, no se reescribe

### Riesgos identificados
1. **WhatsApp ban de número**: Evolution API usa WhatsApp unofficial. Si el número es baneado, el cliente pierde la instancia. Mitigación: usar números dedicados para el agente, no el número personal del dueño.
2. **Cambios de API de WhatsApp**: Meta cambia protocolos ocasionalmente. Evolution API tiene comunidad activa que parchea en 24-72hs.
3. **Límite de mensajes**: WhatsApp limita cuentas nuevas. Mitigación: warming gradual de números nuevos.

---

## HISTORIAL DE CAMBIOS

| Fecha | Cambio | Motivo |
|-------|--------|--------|
| 2026-05-22 | Creación documento | Pivote de instancia-por-cliente a SaaS multi-tenant |
| 2026-05-22 | WhatsApp como canal principal | 95%+ de clientes en Latam usan WA, no Telegram |
| 2026-05-22 | OpenShell descartado | Alpha, resuelve aislamiento enterprise, no aplica |
| 2026-05-22 | Fase 4 completamente reformulada | Plan original basado en Hetzner API ya no aplica |

---

*Documento maestro de arquitectura. Decisiones aquí son definitivas hasta nueva revisión.*
*Documentos obsoletos → docs/archived/, nunca se borran.*
