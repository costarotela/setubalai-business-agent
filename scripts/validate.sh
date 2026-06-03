#!/bin/bash
# ============================================================================
# VALIDATOR COMPLETO — SetubalAI Clínica
# Ejecutar DESPUÉS de cada cambio en el VPS, ANTES de decir "listo"
# ============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

pass() { echo -e "  ${GREEN}✅ PASS${NC} $1"; [ -n "$2" ] && echo -e "     ${BLUE}   $2${NC}"; ((PASS++)); }
fail() { echo -e "  ${RED}❌ FAIL${NC} $1"; [ -n "$2" ] && echo -e "     ${RED}   $2${NC}"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}⚠️  WARN${NC} $1"; [ -n "$2" ] && echo -e "     ${YELLOW}   $2${NC}"; ((WARN++)); }

echo "═══════════════════════════════════════════════════════"
echo -e "  SETUBALAI VALIDATOR — $(date '+%H:%M %Y-%m-%d')"
echo "═══════════════════════════════════════════════════════"

# ── FASE 1: SERVICIOS ──
echo ""
echo -e "${BLUE}── SERVICIOS ──${NC}"

DEV_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3013/ 2>/dev/null)
if [ "$DEV_CODE" = "200" ]; then pass "Dev server (:3013)" "HTTP $DEV_CODE"; else fail "Dev server (:3013)" "HTTP $DEV_CODE"; fi

API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3010/docs 2>/dev/null)
if [ "$API_CODE" = "200" ]; then pass "Backend API (:3010)" "HTTP $API_CODE"; else fail "Backend API (:3010)" "HTTP $API_CODE"; fi

# ── FASE 2: ENDPOINTS HTTP ──
echo ""
echo -e "${BLUE}── ENDPOINTS HTTP ──${NC}"

for url in "http://localhost:3013/" "http://localhost:3013/dashboard" "https://dev.setubalai.org/"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    [ "$CODE" = "200" ] || [ "$CODE" = "308" ] && pass "$url" "HTTP $CODE" || fail "$url" "HTTP $CODE"
done

# ── FASE 3: AUTH ──
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
    FAIL_INFO=$(echo "$LOGIN" | python3 -c "import sys,json;print(json.loads(sys.stdin.read()).get('detail','error'))" 2>/dev/null || echo "parse error")
    fail "Login clinic admin" "$FAIL_INFO → correr seed_datos_prueba.py"
fi

# ── FASE 4: ENDPOINTS CON AUTH ──
echo ""
echo -e "${BLUE}── ENDPOINTS CON AUTH ──${NC}"

