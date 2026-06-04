#!/bin/bash
# ============================================================================
# DIAGNOSE.SH — SetubalAI Pre-Change System Diagnosis
# Ejecutar ANTES de tocar cualquier cosa en el VPS
# Da VISIÓN TOTAL: puertos, procesos, Docker, logs, cloudflare
# ============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'

section() { echo -e "\n${MAGENTA}═══ $1 ═══${NC}"; }

# ── HEADER ──
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║    SETUBALAI SYSTEM DIAGNOSIS — $(date '+%H:%M %Y-%m-%d')    ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# ── 1. PUERTOS PRINCIPALES ──
section "1. PUERTOS DEL SISTEMA"
echo "  [PUERTO]  [SERVICIO]           [PID]"
for line in $(ss -tlnp 2>/dev/null | grep -E ':(3010|3012|3013|3015|3016|9991|9992|9993|3001|3002|5432|8877|8888|9119|9999|8081|7777|7778|80|443) ' | sort -t: -k2 -n); do
    :
done
echo ""
echo "  Puertos SetubalAI:"
ss -tlnp 2>/dev/null | grep -E ':(3010|3012|3013|3015|3016|9991|9992|9993|8877) ' | while read -r line; do
    PORT=$(echo "$line" | grep -oP ':\d+' | head -1 | tr -d ':')
    PID=$(echo "$line" | grep -oP 'pid=\K\d+' | head -1)
    PROC=$(echo "$line" | grep -oP '"\K[^"]+' | head -1)
    ADDR=$(echo "$line" | awk '{print $4}' | cut -d: -f1-2)
    printf "  %-8s %-24s PID %s (%s)\n" ":$PORT" "$PROC" "$PID" "$ADDR"
done

echo ""
echo "  Puertos Infraestructura:"
ss -tlnp 2>/dev/null | grep -E ':(5432|8888|80|443|9000|5050) ' | while read -r line; do
    PORT=$(echo "$line" | grep -oP ':\d+' | head -1 | tr -d ':')
    PROC=$(echo "$line" | grep -oP '"\K[^"]+' | head -1)
    ADDR=$(echo "$line" | awk '{print $4}')
    printf "  %-8s %-24s %s\n" ":$PORT" "$PROC" "$ADDR"
done

# ── 2. DOCKER CONTAINERS ──
section "2. DOCKER CONTAINERS"
docker ps --format '  %-25s %-55s %s' "table {{.Names}}\t{{.Ports}}\t{{.Status}}" 2>/dev/null || echo "  ⚠️ Docker no disponible"

# ── 3. RAM DISK ──
section "3. DISK Y MEMORIA"
echo "  Disk usage:"
df -h / /mnt 2>/dev/null | grep -v Filesystem | while read -r line; do
    echo "  $line"
done
echo ""
echo "  Memory:"
free -h | grep -E 'Mem|Swap' | while read -r line; do
    echo "  $line"
done

# ── 4. PROCESOS KEY ──
section "4. PROCESOS CLAVE"
echo "  next-server:"
pgrep -a "next-server" 2>/dev/null | while read -r pid cmd; do
    PORT=$(ss -tlnp 2>/dev/null | grep "pid=$pid" | grep -oP ':\d+' | head -1)
    echo "    PID $pid → $cmd"
    echo "    → Escuchando en: $PORT"
done
echo ""
echo "  Python FastAPI:"
pgrep -af "uvicorn\|fastapi" 2>/dev/null | grep -v grep | while read -r line; do
    echo "    $line"
done
echo ""
echo "  Hermes Agent:"
H_COUNT=$(pgrep -c hermes 2>/dev/null || echo 0)
H_COUNT=$(echo "$H_COUNT" | head -1 | tr -d '[:space:]')
[ "$H_COUNT" -eq 0 ] && echo "    ✅ Ningún proceso hermes" || echo "    ⚠️  $H_COUNT procesos hermes:"
pgrep -a hermes 2>/dev/null | while read -r line; do
    echo "    → $line"
done

# ── 5. SERVICIOS SYSTEMD ──
section "5. SERVICIOS SYSTEMD"
echo "  User services:"
systemctl --user list-units --type=service --no-pager 2>/dev/null | grep -E '(loaded|ACTIVE)' | grep -v device | head -15
echo ""
echo "  Failed services:"
FAIL_LIST=$(systemctl --user list-units --state=failed --no-pager 2>/dev/null | grep -E 'failed\b')
[ -z "$FAIL_LIST" ] && echo "    ✅ Ninguno" || echo "    ❌ $FAIL_LIST"

