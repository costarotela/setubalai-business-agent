# 🧪 LECCIONES APRENDIDAS - Sesión Mayo 30 / Junio 1, 2026
## Flujo de trabajo para acceso remoto al frontend VPS

---

## ✅ FLUJO CORRECTO (lo que debimos hacer desde el principio)

### 1. Cloudflare Tunnel - Exponer el servicio
- Agregar `dev.setubalai.org` → `localhost:3013` via API de Cloudflare
- Crear registro DNS CNAME: `dev` → `ee96f109.cfargotunnel.com`
- URL pública: `https://dev.setubalai.org`

### 2. Backend CORS - Agregar origen permitido
En `services/api/main.py`:
```python
allow_origins = [
    ...
    "https://dev.setubalai.org",  # ← AGREGAR ESTE
]
```

### 3. Frontend - Build de producción
```bash
# Build único (cada vez que hay cambios en código)
docker exec web-clinica-prod sh -c 'cd /app && npm run build'

# El container ya corre npm start en el puerto 3013
```

### 4. next.config.ts - Configuración mínima
```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Fix redirect 307 de FastAPI (trailing slash)
      { source: "/api/clientes", destination: "http://100.72.101.29:3010/clientes/" },
      // Resto de API routes
      { source: "/api/:path*", destination: "http://100.72.101.29:3010/:path*" },
    ];
  },
};
```

---

## ❌ ERRORES COMETIDOS (NO REPETIR)

### Error 1: Usar `npm run dev` (desarrollo) para acceso público
**Problema:** Next.js dev mode asume acceso local. Por HTTPS público:
- WebSocket HMR no funciona (blockeado por Cloudflare)
- `allowedDevOrigins` solo controla HMR, NO CORS de API routes
- Cloudflare inyecta scripts (beacon.js) que causan errores de integrity hash
- CORS: dev mode no agrega `Access-Control-Allow-Origin` en respuestas

**Solución:** Usar `npm run build` + `npm start` (producción)
- Archivos estáticos precompilados
- CORS headers pasan correctamente desde el backend
- Sin WebSocket, sin HMR, sin quilombo

### Error 2: Docker SIN port mapping
**Problema:** `docker run -p 3013:3000` es OBLIGATORIO. Sin `-p`, el puerto 3000 existe solo DENTRO del container, inaccesible desde afuera.

**Solución:** Siempre `-p HOST_PORT:CONTAINER_PORT`

### Error 3: Contraseña de DB en `.env` incorrecta
**Problema:** `DATABASE_URL=postgresql://paperclip:SetubalAI2024!@127.0.0.1:5432/business`
- La contraseña real era `setubalai2024` (minúsculas, sin !)
- La IP `127.0.0.1` funciona pero `100.72.101.29` es más robusto
- Esto hizo que el backend retornara 500 en login

**Solución:** Verificar siempre `DATABASE_URL` contra la DB real

### Error 4: No verificar CORS ANTES de decir "listo"
**Problema:** El backend FastAPI tenía CORS configurado pero NO incluía `https://dev.setubalai.org`
- El browser bloquea TODAS las respuestas API si el origin no está en `allow_origins`
- curl no muestra CORS headers a menos que se pase `-H "Origin: ..."`

**Solución:** SIEMPRE testear CORS con:
```bash
curl -sv -H "Origin: https://dev.setubalai.org" -X POST "https://dev.setubalai.org/api/auth/login" -d "username=...&password=..."
# Verificar acceso-control-allow-origin en la respuesta
```

### Error 5: Redirect 307 de FastAPI en /clientes
**Problema:** FastAPI redirectea `/clientes` → `/clientes/` con Location = IP interna del VPS
- El browser NO puede seguir el redirect a `100.72.101.29:3010`
- Resultado: fetch falla → .catch() elimina el token → login loop

**Solución:** Rewrite específico en next.config.ts:
```typescript
{ source: "/api/clientes", destination: "http://100.72.101.29:3010/clientes/" }
```

### Error 6: Middleware innecesario que rompe rewrites
**Problema:** Creé `src/middleware.ts` para agregar CORS → interfirió con los rewrites de Next.js
- Modificó el método de POST a GET (los logs lo mostraban)

**Solución:** No necesitamos middleware. El CORS lo agrega el backend FastAPI.

---

## 📋 CHECKLIST DE VERIFICACIÓN ANTES DE DECIR "LISTO"

Para CADA cambio en el frontend:

1. [ ] Build sin errores: `npm run build` (exit 0)
2. [ ] Login funciona: `curl -X POST http://localhost:3013/api/auth/login -d "..."` → 200
3. [ ] CORS headers correctos: `curl -sv -H "Origin: https://dev.setubalai.org" ...` → `access-control-allow-origin` presente
4. [ ] Auth/me funciona: `curl -H "Authorization: Bearer ..." .../api/auth/me` → user data
5. [ ] Dashboard endpoints: `/api/reportes/dashboard`, `/api/cobros/pendientes`, `/api/clientes` → todos 200
6. [ ] Acceso HTTPS: `curl -o /dev/null -w "%{http_code}" https://dev.setubalai.org/dashboard` → 200
7. [ ] No errores de build: `docker logs web-clinica-prod` → sin errores

---

## 🔧 COMANDOS ÚTILES

```bash
# Verificar estado del sistema
docker ps --filter name=web-clinica-prod --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
systemctl --user is-active setubalai-api.service
systemctl --user is-active hermes-cloudflared.service

# Rebuild después de un cambio en código
docker exec web-clinica-prod sh -c 'cd /app && npm run build 2>&1' | tail -5

# Verificar CORS
curl -sv -H "Origin: https://dev.setubalai.org" -X POST "https://dev.setubalai.org/api/auth/login" -d "username=...&password=..." 2>&1 | grep access-control

# Verificar datos de la API
TOKEN=$(curl -s -X POST https://dev.setubalai.org/api/auth/login -d "username=...&password=..." | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s "https://dev.setubalai.org/api/clientes" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print(f'Total clientes: {d[\"total\"]}')"
```

---

## 🏗️ ARQUITECTURA ACTUAL

```
Browser → https://dev.setubalai.org (Cloudflare Tunnel HTTPS)
    → localhost:3013 (Next.js production, npm start)
        → /api/* → rewrite → http://100.72.101.29:3010/* (FastAPI backend)
            → PostgreSQL (100.72.101.29:5432)
```

| Componente | Servicio | Puerto |
|------------|----------|--------|
| Frontend (prod) | Docker `web-clinica-prod` | 3013→3000 |
| Backend API | systemd `setubalai-api.service` | 3010 |
| Tunnel | systemd `hermes-cloudflared.service` | - |
| PostgreSQL | Docker `paperclip-db` | 5432 |
