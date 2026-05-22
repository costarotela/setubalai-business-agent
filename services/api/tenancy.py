"""
Dependency: resolve_empresa_id
Orden de prioridad para determinar empresa_id:
  1. JWT Bearer token (web app — máxima seguridad)
  2. Header X-Empresa-ID (Hermes CLI/skills — backward compat)
  3. Query param empresa_id (legacy/testing)
  4. Default: 1 (SetubalAI)

Esto permite:
  - La web app con login → usa su empresa_id del token, no puede ver otras
  - Hermes skills → pasan X-Empresa-ID: N para operar sobre cualquier empresa
  - Llamadas legacy con ?empresa_id=N → siguen funcionando
"""
import os
from typing import Optional
from fastapi import Header, Depends, Request
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "setubalai_secret_key_produccion_2024")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")


def resolve_empresa_id(
    request: Request,
    x_empresa_id: Optional[int] = Header(default=None, alias="X-Empresa-ID"),
) -> int:
    """
    Extrae empresa_id de forma segura:
    1. JWT token en Authorization header
    2. Header X-Empresa-ID
    3. Query param empresa_id
    4. Default 1
    """
    # 1. JWT — máxima prioridad
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            eid = payload.get("empresa_id")
            if eid is not None:
                return int(eid)
        except JWTError:
            pass  # token inválido → caer al siguiente

    # 2. Header X-Empresa-ID
    if x_empresa_id is not None:
        return x_empresa_id

    # 3. Query param empresa_id
    qp = request.query_params.get("empresa_id")
    if qp is not None:
        try:
            return int(qp)
        except ValueError:
            pass

    # 4. Default
    return 1
