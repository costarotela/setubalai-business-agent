# SetubalAI Business Agent — Plan Maestro

**Fecha:** 2026-05-21  
**Estado:** BORRADOR — pendiente aprobación de Pablo  
**Objetivo:** Construir el agente empresarial más completo del mercado hispanohablante, empaquetado en Docker, vendible a cualquier empresa.

---

## LA VISION

Un empresario escribe por Telegram:
> "Que clientes me deben plata este mes?"
> "Agregá a Juan Pérez como cliente nuevo, servicio de redes sociales, $500/mes"
> "Mandá recordatorio de pago a todos los que vencen esta semana"
> "Cuanto vendí en abril?"
> "Hay stock del producto X?"

El agente responde, ejecuta, recuerda, aprende. Sin apps, sin planillas, sin complicaciones.

---

## CONTEXTO ACTUAL (lo que ya existe)

### En el VPS:
- `/home/admin/setubalai-agente/` — esqueleto con módulos CRM, cobros, atención (sin terminar)
- `/home/admin/noxem/` — motor de memoria semántica clonado (no instalado)
- Hermes Agent corriendo en Telegram con todas las tools
- Docker operativo (paperclip, db, searxng)
- Cloudflare Tunnel activo (setubalai.org, hermes.setubalai.org)
- Dashboard Hermes en https://hermes.setubalai.org

### Tecnología disponible:
- Python 3.12, Node.js 22, SQLite, Docker
- OpenRouter (modelo principal) + Ollama fallback
- Telegram Bot activo (@SetubalCEObot)

---

## ARQUITECTURA DEL PRODUCTO

```
TELEGRAM (interfaz del empresario)
         ↓
   HERMES AGENT (cerebro)
    ├── Noxem Memory (memoria semántica persistente)
    │   ├── Recuerda clientes, preferencias, historial
    │   ├── Búsqueda por significado (no solo palabras)
    │   └── Aprende con cada interacción
    │
    ├── MÓDULO CRM
    │   ├── Alta/baja/modificación de clientes
    │   ├── Historial completo de cada cliente
    │   ├── Estados: prospecto, activo, inactivo, moroso
    │   └── Notas y etiquetas
    │
    ├── MÓDULO COBROS
    │   ├── Registro de facturas/servicios
    │   ├── Estado de pagos (pendiente, pagado, vencido)
    │   ├── Recordatorios automáticos programados
    │   └── Reporte de morosos
    │
    ├── MÓDULO PRODUCTOS/SERVICIOS
    │   ├── Catálogo con precios
    │   ├── Control de stock (para productos físicos)
    │   └── Servicios recurrentes
    │
    ├── MÓDULO PROVEEDORES
    │   ├── Registro de proveedores
    │   ├── Órdenes de compra
    │   └── Seguimiento de pagos a proveedores
    │
    ├── MÓDULO ATENCIÓN AL CLIENTE
    │   ├── Registro de consultas/reclamos
    │   ├── Estado de tickets
    │   └── Historial por cliente
    │
    └── MÓDULO REPORTES Y DECISIONES
        ├── Ventas del período
        ├── Cobros pendientes
        ├── Clientes más rentables
        ├── Stock crítico
        └── KPIs del negocio
         ↓
   SQLite (base de datos del negocio)
   Obsidian/Noxem (memoria semántica)
```

---

## ESTRUCTURA DOCKER (para escalar a mil clientes)

```
setubalai-agent/
├── docker-compose.yml          ← levantar todo con 1 comando
├── Dockerfile                  ← imagen base del agente
├── install.sh                  ← instalador para nuevo cliente
├── .env.template               ← variables que configura el cliente
│
├── agent/                      ← Hermes configurado
│   ├── config.yaml
│   └── skills/
│       └── business/           ← skills del negocio
│
├── memory/                     ← Noxem
│   └── noxem-plugin/
│
├── modules/                    ← lógica de negocio
│   ├── crm.py
│   ├── cobros.py
│   ├── productos.py
│   ├── proveedores.py
│   ├── atencion.py
│   └── reportes.py
│
├── database/
│   └── schema.sql              ← estructura de base de datos
│
└── dashboard/                  ← panel web opcional
    └── index.html
```

