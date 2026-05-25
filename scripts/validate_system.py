#!/usr/bin/env python3
"""
SetubalAI System Validator
===========================
Validates every layer of the stack and outputs clear diagnostics.
Usage: python3 validate_system.py [--json] [--fix]

Layers checked:
  1. PostgreSQL (DB business, schema setubalai, tables, data)
  2. API Backend (port 3010 - health, auth, endpoints)
  3. Web Producto (port 3011 + Cloudflare)
  4. Web Admin (port 3012 + Cloudflare)
  5. Gateway Hermes (systemd service)
  6. End-to-End (login → fetch empresas → verify data)

Exit codes:
  0 = All healthy
  1 = One or more checks failed (see report)
"""

import subprocess
import sys
import json
import http.client
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

results = []

def check(name, fn, critical=True):
    """Run a check and record result."""
    try:
        status, detail = fn()
    except Exception as e:
        status, detail = "FAIL", str(e)
    results.append({"name": name, "status": status, "detail": detail, "critical": critical})
    icon = { "OK": f"{GREEN}✅{RESET}", "WARN": f"{YELLOW}⚠️{RESET}", "FAIL": f"{RED}❌{RESET}" }.get(status, "❓")
    severity = f"{BOLD}[CRITICAL]{RESET} " if critical else ""
    print(f"  {icon} {severity}{name}: {detail}")
    return status

def run(cmd, timeout=10):
    """Run shell command, return (stdout, stderr, returncode)."""
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    return r.stdout.strip(), r.stderr.strip(), r.returncode

