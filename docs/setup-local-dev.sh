#!/bin/bash
# ======================================================
# SETUP DESARROLLO LOCAL - SetubalAI
# Ejecutar esto en tu PC (NO en el VPS)
# Requiere: Node.js 18+, Tailscale conectado
# ======================================================

set -e

echo "🚀 Setup desarrollo local SetubalAI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Descargar código del VPS
echo ""
echo "📥 Descargando código del VPS..."
cd ~
ssh admin@100.72.101.29 "cd /home/admin && tar -czf - setubalai-agente/web-admin/" | tar -xzf -
echo "✅ Código descargado en ~/setubalai-agente/web-admin/"

# 2. Instalar dependencias
echo ""
echo "📦 Instalando dependencias de Node.js..."
cd ~/setubalai-agente/web-admin
npm install
echo "✅ Dependencias instaladas"

# 3. Configurar .env.local
echo ""
echo "⚙️ Configurando variables de entorno..."
cat > .env.local << 'EOF'
# Apunta al backend del VPS via Tailscale
API_BASE_URL=http://100.72.101.29:3010
EOF
echo "✅ .env.local creado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup completo!"
echo ""
echo "Para correr en desarrollo:"
echo "  cd ~/setubalai-agente/web-admin"
echo "  npm run dev"
echo ""
echo "Abrí en tu navegador: http://localhost:3012"
echo "Login: pcostarotela@gmail.com / Pablo2024!"
