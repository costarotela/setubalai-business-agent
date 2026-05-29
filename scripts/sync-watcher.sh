#!/bin/bash
# SetubalAI Auto-Sync Watcher - Detecta cambios en codigo y rebuilda automaticamente
# Se ejecuta como un servicio systemd persistente.
# Evita la desincronizacion: si editas src/ --> rebuild + restart automatico

BASE_DIR="/home/admin/setubalai-agente"
LOG_DIR="$BASE_DIR/logs"
DEPLOY_SCRIPT="$BASE_DIR/scripts/deploy.sh"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOG_DIR/sync-watcher.log"
}

# Verificar que inotifywait esta disponible
if ! command -v inotifywait >/dev/null 2>&1; then
    log "inotifywait no esta instalado. Instalar: sudo apt install inotify-tools"
    exit 1
fi

log "Auto-Sync Watcher iniciado"
log "   Monitorea: web/src/ web-admin/src/ services/api/"
log "   Accion: rebuild + restart automatico"
log ""

# Funcion reemplaza el array approach - armamos un string
WATCH_LIST=""

add_watch() {
    local p="$1"
    if [ -d "$p" ]; then
        WATCH_LIST="$WATCH_LIST -r $p"
    elif [ -f "$p" ]; then
        WATCH_LIST="$WATCH_LIST $p"
    else
        log "  No existe: $p"
    fi
}

add_watch "$BASE_DIR/web/src"
add_watch "$BASE_DIR/web/public"
add_watch "$BASE_DIR/web/next.config.ts"
add_watch "$BASE_DIR/web-admin/src"
add_watch "$BASE_DIR/web-admin/public"
add_watch "$BASE_DIR/web-admin/next.config.ts"
add_watch "$BASE_DIR/services/api"

log "Watching paths listos"

DEBOUNCE_SECONDS=5

while true; do
    changed=$(eval inotifywait -q -e modify,create,delete,move $WATCH_LIST 2>/dev/null) || true
    
    if [ -n "$changed" ]; then
        log "Cambio detectado: $changed"
        log "Esperando ${DEBOUNCE_SECONDS}s para debounce..."
        sleep "$DEBOUNCE_SECONDS"
        
        WEB_CHANGED=false
        ADMIN_CHANGED=false
        API_CHANGED=false
        
        if echo "$changed" | grep -q "web/src\|web/public\|web/next.config"; then
            WEB_CHANGED=true
        fi
        if echo "$changed" | grep -q "web-admin/src\|web-admin/public\|web-admin/next.config"; then
            ADMIN_CHANGED=true
        fi
        if echo "$changed" | grep -q "services/api"; then
            API_CHANGED=true
        fi
        
        if [ "$API_CHANGED" = true ]; then
            log "Deploying API..."
            bash "$DEPLOY_SCRIPT" api 2>&1 | tee -a "$LOG_DIR/sync-watcher.log" || log "API deploy fallo"
        fi
        if [ "$WEB_CHANGED" = true ]; then
            log "Deploying Web..."
            bash "$DEPLOY_SCRIPT" web 2>&1 | tee -a "$LOG_DIR/sync-watcher.log" || log "Web deploy fallo"
        fi
        if [ "$ADMIN_CHANGED" = true ]; then
            log "Deploying Admin..."
            bash "$DEPLOY_SCRIPT" admin 2>&1 | tee -a "$LOG_DIR/sync-watcher.log" || log "Admin deploy fallo"
        fi
        
        log "Deploy automatico completado"
        log ""
    fi
done
