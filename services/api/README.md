# 🔧 services/api/ — BACKEND PRINCIPAL (FastAPI)

**Puerto:** :3010
**Servicio:** `setubalai-api.service` (systemd)
**Lenguaje:** Python 3.12

## Qué es
El backend FastAPI que sirve a TODAS las aplicaciones (App Clínica + Panel Maestro + Bots).
Todas las rutas API pasan por aquí.

## Estructura

```
services/api/
├── main.py              ← Entry point, registra todos los routers
├── models.py            ← Modelos SQLAlchemy (461 líneas)
├── database.py          ← Session de BD
├── auth.py              ← JWT: create, verify, get_current_user
├── tenancy.py           ← resolve_empresa_id (multi-tenant)
├── mcp_server.py        ← MCP tools (médicas + CRM)
├── routers/
│   ├── salud.py         ← 🏥 DOMINIO CLÍNICO (pacientes, turnos, atención, recetas, estudios, hc)
│   ├── whatsapp.py      ← 📱 WHATSAPP BOT (Cloud API Meta webhook)
│   ├── auth.py          ← 🔐 Login, perfil, gestión usuarios
│   ├── especialidades.py ← CRUD especialidades médicas
│   ├── configuracion_agenda.py ← CRUD grillas, bloqueos, duraciones, prestaciones
│   ├── obras_sociales.py ← CRUD obras sociales
│   ├── turnos.py        ← Slots libres (algoritmo de disponibilidad)
│   ├── clientes.py      ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   ├── cobros.py        ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   ├── productos.py     ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   ├── proveedores.py   ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   ├── reportes.py      ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   ├── categorias.py    ← 💼 CRM COMERCIAL (tablas vacías, legacy)
│   └── empresas.py      ← 🎛️ SAAS (gestión multi-tenant)
├── utils/
│   └── slots_calculator.py ← Algoritmo de slots libres
├── tests/               ← Tests del slots calculator
├── venv/                ← Virtualenv Python (no trackear)
├── requirements.txt     ← Dependencias Python
├── .env                 ← Secrets (no trackear)
└── Dockerfile           ← Imagen Docker para el API
```

## Routers activos (dominio clínico) - USAN DATOS
| Router | Endpoints principales | Estado |
|--------|---------------------|--------|
| `salud.py` | pacientes, médicos, turnos, atenciones, recetas, estudios, historia clínica | ✅ Activo |
| `whatsapp.py` | Webhook WhatsApp Cloud API (Meta) | ✅ Activo |
| `auth.py` | login, /auth/me, usuarios, reset password | ✅ Activo |
| `especialidades.py` | CRUD especialidades | ✅ Activo |
| `configuracion_agenda.py` | CRUD grillas, bloqueos, duraciones, prestaciones | ✅ Activo |
| `obras_sociales.py` | CRUD obras sociales | ✅ Activo |
| `turnos.py` | /agenda/slots-libres | ✅ Activo |
| `empresas.py` | CRUD empresas, stats | ✅ Activo |

## Routers legacy (CRM comercial) - TABLAS VACÍAS
| Router | Qué haría | Estado |
|--------|---------|--------|
| `clientes.py` | CRM de clientes empresariales | ❌ Inactivo (0 filas en DB) |
| `cobros.py` | Facturación | ❌ Inactivo (0 filas en DB) |
| `productos.py` | Catálogo productos | ❌ Inactivo (0 filas en DB) |
| `proveedores.py` | Gestión proveedores | ❌ Inactivo (0 filas en DB) |
| `reportes.py` | Dashboard KPIs comerciales | ❌ Inactivo (0 filas en DB) |
| `categorias.py` | Categorías de productos | ❌ Inactivo (0 filas en DB) |

## Cómo reiniciar
```bash
systemctl --user restart setubalai-api.service
curl http://localhost:3010/health  # → 200
```

## Cómo ver logs
```bash
journalctl --user -u setubalai-api.service -f --no-pager
```
