# Desarrollo Local CLÍNICA SetubalAI 🏥

## Para correr la aplicación de CLÍNICA en tu PC (NO el panel maestro):

### Paso 1: Descargar código del VPS a tu PC
```bash
cd ~
ssh admin@100.72.101.29 "cd /home/admin && tar -czf - setubalai-agente/web/" | tar -xzf -
```

### Paso 2: Instalar dependencias
```bash
cd ~/setubalai-agente/web
npm install
```

### Paso 3: Configurar .env.local (conexión al backend del VPS via Tailscale)
```bash
cat > .env.local << 'EOF'
# Apunta al backend del VPS via Tailscale
API_BASE_URL=http://100.72.101.29:3010
NEXT_PUBLIC_API_URL=http://100.72.101.29:3010
EOF
```

### Paso 4: Correr en desarrollo
```bash
npm run dev
```

**Abrí en tu navegador:** `http://localhost:3000`
**Login de clínica:** Usá las credenciales de admin de la empresa configurada

---

## ¿Qué tenés?

- **Menú lateral** con: Pacientes, Médicos, Agenda/Turnos, Historia Clínica, Prácticas, etc.
- **Hot reload** → cada cambio en el código se ve al instante
- **Backend en el VPS** accesible via Tailscale
- **$0 en builds** → desarrollás gratis, subís a VPS solo cuando está perfecto

---

## Flujo de trabajo:

1. **Editá** código en `~/setubalai-agente/web/` con VS Code
2. **Vedé** los cambios al instante en `http://localhost:3000`
3. **Iterá** sin límite hasta que funcione
4. **Subí** al VPS cuando esté listo:

```bash
# Comprimir cambios
cd ~
tar -czf web-clinica-update.tar.gz setubalai-agente/web/

# Subir al VPS
scp web-clinica-update.tar.gz admin@100.72.101.29:/home/admin/

# SSH al VPS, build y reinicio
ssh admin@100.72.101.29 << 'ENDSSH'
cd /home/admin
tar -xzf web-clinica-update.tar.gz
cd setubalai-agente/web
rm -rf .next && npm run build
systemctl --user restart setubalai-web
ENDSSH
```
