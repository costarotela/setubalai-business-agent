# Plan Multi-Tenant: Configuración por Empresa

> **Para Hermes:** Ejecutar paso a paso, validar CADA paso con curl antes de seguir.

**Goal:** Dar a cada empresa su panel de configuración (datos fiscales, categorías, datos de cobro) y eliminar datos hardcodeados.

**Arquitectura:**
- Backend: nuevo router `categorias.py`, nuevos endpoints en `empresas.py` para `/mi-empresa`
- Frontend: nueva página `/configuracion` en web-app
- Seed data: opcional, botón "Cargar datos de ejemplo"

---

## FASE 1: Backend — Endpoints de configuración

### Paso 1.1: Crear router categorias.py

**Objetivo:** CRUD completo de categorías filtrado por empresa_id vía `resolve_empresa_id`.

**Archivo nuevo:** `services/api/routers/categorias.py`

Endpoints:
- `GET /categorias/` → listar categorías de MI empresa
- `POST /categorias/` → crear categoría
- `PUT /categorias/{id}` → editar categoría
- `DELETE /categorias/{id}` → eliminar (solo si NO tiene productos)

**Reglas de integridad:**
- DELETE bloqueado si hay productos con esa categoria_id
- Todo filtrado por empresa_id (resolve_empresa_id)
- Validación: nombre no vacío, max 100 chars

**Validación Paso 1.1:**
```bash
# Registrar router en main.py (agregar import + include_router)
curl http://localhost:3010/categorias/ | grep "categorias"
# Espera: {"total":0, "categorias":[]}
```

### Paso 1.2: Endpoint GET /mi-empresa

**Objetivo:** Retornar configuración completa de la empresa del usuario logueado (desde JWT).

**Archivo a modificar:** `services/api/routers/empresas.py`

Nuevo endpoint: `GET /mi-empresa`
- Usa `get_current_user` para obtener usuario
- Usa `user.empresa_id` para buscar la empresa
- Retorna TODOS los campos: nombre, rubro, moneda, CUIT, CBU, alias, banco, dirección, teléfono, email, configuración JSONB

**Validación Paso 1.2:**
```bash
# Login → obtener token
TOKEN=$(curl -s -X POST http://localhost:3010/auth/login \
  -d "username=pcostarotela@gmail.com&password=Setubalai2024!" | jq -r .access_token)
curl -s http://localhost:3010/mi-empresa \
  -H "Authorization: Bearer $TOKEN" | jq .
# Espera: datos completos de empresa con id=1
```

### Paso 1.3: Endpoint PUT /mi-empresa

**Objetivo:** Permitir al usuario actualizar los datos de SU empresa.

**Archivo:** `services/api/routers/empresas.py`

Nuevo endpoint: `PUT /mi-empresa`
- Body: nombre, rubro, moneda, CUIT, CBU, alias_cbu, banco, dirección, teléfono, email (todos opcionales)
- Solo puede modificar campos de su propia empresa (user.empresa_id)
- NO puede cambiar plan ni estado (solo superadmin)

**Validación Paso 1.3:**
```bash
curl -s -X PUT http://localhost:3010/mi-empresa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rubro":"Tecnología","moneda":"ARS"}' | jq .rubro
# Espera: "Tecnología"
```

### Paso 1.4: Endpoint POST /configuracion/seed

**Objetivo:** Cargar datos demo (categorías + productos) SOLO para la empresa del usuario.

**Archivo:** `services/api/routers/empresas.py` (o categorias.py)

Nuevo endpoint: `POST /configuracion/seed`
- Protegido con `get_current_user`
- Crea 3-4 categorías genéricas (Productos, Servicios, Insumos, Otros)
- Crea 2-3 productos de ejemplo
- TODO con el empresa_id del usuario logueado
- Idempotente: si ya tiene datos, NO vuelve a crear (check: si tiene ≥1 producto, retornar "ya tiene datos")

**Validación Paso 1.4:**
```bash
curl -s -X POST http://localhost:3010/configuracion/seed \
  -H "Authorization: Bearer $TOKEN" | jq .
# Espera: {"ok":true, "mensaje":"Datos demo cargados","categorias_creadas":N,"productos_creados":N}

curl -s http://localhost:3010/categorias/ \
  -H "Authorization: Bearer $TOKEN" | jq '.total'
# Espera: 4 (o el número de categorías creadas)
```

### Paso 1.5: Registrar router en main.py

**Objetivo:** Asegurar que `categorias.py` se importa y registra.

