# SetubalAI Business Agent

> El Agente IA que maneja todo tu negocio desde Telegram y la Web

## ¿Qué hace?

Un **agente empresarial completo** — no un bot básico.
Gestiona clientes, cobros, atención, stock, reportes y más, **24/7, desde Telegram + Web**.

## 🔧 Stack

| Capa | Tecnología |
|------|-----------|
| Base de datos | PostgreSQL 17 |
| API Backend | FastAPI (Python) |
| Frontend Web | Next.js 14 + Tailwind |
| Memoria AI | Noxem (semántica) |
| Agente | Hermes Agent |
| Containerización | Docker + docker-compose |

## 🚀 Instalación

### Con Docker (1 comando)

```bash
git clone https://github.com/SetubalAI/setubalai-agent.git
cd setubalai-agent
docker-compose up -d
```

### Manual (sin Docker)

```bash
# 1. Dependencias API
cd services/api
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3010

# 2. Web App
cd web
npm install
npm run dev
```

## 📦 Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| API Backend | 3010 | CRUD + reportes + reglas de negocio |
| Web App | 3011 | Dashboard, clientes, cobros, productos, reportes |
| Noxem Memory | 3001 | Motor de memoria semántica |

## 📂 Estructura

```
setubalai-agent/
├── services/api/           ← FastAPI backend
│   ├── main.py
│   ├── models.py
│   ├── routers/            ← CRM, cobros, productos, reportes
│   └── Dockerfile
├── web/                    ← Next.js frontend
│   ├── src/app/            ← páginas: dashboard, clientes, cobros, productos, reportes
│   └── Dockerfile
├── database/               ← schema.sql completo
├── docker-compose.yml      ← levanta todo
├── install.sh              ← instalador 1 comando
└── GOAL.md                 ← plan maestro con trazabilidad
```

## 🔌 API

```bash
# Clientes
GET  /clientes/
POST /clientes/
PUT  /clientes/{id}

# Cobros
GET  /cobros/pendientes
POST /cobros/
PUT  /cobros/{id}/pagar

# Productos
GET  /productos/
GET  /productos/stock-critico

# Reportes
GET  /reportes/dashboard
GET  /reportes/resumen-semanal
```

## 📋 Requisitos mínimos

- VPS con Linux (2GB RAM, 10GB disco)
- Docker + docker-compose
- Bot de Telegram

## 🏷️ Licencia

Propiedad de SetubalAI — uso comercial autorizado para clientes.
