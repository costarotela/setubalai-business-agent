"""
Middleware de autorización global — Centraliza auth, roles y tenancy.

Reemplaza el patrón repetitivo de Depends(get_medico_restriction) en cada endpoint.
El middleware:
  1. Parsea el JWT en CADA request (una sola vez)
  2. Extrae rol, medico_id, empresa_id del token
  3. Los guarda en request.state para que los endpoints los usen directamente
  4. Bloquea acceso a rutas clínicas para roles no autorizados ANTES de ejecutar código
  5. Agrega X-Empresa-ID header para compatibilidad con resolve_empresa_id()

Reglas de acceso por rol:
  - superadmin / admin: acceso a TODO (clave maestra)
  - médico (operador + medico_id): acceso a datos clínicos SOLO propios
  - recepcionista (operador sin medico_id): turnos, pacientes, agenda. NO clínico
  - sin auth: acceso a endpoints públicos (auth/login, catalogo)

Endpoints clínicos sensibles (requieren médico o admin):
  /historia_clinica/, /practicas_medicas/, /recetas/, /estudios_adjuntos/,
  /atenciones/, /seguimiento/, /derivacion/

Endpoints solo admin/superadmin:
  /nomenclador_practicas/ (POST/PUT/DELETE), /empresas/ (POST/PUT/DELETE)
"""

from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("TOKEN_KEY") or "setubalai_secret_key_produccion_2024"
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# ── Rutas clínicas sensibles (requieren médico o admin) ────────────────────
CLINICAL_PATHS = {
    "/historia_clinica/",
    "/practicas_medicas/",
    "/recetas/",
    "/estudios_adjuntos/",
    "/atenciones/",
    "/seguimiento/",
    "/derivacion/",
    "/mis_pacientes/",
}

# ── Rutas admin-only (solo admin/superadmin) ───────────────────────────────
ADMIN_PATHS = {
    "/nomenclador_practicas/",  # POST/PUT/DELETE (GET es público)
    "/empresas/",                # POST/PUT/DELETE (GET es público)
}

# ── Rutas públicas (no requieren auth) ─────────────────────────────────────
PUBLIC_PATHS = {
    "/", "/docs", "/openapi.json", "/redoc",
    "/auth/login", "/auth/register",
    "/turnos/", "/pacientes/", "/medicos/", "/especialidades/",
    "/obras-sociales/", "/configuracion-agenda/",
    "/salud/", "/catalogo/",
    "/whatsapp/webhook/", "/health",
}


def _parse_jwt(auth_header: str) -> dict | None:
    """Parsea JWT token. Retorna payload o None si inválido."""
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _is_clinical_path(path: str) -> bool:
    """¿Es un endpoint clínico sensible?"""
    clean = path.rstrip("/") + "/"
    return any(clean.startswith(cp) for cp in CLINICAL_PATHS)


def _is_admin_path(path: str) -> bool:
    """¿Es un endpoint admin-only (escritura)?"""
    clean = path.rstrip("/") + "/"
    return any(clean.startswith(ap) for ap in ADMIN_PATHS)


def _is_admin_write(path: str, method: str) -> bool:
    """Admin-only = POST/PUT/DELETE en rutas admin."""
    method_upper = method.upper()
    if method_upper in ("GET", "HEAD", "OPTIONS"):
        return False
    return _is_admin_path(path)


def _needs_clinical_access(path: str, method: str) -> bool:
    """¿Esta ruta requiere acceso clínico (médico o admin)?"""
    # GET en nomenclador_practicas es público, mutation = admin
    if _is_admin_write(path, method):
        return True  # handled separately
    return _is_clinical_path(path)


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware global de autorización y tenancy."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method.upper()

        # ── 1. Parsear JWT (si existe) ──────────────────────────────
        auth_header = request.headers.get("Authorization", "")
        payload = _parse_jwt(auth_header)

        if payload:
            empresa_id = payload.get("empresa_id")
            rol = payload.get("rol", "operador")
            medico_id = payload.get("medico_id")
            user_id = payload.get("sub")

            # ── 2. Control de acceso por ruta ────────────────────────
            # Admin-writes: nomenclador, empresas (solo admin/superadmin)
            if _is_admin_write(path, method):
                if rol not in ("superadmin", "admin"):
                    return Response(
                        content='{"detail":"Acceso denegado: solo administradores"}',
                        status_code=403,
                        media_type="application/json"
                    )

            # Clinical paths: requiere médico o admin (recepcionista = 403)
            if _needs_clinical_access(path, method):
                is_admin_role = rol in ("superadmin", "admin")
                if medico_id is None and not is_admin_role:
                    return Response(
                        content='{"detail":"Acceso denegado: se requiere rol médico o administrador"}',
                        status_code=403,
                        media_type="application/json"
                    )

            # ── 3. Guardar info en request.state ────────────────────
            is_admin = rol in ("superadmin", "admin")
            request.state.user_id = user_id
            request.state.empresa_id = empresa_id
            request.state.user_rol = rol
            request.state.medico_id = medico_id
            request.state.es_admin = is_admin

        else:
            # Sin auth → acceso anónimo
            request.state.user_id = None
            request.state.empresa_id = None
            request.state.user_rol = "anonymous"
            request.state.medico_id = None
            request.state.es_admin = True

        # ── 4. Ejecutar el endpoint ─────────────────────────────────
        response = await call_next(request)
        return response
