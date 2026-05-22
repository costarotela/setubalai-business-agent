# SetubalAI Business Agent — Plan Maestro v2
**Fecha:** 2026-05-21 | **Estado:** BORRADOR v2 — pendiente aprobación Pablo

---

## LA VISION COMPLETA

Un gerente o dueño de empresa tiene 3 formas de controlar su negocio:

```
📱 TELEGRAM          🌐 WEB APP           📊 DASHBOARD
"Qué debo cobrar     Panel visual con     Métricas en tiempo
esta semana?"        tablas, gráficos,    real. KPIs. Alertas.
                     formularios          Reportes exportables
        ↓                  ↓                     ↓
   ═══════════════════════════════════════════════
              SETUBALAI BUSINESS AGENT
              (un solo backend, 3 interfaces)
   ═══════════════════════════════════════════════
        ↓                  ↓                     ↓
    CEREBRO AI         MEMORIA              BASE DE DATOS
    Hermes Agent    Noxem (semántica)      PostgreSQL 17
    + OpenRouter    recuerda todo          datos del negocio
```

---

## LO QUE NECESITA UN DUEÑO DE EMPRESA

Investigando qué necesita realmente un gerente/dueño:

### Gestión diaria (urgente, por Telegram):
- "¿Quién me debe plata esta semana?"
- "Agregá cliente nuevo"
- "¿Hay stock del producto X?"
- "¿Qué consultas entraron hoy?"

### Control semanal (dashboard web):
- Ventas vs mes anterior
- Cobros pendientes con aging
- Clientes nuevos vs perdidos
- Pipeline de ventas

### Decisiones estratégicas (reportes):
- Producto/servicio más rentable
- Cliente más valioso
- Tendencias de crecimiento
- Proyección de flujo de caja

---

## ARQUITECTURA TÉCNICA DEFINITIVA

### Stack tecnológico:

```
FRONTEND
├── Next.js 14 (App Router)     ← web app + dashboard
│   ├── Tailwind CSS            ← diseño rápido y profesional
│   ├── shadcn/ui               ← componentes listos (tablas, charts)
│   └── Recharts                ← gráficos de negocio

BACKEND
├── FastAPI (Python)            ← API REST del negocio
│   ├── Autenticación JWT       ← login seguro
│   ├── WebSockets              ← actualizaciones en tiempo real
│   └── API para el agente AI   ← Hermes llama a esta API

BASE DE DATOS
├── PostgreSQL 17               ← YA EXISTE EN TU VPS (Docker)
│   ├── Datos del negocio       ← clientes, cobros, productos
│   └── Multi-tenant            ← un schema por empresa cliente

MEMORIA AI
├── Noxem                       ← memoria semántica
│   ├── Brain 1: SQLite         ← búsqueda vectorial local
│   └── Brain 2: LLM            ← razonamiento sobre memoria

AGENTE AI
├── Hermes Agent                ← ya funciona en tu VPS
│   ├── Telegram interface      ← ya configurado
│   ├── Skills de negocio       ← a construir
│   └── Llama a FastAPI         ← para ejecutar acciones
```

### Por qué estas tecnologías:

| Tech | Alternativa | Por qué esta |
|------|-------------|--------------|
| PostgreSQL | SQLite | Ya existe, escala a millones de registros, multi-tenant nativo |
| Next.js | React puro | Full-stack, routing, SSR, deploy simple, el estándar 2026 |
| FastAPI | Django/Flask | Más rápido, async, documentación auto, ideal para AI |
| shadcn/ui | Material UI | Sin dependencias pesadas, componentes copiables, muy moderno |
| Tailwind | CSS puro | Velocidad de desarrollo x5 |

---

## MÓDULOS DEL SISTEMA

### 1. CRM (Gestión de Clientes)
```
Clientes
├── Datos: nombre, empresa, email, teléfono, dirección
├── Estado: prospecto → activo → inactivo → moroso
├── Historial: cada interacción registrada
├── Valor: cuánto ha gastado, potencial
└── Notas: el agente recuerda todo lo que dijiste de él
```

### 2. Cobros y Facturación
```
Cobros
├── Factura: cliente, servicio/producto, monto, fecha vencimiento
├── Estados: borrador → enviada → pendiente → pagada → vencida
├── Recordatorios: automáticos por cron (3 días antes, día de vencimiento, después)
├── Reporte morosos: lista con días de atraso y monto
└── Flujo de caja: proyección próximos 30/60/90 días
```

