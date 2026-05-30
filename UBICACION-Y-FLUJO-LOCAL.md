# 📍 UBICACIÓN COMPLETA Y FLUJO DE DESARROLLO LOCAL

**Generado:** 2026-05-30  
**VPS:** 157.173.197.224 (Tailscale: 100.72.101.29)  
**PC Local:** Tailscale 100.81.134.102:2222

---

## 🗂️ ESTRUCTURA EN VPS

```
/home/admin/setubalai-agente/
├── services/
│   ├── api/              ← Backend FastAPI (Puerto 3010)
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── ...
│   ├── infrastructure/   ← Infrastructure API (Puerto 9993)
│   └── db-explorer/      ← DB Explorer (Puerto 9991)
├── web-admin/            ← Panel Admin Next.js (Puerto 3012)
│   ├── package.json
│   ├── next.config.js
│   └── .next/
├── telegram-bot/         ← Bot Telegram
└── docs/                 ← Documentación

/home/admin/www/public/   ← Landing Page (Puerto 3011)
```

---

## 🚀 SERVICIOS SYSTEMD ACTIVOS

| Servicio | Puerto | Comando |
|----------|--------|---------|
| **setubalai-api.service** | 3010 | `systemctl --user status setubalai-api` |
| **setubalai-admin.service** | 3012 | `systemctl --user status setubalai-admin` |
| **setubalai-landing.service** | 3011 | `systemctl --user status setubalai-landing` |
| **setubalai-clinic-bot.service** | - | `systemctl --user status setubalai-clinic-bot` |
| **setubalai-db-explorer.service** | 9991 | `systemctl --user status setubalai-db-explorer` |
| **setubalai-infrastructure.service** | 9993 | `systemctl --user status setubalai-infrastructure` |

**Ver logs en tiempo real:**
```bash
journalctl --user -u setubalai-api -f
```

---

## 💾 BASE DE DATOS

**Docker Container:** `paperclip-db`  
**Motor:** PostgreSQL 17  
**Puerto:** `127.0.0.1:5432`  
**Database:** `setubalai_clinica`  
**Usuario:** `admin`

**Conectar desde VPS:**
```bash
docker exec -it paperclip-db psql -U admin -d setubalai_clinica
```

**Ver tablas:**
```sql
\dt
```

---

## 🔑 CREDENCIALES

### Superadmin (Panel Maestro)
- **Email:** pcostarotela@gmail.com
- **Password:** Pablo2024!
- **Rol:** superadmin

### Admin Empresa 1
- **Email:** admin@setubalai.com
- **Password:** Admin123!
- **Rol:** admin

---

## 🖥️ FLUJO DE DESARROLLO LOCAL (TU PC)

### 1️⃣ CLONAR CÓDIGO A TU PC

```bash
# Conectarse al VPS por SSH
ssh admin@100.72.101.29

# Comprimir el proyecto
cd /home/admin
tar -czf setubalai-agente.tar.gz setubalai-agente/

# Desde tu PC (nueva terminal)
scp admin@100.72.101.29:/home/admin/setubalai-agente.tar.gz ~/

# Extraer
cd ~
tar -xzf setubalai-agente.tar.gz
```

### 2️⃣ CONFIGURAR BACKEND LOCAL (FastAPI)

```bash
cd ~/setubalai-agente/services/api

# Crear venv
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://admin:password@100.72.101.29:5432/setubalai_clinica
JWT_SECRET_KEY=tu-secret-key-aqui
TOKEN_KEY=tu-token-key-aqui
TELEGRAM_BOT_TOKEN=tu-bot-token
EOF

# Correr backend local
uvicorn main:app --reload --port 8000
```

**✅ Backend corriendo en:** `http://localhost:8000`

### 3️⃣ CONFIGURAR FRONTEND LOCAL (Next.js)

```bash
cd ~/setubalai-agente/web-admin

# Instalar dependencias
npm install

# Configurar .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Correr en modo desarrollo
npm run dev
```

**✅ Frontend corriendo en:** `http://localhost:3000`

### 4️⃣ ABRIR EN NAVEGADOR

```
http://localhost:3000
```

**Login con:**
- pcostarotela@gmail.com / Pablo2024!

---

## 🔄 FLUJO DE TRABAJO

### Desarrollo Local (GRATIS)

1. **Modificar código** en tu PC con VS Code
2. **Ver cambios** instantáneamente en `localhost:3000`
3. **Probar** todas las funciones localmente
4. **Iterar** sin límite de cambios

### Subir a Producción (cuando esté listo)

```bash
# Desde tu PC
cd ~/setubalai-agente

# Comprimir cambios
tar -czf setubalai-agente-update.tar.gz web-admin/ services/

# Subir al VPS
scp setubalai-agente-update.tar.gz admin@100.72.101.29:/home/admin/

# SSH al VPS
ssh admin@100.72.101.29

# Extraer y reiniciar servicios
cd /home/admin
tar -xzf setubalai-agente-update.tar.gz -C setubalai-agente/
systemctl --user restart setubalai-api
systemctl --user restart setubalai-admin
```

---

## 🎯 URLS DE PRODUCCION

| Servicio | URL |
|----------|-----|
| **Landing** | https://setubalai.org |
| **Panel Admin** | https://admin.setubalai.org |
| **API Backend** | https://api.setubalai.org |

*(Configuradas via Cloudflare Tunnel)*

---

## 🛠️ HERMES LOCAL

Ya instalado en tu PC:

```bash
# Desde terminal de tu PC
hermes chat

# O path completo
~/.local/bin/hermes chat
```

**Configuración:** `~/.hermes/profiles/local/config.yaml`  
**API Key:** Tu OpenRouter key (ya configurada)  
**Costos:** Van a TU cuenta, no a la del VPS

---

## 📊 SCHEMA DE BASE DE DATOS

### Tablas Principales

```
visitas              → Turnos agendados
atenciones_medicas   → Registro de atención médica
practicas_medicas    → Códigos facturables (NABONs)
pacientes            → Datos de pacientes
profesionales        → Médicos y especialistas
empresas             → Multi-tenant
usuarios             → Auth y permisos
```

---

## ⚠️ REGLAS DE ORO

1. **NUNCA** hacer builds en el VPS durante desarrollo
2. **SIEMPRE** probar localmente primero
3. **VERIFICAR** que todo funciona en `localhost` antes de subir
4. **DOCUMENTAR** cambios importantes
5. **COMMITS** frecuentes con mensajes claros

---

## 🔍 DEBUGGING

### Backend no arranca
```bash
journalctl --user -u setubalai-api -n 50
```

### Frontend no carga
```bash
journalctl --user -u setubalai-admin -n 50
```

### Base de datos no conecta
```bash
docker logs paperclip-db --tail 50
```

### Ver procesos
```bash
systemctl --user list-units --type=service | grep setubal
```

---

## 📞 SOPORTE

Si algo no funciona:

1. Ver logs del servicio con `journalctl`
2. Verificar que el puerto no esté ocupado con `netstat -tlnp`
3. Revisar `.env` y configuración
4. Consultar esta documentación

---

**Última actualización:** 2026-05-30  
**Mantenido por:** Hermes Agent
