#!/usr/bin/env python3
"""
SetubalAI Admin CLI
===================
Script de administración rápida para desarrollo.
Crea empresas, resetea passwords, lista credenciales.

USO:
  python3 admin-cli.py crear-empresa "Clinica Ejemplo" --rubro "salud"
  python3 admin-cli.py listar-empresas
  python3 admin-cli.py listar-usuarios --empresa-id 16
  python3 admin-cli.py resetear-password usuario@ejemplo.com --nueva-pass "Test123!"
  python3 admin-cli.py credenciales-empresa 16
"""

import requests
import sys
import json
from typing import Optional

# Configuración
API_URL = "http://localhost:3010"
SUPERADMIN_EMAIL = "pcostarotela@gmail.com"
SUPERADMIN_PASS = "Pablo2024!"

# Colores
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def get_token() -> str:
    """Obtiene token JWT del superadmin."""
    try:
        resp = requests.post(
            f"{API_URL}/auth/login",
            data={"username": SUPERADMIN_EMAIL, "password": SUPERADMIN_PASS},
            timeout=10
        )
        resp.raise_for_status()
        return resp.json()["access_token"]
    except Exception as e:
        print(f"{RED}❌ Error obteniendo token: {e}{RESET}")
        sys.exit(1)


def crear_empresa(nombre: str, rubro: str = "general", email: Optional[str] = None):
    """Crea empresa + usuario admin con password conocida."""
    token = get_token()
    
    payload = {
        "nombre": nombre,
        "rubro": rubro,
        "email": email or f"admin.{nombre.lower().replace(' ', '')}@test.com",
        "moneda": "ARS",
        "plan": "basico"
    }
    
    try:
        resp = requests.post(
            f"{API_URL}/empresas/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        
        print(f"\n{GREEN}✅ Empresa creada exitosamente{RESET}")
        print(f"{BOLD}{'='*70}{RESET}")
        print(f"{CYAN}Empresa:{RESET} {data['nombre']} (ID: {data['id']})")
        print(f"{CYAN}Rubro:{RESET} {data.get('rubro', 'N/A')}")
        
        if "admin_credentials" in data:
            creds = data["admin_credentials"]
            print(f"\n{YELLOW}{BOLD}🔑 CREDENCIALES DE ACCESO:{RESET}")
            print(f"{BOLD}{'─'*70}{RESET}")
            print(f"  {CYAN}URL:{RESET}      {creds['login_url']}")
            print(f"  {CYAN}Email:{RESET}    {creds['email']}")
            print(f"  {CYAN}Password:{RESET} {creds['password_temporal']}")
            print(f"{BOLD}{'─'*70}{RESET}\n")
        
        return data
    
    except requests.exceptions.HTTPError as e:
        print(f"{RED}❌ Error HTTP {e.response.status_code}: {e.response.text}{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        sys.exit(1)


def listar_empresas():
    """Lista todas las empresas con sus IDs."""
    token = get_token()
    
    try:
        resp = requests.get(
            f"{API_URL}/empresas/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp.raise_for_status()
        empresas = resp.json()["empresas"]
        
        print(f"\n{BOLD}{'='*90}{RESET}")
        print(f"{CYAN}{BOLD}  ID  │  Nombre                          │  Rubro         │  Estado{RESET}")
        print(f"{BOLD}{'='*90}{RESET}")
        
        for e in empresas:
            estado = e.get("configuracion", {}).get("estado", "N/A")
            estado_icon = "✅" if estado == "activa" else "⚠️"
            print(f"  {e['id']:3d} │  {e['nombre']:<30s} │  {e.get('rubro', 'N/A'):<13s} │  {estado_icon} {estado}")
        
        print(f"{BOLD}{'='*90}{RESET}\n")
        
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        sys.exit(1)


def listar_usuarios(empresa_id: Optional[int] = None):
    """Lista usuarios (todos o de una empresa específica)."""
    token = get_token()
    
    try:
        resp = requests.get(
            f"{API_URL}/auth/users",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp.raise_for_status()
        usuarios = resp.json()["users"]
        
        if empresa_id:
            usuarios = [u for u in usuarios if u["empresa_id"] == empresa_id]
        
        print(f"\n{BOLD}{'='*110}{RESET}")
        print(f"{CYAN}{BOLD}  ID  │  Empresa ID │  Email                          │  Nombre              │  Rol        │  Activo{RESET}")
        print(f"{BOLD}{'='*110}{RESET}")
        
        for u in usuarios:
            activo_icon = "✅" if u["activo"] else "❌"
            print(f"  {u['id']:3d} │     {u['empresa_id']:3d}     │  {u['email']:<30s} │  {u['nombre']:<18s} │  {u['rol']:<10s} │  {activo_icon}")
        
        print(f"{BOLD}{'='*110}{RESET}\n")
        
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        sys.exit(1)


def resetear_password(email: str, nueva_pass: Optional[str] = None):
    """Resetea password de un usuario. Si no se provee nueva_pass, genera una temporal."""
    token = get_token()
    
    # Primero buscar el usuario por email
    try:
        resp = requests.get(
            f"{API_URL}/auth/users",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp.raise_for_status()
        usuarios = resp.json()["users"]
        
        usuario = next((u for u in usuarios if u["email"] == email), None)
        if not usuario:
            print(f"{RED}❌ Usuario con email '{email}' no encontrado{RESET}")
            sys.exit(1)
        
        user_id = usuario["id"]
        
        # Resetear password
        if nueva_pass:
            # Si se provee password específica, hay que usar endpoint diferente
            # Por ahora el endpoint solo genera temporal, necesitamos adaptar
            print(f"{YELLOW}⚠️  El endpoint actual solo genera passwords temporales aleatorias{RESET}")
            print(f"{YELLOW}⚠️  Para setear password específica, usa el endpoint POST /auth/users/{user_id}/reset-password y modifícalo en la API{RESET}")
        
        resp = requests.post(
            f"{API_URL}/auth/users/{user_id}/reset-password",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp.raise_for_status()
        data = resp.json()
        
        print(f"\n{GREEN}✅ Password reseteada exitosamente{RESET}")
        print(f"{BOLD}{'='*70}{RESET}")
        print(f"{CYAN}Email:{RESET}    {data['email']}")
        print(f"{CYAN}Password:{RESET} {data['password_temporal']}")
        print(f"{BOLD}{'='*70}{RESET}\n")
        
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        sys.exit(1)


def credenciales_empresa(empresa_id: int):
    """Muestra todas las credenciales de usuarios de una empresa."""
    token = get_token()
    
    try:
        # Obtener empresa del listado general
        resp_empresas = requests.get(
            f"{API_URL}/empresas/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp_empresas.raise_for_status()
        empresas = resp_empresas.json()["empresas"]
        empresa = next((e for e in empresas if e["id"] == empresa_id), None)
        
        if not empresa:
            print(f"{RED}❌ Empresa con ID {empresa_id} no encontrada{RESET}")
            sys.exit(1)
        
        # Obtener usuarios
        resp_users = requests.get(
            f"{API_URL}/auth/users",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        resp_users.raise_for_status()
        usuarios = [u for u in resp_users.json()["users"] if u["empresa_id"] == empresa_id]
        
        print(f"\n{GREEN}{'='*90}{RESET}")
        print(f"{CYAN}{BOLD}  EMPRESA: {empresa['nombre']} (ID: {empresa_id}){RESET}")
        print(f"{GREEN}{'='*90}{RESET}")
        print(f"  {CYAN}Rubro:{RESET}      {empresa.get('rubro', 'N/A')}")
        print(f"  {CYAN}Login URL:{RESET}  https://business.setubalai.org/login")
        print(f"{GREEN}{'='*90}{RESET}\n")
        
        if not usuarios:
            print(f"{YELLOW}⚠️  Esta empresa NO tiene usuarios creados{RESET}")
            print(f"{YELLOW}⚠️  Usá: python3 admin-cli.py crear-usuario --empresa-id {empresa_id}{RESET}\n")
            return
        
        print(f"{BOLD}  USUARIOS:{RESET}")
        print(f"{BOLD}{'─'*90}{RESET}")
        for u in usuarios:
            activo = "✅ Activo" if u["activo"] else "❌ Inactivo"
            print(f"  • {u['nombre']} ({u['rol']})")
            print(f"    Email: {u['email']}")
            print(f"    Estado: {activo}")
            print(f"    {YELLOW}Password: [HASH - usar 'resetear-password' para generar nueva]{RESET}")
            print()
        
        print(f"{BOLD}{'─'*90}{RESET}\n")
        
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    comando = sys.argv[1]
    
    if comando == "crear-empresa":
        if len(sys.argv) < 3:
            print(f"{RED}❌ Uso: admin-cli.py crear-empresa \"Nombre Empresa\" [--rubro salud] [--email admin@ejemplo.com]{RESET}")
            sys.exit(1)
        
        nombre = sys.argv[2]
        rubro = "general"
        email = None
        
        for i, arg in enumerate(sys.argv[3:], start=3):
            if arg == "--rubro" and i+1 < len(sys.argv):
                rubro = sys.argv[i+1]
            if arg == "--email" and i+1 < len(sys.argv):
                email = sys.argv[i+1]
        
        crear_empresa(nombre, rubro, email)
    
    elif comando == "listar-empresas":
        listar_empresas()
    
    elif comando == "listar-usuarios":
        empresa_id = None
        if "--empresa-id" in sys.argv:
            idx = sys.argv.index("--empresa-id")
            if idx + 1 < len(sys.argv):
                empresa_id = int(sys.argv[idx + 1])
        listar_usuarios(empresa_id)
    
    elif comando == "resetear-password":
        if len(sys.argv) < 3:
            print(f"{RED}❌ Uso: admin-cli.py resetear-password usuario@ejemplo.com [--nueva-pass Test123!]{RESET}")
            sys.exit(1)
        
        email = sys.argv[2]
        nueva_pass = None
        if "--nueva-pass" in sys.argv:
            idx = sys.argv.index("--nueva-pass")
            if idx + 1 < len(sys.argv):
                nueva_pass = sys.argv[idx + 1]
        
        resetear_password(email, nueva_pass)
    
    elif comando == "credenciales-empresa":
        if len(sys.argv) < 3:
            print(f"{RED}❌ Uso: admin-cli.py credenciales-empresa <empresa_id>{RESET}")
            sys.exit(1)
        
        empresa_id = int(sys.argv[2])
        credenciales_empresa(empresa_id)
    
    else:
        print(f"{RED}❌ Comando desconocido: {comando}{RESET}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