---

## MODELO DE NEGOCIO

### Precios sugeridos (Argentina/Latam):
```
Plan Starter   — $150 USD/mes → hasta 100 clientes, CRM + Cobros + Telegram
Plan Business  — $300 USD/mes → ilimitado + Proveedores + Reportes avanzados
Plan Enterprise— $500 USD/mes → todo + personalización + onboarding dedicado
Setup inicial  — $200-500 USD → instalación y configuración
```

### Costo operativo por cliente:
```
VPS Hetzner CX22:  $4.5/mes
OpenRouter API:    ~$5-10/mes (uso normal)
Total costo:       ~$15/mes
Margen Plan Starter: 90%
```

### Escalabilidad:
- 10 clientes = $1,500 USD/mes ingreso, $150 costo → $1,350 ganancia
- 50 clientes = $7,500 USD/mes ingreso, $750 costo → $6,750 ganancia
- 100 clientes = $15,000 USD/mes (automatizado casi 100%)

---

## PLAN DE CONSTRUCCIÓN — FASES

### FASE 1: PRODUCTO BASE (construir ahora, en nuestro VPS)
**Duración estimada: esta semana**

**Paso 1 — Instalar y verificar Noxem**
- Ejecutar install.sh de noxem
- Integrarlo como plugin de memoria en Hermes perfil local
- Verificar que recuerda entre sesiones

**Paso 2 — Base de datos del negocio**
- Schema SQLite completo (clientes, cobros, productos, proveedores, tickets)
- Scripts de migración
- Datos de prueba con SetubalAI como empresa

**Paso 3 — Módulos de negocio**
- CRM: CRUD completo de clientes
- Cobros: facturas + estados + recordatorios
- Productos: catálogo + stock
- Proveedores: registro + pagos
- Atención: tickets
- Reportes: queries predefinidos

**Paso 4 — Skills de Hermes**
- Skill `crm` → comandos en lenguaje natural → acciones en base de datos
- Skill `cobros` → gestión de pagos por Telegram
- Skill `reportes` → "mostrame las ventas de este mes"

**Paso 5 — Automatizaciones (cron)**
- Recordatorios de cobros automáticos
- Reporte semanal del negocio
- Alertas de stock crítico

### FASE 2: DOCKERIZAR
**Cuando Fase 1 funciona perfecto**
- Crear Dockerfile
- Crear docker-compose.yml
- Crear install.sh de un comando
- Crear .env.template con variables del cliente

### FASE 3: PANEL DE CONTROL MAESTRO
**Cuando hay 2-3 clientes reales**
- Panel en nuestro VPS para gestionar todos los clientes
- API Hetzner para crear VPS automáticamente
- Sistema de pagos (Stripe o MercadoPago)
- Monitoreo de todos los agentes

---

## PRIMER CLIENTE: SETUBALAI

### Datos de la empresa:
- Nombre: SetubalAI
- Rubro: Agencia de AI / Servicios digitales
- Productos: Sí (cursos, templates, herramientas)
- Servicios: Sí (agentes custom, consultoría, implementación)

### Lo que el agente debe saber desde el día 1:
- Catálogo de servicios y precios de SetubalAI
- Flujo de venta típico
- Cómo responder consultas de potenciales clientes

---

## CRITERIO DE ÉXITO

El producto está listo para vender cuando Pablo pueda hacer esto por Telegram:
1. "Agregá cliente: Empresa XYZ, contacto Juan, servicio agente IA, $300/mes"
2. "Qué clientes me deben plata?"
3. "Mandá recordatorio a los morosos"
4. "Cuánto facturé este mes?"
5. "Agregá producto: Template CRM, precio $50"
6. Y el agente ejecuta todo, recuerda todo, y aprende.

---

## RIESGOS

- Noxem no compatible con Hermes → Plan B: usar memoria nativa de Hermes
- SQLite no suficiente a escala → migración a PostgreSQL (ya tienen Docker)
- Hermes demasiado lento para respuestas en tiempo real → optimizar prompts

---

## PRÓXIMO PASO

**Aprobar este plan → arrancar Paso 1 (instalar Noxem)**