### 3. Productos y Servicios
```
Catálogo
├── Tipo: producto físico (con stock) o servicio (sin stock)
├── Precio: unitario, por hora, suscripción mensual
├── Stock: actual, mínimo, alertas automáticas
└── Historial de ventas por producto
```

### 4. Proveedores
```
Proveedores
├── Datos de contacto
├── Productos/servicios que proveen
├── Órdenes de compra
└── Pagos pendientes a proveedores
```

### 5. Atención al Cliente
```
Tickets
├── Canal: Telegram, email, formulario web
├── Estado: abierto → en proceso → resuelto
├── Prioridad: baja, media, alta, urgente
└── Tiempo de resolución promedio
```

### 6. Reportes y Dashboard
```
KPIs en tiempo real
├── Ventas del mes (vs mes anterior)
├── Cobros pendientes (con aging: 0-30, 31-60, 61+ días)
├── Clientes nuevos este mes
├── Ticket promedio de venta
├── Top 5 clientes por ingreso
├── Top 5 productos más vendidos
└── Proyección de ingresos próximo mes
```

### 7. Memoria del Negocio (Noxem)
```
El agente recuerda
├── "El cliente Juan siempre paga tarde pero nunca deja de pagar"
├── "La empresa XYZ prefiere que la llamen los lunes"
├── "El producto A tiene más demanda en diciembre"
├── Preferencias, contexto, historial de conversaciones
└── Aprende y mejora con cada interacción
```

---

## INTERFACES DE USUARIO

### 1. Telegram (operación diaria)
```
Comandos naturales:
/reporte → resumen del día
/cobros  → pendientes de cobro
/nuevo_cliente → flujo guiado
/stock   → alertas de stock

Lenguaje natural:
"Marcos López pagó la factura 123"
"Qué vendí esta semana?"
"Agregá 50 unidades del producto X"
"Mandá recordatorio a los morosos"
```

### 2. Web App (Next.js)
```
Páginas:
/dashboard    → KPIs + gráficos en tiempo real
/clientes     → tabla con filtros, búsqueda, exportar
/cobros       → lista de facturas, estados, acciones
/productos    → catálogo + stock
/reportes     → generador de reportes custom
/config       → configuración del negocio
```

### 3. Acceso seguro
```
Login: email + contraseña (JWT)
Roles: admin (dueño), operador (empleado), solo lectura (contador)
URL: negocio.setubalai.org (cada cliente su subdominio)
HTTPS: Cloudflare automático
```

---

## ESTRUCTURA DOCKER (escalable a 1000 clientes)

```
setubalai-agent/
├── docker-compose.yml          ← 1 comando levanta todo
├── docker-compose.prod.yml     ← versión producción
├── .env.template               ← variables del cliente
├── install.sh                  ← instalador 1 comando
│
├── services/
│   ├── api/                    ← FastAPI backend
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── modules/
│   │       ├── crm.py
│   │       ├── cobros.py
│   │       ├── productos.py
│   │       ├── proveedores.py
│   │       └── reportes.py
│   │
│   ├── web/                    ← Next.js frontend
│   │   ├── Dockerfile
│   │   └── src/
│   │       └── app/
│   │
│   ├── agent/                  ← Hermes configurado
│   │   ├── config.yaml
│   │   └── skills/
│   │
│   └── memory/                 ← Noxem
│       └── noxem-plugin/
│
└── database/
    ├── schema.sql              ← estructura completa
    └── seed.sql                ← datos iniciales
```

### Para nuevo cliente (cuando escales):
```bash
# UN SOLO COMANDO crea todo el entorno del cliente:
./install.sh --empresa "Ferretería López" --telegram-token "xxx" --dominio "lopez"

# Resultado en 3 minutos:
# ✅ Base de datos creada con schema completo
# ✅ Agente Telegram configurado y corriendo
# ✅ Web app en https://lopez.setubalai.org
# ✅ Dashboard con datos de prueba
```

---

## MULTI-TENANT (gestión de muchos clientes)

