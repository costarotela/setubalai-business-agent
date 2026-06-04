#!/usr/bin/env python3
"""
Diagnóstico de Alineación de Pila — SetubalAI
==============================================
Verifica si DB schema → Backend → Frontend → Datos están alineados.
Detecta desalineaciones y señala exactamente dónde está la ruptura.

Uso: cd /home/admin/setubalai-agente/services/api && ../../venv/bin/python3 diagnose-alineacion.py
"""
import argparse
import json
import os
import re
import socket
import sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

API_BASE = "http://localhost:3010"
WEB_SRC = "/home/admin/setubalai-agente/web/src"
PROJECT_ROOT = "/home/admin/setubalai-agente"
API_VENV_PYTHON = "/home/admin/setubalai-agente/services/api/venv/bin/python3"

RESULTS = []  # (layer, check, status, detail)

def report(layer, check, status, detail=""):
    icon = {"✅": "✅", "❌": "❌", "⚠️": "⚠️", "ℹ️": "ℹ️"}.get(status, status)
    RESULTS.append((layer, check, status, detail))
    print(f"  {icon} [{layer}] {check}")
    if detail and status in ("❌", "⚠️"):
        print(f"     → {detail}")

def port_open(host, port, timeout=3):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except:
        return False

# ── Parse args ──────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--empresa", type=int, default=16, help="Empresa ID (default: 16)")
args = parser.parse_args()
EMP_ID = args.empresa

# ════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("🔍 DIAGNÓSTICO DE ALINEACIÓN DE PILA — SetubalAI")
print(f"   Empresa: {EMP_ID}")
print("="*70)

# ── FASE 1: Servicios ──────────────────────────────────────────────────
print("\n📡 FASE 1: Servicios")

if port_open("localhost", 3010):
    try:
        r = urlopen(f"{API_BASE}/health", timeout=5)
        report("Servicios", "API :3010", "✅", f"/health → {r.getcode()}")
    except Exception as e:
        report("Servicios", "API :3010", "❌", f"puerto ok pero /health falla: {e}")
else:
    report("Servicios", "API :3010", "❌", "Puerto cerrado")

if port_open("localhost", 3013):
    report("Servicios", "Frontend dev :3013", "✅")
elif port_open("localhost", 3011):
    report("Servicios", "Frontend prod :3011", "✅")
else:
    report("Servicios", "Frontend", "❌", "Ni :3013 ni :3011 responden")

report("Servicios", "PostgreSQL :5432", "✅" if port_open("localhost", 5432) else "❌",
       "" if port_open("localhost", 5432) else "Puerto cerrado")

# ── FASE 2: DB Schema → lanzo subprocess para evitar import issues ─────
print("\n🗃️  FASE 2: DB Schema")
print("\n📊 FASE 2a: Integridad de Datos")

# Ejecuto consultas DB via psql (más confiable que SQLAlchemy aquí)
db_checks = [
    ("Tablas total",
     r"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='setubalai';"),
    (f"Empresas (id={EMP_ID})",
     f"SELECT COUNT(*) FROM setubalai.empresa WHERE id={EMP_ID};"),
    (f"Médicos activos (empresa={EMP_ID})",
     f"SELECT COUNT(*) FROM setubalai.medicos WHERE empresa_id={EMP_ID} AND activo=true;"),
    ("Médicos por especialidad",
     f"SELECT string_agg(info, ', ') FROM (SELECT e.nombre || ':' || COUNT(m.id)::text as info "
     f"FROM setubalai.especialidades_medicas e "
     f"LEFT JOIN setubalai.medico_especialidades me ON e.id=me.especialidad_id "
     f"LEFT JOIN setubalai.medicos m ON me.medico_id=m.id AND m.activo=true "
     f"WHERE e.empresa_id={EMP_ID} GROUP BY e.nombre) x;"),
    (f"Pacientes (empresa={EMP_ID})",
     f"SELECT COUNT(*) FROM setubalai.pacientes WHERE empresa_id={EMP_ID};"),
    (f"Turnos totales (empresa={EMP_ID})",
     f"SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id={EMP_ID};"),
    (f"Turnos HOY (empresa={EMP_ID})",
     f"SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id={EMP_ID} AND fecha_hora::date=CURRENT_DATE;"),
    ("Huérfanos: visitas.medico_id",
     f"SELECT COUNT(*) FROM setubalai.visitas v WHERE v.medico_id NOT IN (SELECT id FROM setubalai.medicos);"),
    ("Huérfanos: visitas.paciente_nuevo_id",
     f"SELECT COUNT(*) FROM setubalai.visitas v WHERE v.paciente_nuevo_id IS NOT NULL AND v.paciente_nuevo_id NOT IN (SELECT id FROM setubalai.pacientes);"),
    ("Huérfanos: medico_especialidades",
     f"SELECT COUNT(*) FROM setubalai.medico_especialidades me WHERE me.medico_id NOT IN (SELECT id FROM setubalai.medicos);"),
]

