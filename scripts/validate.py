#!/usr/bin/env python3
"""
Validación completa de SetubalAI Business - Verifica TODO antes de login
Uso: python3 validate.py [--email admin@centromedicosantaclara.com.ar]
"""
import subprocess
import sys
import json
import requests

PASS_MAP = {
    "admin@centromedicosantaclara.com.ar": "Centromedico2024!",
    "pcostarotela@gmail.com": "Pablo2024!",
}

PASS = []
FAIL = []

def ok(msg):
    PASS.append(msg)
    print(f"  ✓ {msg}")

def err(msg, detail=None):
    FAIL.append(msg)
    print(f"  ✗ {msg}")
    if detail:
        print(f"    → {detail}")

def run(cmd, timeout=10):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return r.returncode, r.stdout.strip(), r.stderr.strip()

def psql(query):
    cmd = f"sudo docker exec paperclip-db psql -U paperclip -d business -t -A -c \"{query}\""
    code, out, stderr = run(cmd)
    return out

# ── 1. DB Container ──
print("\n📦 1. PostgreSQL Container")
code, out, _ = run("sudo docker ps --filter name=paperclip-db --format '{{.Status}}'")
if code == 0 and "Up" in out:
    ok(f"paperclip-db corriendo ({out})")
else:
    err("Container PostgreSQL NO está corriendo", out or "no encontrado")

# ── 2. Tablas ──
print("\n🗄️ 2. Base de datos y tablas")
tables = psql("SELECT count(*) FROM information_schema.tables WHERE table_schema='setubalai'")
try:
    n = int(tables)
    if n >= 20:
        ok(f"Schema setubalai con {n} tablas")
    else:
        err("Schema setubalai tiene pocas tablas", f"Solo {n} (esperado ≥20)")
except:
    err("No se pudo contar tablas", tables)

# ── 3. Usuario ──
email = "admin@centromedicosantaclara.com.ar"
for i, arg in enumerate(sys.argv[1:]):
    if arg == "--email" and i+1 < len(sys.argv):
        email = sys.argv[i+2]

print(f"\n👤 3. Usuario: {email}")
user_info = psql(f"SELECT id, activo, empresa_id, rol FROM setubalai.usuarios WHERE email='{email}'")
if user_info and user_info[0:3] != "ERR" and "|" in user_info:
    parts = user_info.strip().split("|")
    uid = parts[0]
    activo = parts[1]
    empresa_id = parts[2]
    rol = parts[3]
    ok(f"Usuario existe (id={uid}, rol={rol}, empresa_id={empresa_id})")
    if activo == "t":
        ok("Usuario ACTIVO")
    else:
        err("Usuario DESACTIVADO", "activo=false")
    
    # Empresa
    emp = psql(f"SELECT nombre, estado FROM setubalai.empresa WHERE id={empresa_id}")
    if emp and "|" in emp:
        emp_parts = emp.strip().split("|")
        if emp_parts[1] in ("activo", "activa"):
            ok(f"Empresa activa: {emp_parts[0]}")
        else:
            err("Empresa NO activa", f"estado={emp_parts[1]}")
    
    # Password hash
    phash = psql(f"SELECT password_hash FROM setubalai.usuarios WHERE email='{email}'")
    if phash and phash.startswith("$2b$"):
        ok(f"Password hash OK (bcrypt, {len(phash)} chars)")
    else:
        err("Password hash inválido o no existe", phash[:50] or "nulo")
else:
    err(f"Usuario NO encontrado en DB", f"email='{email}'")

# ── 4. API Backend ──
print("\n🚀 4. API Backend (puerto 3010)")
code3, out3, _ = run("sudo ss -tlnp | grep ':3010'")
if code3 == 0:
    ok(f"API escuchando en puerto 3010")
else:
    # Fallback: systemd
    code3b, _, _ = run("sudo systemctl is-active setubalai-api 2>/dev/null")
    if code3b == 0:
        ok("Servicio setubalai-api activo")
    else:
        err("API NO escuchando en puerto 3010", "No hay proceso escuchando")

try:
    r = requests.get("http://localhost:3010/docs", timeout=5)
    if r.status_code == 200:
        ok("API responde en /docs (200)")
    else:
        err("API no responde correctamente", f"GET /docs → {r.status_code}")
except Exception as e:
    err("API no accesible", str(e))

# ── 5. Login Test ──
print("\n🔐 5. Test de Login")
pw = PASS_MAP.get(email)
if pw:
    try:
        r = requests.post("http://localhost:3010/auth/login",
                         data={"username": email, "password": pw},
                         timeout=5)
        if r.status_code == 200:
            data = r.json()
            tok = data.get('access_token', '')
            ok(f"Login EXITOSO → token: {tok[:40]}...")
            user = data.get("user", {})
            ok(f"Rol: {user.get('rol')}, Empresa: {user.get('empresa',{}).get('nombre')}")
        else:
            err("Login FALLIDO", f"HTTP {r.status_code}: {r.text[:120]}")
    except Exception as e:
        err("Error haciendo login", str(e))
else:
    err("No hay password configurada para este email", "Agregala al PASS_MAP en el script")

# ── 6. Proxy Nginx ──
print("\n🌐 6. Nginx Proxy")
code4, out4, _ = run("sudo nginx -t 2>&1 | head -1")
if code4 == 0 and ("successful" in out4 or "syntax is ok" in out4):
    ok("Nginx config válido")
else:
    err("Nginx config inválido", out4)

code5, out5, _ = run("sudo systemctl is-active nginx")
if code5 == 0:
    ok("Nginx activo")
else:
    err("Nginx NO activo")

# ── Summary ──
print("\n" + "=" * 50)
if FAIL:
    print(f"❌ {len(FAIL)} errores, {len(PASS)} OK")
    print("NO hacer deploy. Arreglar errores primero:")
    for e in FAIL:
        print(f"  • {e}")
else:
    print(f"✅ TODO OK — {len(PASS)} checks pasados")
    print("   Sistema listo para login.")
print("=" * 50)
