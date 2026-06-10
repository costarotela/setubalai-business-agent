# 🎛️ web-admin/ — PANEL MAESTRO (Frontend Next.js)

**Puerto:** :3012 (systemd, `next start`)
**Servicio:** `setubalai-admin.service`
**Framework:** Next.js 16.2.6 + React 19 + TypeScript

## Qué es
El panel de administración para Pablo (rol: superadmin).
Permite gestionar TODAS las clínicas/empresas registradas en el SaaS.
Solo accesible con rol "superadmin".

## Estructura

```
web-admin/
├── src/app/
│   ├── layout.tsx              ← Root layout
│   ├── page.tsx                ← Redirige según auth (login o panel-maestro)
│   ├── login/page.tsx          ← Login (verifica rol = superadmin)
│   ├── panel-maestro/
│   │   ├── page.tsx             ← Dashboard: lista de empresas, stats, tabs
│   │   └── InfrastructureTab.tsx ← Tab: monitoreo VPS, Docker, PC local, GPU
│   ├── api/[...path]/route.ts   ← PROXY a FastAPI backend (:3010)
│   └── infra-api/[...path]/route.ts ← PROXY a Infrastructure API (:9993)
│
├── next.config.ts
├── package.json
└── .env.local                  ← API_BASE_URL = http://127.0.0.1:3010
```

## Tabs del Panel Maestro
1. **Empresas clientes** — Lista todas las empresas con stats (clientes, facturas, cobros)
2. **Agregar empresa** — Formulario de alta de nueva clínica
3. **Sistema** — Métricas globales del SaaS
4. **Infraestructura** — Estado de servicios, contenedores Docker, recursos VPS/PC

## Cómo reiniciar
```bash
systemctl --user restart setubalai-admin.service
```

## Cómo ver logs
```bash
journalctl --user -u setubalai-admin.service -f
```