```
TU VPS MAESTRO (panel de control)
├── Lista de todos tus clientes
├── Estado de cada agente (activo/inactivo)
├── Facturación: si no paga → agente se pausa automáticamente
├── Updates: actualizar todos los clientes a la vez
└── Monitoreo: alertas si algo se rompe

CLIENTE 1: VPS Hetzner CX22 ($4.5/mes)
├── Su PostgreSQL (datos aislados, privados)
├── Su agente Telegram
├── Su web app
└── Su subdominio: empresa1.setubalai.org

CLIENTE 2: VPS Hetzner CX22 ($4.5/mes)
└── ... (idéntico, aislado)
```

---

## MODELO DE NEGOCIO REVISADO

### Planes:
```
🥉 STARTER   $99 USD/mes
   → Telegram + CRM + Cobros básico
   → Hasta 200 clientes en su sistema
   → Soporte por email

🥈 BUSINESS  $249 USD/mes
   → Todo Starter + Web App completa
   → Productos + Proveedores + Reportes
   → Clientes ilimitados
   → Soporte prioritario

🥇 ENTERPRISE $499 USD/mes
   → Todo Business + personalización de marca
   → Integración con sistemas existentes
   → Onboarding dedicado (vos vas y lo configurás)
   → SLA garantizado
```

### Costo operativo real por cliente:
```
VPS Hetzner CX22:     $4.50/mes  (4GB RAM, 2 vCPU, 40GB disco)
OpenRouter API:       $5-15/mes  (uso típico de pyme)
Tu tiempo soporte:    ~1h/mes    (una vez que funciona solo)
─────────────────────────────────
Total costo:          ~$20/mes

Margen Plan Starter:  79%  ($79 de ganancia por cliente)
Margen Plan Business: 92%  ($229 de ganancia)
Margen Plan Enterprise: 96% ($479 de ganancia)
```

### Proyección:
```
5 clientes  → $1,245/mes ingreso → $1,145 ganancia
20 clientes → $4,980/mes         → $4,580 ganancia
50 clientes → $12,450/mes        → $11,450 ganancia (automatizado)
```

---

## FASES DE CONSTRUCCIÓN

### FASE 1 — CORE (ahora, en nuestro VPS)
1. Instalar Noxem + integrar con Hermes
2. Crear schema PostgreSQL completo
3. Construir FastAPI con todos los módulos
4. Skills de Hermes para operar por Telegram
5. Crons automáticos (recordatorios, reportes)
6. **TEST: Pablo gestiona SetubalAI 100% por Telegram**

### FASE 2 — WEB APP (semana siguiente)
1. Next.js dashboard con shadcn/ui
2. Login seguro (JWT)
3. Todas las páginas operativas
4. Gráficos y reportes exportables
5. **TEST: Dashboard funciona en hermes.setubalai.org/business**

### FASE 3 — DOCKERIZAR (cuando Fase 2 funciona)
1. Dockerfile para cada servicio
2. docker-compose completo
3. install.sh de 1 comando
4. .env.template documentado
5. **TEST: Nuevo cliente instalado en menos de 5 minutos**

### FASE 4 — PANEL MAESTRO (cuando haya 2 clientes reales)
1. Panel de gestión de clientes en tu VPS
2. API Hetzner para crear VPS automáticamente
3. Sistema de pagos (Stripe o MercadoPago)
4. Monitoreo automático

---

## CRITERIO DE ÉXITO FASE 1

Pablo puede hacer TODO esto solo por Telegram:
- [ ] "Agregá cliente: Empresa ABC, Juan Pérez, servicio agente IA, $300/mes"
- [ ] "Qué clientes me deben plata este mes?"
- [ ] "Marcos pagó la factura de abril"
- [ ] "Cuánto facturé en mayo?"
- [ ] "Agregá producto: Template CRM, precio $50, stock 999"
- [ ] "Mandá recordatorio a todos los morosos"
- [ ] "Dame el reporte semanal"
- [ ] El agente recuerda todo entre sesiones (Noxem)

---

## RIESGOS Y PLAN B

| Riesgo | Probabilidad | Plan B |
|--------|-------------|--------|
| Noxem incompatible con Hermes | Media | Usar memoria nativa de Hermes (ya funciona) |
| PostgreSQL multi-tenant complejo | Baja | Un schema por cliente (ya resuelto en Paperclip) |
| Next.js muy pesado para VPS | Baja | Static export o usar dashboard simple HTML |
| OpenRouter sin crédito | Alta (pasó) | Fallback Ollama ya configurado |

---

## PRÓXIMO PASO INMEDIATO

**Aprobar este plan → Arrancar Fase 1, Paso 1: Instalar Noxem**

¿Aprobás?
