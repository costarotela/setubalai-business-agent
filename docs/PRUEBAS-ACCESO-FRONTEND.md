# 🧪 Registro de Pruebas - Acceso Frontend Clínica
## Última actualización: Junio 1, 2026

---

## ✅ SOLUCIÓN FINAL (Funcionando JUNIO 1)

### Flujo: Producción (NO dev mode)

**NO usar `npm run dev`.** Usar `npm start` (producción).

### Container de producción:
```bash
docker run -d \
  --name web-clinica-prod \
  -p 3013:3000 \
  -v /home/admin/setubalai-agente/web:/app \
  -w /app \
  --restart unless-stopped \
  node:23-slim \
  sh -c 'npm start -- -p 3000 --hostname 0.0.0.0'
```

### Rebuild después de cambios:
```bash
docker exec web-clinica-prod sh -c 'cd /app && npm run build'
# (30 segundos, sin quilombo)
```

### next.config.ts (final):
```typescript
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost',
    '100.72.101.29',
    '135.181.86.129',
    'dev.setubalai.org',
  ],
  async rewrites() {
    return [
      { source: "/api/clientes", destination: "http://100.72.101.29:3010/clientes/" },
      { source: "/api/:path*", destination: "http://100.72.101.29:3010/:path*" },
    ];
  },
};
```

### .env.local:
```
NEXT_PUBLIC_API_URL=/api
```

### Backend CORS (services/api/main.py):
Incluir `"https://dev.setubalai.org"` en `allow_origins`.

### URL pública: `https://dev.setubalai.org/login`

### Verificado por curl (JUNIO 1):
```
Login → 200 OK, token JWT válido ✅
Auth/me → 200 OK, user data ✅
Dashboard → 200 OK ✅
CORS → access-control-allow-origin: https://dev.setubalai.org ✅

Datos reales:
  /api/reportes/dashboard → 20 clientes activos
  /api/cobros/pendientes → 0 facturas
  /api/clientes → 20 clientes (Ana, Andrés, etc.)
```

---

## ❌ PRUEBAS PREVIAS FALLIDAS (NO REPETIR)

### Prueba 1: Docker sin port mapping
**Fecha:** Mayo 30 (mañana)
**Config:** `docker run -d --name web-clinica-dev ... node:23-slim npm run dev`
**Resultado:** ❌ Container corría pero puerto 3000 inaccesible desde afuera
**Lección:** `-p 3013:3000` es OBLIGATORIO

### Prueba 2: Rewrite con localhost
**Fecha:** Múltiples sesiones
**Config:** `destination: "http://localhost:3010/:path*"`
**Resultado:** ❌ Browser intenta localhost en PC del usuario → sin backend → loop
**Lección:** Usar IP del VPS (100.72.101.29) en rewrites

### Prueba 3: NEXT_PUBLIC_API_URL = localhost:3010
**Fecha:** Múltiples sesiones
**Config:** `NEXT_PUBLIC_API_URL=http://localhost:3010`
**Resultado:** ❌ Browser apunta a PC local → fail → token borrado → redirect login
**Lección:** Usar `/api` relativo para que Next.js proxy haga el trabajo

### Prueba 4: npm run build standalone con Turbopack
**Fecha:** Mayo 29-30
**Config:** `npm run build` (Turbopack por defecto)
**Resultado:** ❌ Build corrupto, ENOENT errors, chunks 404
**Lección:** Turbopack tiene race conditions en VPS

### Prueba 5: Desarrollo local en PC (sin Docker)
**Fecha:** Mayo 30
**Config:** `cd /mnt/disco2/VPS/setubalai-agente/web && npm run dev`
**Resultado:** ❌ DB no replicable, quilombo de puertos, backend remoto necesario
**Lección:** Mejor dev en VPS con port mapping via Tailscale

### Prueba 6: Auth deshabilitado
**Fecha:** Mayo 29
**Config:** Hardcodear `user = null` en shell.tsx
**Resultado:** ❌ Variables conflictivas, build completamente roto
**Lección:** No tocar auth sin entender el flujo completo

---

## 🔍 CAUSAS DEL LOGIN LOOP (Investigadas)

### Bug 1: TOKEN_KEY truncado (FIXED)
**Archivo:** `auth-context.tsx`
**Problema:** `"setuba...n_v2"` (literal, con puntos) ≠ `"setubalai_token_v2"`
**Fix:** Patch aplicado a `auth-context.tsx`

### Bug 2: API URL incorrecta en browser (FIXED)
**Problema:** `NEXT_PUBLIC_API_URL=http://localhost:3010` → browser busca en PC local
**Fix:** `NEXT_PUBLIC_API_URL=/api` + rewrite con IP del VPS

### Bug 3: Docker sin port mapping (FIXED)
**Problema:** Puerto 3000 dentro del container, inaccesible desde afuera
**Fix:** `-p 3013:3000` en `docker run`

---

## 📋 PRUEBAS PENDIENTES PARA MAÑANA

### Prueba 7: Acceso completo desde browser
- [ ] Abrir `http://100.72.101.29:3013/login` en incógnito
- [ ] Login con credenciales de la clínica
- [ ] Verificar que no redirija al login
- [ ] Verificar que el dashboard muestre datos
- **Si falla:** Abrir F12 Console, revisar errores de red

### Prueba 8: Hot reload
- [ ] Modificar un archivo en `/home/admin/setubalai-agente/web/`
- [ ] Verificar que el cambio se refleja en el browser (F5)
- **Si falla:** Turbopack puede tener problemas con mounted volumes

---

## 🛠️ COMANDOS DE DIAGNÓSTICO RÁPIDO

```bash
# Estado del container
docker ps --filter name=web-clinica-dev
docker logs web-clinica-dev 2>&1 | tail -20

# Verificar port mapping
docker port web-clinica-dev
curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/login

# Verificar rewrite
curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/api/auth/login

# Verificar TOKEN_KEY en archivos
grep "TOKEN_KEY" src/app/auth-context.tsx
grep "setubalai_token_v2" src/app/login/page.tsx
grep "setubalai_token_v2" src/app/dashboard/page.tsx

# Verificar .env.local
cat .env.local
```

---

## 📊 ESTADO ACTUAL DEL SISTEMA (Mayo 30, noche)

| Componente | Estado | Puerto |
|------------|--------|--------|
| PostgreSQL | ✅ Activo | 5432 |
| FastAPI Backend | ✅ Activo | 3010 |
| Frontend Dev (Docker) | ✅ Activo | 3013 → 3000 |
| Cloudflare Tunnel | ✅ Activo | - |
| Cloudflared Service | ✅ Activo | - |
