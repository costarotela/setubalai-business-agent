# PLAN — Separación App Producto vs Panel Maestro
**Fecha:** 2026-05-22
**Prioridad:** BLOQUEANTE — resolver antes de continuar Fase 4
**Costo estimado:** 4-6 horas de trabajo
**Estado:** APROBADO PARA EJECUTAR

---

## CONTEXTO

Ver análisis completo: `docs/ANALISIS-ERROR-ARQUITECTURAL-2026-05-22.md`

El error: Panel Maestro (administración SetubalAI) está dentro del producto que
se vende. Son dos cosas distintas y deben vivir separadas.

Principio: NO se tira nada. Se reorganiza.

---

## VISION FINAL

```
/home/admin/setubalai-agente/
  services/api/         ← SIN CAMBIOS (FastAPI :3010)
  web/                  ← APP PRODUCTO — lo que se vende (:3011)
  web-admin/            ← PANEL MAESTRO SetubalAI (:3012) [NUEVO]
  docker-compose.yml    ← solo db + api + web (el producto)
  docker-compose.admin.yml  ← solo web-admin (uso interno) [NUEVO]
```

```
URLs produccion:
  business.setubalai.org → web/ (el producto, empresa logueada ve sus datos)
  admin.setubalai.org    → web-admin/ (solo Pablo, panel maestro)
```

---

## PASOS — EN ORDEN ESTRICTO

### PASO 1 — Proteger el endpoint /empresas/ en el backend
**Archivo:** `services/api/routers/empresas.py`
**Cambio:** Agregar `Depends(get_current_user)` a GET /, POST /, PUT /{id}, DELETE /{id}
**Validación:** Solo usuarios con rol superadmin pueden llamar esos endpoints
**Tiempo:** 30 minutos
**Riesgo:** Ninguno — el panel-maestro ya manda JWT en los headers

### PASO 2 — Crear web-admin como app Next.js nueva
**Directorio:** `/home/admin/setubalai-agente/web-admin/`
**Contenido:** App Next.js mínima con:
  - Login propio (solo acepta superadmin)
  - La página panel-maestro/page.tsx trasladada (copy, no move)
  - Sidebar mínimo: solo "Empresas" y "Sistema"
  - Branding: SetubalAI fijo (no dinámico)
**Tiempo:** 1.5-2 horas
**Riesgo:** Bajo — el código de panel-maestro ya existe y funciona

### PASO 3 — Limpiar web/ (el producto)
**Archivos a modificar:**
  - `web/src/app/shell.tsx` → quitar "Panel Maestro" del sidebar
  - `web/src/app/panel-maestro/` → eliminar directorio
  - `web/src/app/shell.tsx` → hacer nombre/logo dinámico desde JWT/config empresa
**Tiempo:** 1-1.5 horas
**Riesgo:** Bajo — solo es UI, la lógica no cambia

### PASO 4 — Hacer el branding dinámico en el producto
**Archivo:** `web/src/app/shell.tsx`
**Cambio:** En lugar de hardcodear "SetubalAI / Business Agent", leer de la API:
  - GET /empresas/{empresa_id} ya devuelve nombre, configuracion (logo_url, color)
  - El sidebar muestra el nombre de la empresa logueada
  - Color primario del sidebar sale de configuracion.color_primario (con fallback a #7170ff)
**Tiempo:** 1 hora
**Riesgo:** Bajo — es solo lectura de datos, no modifica lógica

### PASO 5 — Docker: separar compose
**Archivos:**
  - `docker-compose.yml` → quitar servicio web-admin si estuviera
  - `docker-compose.admin.yml` → NUEVO, solo para web-admin
**Tiempo:** 30 minutos
**Riesgo:** Ninguno

### PASO 6 — Cloudflare: agregar admin.setubalai.org
**Acción:** En Cloudflare Tunnel agregar ruta admin.setubalai.org → localhost:3012
**Tiempo:** 15 minutos
**Riesgo:** Ninguno

### PASO 7 — Deploy y validación
**Acciones:**
  - Build y arrancar web-admin en :3012
  - Verificar que web/ (producto) ya no tiene panel maestro en el sidebar
  - Verificar que admin.setubalai.org funciona y solo Pablo puede entrar
  - Verificar que business.setubalai.org muestra el nombre de la empresa logueada
**Tiempo:** 30 minutos

---

## RESUMEN DE CAMBIOS POR ARCHIVO

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `services/api/routers/empresas.py` | Modificar | Agregar auth superadmin |
| `web/src/app/shell.tsx` | Modificar | Quitar Panel Maestro, branding dinámico |
| `web/src/app/panel-maestro/` | Eliminar | Se mueve a web-admin |
| `web-admin/` | Crear nuevo | App Next.js mínima para admin |
| `docker-compose.admin.yml` | Crear nuevo | Stack admin separado |
| `docker-compose.yml` | Sin cambios | Ya está correcto |

---

## LO QUE NO CAMBIA

- FastAPI backend: sin tocar
- Base de datos: sin tocar
- Páginas del producto (clientes, cobros, productos, reportes): sin tocar
- Auth JWT: sin tocar
- tenancy.py: sin tocar
- Skills de Hermes: sin tocar
- Crons: sin tocar

---

## CRITERIO DE EXITO

1. Un usuario de empresa cliente que hace login en business.setubalai.org:
   - Ve el nombre de SU empresa en el sidebar
   - NO ve "Panel Maestro" en ningún lugar
   - No puede acceder a /api/empresas/ (403 si intenta)

2. Pablo logueado en admin.setubalai.org:
   - Ve la lista de todas las empresas con sus métricas
   - Puede crear, editar, eliminar empresas
   - Es una interfaz COMPLETAMENTE separada del producto

3. El docker-compose.yml que se entrega a clientes enterprise:
   - NO contiene el panel maestro
   - Solo contiene el producto (db + api + web)

---

## DEUDA TECNICA QUE ESTO RESUELVE

- [x] Separación conceptual empresa/producto
- [x] Seguridad: endpoint /empresas/ protegido
- [x] Branding dinámico por empresa (preparación para Fase 4.5)
- [x] Docker limpio para distribución a clientes

---

## NOTA SOBRE EL ERROR COMETIDO

Este error debió haberse detectado en la fase de planificación, no en ejecución.
El modelo debió preguntar antes de construir dónde vive el Panel Maestro.
El costo de la corrección es bajo (4-6 horas), pero el costo en confianza
es más alto. Documentado para no repetir.

---

*Creado: 2026-05-22*
*Aprobación requerida de Pablo antes de ejecutar*
