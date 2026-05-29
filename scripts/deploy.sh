#!/bin/bash
# SetubalAI Deploy Script — Sincroniza DB + código + build + servicios en un paso
# Uso: ./deploy.sh [web|admin|all|api|clinic-db]
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_DIR="/home/admin/setubalai-agente"
LOG_FILE="/home/admin/setubalai-agente/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ✗ ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

check_service() {
    local svc=$1
    if systemctl --user is-active "$svc" &>/dev/null || systemctl is-active "$svc" &>/dev/null; then
        log "✅ $svc: activo"
    else
        warn "$svc: inactivo"
    fi
}

deploy_web() {
    log "=========================================="
    log "🚀 Deploying Web (business.setubalai.org)"
    log "=========================================="
    
    cd "$BASE_DIR/web"
    
    # 1. Eliminar build anterior (CRÍTICO: sino hay chunks viejos/404)
    log "🧹 Limpiando .next/..."
    rm -rf .next
    
    # 2. Rebuild completo
    log "🔨 Compilando Next.js..."
    npx next build 2>&1 | tee -a "$LOG_FILE" || {
        error "Build fallido!"
        return 1
    }
    
    # 3. Verificar que el build exista
    if [ ! -f ".next/BUILD_ID" ]; then
        error "Build no generó BUILD_ID!"
        return 1
    fi
    
    # 4. Reiniciar servicio
    log "🔄 Reiniciando servicio..."
    systemctl --user restart setubalai-web.service
    
    # 5. Esperar que levante
    log "⏳ Esperando 3 segundos..."
    sleep 3
    
    # 6. Verificar
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3011/login 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "✅ Web corriendo en puerto 3011 (HTTP $HTTP_CODE)"
    else
        warn "Web responde con HTTP $HTTP_CODE"
    fi
    
    log "📦 BUILD_ID: $(cat .next/BUILD_ID)"
}

deploy_admin() {
    log "=========================================="
    log "🚀 Deploying Admin (admin.setubalai.org)"
    log "=========================================="
    
    cd "$BASE_DIR/web-admin"
    
    # 1. Eliminar build anterior
    log "🧹 Limpiando .next/..."
    rm -rf .next
    
    # 2. Rebuild completo
    log "🔨 Compilando Next.js..."
    npx next build 2>&1 | tee -a "$LOG_FILE" || {
        error "Build fallido!"
        return 1
    }
    
    # 3. Verificar
    if [ ! -f ".next/BUILD_ID" ]; then
        error "Build no generó BUILD_ID!"
        return 1
    fi
    
    # 4. Reiniciar servicio
    log "🔄 Reiniciando servicio..."
    systemctl --user restart setubalai-admin.service 2>/dev/null || {
        warn "No hay setubalai-admin.service, verificando..."
        systemctl --user list-units | grep admin || true
    }
    
    sleep 3
    
    log "📦 BUILD_ID: $(cat .next/BUILD_ID)"
}

deploy_api() {
    log "=========================================="
    log "🚀 Deploying API Backend"
    log "=========================================="
    
    cd "$BASE_DIR/services/api"
    
    log "🔄 Reiniciando API..."
    systemctl --user restart setubalai-api.service
    
    sleep 2
    
    # Verificar API
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/docs 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "✅ API corriendo en puerto 3010 (HTTP $HTTP_CODE)"
    else
        warn "API responde con HTTP $HTTP_CODE"
    fi
}

deploy_clinic_db() {
    log "=========================================="
    log "🚀 Deploying Clinic DB Explorer"
    log "=========================================="
    
    systemctl --user restart setubalai-db-explorer.service
    sleep 2
    
    # Verificar
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9992/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "✅ DB Explorer corriendo en puerto 9992"
    else
        warn "DB Explorer responde con HTTP $HTTP_CODE"
    fi
}

status_all() {
    log "=========================================="
    log "📊 Estado de todos los servicios SetubalAI"
    log "=========================================="
    
    check_service "setubalai-api.service"
    check_service "setubalai-web.service"
    check_service "setubalai-landing.service"
    check_service "setubalai-clinic-bot.service"
    check_service "setubalai-infrastructure.service"
    check_service "setubalai-db-explorer.service"
    check_service "setubalai-admin.service" 2>/dev/null
    
    log ""
    log "📦 Build timestamps:"
    if [ -f "$BASE_DIR/web/.next/BUILD_ID" ]; then
        log "   Web: $(stat -c '%y' $BASE_DIR/web/.next/BUILD_ID | cut -d. -f1)"
    else
        warn "   Web: SIN BUILD"
    fi
    if [ -f "$BASE_DIR/web-admin/.next/BUILD_ID" ]; then
        log "   Admin: $(stat -c '%y' $BASE_DIR/web-admin/.next/BUILD_ID | cut -d. -f1)"
    else
        warn "   Admin: SIN BUILD"
    fi
}

# ===================== MAIN =====================

mkdir -p "$BASE_DIR/logs"

case "${1:-all}" in
    web)
        deploy_web
        ;;
    admin)
        deploy_admin
        ;;
    api)
        deploy_api
        ;;
    clinic-db|db)
        deploy_clinic_db
        ;;
    all)
        deploy_api
        deploy_web
        deploy_admin
        deploy_clinic_db
        status_all
        ;;
    status)
        status_all
        ;;
    *)
        echo -e "Uso: $0 ${GREEN}[web|admin|api|clinic-db|all|status]${NC}"
        echo ""
        echo "  web       → Deploy frontend business (port 3011)"
        echo "  admin     → Deploy frontend admin (port 3012)"
        echo "  api       → Restart API backend (port 3010)"
        echo "  clinic-db → Restart DB Explorer (port 9992)"
        echo "  all       → Deploy TODO + verificar"
        echo "  status    → Solo mostrar estado sin deployar"
        exit 1
        ;;
esac

log ""
log "📋 Deploy log: $LOG_FILE"
