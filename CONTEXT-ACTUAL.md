# SETUBALAI PROJECT CONTEXT — ESTADO REAL (Jun 2026)

**Actualizado:** 2026-06-01 (auditoría completa + fix auth + obras_sociales)
**DB:** PostgreSQL 17, schema `setubalai`, 31 tablas, empresa_id=16 (Centro Médico Santa Clara)
**Backend:** FastAPI systemd :3010 | **Frontend:** Next.js dev :3013 (dev.setubalai.org)
**VPS:** 100.72.101.29 | **PC:** 100.81.134.102:2222

---

## ✅ COMPLETADO

| Capa | Componente | Estado |
|------|-----------|--------|
| **DB** | 31 tablas | ✅ Especialidades (5), médicos M:N, pacientes vinculados, obras_sociales, grillas, duraciones |
| **Backend** | 9 routers | ✅ /medicos/, /especialidades/, /obras-sociales/, /configuracion-agenda/*, /agenda/slots-libres |
| **Auth** | JWT multi-tenant | ✅ superadmin (empresa_id=1) + clinic admin (empresa_id=16) |
| **Frontend** | Listados + Config | ✅ Login, dashboard, pacientes, turnos, medicos, config, especialidades, agenda config, obras sociales |
| **Sidebar** | Configuración visible | ✅ flex:1 removido, aside overflowY auto |
| **AuthFetch** | Auto-prepend /api/ | ✅ Fix Jun 2026 |
| **Duraciones** | Join especialidad | ✅ Fix Jun 2026 (INNER JOIN → nombre de especialidad) |

## ⚠️ PROBLEMAS CONOCIDOS — RESUELTOS

| Problema | Causa | Solución |
|----------|-------|----------|
| Configuración no visible (móvil) | flex:1 en nav empujaba fuera del viewport | aside overflowY:auto, nav sin flex:1 |
| authFetch JSON.parse error | URL sin /api/ → HTML en vez de JSON | Auto-prepend /api/ si no empieza con /api/ |
| Login 401 sin causa | Password admin corrompida | seed_datos_prueba.py repara passwords automáticamente |
| 0 registros en páginas | Token de superadmin (empresa_id=1) | Usar admin de la clínica (empresa_id=16) |
| Duraciones 500 Internal Error | .order_by(especialidad) no existe | JOIN EspecialidadMedica, order por especialidad_id |

## 🔐 AUTH — USUARIOS DE LA CLÍNICA

| Usuario | Password | Rol | empresa_id | Nota |
|---------|----------|-----|------------|------|
| admin@centromedicosantaclara.com.ar | Pablo2024! | admin | 16 | **Admin principal de la clínica** |
| medico.maria.garcia@centromedico.com.ar | Pablo2024! | operador | 16 | Dra. García |
| medico.carlos.rodriguez@centromedico.com.ar | Pablo2024! | operador | 16 | Dr. Rodríguez |
| medico.juan.martinez@centromedico.com.ar | Pablo2024! | operador | 16 | Dr. Martínez |
| medico.ana.lopez@centromedico.com.ar | Pablo2024! | operador | 16 | Dra. López |
| medico.roberto.fernandez@centromedico.com.ar | Pablo2024! | operador | 16 | Dr. Fernández |

**Superadmin:** pcostarotela@gmail.com / Pablo2024! → empresa_id=1 (NO ve datos de la clínica)

## 🗃️ DB — OBRAS SOCIALES (seeded 8)

| Nombre | Código | Tipo | Cobertura |
|--------|--------|------|-----------|
| OSDE | OSDE | PREPAGA | 100% |
| Swiss Medical | SWISS | PREPAGA | 100% |
| PAMI | PAMI | OS | 100% |
| IOMA | IOMA | OS | 90% |
| Particular | PARTICULAR | PARTICULAR | 0% |
| Galeno | GALENO | PREPAGA | 85% |
| Medifé | MEDIFE | PREPAGA | 100% |
| IAPOS | IAPOS | OS | 90% |

## ⚠️ BUG PASSWORD (IMPORTANTE)

`POST /empresas/` genera password **aleatoria** con `secrets.token_urlsafe(12)`. Si no se guarda, se pierde. No hay forma de recuperarla sin reset.

**FIX AUTOMÁTICO:**
```bash
cd ~/setubalai-agente/services/api && ./venv/bin/python3 seed_datos_prueba.py
```
→ Verifica TODOS los usuarios de empresa 16, repara password a `Pablo2024!`, reporta estado.

**Regla:** Tras cualquier deploy o reseed → correr seed. Si login falla → seed primero.

## 🔄 DEV FLOW (LEY INQUEBRANTABLE)

```bash
cd ~/setubalai-agente/web && PORT=3013 npm run dev
```

1. `curl localhost:3013` → 200
2. Leer archivo REAL antes de editar
3. UN cambio ≤3 líneas
4. `curl localhost:3013` → 200
5. Avisar: "F5, debería verse X"

**NUNCA:** build, borrar .next, restart sin causa, tocar next.config.ts
**SIEMPRE:** auditar primero (ps, curl, grep archivo, grep chunks)

**Skill:** `vps-dev-workflow`