**Archivo:** `services/api/main.py`
- Agregar `categorias` al import
- Agregar `app.include_router(categorias.router)`

**Validación Paso 1.5:**
```bash
curl -s http://localhost:3010/categorias/ | jq .
# Espera: {"total":0, "categorias":[]} o datos si ya se corrió seed
```

---

## FASE 2: Frontend — Panel de Configuración

### Paso 2.1: Crear página /configuracion

**Objetivo:** Nueva página con 3 secciones: Datos Empresa, Categorías, Datos de Cobro.

**Archivo nuevo:** `web/src/app/configuracion/page.tsx`

Secciones:
1. **Datos de Empresa:** form con nombre, CUIT, rubro, dirección, teléfono, email, moneda
2. **Categorías de Productos:** tabla ABM (crear, editar, eliminar) con:
   - Botón "Nueva categoría" → input + crear
   - Editar inline (doble click o botón editar)
   - Eliminar → confirm, bloqueado si tiene productos (mostrar mensaje)
3. **Datos de Cobro:** CBU, alias_cbu, banco

**API calls:**
- GET `/mi-empresa` → cargar datos iniciales
- PUT `/mi-empresa` → guardar cambios
- GET `/categorias/` → listar categorías
- POST `/categorias/` → crear categoría
- PUT `/categorias/{id}` → editar categoría
- DELETE `/categorias/{id}` → eliminar categoría
- Botón "Cargar datos de ejemplo" → POST `/configuracion/seed`

**Validación Paso 2.1:**
```bash
# Verificar que la página compila
cd /home/admin/setubalai-agente/web && npm run build
# Espera: Build completado sin errores
# O verificar dev server:
curl -s http://localhost:3011/configuracion | head -20
# Espera: HTML con "Configuración"
```

### Paso 2.2: Agregar "Configuración" al sidebar

**Objetivo:** Link visible en el menú lateral.

**Archivo:** `web/src/app/shell.tsx`
- Agregar item en grupo "Administración": `{ name: "Configuración", path: "/configuracion", icon: Settings }`
- Importar `Settings` de lucide-react

### Paso 2.3: Dropdown de categorías dinámico en productos

**Objetivo:** Al crear/editar producto, mostrar categorías reales (no hardcoded).

**Archivos a modificar:**
- `web/src/app/nuevo-producto/page.tsx` (o similar)
- `web/src/app/productos/page.tsx`

Cambios:
- Fetch `GET /categorias/` al montar la página
- Reemplazar categoría hardcoded por `<select>` con categorías dinámicas
- Incluir opción "Sin categoría"

**Validación Paso 2.3:**
```bash
curl -s http://localhost:3011/productos | grep -i "categoria"
# Verificar que el dropdown muestra las categorías
```

---

## FASE 3: Datos iniciales vacíos

### Paso 3.1: Eliminar seed hardcodeado de la DB

**Objetivo:** Nueva empresa empieza sin datos.

**Acción:** Identificar y eliminar datos hardcodeados de la DB (setubalai-agente tiene productos/categorías pre-cargados en tabla)

**Archivo:** posiblemente `services/api/database.py` o script de migración

**Validación Paso 3.1:**
```bash
# Verificar estado actual de la DB
curl -s http://localhost:3010/productos/?empresa_id=1 | jq '.total'
# Esto debe mantener los datos de SetubalAI (empresa id=1)
# El cambio es que NUEVAS empresas no tendrán datos por defecto
```

### Paso 3.2: Botón "Cargar datos de ejemplo"

**Objetivo:** Ya cubierto por Paso 1.4 (seed endpoint). Agregar botón en UI.

**Archivo:** `web/src/app/configuracion/page.tsx`
- Botón "Cargar datos de ejemplo" → POST `/configuracion/seed`
- Mostrar estado: "Cargado" / "Ya tenés datos de ejemplo"

---

## REGLAS DE INTEGRIDAD

1. **NO borrar categoría** si tiene productos → check FK antes de DELETE
2. **Renombrar categoría** → safe, solo cambia nombre (id不变)
3. **Eliminar empresa** → ya existe cascade en empresas.py
4. **Todo filtrado por empresa_id** → nunca ver datos de otra empresa
5. **Seed data** → siempre dentro del empresa_id del usuario logueado

---

## EJECUCIÓN

Cada fase se valida con curl/browser ANTES de pasar a la siguiente.
Si un paso falla → PARAR, diagnosticar, fix, re-validar.