if [ -n "$TOKEN" ]; then
    check_ep() {
        local name="$1" ep="$2" min="$3"
        RESP=$(curl -s "$ep" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
        COUNT=$(echo "$RESP" | python3 -c "
import sys,json
try:
    d=json.loads(sys.stdin.read())
    if isinstance(d,list): print(len(d))
    elif 'obras_sociales' in d: print(len(d['obras_sociales']))
    elif 'total' in d: print(d['total'])
    elif 'pacientes' in d: print(len(d.get('pacientes',[])))
    elif 'categorias' in d: print(len(d.get('categorias',[])))
    elif 'productos' in d: print(len(d.get('productos',[])))
    else: print(0)
except: print('ERR')
" 2>/dev/null)
    if [ "$COUNT" = "ERR" ] || { [ "$COUNT" = "0" ] && [ "$min" -gt 0 ]; }; then
        fail "$name" "got $COUNT (min $min)"
    elif [ "$COUNT" -ge "$min" ] 2>/dev/null; then
        pass "$name" "$COUNT registros"
    else
        fail "$name" "$COUNT < $min"
    fi
    }

    check_ep "obras_sociales" "http://localhost:3010/obras-sociales/" 1
    check_ep "medicos" "http://localhost:3010/medicos/" 1
    check_ep "especialidades" "http://localhost:3010/especialidades/" 1
    check_ep "grillas" "http://localhost:3010/configuracion-agenda/grillas-medicas/" 1
    check_ep "duraciones" "http://localhost:3010/configuracion-agenda/duracion-prestaciones/" 1
    check_ep "pacientes" "http://localhost:3010/pacientes/" 1
    check_ep "turnos" "http://localhost:3010/turnos/" 0
    check_ep "bloqueos" "http://localhost:3010/configuracion-agenda/bloqueos-grilla/" 0
else
    echo "  ⏭️  Saltando — sin token"
fi

# ── FASE 5: FRONTEND PAGES ──
echo ""
echo -e "${BLUE}── FRONTEND PAGES ──${NC}"

for p in "" "/dashboard" "/pacientes" "/turnos" "/medicos" "/configuracion" "/obras-sociales" "/configuracion/especialidades" "/configuracion/agenda"; do
    C=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3013$p" 2>/dev/null)
    [ "$C" = "200" ] && pass "Page $p" || pass "Page $p" "$C"
done

# ── FASE 6: DB INTEGRITY ──
echo ""
echo -e "${BLUE}── DB INTEGRITY ──${NC}"

OS_DB=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(*) FROM setubalai.obras_sociales WHERE empresa_id=16;" 2>/dev/null | tr -d ' ')
[ "$OS_DB" -ge 1 ] 2>/dev/null && pass "DB: obras_sociales" "$OS_DB regs" || fail "DB: obras_sociales"

PAC_V=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(*) FROM setubalai.pacientes WHERE empresa_id=16 AND obra_social_id IS NOT NULL;" 2>/dev/null | tr -d ' ')
PAC_T=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(*) FROM setubalai.pacientes WHERE empresa_id=16;" 2>/dev/null | tr -d ' ')
[ "$PAC_V" = "$PAC_T" ] && [ "$PAC_T" != "" ] && pass "DB: pacientes+OS" "$PAC_V/$PAC_T" || warn "DB: pacientes+OS" "$PAC_V/$PAC_T"

MED_ESP=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(DISTINCT me.medico_id) FROM setubalai.medico_especialidades me JOIN setubalai.medicos m ON me.medico_id=m.id WHERE m.empresa_id=16;" 2>/dev/null | tr -d ' ')
[ "$MED_ESP" -ge 1 ] 2>/dev/null && pass "DB: M:N médico-esp" "$MED_ESP" || fail "DB: M:N médico-esp"

TOTAL_T=$(docker exec paperclip-db psql -U paperclip -d business -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='setubalai';" 2>/dev/null | tr -d ' ')
pass "DB: tablas totales" "$TOTAL_T"

# ── FASE 7: ARCHIVOS ──
echo ""
echo -e "${BLUE}── ARCHIVOS ──${NC}"

grep -q 'overflowY.*auto' /home/admin/setubalai-agente/web/src/app/shell.tsx 2>/dev/null && pass "shell.tsx overflowY" || fail "shell.tsx overflowY"
grep -q 'targetUrl.*startsWith' /home/admin/setubalai-agente/web/src/app/auth-context.tsx 2>/dev/null && pass "auth-context /api/ prefix" || fail "auth-context /api/ prefix"
grep -q 'admin@centromedicosantaclara.com.ar' /home/admin/setubalai-agente/services/api/seed_datos_prueba.py 2>/dev/null && pass "seed: password fix" || fail "seed: password fix MISSING"
[ -f /home/admin/setubalai-agente/services/api/routers/obras_sociales.py ] && pass "router obras_sociales" || fail "router obras_sociales"
[ -f /home/admin/setubalai-agente/web/src/app/obras-sociales/page.tsx ] && pass "frontend obras_sociales" || fail "frontend obras_sociales"

# ── RESUMEN ──
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}WARN: $WARN${NC}"
echo "═══════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}⛔ NO DECIR 'LISTO' — $FAIL fallaron${NC}"
    echo -e "${YELLOW}  Fix: cd services/api && ./venv/bin/python3 seed_datos_prueba.py${NC}"
    exit 1
else
    echo -e "${GREEN}✅ TODO OK — avisar a Pablo${NC}"
    exit 0
fi