# ── 6. LOGS RECIENTES ──
section "6. LOGS RECIENTES (últimos 5 errores)"
echo "  FastAPI (:3010):"
tail -20 /tmp/api.log 2>/dev/null | grep -iE 'error|exception|traceback|fail' | tail -5 || echo "    (sin archivo de log)"
echo ""
echo "  Dev Clínica (:3013):"
# Buscar logs de Next en stdout del proceso
NEXT_PID=$(pgrep -f "next-server" | head -1)
if [ -n "$NEXT_PID" ]; then
    ls -la /proc/$NEXT_PID/fd/ 2>/dev/null | grep -i log | head -3 || echo "    (logs en systemd/journal)"
fi
journalctl --user -u "setubalai*" --since "1 hour ago" --no-pager 2>/dev/null | grep -iE 'error|fail' | tail -5 || echo "    (sin logs systemd)"

# ── 7. CLOUDFLARE TUNNEL ──
section "7. CLOUDFLARE TUNNEL"
CF_PID=$(pgrep cloudflared 2>/dev/null)
if [ -n "$CF_PID" ]; then
    echo "  ✅ cloudflared running — PID $CF_PID"
    # Intentar obtener el estado
    curl -s http://localhost:20241/metrics 2>/dev/null | grep -i "connected\|tunnel" | head -3 || echo "  → métricas no disponibles"
else
    echo "  ❌ cloudflared NO está corriendo"
fi
echo ""
echo "  Conectividad dev.setubalai.org:"
CF_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://dev.setubalai.org/ 2>/dev/null)
[ "$CF_CODE" = "200" ] && echo "  ✅ HTTP $CF_CODE" || echo "  ❌ HTTP $CF_CODE"
echo ""
echo "  Conectividad dev.setubalai.org → localhost:3013:"
DEV_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/ 2>/dev/null)
[ "$DEV_CODE" = "200" ] && echo "  ✅ Dev server responde: HTTP $DEV_CODE" || echo "  ❌ Dev server NO responde: HTTP $DEV_CODE"

# ── 8. GIT STATUS ──
section "8. GIT REPO"
if [ -f /home/admin/setubalai-agente/.git/HEAD ]; then
    cd /home/admin/setubalai-agente
    BRANCH=$(git branch --show-current 2>/dev/null)
    STATUS=$(git status --porcelain 2>/dev/null | wc -l)
    LAST_COMMIT=$(git log --oneline -1 2>/dev/null | cut -d' ' -f1-5)
    echo "  📍 Branch: $BRANCH"
    echo "  📝 Archivos modificados: $STATUS"
    echo "  🔨 Último commit: $LAST_COMMIT"
    if [ "$BRANCH" = "main" ]; then
        echo -e "  ${YELLOW}  ⚠️  Estás en main — crear rama antes de tocar código${NC}"
    else
        echo "  ✅ En rama de trabajo"
    fi
else
    echo "  ⚠️ No es un repo git"
fi

# ── 9. API QUICK CHECK ──
section "9. API QUICK CHECK"
echo "  Backend (:3010):"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/docs 2>/dev/null)
[ "$API_CODE" = "200" ] && echo "  ✅ API docs: HTTP $API_CODE" || echo "  ❌ API docs: HTTP $API_CODE"

echo "  Auth login:"
LOGIN=$(curl -s -X POST "http://localhost:3010/auth/login" \
    -d "username=admin@centromedicosantaclara.com.ar&password=Pablo2024!" 2>/dev/null)
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.loads(sys.stdin.read()).get('access_token',''))" 2>/dev/null)
if [ -n "$TOKEN" ]; then
    echo "  ✅ Login OK"
else
    DETAIL=$(echo "$LOGIN" | python3 -c "import sys,json;d=json.loads(sys.stdin.read());print(d.get('detail','error'))" 2>/dev/null)
    echo "  ❌ Login falló: $DETAIL"
fi

# ── 10. DB QUICK COUNT ──
section "10. DB QUICK COUNT (empresa_id=16)"
quick_count() {
    local tbl="$1"
    local cnt
    cnt=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(*) FROM setubalai.${tbl} WHERE empresa_id=16;" 2>/dev/null | tr -d ' \n')
    printf "  %-30s %s registros\n" "$tbl" "${cnt:-ERR}"
}
for tbl in "empresa" "especialidades_medicas" "medicos" "obras_sociales" "nomenclador_practicas" "visitas" "pacientes"; do
    quick_count "$tbl"
done

# ── FOOTER ──
section "RESUMEN DE ACCIÓN"
echo "  1. Revisar arriba — ¿algo rojo/❌ antes de tocar?"
echo "  2. Si algo está roto → arreglar PRIMERO"
echo "  3. Si todo OK → hacer 1 cambio"
echo "  4. Validar con: bash /home/admin/setubalai-agente/scripts/validate.sh"
echo "  5. NUNCA decir 'listo' sin validate.sh → PASS"
echo ""
echo "═══════════════════════════════════════════════════════"
