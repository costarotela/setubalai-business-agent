#!/bin/bash
# ============================================================================
# VALIDATE.SH — SetubalAI Post-Change Validator
# Ejecutar DESPUÉS de cada cambio en el VPS, ANTES de decir "listo"
# Verifica servicios, endpoints, auth, DB, frontend — resumen PASS/FAIL/WARN
# ============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

pass() { echo -e "  ${GREEN}✅ PASS${NC} $1"; [ -n "$2" ] && echo -e "     ${BLUE}   $2${NC}"; ((PASS++)); }
fail() { echo -e "  ${RED}❌ FAIL${NC} $1"; [ -n "$2" ] && echo -e "     ${RED}   $2${NC}"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}⚠️  WARN${NC} $1"; [ -n "$2" ] && echo -e "     ${YELLOW}   $2${NC}"; ((WARN++)); }
count_items() {
    local FILE="$1"
    python3 -c '
import json, sys
try:
    with open(sys.argv[1]) as f:
        d = json.load(f)
    if isinstance(d, list):
        print(len(d))
    elif isinstance(d, dict):
        for key in ["obras_sociales","especialidades","items","medicos","pacientes","turnos","grillas","bloqueos","productos","categorias"]:
            if key in d and isinstance(d[key], list):
                print(len(d[key]))
                sys.exit(0)
        if "total" in d and isinstance(d["total"], int):
            print(d["total"])
            sys.exit(0)
        vals = [v for v in d.values() if isinstance(v, list)]
        if vals:
            print(len(vals[0]))
        else:
            print(0)
    else:
        print("ERR")
except Exception:
    print("ERR")
' "$FILE"
}

echo "═══════════════════════════════════════════════════════"
echo -e "  SETUBALAI VALIDATOR — $(date '+%H:%M %Y-%m-%d')"
echo "═══════════════════════════════════════════════════════"

# ── FASE 1: PUERTOS Y SERVICIOS ──
echo ""
echo -e "${BLUE}── PUERTOS PRINCIPALES ──${NC}"

for port_name in "Backend API:3010" "Web Admin:3012" "Dev Clinica:3013" "DB Explorer:9991" "SearxNG:8888"; do
    port=$(echo "$port_name" | cut -d: -f2)
    name=$(echo "$port_name" | cut -d: -f1)
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
        PID=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K\d+' | head -1)
        pass "${name} (:${port})" "PID ${PID:-?}"
    else
        fail "${name} (:${port})" "no escucha"
    fi
done

# ── FASE 2: DOCKER CONTAINERS ──
echo ""
echo -e "${BLUE}── DOCKER CONTAINERS ──${NC}"

for container in "paperclip-db" "web-clinica-dev" "portainer"; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
        pass "Docker: $container" "running"
    else
        [ -z "$STATUS" ] && fail "Docker: $container" "no existe" || fail "Docker: $container" "$STATUS"
    fi
done

# ── FASE 3: ENDPOINTS CRÍTICOS ──
echo ""
echo -e "${BLUE}── ENDPOINTS CRÍTICOS ──${NC}"

API_DOCS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/docs 2>/dev/null)
[ "$API_DOCS" = "200" ] && pass "API docs (:3010/docs)" "HTTP $API_DOCS" || fail "API docs (:3010/docs)" "HTTP $API_DOCS"

DEV_ROOT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/ 2>/dev/null)
[ "$DEV_ROOT" = "200" ] && pass "Dev server (:3013/)" "HTTP $DEV_ROOT" || fail "Dev server (:3013/)" "HTTP $DEV_ROOT"

DEV_DASH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/dashboard 2>/dev/null)
[ "$DEV_DASH" = "200" ] && pass "Dev dashboard (/dashboard)" "HTTP $DEV_DASH" || warn "Dev dashboard (/dashboard)" "HTTP $DEV_DASH"

CF_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://dev.setubalai.org/ 2>/dev/null)
[ "$CF_CODE" = "200" ] && pass "Cloudflare (dev.setubalai.org)" "HTTP $CF_CODE" || fail "Cloudflare (dev.setubalai.org)" "HTTP $CF_CODE"

# ── FASE 4: AUTENTICACIÓN ──
echo ""
echo -e "${BLUE}── AUTENTICACIÓN ──${NC}"

LOGIN=$(curl -s -X POST "http://localhost:3010/auth/login" \
    -d "username=admin@centromedicosantaclara.com.ar&password=Pablo2024!" 2>/dev/null)

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.loads(sys.stdin.read()).get('access_token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    pass "Login clinic admin" "token obtenido"
    EID=$(python3 -c "import jwt;print(jwt.decode('$TOKEN',options={'verify_signature':False}).get('empresa_id','?'))")
    [ "$EID" = "16" ] && pass "Token empresa_id=16" || fail "Token empresa_id" "got $EID"
else
    DETAIL=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.loads(sys.stdin.read()).get('detail','parse error'))" 2>/dev/null)
    fail "Login clinic admin" "$DETAIL"
    echo -e "  ${YELLOW}  Fix: cd services/api && ./venv/bin/python3 scripts/seed_datos_prueba.py ${NC}"
