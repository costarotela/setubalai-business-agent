#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo " SetubalAI Business Agent — Instalador"
echo "========================================"
echo ""

# Verificar Docker
if ! command -v docker &>/dev/null; then
    echo "❌ Docker no instalado. Ejecuta: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
    echo "❌ Docker Compose no disponible."
    exit 1
fi

echo "✓ Docker $(docker --version)"
echo "✓ Docker Compose disponible"
echo ""

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "⚠️ No se encontró .env. Creando desde plantilla..."
    cp .env.example .env 2>/dev/null || echo "DATABASE_URL=postgresql://paperclip:setubalai2024@localhost:5432/business" > .env
    echo "  Editá .env con tus configuraciones"
    echo ""
fi

# Crear directorios
mkdir -p data logs

# Construir y levantar
echo "🔨 Construyendo imágenes..."
docker compose build --quiet 2>/dev/null || true

echo "🚀 Levantando servicios..."
docker compose up -d

echo ""
echo "========================================"
echo " ✅ Instalación completa!"
echo "========================================"
echo ""
echo "Servicios corriendo:"
echo "  📡 API Backend     → http://localhost:3010"
echo "  🌐 Web App         → http://localhost:3011"
echo "  🗄️  PostgreSQL       → localhost:5433"
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f        # ver logs"
echo "  docker compose down           # detener"
echo "  docker compose restart        # reiniciar"
echo ""
echo "Para acceder al dashboard: http://localhost:3011"
echo "========================================"
