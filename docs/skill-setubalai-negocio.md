---
name: setubalai-negocio
description: "Gestión empresarial completa: CRM, cobros, productos, reportes para SetubalAI Business Agent"
version: 1.0.0
author: SetubalAI
---

# SetubalAI Business Agent - Skill

Este skill te permite gestionar una empresa completa desde Telegram usando lenguaje natural.

## API del Negocio

La API de FastAPI corre en `http://localhost:3010`.

### Endpoints disponibles:

```
GET  /clientes/?buscar=X&estado=Y&empresa_id=1      → listar clientes
GET  /clientes/stats?empresa_id=1                     → estadísticas
GET  /clientes/morosos?empresa_id=1                   → clientes que deben
GET  /clientes/{id}/historial                        → historial interacciones
POST /clientes/                                       → crear cliente
PUT  /clientes/{id}                                  → actualizar cliente

GET  /cobros/?estado=X&empresa_id=1                  → listar facturas
GET  /cobros/pendientes?empresa_id=1                 → pendientes de cobro
GET  /cobros/vencidas?empresa_id=1                   → facturas vencidas
GET  /cobros/stats?empresa_id=1                      → stats de cobros
POST /cobros/                                         → crear factura
PUT  /cobros/{id}/pagar                             → marcar pagada

GET  /productos/?tipo=X&empresa_id=1                 → listar productos
GET  /productos/stock-critico?empresa_id=1           → alertas stock
POST /productos/                                      → crear producto
PUT  /productos/{id}                                → actualizar producto
PUT  /productos/{id}/stock?cantidad=X                → actualizar stock

GET  /reportes/dashboard?empresa_id=1                → KPIs principales
GET  /reportes/resumen-semanal?empresa_id=1          → reporte semanal
GET  /reportes/top-clientes?empresa_id=1&limit=5     → top clientes
```

### Base de datos:
- PostgreSQL 17, contenedor `paperclip-db`
- Base: `business`, Schema: `setubalai`
- Usuario: `paperclip`, sin password directo

### Comandos de ejemplo:

**CRM:**
- "Agregá cliente: Empresa ABC, contacto Juan Pérez, email juan@abc.com"
- "Qué clientes están activos?"
- "Buscá clientes que tienen 'garcia'"
- "Quién me debe plata?"

**Cobros:**
- "Qué facturas están pendientes de cobro?"
- "Cuánto tengo pendiente de cobrar?"
- "El cliente pagó la factura 123"
- "Mandame el resumen de cobros"

**Productos:**
- "Cuánto stock hay del producto X?"
- "Agregá producto: Consultoría AI, precio $80/hora"
- "Qué productos tienen stock bajo?"

**Reportes:**
- "Cómo va el negocio este mes?"
- "Dame el resumen semanal"
- "Cuánto facturé vs el mes pasado?"
- "Quiénes son mis mejores clientes?"

## Reglas de operación:

1. **Siempre usa la API**, nunca toques la base de datos directamente
2. **empresa_id por defecto es 1** (SetubalAI)
3. **Responde directamente con los datos**, no con JSON crudo
4. **Formato amigable**: "$99.00 USD", "3 clientes", "15 de mayo de 2026"
5. **Si hay errores, decí qué pasó en lenguaje claro**
6. **Las fechas son DD/MM/YYYY** (zona horaria Argentina)
7. **Moneda por defecto: USD**
