# Desarrollo Local en tu PC 🖥️

## Qué vas a tener:
- Next.js corriendo en tu navegador con `npm run dev` (hot reload instantáneo)
- Backend en el VPS accesible via Tailscale
- **$0 en tokens de build** - desarrollás gratis, subís a VPS solo cuando funciona

---

## Instrucciones (copiar y pegar en terminal de tu PC):

### Paso 1: Descargar el código
```bash
cd ~
ssh admin@100.72.101.29 "cd /home/admin && tar -czf - setubalai-agente/web-admin/" | tar -xzf -
```

### Paso 2: Instalar dependencias
```bash
cd ~/setubalai-agente/web-admin
npm install
```

### Paso 3: Configurar conexión al backend VPS
```bash
cat > .env.local << 'EOF'
API_BASE_URL=http://100.72.101.29:3010
EOF
```

### Paso 4: Correr en desarrollo
```bash
npm run dev
```

**Abrí en tu navegador:** `http://localhost:3012`
**Login:** `pcostarotela@gmail.com` / `Pablo2024!`

---

## Flujo de trabajo:

1. **Editá código** con VS Code en `~/setubalai-agente/web-admin/`
2. **Los cambios se ven al instante** en el navegador (hot reload)
3. **Iterá gratis** hasta que funcione perfecto
4. **Subí los cambios al VPS** cuando esté listo:

```bash
# Comprimir cambios locales
cd ~
tar -czf web-admin-update.tar.gz setubalai-agente/web-admin/

# Subir al VPS
scp web-admin-update.tar.gz admin@100.72.101.29:/home/admin/

# SSH al VPS para reiniciar
ssh admin@100.72.101.29 << 'ENDSSH'
cd /home/admin
tar -xzf web-admin-update.tar.gz
cd setubalai-agente/web-admin
rm -rf .next && npm run build
systemctl --user restart setubalai-admin
ENDSSH
```

---

## Para la clínica (web/):

El mismo flujo pero cambiando directorios:
```bash
cd ~/setubalai-agente/web
npm install
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://100.72.101.29:3010
EOF
npm run dev
```