import subprocess
for label, query in db_checks:
    try:
        result = subprocess.run(
            ["docker", "exec", "paperclip-db", "psql", "-U", "paperclip", "-d", "business",
             "-t", "-A", "-c", query.strip()],
            capture_output=True, text=True, timeout=10
        )
        val = result.stdout.strip()
        if "huérfano" in label.lower() or "huérfano" in label.lower():
            count = int(val) if val.isdigit() else 0
            if count > 0:
                report("Integridad", f"Huérfanos: {label}", "❌", f"{count} registros huérfanos")
            else:
                report("Integridad", f"Huérfanos: {label}", "✅", "0 huérfanos")
        else:
            is_count = val.isdigit()
            count_val = int(val) if is_count else 0
            if "Tablas" in label:
                report("Schema", label, "✅", f"{count_val} tablas en schema setubalai")
            elif "Médicos por" in label:
                if val and ":" in val:
                    report("Datos", label, "✅", val)
                else:
                    report("Datos", label, "⚠️", "Sin datos o query inválida")
            elif "HOY" in label:
                report("Datos", label, "✅" if count_val > 0 else "⚠️", f"{count_val} turnos")
            else:
                report("Datos", label, "✅" if count_val > 0 else "⚠️", f"{count_val} registros")
    except Exception as e:
        report("DB", label, "❌", f"Error: {e}")

# ── FASE 3: Backend Endpoints ──────────────────────────────────────────
print("\n🔗 FASE 3: Backend Endpoints")

token = None
try:
    req = Request(f"{API_BASE}/auth/login",
                  data=b"username=admin@centromedicosantaclara.com.ar&password=Pablo2024!",
                  headers={"Content-Type": "application/x-www-form-urlencoded"},
                  method="POST")
    resp = urlopen(req, timeout=10)
    data = json.loads(resp.read())
    token = data.get("access_token") or data.get("token")
    report("Auth", "Token obtenido", "✅" if token else "❌", "" if token else str(data))
except Exception as e:
    report("Auth", "Token", "❌", str(e))

headers = {"Authorization": f"Bearer {token}"} if token else {}

endpoints = [
    ("GET", "/especialidades/", "especialidades"),
    ("GET", "/medicos/", "médicos"),
    ("GET", "/pacientes/", "pacientes"),
    ("GET", "/turnos/", "turnos"),
    ("GET", "/nomenclador_practicas/", "prácticas"),
    ("GET", "/obras-sociales/", "obras sociales"),
    ("GET", "/calendario/?mes=2026-06", "calendario"),
    ("GET", "/agenda/timeline/?fecha=2026-06-04", "agenda timeline"),
]

for method, path, label in endpoints:
    try:
        req = Request(f"{API_BASE}{path}", headers=headers, method=method)
        resp = urlopen(req, timeout=10)
        status_code = resp.getcode()
        body = json.loads(resp.read())
        
        if isinstance(body, dict) and "detail" in body:
            report("Endpoints", f"{method} {path}", "⚠️", f"Error API: {body['detail']}")
        elif isinstance(body, dict):
            items = 0
            for k, v in body.items():
                if isinstance(v, list):
                    items = len(v)
                    break
            report("Endpoints", f"{method} {path} ({label})", "✅", f"HTTP {status_code} → {items} items")
        elif isinstance(body, list):
            report("Endpoints", f"{method} {path} ({label})", "✅", f"HTTP {status_code} → {len(body)} items")
        else:
            report("Endpoints", f"{method} {path} ({label})", "⚠️", f"Tipo raro: {type(body).__name__}")
    except HTTPError as e:
        report("Endpoints", f"{method} {path} ({label})", "❌", f"HTTP {e.code}")
    except URLError as e:
        report("Endpoints", f"{method} {path} ({label})", "❌", str(e.reason))
    except Exception as e:
        report("Endpoints", f"{method} {path} ({label})", "❌", str(e))

# ── FASE 4: Frontend → Backend Alignment ───────────────────────────────
print("\n🎨 FASE 4: Frontend → Backend Alignment")

# Buscar llamadas /api/ en frontend
frontend_calls = set()
api_pattern = re.compile(r'["\'](/api/[\w\-_/]+)\??')

for root, dirs, files in os.walk(WEB_SRC):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.turbo', '__pycache__')]
    for f in files:
        if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
            filepath = os.path.join(root, f)
            try:
                with open(filepath) as fh:
                    for match in api_pattern.findall(fh.read()):
                        # Normalizar: quitar /api/ prefix y trailing slash
                        cleaned = match.replace("/api/", "/").rstrip("/")
                        if cleaned != "/" and cleaned:
                            frontend_calls.add(cleaned)
            except:
                pass

# Endpoints registrados en backend routers
backend_routes = set()
router_files = [
    os.path.join(PROJECT_ROOT, "services", "api", "routers", "salud.py"),
    os.path.join(PROJECT_ROOT, "services", "api", "routers", "crm.py"),
    os.path.join(PROJECT_ROOT, "services", "api", "routers", "config.py"),
    os.path.join(PROJECT_ROOT, "services", "api", "main.py"),
]

