# FLUJO DE DESARROLLO VPS — LEY IMPLÍCITA

**Última validación:** Junio 2026
**Proyecto:** SetubalAI Clínica (/home/admin/setubalai-agente/web)
**Puerto:** 3013 (dev.setubalai.org)
**Backend:** FastAPI :3010

---

## 🚨 REGLAS FÉRREAS (NUNCA VIOLAR)

### 1. DEV MODE SIEMPRE
```bash
cd /home/admin/setubalai-agente/web && PORT=3013 npm run dev
```
- **NUNCA** usar `npm run build` para cambios pequeños
- **NUNCA** borrar `.next` salvo compilación corrupta verificada (no adivinar)
- **NUNCA** restartear procesos sin causa específica y verificada
- Hot reload de Turbopack funciona — F5 y listo

### 2. VERIFICAR ANTES DE MOVER
- **SIEMPRE** leer el archivo real que voy a modificar antes de editarlo
- **SIEMPRE** verificar `curl http://localhost:3013/` → HTTP 200 antes de declarar "listo"
- **SIEMPRE** verificar `curl https://dev.setubalai.org/` → HTTP 200 después del cambio
- **NUNCA** decir "listo/funciona/completado" sin que ambos curl respondan 200

### 3. DIAGNÓSTICO ANTES DE CAMBIAR (Anti-ciego)
Si el usuario dice "no se ve" / "no funciona":

**PRIMERO** — Ejecutar esta auditoría completa:
```bash
# 1. Proceso vivo?
ps aux | grep "[n]ext dev"

# 2. Server responde?
curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/

# 3. URL externa responde?
curl -s -o /dev/null -w "%{http_code}" https://dev.setubalai.org/

# 4. El archivo tiene lo que creo que tiene?
grep -n "lo-que-busco" src/app/shell.tsx

# 5. El chunk compilado tiene lo que creo?
grep -r "lo-que-busco" .next/dev/static/chunks/ 2>/dev/null | head -3
```

**NUNCA** asumir que el problema es cache/Turbopack/HMR sin evidencia.
**NUNCA** matar procesos sin evidencia de que están rotos.
**NUNCA** cambiar puertos sin evidencia de que el puerto actual no sirve.

### 4. FLUJO DE DESARROLLO CORRECTO (paso a paso)
```
1. Verificar: curl localhost:3013 → 200
2. Leer archivo: cat src/app/shell.tsx (o el que sea)
3. Hacer UN cambio mínimo (1-3 líneas max)
4. Esperar compilación: Turbopack recompila auto (1-3 seg)
5. Verificar: curl localhost:3013 → 200
6. Verificar: curl dev.setubalai.org → 200
7. Avisar al usuario: "F5, debería verse X"
8. Si NO funciona → ir al paso 3 con diagnóstico real, NO adivinar
```

### 5. ARQUITECTURA QUE FUNCIONA
```
VPS (100.72.101.29)
├─ npm run dev :3013 (Next.js)
│   └─ Turbopack HMR (hot reload, F5 = nuevo bundle)
├─ FastAPI :3010 (backend)
│   └─ /medicos/, /turnos/, /pacientes/, etc
└─ Cloudflare Tunnel → dev.setubalai.org
    └─ Proxy a localhost:3013 (cf-cache-status: DYNAMIC = sin cache)

PC del usuario (Chrome)
└─ Abre dev.setubalai.org → ve lo que está en el VPS
   └─ SI F5 no funciona: Ctrl+Shift+R (hard reload) o ventana incógnita
```

### 6. QUÉ NO HACER NUNCA
- ✗ No tocar next.config.ts (exponer IPs, romper proxy)
- ✗ No cambiar puertos sin causa verificada
- ✗ No instalar dependencias nuevas sin preguntar
- ✗ No refactorizar archivos que "parecen" relacionados
- ✗ No usar webpack en vez de Turbopack sin causa verificada
- ✗ No cambiar color/texto sin verificar contraste WCAG
- ✗ No asumir "es cache" sin revisar chunks compilados
- ✗ No matar node procesos sin verificar que son los correctos

### 7. ANTE DUDA — SCRIPT DE AUDITORÍA
Si algo "no se ve" y no es obvio, ejecutar:
```bash
cd /home/admin/setubalai-agente/web
# Verificar proceso, server, archivo, chunks, y URL externa
ps aux | grep "[n]ext dev"
curl -s -o /dev/null -w "%{http_code}
" http://localhost:3013/
curl -s -o /dev/null -w "%{http_code}
" https://dev.setubalai.org/
grep -n "Configuración\|CONFIG\|config" src/app/shell.tsx
grep -rl "Configuración" .next/dev/static/chunks/ 2>/dev/null | head -5
ps aux | grep -c "[n]ode"  # Cuántos procesos node vivos
```

### 8. ERRORES PASADOS (NO REPETIR)

| Fecha | Error | Costo | Causa raíz |
|-------|-------|-------|------------|
| May 2026 | Next.js standalone 404 | 5h + $100 | asumí "build OK" = funciona |
| Jun 2026 | `flex: 1` empujaba config fuera del viewport | Tokens × 10 | adiviné cache/Turbopack en vez de auditar CSS |

**Patrón repetido:** Cambio código a ciegas sin auditar primero → usuario prueba → no funciona → cambio más código → más confusión → gasto de tokens.

**Fix:** AUDITAR PRIMERO. Leer archivos, verificar curl, revisar chunks. DIAGNÓSTICO antes de tratamiento.

---

## 📋 CHECKLIST OBLIGATORIO (cada cambio)

- [ ] Proceso dev server corriendo (`ps aux | grep next`)
- [ ] `curl localhost:3013` → 200
- [ ] `curl dev.setubalai.org` → 200
- [ ] Archivo leído antes de editar
- [ ] Cambio mínimo (≤3 líneas)
- [ ] Compilación verificada (HTTP 200 post-cambio)
- [ ] Usuario probó en su browser