fi

# ── FASE 5: ENDPOINTS CON AUTH ──
echo ""
echo -e "${BLUE}── ENDPOINTS CON AUTH ──${NC}"

if [ -n "$TOKEN" ]; then
    AUTH_HDR="Authorization: Bearer $TOKEN"
    TMPFILE=$(mktemp /tmp/val_XXXXXX.json)

    check_ep() {
        local name="$1" ep="$2" min="$3"
        curl -s -o "$TMPFILE" "$ep" -H "$AUTH_HDR" 2>/dev/null
        COUNT=$(count_items "$TMPFILE")
        if [ "$COUNT" = "ERR" ] || { [ "$COUNT" = "0" ] && [ "$min" -gt 0 ]; }; then
            fail "$name" "got $COUNT (min $min)"
        elif [ "$COUNT" -ge "$min" ] 2>/dev/null; then
            pass "$name" "$COUNT registros"
        else
            fail "$name" "$COUNT < $min"
        fi
    }

    check_ep "especialidades" "http://localhost:3010/especialidades/" 1
    check_ep "medicos" "http://localhost:3010/medicos/" 1
    check_ep "obras_sociales" "http://localhost:3010/obras-sociales/" 1
    check_ep "turnos" "http://localhost:3010/turnos/" 0
    check_ep "pacientes" "http://localhost:3010/pacientes/" 1
    check_ep "grillas" "http://localhost:3010/configuracion-agenda/grillas-medicas/" 1

    rm -f "$TMPFILE"
else
    echo -e "  ${CYAN}  ⏭️  Saltando endpoints con auth — sin token${NC}"
fi

# ── FASE 6: DB INTEGRITY ──
echo ""
echo -e "${BLUE}── DB INTEGRITY ──${NC}"

check_db() {
    local name="$1" query="$2" min="$3"
    RESULT=$(docker exec paperclip-db psql -U paperclip -d business -t -c "$query" 2>/dev/null | tr -d ' \n')
    if [ -z "$RESULT" ]; then
        fail "DB: $name" "sin respuesta"
    elif [ -z "$min" ]; then
        pass "DB: $name" "$RESULT"
    elif [ "$RESULT" -ge "$min" ] 2>/dev/null; then
        pass "DB: $name" "$RESULT"
    else
        warn "DB: $name" "$RESULT (mínimo esperable: $min)"
    fi
}

check_db "tablas totales" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='setubalai';" 25
check_db "especialidades_med" "SELECT COUNT(*) FROM setubalai.especialidades_medicas WHERE empresa_id=16;" 1
check_db "medicos" "SELECT COUNT(*) FROM setubalai.medicos WHERE empresa_id=16;" 1
check_db "obras_sociales" "SELECT COUNT(*) FROM setubalai.obras_sociales WHERE empresa_id=16;" 1
check_db "pacientes" "SELECT COUNT(*) FROM setubalai.pacientes WHERE empresa_id=16;" 1
check_db "visitas_turnos" "SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id=16;"

# ── FASE 7: PROCESOS ZOMBIE ──
echo ""
echo -e "${BLUE}── PROCESOS ZOMBIE ──${NC}"

HERMES_COUNT=$(pgrep -c hermes 2>/dev/null || echo 0)
HERMES_COUNT=$(echo "$HERMES_COUNT" | head -1 | tr -d '[:space:]')
[ "$HERMES_COUNT" -eq 0 ] && pass "No procesos hermes zombie" || warn "Procesos hermes" "$HERMES_COUNT activos"

NEXT_COUNT=$(pgrep -c "next-server" 2>/dev/null || echo 0)
NEXT_COUNT=$(echo "$NEXT_COUNT" | head -1 | tr -d '[:space:]')
echo -e "${CYAN}   next-server: $NEXT_COUNT | nginx: $(pgrep -c nginx 2>/dev/null || echo 0) ${NC}"

# ── RESUMEN ──
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}WARN: $WARN${NC}"
echo "═══════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}⛔ NO DECIR 'LISTO' — $FAIL fallaron${NC}"
    echo -e "${YELLOW}  1. Ejecutar: bash /home/admin/setubalai-agente/scripts/diagnose.sh${NC}"
    echo -e "${YELLOW}  2. Revisar diagnose output${NC}"
    echo -e "${YELLOW}  3. Fix → re-validate → confirmar${NC}"
    exit 1
else
    echo -e "${GREEN}✅ TODO OK — avisar a Pablo${NC}"
    exit 0
fi