for rf in router_files:
    if os.path.exists(rf):
        with open(rf) as f:
            content = f.read()
        # @router.get("/path/@router.post("/path
        for match in re.findall(r'@(?:router|app)\.(?:get|post|put|delete|patch)\(["\']([^"\']+)["\']', content):
            backend_routes.add(match.rstrip("/"))
        # include_router(prefix="...")
        for match in re.findall(r'include_router\(.+prefix=["\']([^"\']+)["\']', content):
            backend_routes.add(match.rstrip("/"))

# Comparar
missing_frontend = {c for c in frontend_calls - backend_routes if not c.startswith("/auth")}
unused_backend = backend_routes - frontend_calls

report("Alignment", f"Endpoints desde frontend", "ℹ️", f"{len(frontend_calls)} rutas: {', '.join(sorted(frontend_calls)[:6])}")
report("Alignment", f"Endpoints en backend", "ℹ️", f"{len(backend_routes)} rutas")

if missing_frontend:
    report("Alignment", "Frontend → endpoint NO registrado en backend", "❌",
           "\n           ".join(f"{c} (buscar en routers/)" for c in sorted(missing_frontend)))
else:
    report("Alignment", "Frontend → Backend routes", "✅", "Todos los endpoints frontend existen en backend")

# ── FASE 5: Schema DB vs Models Python ─────────────────────────────────
print("\n🔬 FASE 5: Schema DB vs Código Backend")

# Verificar columnas que el código usa vs las que existen
# Extraigo queries del router y veo qué columnas references
column_checks = []
salud_path = os.path.join(PROJECT_ROOT, "services", "api", "routers", "salud.py")
if os.path.exists(salud_path):
    with open(salud_path) as f:
        salud_content = f.read()
    
    # Buscar referencias a atributos de modelo (Model.columna)
    attr_refs = re.findall(r'(\w+)\.(\w+)', salud_content)
    # Modelos conocidos → tablas
    model_table = {
        "Visita": "visitas", "Medico": "medicos", "Paciente": "pacientes",
        "EspecialidadMedica": "especialidades_medicas", "ObraSocial": "obras_sociales",
        "MedicoEspecialidades": "medico_especialidades", "Empresa": "empresa",
        "Usuario": "usuarios", "HistoriaClinica": "historia_clinica",
        "AtencionMedica": "atenciones_medicas", "GrillaMedica": "grillas_medicas",
    }
    
    for model_name, col_name in attr_refs:
        if model_name in model_table:
            tabla = model_table[model_name]
            # Verificar que la columna existe
            try:
                result = subprocess.run(
                    ["docker", "exec", "paperclip-db", "psql", "-U", "paperclip", "-d", "business",
                     "-t", "-A", "-c",
                     f"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='setubalai' AND table_name='{tabla}' AND column_name='{col_name}';"],
                    capture_output=True, text=True, timeout=5
                )
                if result.stdout.strip() == "0":
                    column_checks.append((tabla, col_name))
            except:
                pass

if column_checks:
    unique = set((t, c) for t, c in column_checks)
    report("Schema vs Código", "Columnas en código pero NO en DB", "❌",
           "\n           ".join(f"{tabla}.{col}" for tabla, col in sorted(unique)[:10]))
else:
    report("Schema vs Código", "Columnas del código vs DB", "✅", "Ninguna columna faltante detectada")

# ════════════════════════════════════════════════════════════════════════
print("\n" + "="*70)
print("RESUMEN DE ALINEACIÓN")
print("="*70)

by_status = {}
for layer, check, status, detail in RESULTS:
    by_status.setdefault(status, []).append((layer, check, detail))

total_checks = len(RESULTS)
for status in ["❌", "⚠️", "ℹ️", "✅"]:
    items = by_status.get(status, [])
    if items:
        print(f"\n{status} {len(items)}/{total_checks}:")
        for layer, check, detail in items:
            if detail and status != "✅":
                # Truncate long details
                d = detail[:120] + "..." if len(detail) > 120 else detail
                print(f"   • [{layer}] {check}: {d}")
            else:
                print(f"   • [{layer}] {check}")

fails = [r for r in RESULTS if r[2] == "❌"]
warnings = [r for r in RESULTS if r[2] == "⚠️"]

print("\n" + "="*70)
if not fails:
    print(f"✅ PILA ALINEADA{' (con advertencias)' if warnings else ' — todo ok'}")
    if warnings:
        for layer, check, status, detail in warnings:
            print(f"   ⚠️ [{layer}] {check}: {detail[:100]}")
else:
    print(f"❌ DESALINEADO — {len(fails)} {'problema' if len(fails)==1 else 'problemas'} crítico{'s' if len(fails)>1 else ''}:")
    for layer, check, status, detail in fails:
        print(f"   → [{layer}] {check}: {detail[:150]}")
print("="*70 + "\n")

sys.exit(1 if fails else 0)