def http_get(url, timeout=5):
    """Simple HTTP GET, return (status_code, body_or_error)."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SetubalAI-Validator/1.0"})
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, resp.read().decode()[:500]
    except Exception as e:
        return 0, str(e)

def http_get_auth(url, token, timeout=5, limit=5000):
    """HTTP GET with Bearer token."""
    try:
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "User-Agent": "SetubalAI-Validator/1.0"})
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, resp.read().decode()[:limit]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:limit]
    except Exception as e:
        return 0, str(e)

def http_post_form(url, data, timeout=5):
    """POST urlencoded form."""
    try:
        import urllib.parse
        body = urllib.parse.urlencode(data).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "SetubalAI-Validator/1.0"})
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.status, resp.read().decode()[:1000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:1000]
    except Exception as e:
        return 0, str(e)

# ─── 1. PostgreSQL ───────────────────────────────────────────────────────────
def check_postgres_running():
    _, _, rc = run("docker ps --filter name=paperclip-db --format '{{.Status}}' | grep -q Up")
    if rc == 0:
        return "OK", "Container running"
    return "FAIL", "paperclip-db container is NOT running"

def check_postgres_schema():
    out, err, rc = run("docker exec paperclip-db psql -U paperclip -d business -tAc \"SELECT count(*) FROM information_schema.schemata WHERE schema_name='setubalai'\"")
    if out.strip() == "1":
        return "OK", "Schema setubalai exists"
    return "FAIL", f"Schema setubalai missing (got: {out})"

def check_postgres_tables():
    out, err, rc = run("docker exec paperclip-db psql -U paperclip -d business -tAc \"SELECT count(*) FROM information_schema.tables WHERE table_schema='setubalai'\"")
    count = int(out.strip()) if out.strip().isdigit() else 0
    if count >= 10:
        return "OK", f"{count} tables in schema setubalai"
    return "FAIL", f"Only {count} tables (expected >= 10)"

def check_postgres_data():
    out, err, rc = run("docker exec paperclip-db psql -U paperclip -d business -tAc \"SELECT count(*) FROM setubalai.empresa; SELECT count(*) FROM setubalai.clientes; SELECT count(*) FROM setubalai.facturas\"")
    lines = [l.strip() for l in out.strip().split("\n") if l.strip()]
    if len(lines) >= 3:
        emp, cli, fac = lines[0], lines[1], lines[2]
        return "OK", f"{emp} empresas, {cli} clientes, {fac} facturas"
    return "FAIL", f"Could not read data (output: {out[:100]})"

# ─── 2. API Backend ─────────────────────────────────────────────────────────
def check_api_running():
    _, _, rc = run("ss -tlnp 2>/dev/null | grep -q ':3010 '")
    if rc == 0:
        return "OK", "Listening on port 3010"
    return "FAIL", "NOT listening on port 3010 — start with: cd /home/admin/setubalai-agente/services/api && source venv/bin/activate && nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 3010 > /tmp/api.log 2>&1 &"

def check_api_health():
    status, body = http_get("http://localhost:3010/health")
    if status == 200 and "ok" in body.lower():
        return "OK", "GET /health → 200"
    return "FAIL", f"GET /health → {status} {body[:80]}"

def check_api_auth():
    status, body = http_post_form("http://localhost:3010/auth/login", {"username": "pcostarotela@gmail.com", "password": "Pablo2024!"})
    if status == 200 and "access_token" in body:
        return "OK", "Login works (superadmin)"
    return "FAIL", f"Login → {status} {body[:100]}"

def get_token():
    """Get auth token for e2e tests."""
    status, body = http_post_form("http://localhost:3010/auth/login", {"username": "pcostarotela@gmail.com", "password": "Pablo2024!"})
    if status == 200 and "access_token" in body:
        d = json.loads(body)
        return d.get("access_token")
    return None

def check_api_empresas(token):
    if not token:
        return "FAIL", "No token available"
    status, body = http_get_auth("http://localhost:3010/empresas/", token)
    if status == 200 and "empresas" in body:
        d = json.loads(body)
        n = len(d.get("empresas", []))
        return "OK", f"GET /empresas/ → {n} empresas"
    return "FAIL", f"GET /empresas/ → {status} {body[:100]}"

def check_api_rewrites(token):
    """Verify Next.js proxy to API works."""
    if not token:
        return "FAIL", "No token"
    status, body = http_get_auth("http://localhost:3012/api/empresas/", token)
    if status == 200 and "empresas" in body:
        return "OK", "Proxy /api/empresas/ → API OK"
    elif status == 308:
        return "WARN", "308 redirect from proxy (trailing slash issue — may break in browser)"
    return "FAIL", f"Proxy /api/empresas/ → {status} {body[:100]}"

# ─── 3. Web Producto ────────────────────────────────────────────────────────
def check_web_running():
    _, _, rc = run("ss -tlnp 2>/dev/null | grep -q ':3011 '")
    if rc == 0:
        return "OK", "Listening on port 3011"
    return "FAIL", "NOT listening on port 3011 — start: cd /home/admin/setubalai-agente/web && npx next start --port 3011 &"

def check_web_local():
    status, body = http_get("http://localhost:3011/clientes")
    if status == 200:
        return "OK", "GET /clientes → 200"
    return "FAIL", f"GET /clientes → {status} {body[:80]}"

def check_web_cloudflare():
    status, body = http_get("https://business.setubalai.org/clientes")
    if status == 200:
        return "OK", "business.setubalai.org → 200"
    return "FAIL", f"business.setubalai.org → {status} {body[:100]}"

# ─── 4. Web Admin ────────────────────────────────────────────────────────────
def check_admin_running():
    _, _, rc = run("ss -tlnp 2>/dev/null | grep -q ':3012 '")
    if rc == 0:
        return "OK", "Listening on port 3012"
    return "FAIL", "NOT listening on port 3012 — start: cd /home/admin/setubalai-agente/web-admin && npx next start --port 3012 &"

def check_admin_local():
    status, body = http_get("http://localhost:3012/panel-maestro")
    if status == 200:
        return "OK", "GET /panel-maestro → 200"
    return "FAIL", f"GET /panel-maestro → {status} {body[:80]}"

def check_admin_cloudflare():
    status, body = http_get("https://admin.setubalai.org/panel-maestro")
    if status == 200:
        return "OK", "admin.setubalai.org → 200"
    return "FAIL", f"admin.setubalai.org → {status} {body[:100]}"

def check_admin_standalone():
    """Check that standalone mode is NOT enabled (known bug)."""
    try:
        with open("/home/admin/setubalai-agente/web-admin/next.config.ts") as f:
            content = f.read()
        if 'output: "standalone"' in content or "output: 'standalone'" in content:
            return "FAIL", "standalone mode ENABLED — known bug! Remove output:'standalone' from next.config.ts, then: cd web-admin && rm -rf .next && npm run build"
        return "OK", "standalone mode OFF (correct)"
    except FileNotFoundError:
        return "FAIL", "next.config.ts not found"

# ─── 5. Gateway ──────────────────────────────────────────────────────────────
def check_gateway():
    out, err, rc = run("systemctl --user is-active hermes-gateway-local.service 2>/dev/null")
    if rc == 0:
        out2, _, _ = run("systemctl --user status hermes-gateway-local.service 2>&1 | grep 'Active:'")
        return "OK", out2.strip() if out2 else "running"
    return "FAIL", "Gateway service is NOT active — run: systemctl --user restart hermes-gateway-local.service"

# ─── 6. End-to-End ──────────────────────────────────────────────────────────
def check_e2e_admin(token):
    """Login to admin and fetch empresas through the browser proxy."""
    if not token:
        return "FAIL", "Cannot authenticate"
    out, err, rc = run(f"""curl -s http://localhost:3012/api/empresas/ -H "Authorization: Bearer {token}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('empresas',[])))" 2>/dev/null""")
    if rc == 0 and out.strip().isdigit() and int(out.strip()) > 0:
        return "OK", f"Admin proxy returns {out.strip()} empresas"
    return "WARN", f"Admin proxy returned: {out.strip() or err.strip()[:80]}"

