# Infraestructura VPS — Estado Actual

**Última actualización:** 2026-05-24
**Realizado por:** Hermes Agent (health check + limpieza)

---

## SERVICIOS ACTIVOS

| Servicio | Estado | Puerto | Descripción |
|----------|--------|--------|-------------|
| hermes-gateway-local | ✅ active | — | Gateway Telegram (hermes --profile local) |
| hermes-dashboard | ✅ active | — | Dashboard web (https://hermes.setubalai.org) |
| noxem-memory | ✅ active | 3001 | Memoria semántica (Brain-1) |
| setubalai-api | ✅ active | :3010 | FastAPI Backend |
| setubalai-web | ✅ active | :3011 | Frontend producto |
| setubalai-admin | ✅ active | :3012 | Panel maestro |
| paperclip-db | ✅ running | Docker | PostgreSQL 17, DB business |

**Servicios LEGACY (fallen, no necesarios):**
- openclaw-gateway.service → legacy de pruebas, abril 2026
- setubalai-bridge.service → bridge v3.1, reemplazado por gateway-local

## DISCO / MEMORIA

| Recurso | Uso | Límite |
|---------|-----|--------|
| Disco | 48/75GB (66%) | 19GB libres |
| RAM | 4.7/7.6GB | 2.8GB disponibles |
| Swap | 0B | NO configurado |

**Directorios principales:**
- `~/.hermes/profiles/local/` — 3.5GB (sessions, config)
- `~/.hermes/hermes-agent/` — 2.6GB (código + venv)
- `~/.hermes/noxem-server/` — 1.1GB (noxem)
- `~/.hermes/state-snapshots/` — 739MB (backups pre-update — NO BORRAR)
- `~/setubalai-agente/` — 1.6GB (proyecto Next.js)
- `~/noxem/` — 742MB (copia suelta en home, verificar si aún se usa)
- `~/setubalai/` — 529MB (proyecto viejo/frontend prototype)

## CRON JOBS

| Job | Schedule | Estado |
|-----|----------|--------|
| Backup Paperclip DB | 0 3 * * * | ✅ recreado 2026-05-24 |
| recordatorio-cobros-diario | 0 9 * * * | ✅ recreado 2026-05-24 |
| Hermes Health Check Diario | 0 8 * * * | ✅ NUEVO - script, sin LLM |

**Jobs pausados (legacy, no ejecutan):**
- PC Local Check (every 5m) — paused
- Gateway Health Check (every 30m) — paused
- Limpieza Temporal (every 360m) — paused
- Disco y RAM Monitor (every 60m) — paused
- Telegram Bot Ping (every 15m) — paused

## GIT BACKUP TAGS

**Tag estable actual:** `estable-v0.14.0-2026-05-23`
- Todos los tags en `~/.hermes/hermes-agent/.git`
- Restaurar: `git reset --hard <tag>` → ver skill `hermes-backup-and-health`

## PROCEDIMIENTOS DE EMERGENCIA

Todo está documentado en la skill `hermes-backup-and-health`:
- Crear tags estables: cuándo y cómo
- Health checks: 8 verificaciones
- Alertas: 3 niveles (1=advertencia, 2=crítico, 3=emergencia)
- Restaurar desde tag: paso a paso
- Script automático: `~/.hermes/scripts/health-check.sh`

## LIMPIEZA REALIZADA 2026-05-24

| Acción | Espacio recuperado |
|--------|-------------------|
| Borrado wan-download/ | 2.7GB |
| npm cache clean | ~1.0GB |
| Docker build cache prune | 2.3GB |
| **Total** | **~6.0GB** (75% → 66%) |

## REGLAS DE MANTENIMIENTO

1. Health check diario corre automáticamente a las 8am
2. Solo notifica por Telegram si hay problemas
3. Si disco > 85%: alertar para limpieza
4. Si memoria < 1GB: alertar para revisión
5. Tags estables: crear antes de cualquier cambio grande en Hermes
6. Cronjobs desactualizados = problema del scheduler, recrear jobs
7. Documentación obsoleta → docs/archived/, nunca borrar
