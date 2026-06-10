# 🖥️ web/ — APP CLÍNICA (Frontend Next.js)

**Puerto:** :3013 (dev mode, Docker)
**Servicio:** Docker container `web-clinica-dev`
**URL externa:** `dev.setubalai.org` (Cloudflare Tunnel)
**Framework:** Next.js 16.2.6 + React 19 + TypeScript

## Qué es
La aplicación web para el personal de la clínica: recepcionistas, médicos y administradores de clínica.

## Estructura

```
web/
├── src/app/
│   ├── layout.tsx              ← Root layout (carga fonts, ShellProvider)
│   ├── shell.tsx               ← Layout principal: sidebar + FiltrosClinicaProvider + AuthProvider
│   ├── auth-context.tsx        ← Auth: login, token, user, esMedico, useAuthFetch
│   ├── login/page.tsx          ← Página de login
│   ├── page.tsx                ← Dashboard raíz (❌ MUESTRA DATOS CRM VACÍOS - legacy)
│   │
│   ├── turnos/page.tsx          ← ✅ Lista de turnos con filtros
│   ├── turnos/calendario/page.tsx ← ✅ Calendario mensual
│   │
│   ├── agenda/slots-libres/page.tsx ← ✅ Agenda del día (timeline visual)
│   │
│   ├── pacientes/page.tsx       ← ✅ Lista de pacientes
│   ├── pacientes/[id]/historial/   ← ✅ Historial completo del paciente
│   │
│   ├── medico/                  ← 👨‍⚕️ VISTA MÉDICO
│   │   ├── hoy/page.tsx         ← ✅ Agenda del día del médico
│   │   ├── atender/[visita_id]/page.tsx ← ✅ Formulario atención médica
│   │   ├── calendario/page.tsx  ← ✅ Calendario mensual del médico
│   │   └── mi-grilla/page.tsx   ← ✅ Personalización horarios propios
│   │
│   ├── configuracion/           ← ⚙️ CONFIGURACIÓN DE LA CLÍNICA
│   │   ├── especialidades/page.tsx  ← CRUD especialidades
│   │   ├── profesionales/page.tsx   ← CRUD profesionales (admin)
│   │   └── agenda/                  ← Config de agenda
│   │       ├── profesionales/page.tsx   ← CRUD médicos
│   │       ├── grillas/page.tsx         ← CRUD horarios
│   │       ├── bloqueos/page.tsx        ← CRUD bloqueos (vacaciones)
│   │       ├── duraciones/page.tsx      ← CRUD duraciones por especialidad
│   │       └── prestaciones/page.tsx    ← CRUD prácticas/nomenclador
│   │
│   ├── obras-sociales/page.tsx  ← CRUD obras sociales
│   ├── nomencladores/page.tsx   ← Nomenclador de prácticas
│   │
│   ├── api/[...path]/route.ts   ← PROXY a FastAPI backend (:3010)
│   │
│   │
│   ├── clientes/page.tsx        ← ❌ CRM LEGACY - tabla vacía
│   ├── cobros/page.tsx          ← ❌ CRM LEGACY - tabla vacía
│   ├── productos/page.tsx       ← ❌ CRM LEGACY - tabla vacía
│   ├── proveedores/page.tsx     ← ❌ CRM LEGACY - tabla vacía
│   ├── reportes/page.tsx        ← ❌ CRM LEGACY - tabla vacía
│   ├── servicios/page.tsx       ← ❌ CRM LEGACY - tabla vacía
│   └── nuevo-cliente/page.tsx   ← ❌ CRM LEGACY - tabla vacía
│
├── src/contexts/
│   └── FiltrosClinicaContext.tsx  ← 🧠 Context Provider: especialidades + médicos + prácticas
│
├── src/components/
│   ├── ClinicaFilterBar.tsx       ← Barra visual de filtros seleccionados
│   ├── SelectEspecialidadMedico.tsx ← Selects anidados (especialidad → médico)
│   ├── HistoriaClinica.tsx        ← Componente historia clínica
│   ├── MedicoLink.tsx             ← Link a médico que setea contexto
│   ├── BreadcrumbNav.tsx          ← Navegación breadcrumbs
│   ├── PatientLink.tsx            ← Link a paciente que setea contexto
│   └── TurnosDelPaciente.tsx      ← Lista de turnos de un paciente
│
├── next.config.ts              ← Config Next.js
├── next.config.dev.ts          ← Config para desarrollo
├── package.json
├── Dockerfile                  ← Imagen Docker
└── .env.local                  ← API_BASE_URL = http://127.0.0.1:3010
```

## Context Provider (ADN del sistema)
`FiltrosClinicaContext.tsx` carga UNA VEZ al montar:
1. GET /especialidades/
2. GET /medicos/
3. GET /nomenclador_practicas/

Expone: `selectedEspecialidadId`, `selectedMedicoId`, `medicosFiltrados[]`, `practicasFiltradas[]`

## Cómo ver cambios
El dev server corre en Docker. Cambios en el VPS → hot reload automático via bind mount.
URL: `dev.setubalai.org`

## Cómo reiniciar
```bash
cd /home/admin/setubalai-agente
docker compose -f docker-compose.dev.yml restart web-clinica-dev
```

## Cómo ver logs
```bash
docker compose -f docker-compose.dev.yml logs -f web-clinica-dev
```