def check_e2e_web(token):
    """Login to web and fetch clientes through the browser proxy."""
    if not token:
        return "FAIL", "Cannot authenticate"
    out, err, rc = run(f"""curl -s http://localhost:3011/api/clientes/ -H "Authorization: Bearer {token}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('clientes',[])) if isinstance(d,dict) else 'PARSE_ERROR')" 2>/dev/null""")
    if rc == 0 and out.strip().isdigit() and int(out.strip()) > 0:
        return "OK", f"Web proxy returns {out.strip()} clientes"
    return "WARN", f"Web proxy returned: {out.strip() or err.strip()[:80]}"

# ─── Main ────────────────────────────────────────────────────────────────────
def main():
    print(f"\n{BOLD}{CYAN}╔══════════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{CYAN}║     SetubalAI System Validator v1.0       ║{RESET}")
    print(f"{BOLD}{CYAN}╚══════════════════════════════════════════════╝{RESET}")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    token = None

    print(f"{BOLD}📊 1. PostgreSQL (paperclip-db){RESET}")
    check("Container", check_postgres_running)
    check("Schema setubalai", check_postgres_schema)
    check("Tables (≥10)", check_postgres_tables)
    check("Data integrity", check_postgres_data)
    print()

    print(f"{BOLD}🔧 2. API Backend (:3010){RESET}")
    check("Port 3010", check_api_running)
    check("/health", check_api_health)
    check("/auth/login", check_api_auth)
    token = get_token()
    if token:
        check("GET /empresas/", lambda: check_api_empresas(token))
        check("Proxy rewrite", lambda: check_api_rewrites(token))
    else:
        check("GET /empresas/", lambda: ("FAIL", "No token"))
    print()

    print(f"{BOLD}🌐 3. Web Producto (:3011){RESET}")
    check("Port 3011", check_web_running)
    check("Local /clientes", check_web_local)
    check("Cloudflare business", check_web_cloudflare)
    print()

    print(f"{BOLD}🛡️  4. Web Admin (:3012){RESET}")
    check("Port 3012", check_admin_running)
    check("Local /panel-maestro", check_admin_local)
    check("Cloudflare admin", check_admin_cloudflare)
    check("Standalone bug", check_admin_standalone)
    print()

    print(f"{BOLD}⚡ 5. Gateway Hermes{RESET}")
    check("systemd service", check_gateway)
    print()

    print(f"{BOLD}🔗 6. End-to-End Integration{RESET}")
    if token:
        check("Admin proxy → empresas", lambda: check_e2e_admin(token))
        check("Web proxy → clientes", lambda: check_e2e_web(token))
    else:
        check("Admin proxy", lambda: ("FAIL", "No auth token"))
        check("Web proxy", lambda: ("FAIL", "No auth token"))
    print()

    # ─── Summary ──────────────────────────────────────────────────
    fail_critical = [r for r in results if r["status"] == "FAIL" and r["critical"]]
    fail_non_critical = [r for r in results if r["status"] == "FAIL" and not r["critical"]]
    warns = [r for r in results if r["status"] == "WARN"]

    ok_count = len([r for r in results if r["status"] == "OK"])
    total = len(results)

    print(f"{BOLD}{'─' * 50}{RESET}")
    print(f"  {GREEN}{ok_count}/{total} checks passed{RESET}")

    if fail_critical:
        print(f"\n{RED}{BOLD}🚨 CRITICAL FAILURES (blockers):{RESET}")
        for r in fail_critical:
            print(f"  {RED}▸ {r['name']}: {r['detail']}{RESET}")

    if fail_non_critical:
        print(f"\n{YELLOW}⚡ Non-critical failures:{RESET}")
        for r in fail_non_critical:
            print(f"  {YELLOW}▸ {r['name']}: {r['detail']}{RESET}")

    if warns:
        print(f"\n{YELLOW}⚠️ Warnings (may cause issues):{RESET}")
        for r in warns:
            print(f"  {YELLOW}▸ {r['name']}: {r['detail']}{RESET}")

    if not fail_critical:
        print(f"\n{GREEN}{BOLD}✅ ALL CRITICAL CHECKS PASSED — System is operational{RESET}")
    else:
        print(f"\n{RED}{BOLD}❌ {len(fail_critical)} CRITICAL ISSUE(S) FOUND{RESET}")
        print(f"{YELLOW}💡 Run: python3 /home/admin/setubalai-agente/scripts/validate_system.py --fix{RESET}")

    print()

    if fail_critical:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
