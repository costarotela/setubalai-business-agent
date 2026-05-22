"""
Router /auth — login, perfil, cambiar contraseña
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models import Usuario
from auth import (
    create_access_token, hash_password, verify_password,
    get_current_user,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ChangePasswordBody(BaseModel):
    password_actual: str
    password_nueva: str


class CreateUserBody(BaseModel):
    empresa_id: int
    nombre: str
    email: str
    password: str
    rol: str = "operador"       # admin | operador | contador | superadmin


# ── POST /auth/login ──────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(Usuario).filter(
        Usuario.email == form.username.lower().strip(),
        Usuario.activo == True,
    ).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    if not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )

    # Actualizar último acceso
    # user.ultimo_acceso no existe en el modelo — omitir
    db.commit()

    token = create_access_token({
        "sub": str(user.id),
        "empresa_id": user.empresa_id,
        "rol": user.rol,
        "nombre": user.nombre,
    })

    return TokenResponse(
        access_token=token,
        user=_user_dict(user),
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me")
def me(current_user: Usuario = Depends(get_current_user)):
    return _user_dict(current_user)


# ── POST /auth/cambiar-password ───────────────────────────────────────────────
@router.post("/cambiar-password")
def cambiar_password(
    body: ChangePasswordBody,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.password_actual, current_user.password_hash or ""):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if len(body.password_nueva) < 8:
        raise HTTPException(status_code=400, detail="La contraseña nueva debe tener al menos 8 caracteres")

    current_user.password_hash = hash_password(body.password_nueva)
    db.commit()
    return {"ok": True, "message": "Contraseña actualizada"}


# ── POST /auth/users (solo superadmin) ───────────────────────────────────────
@router.post("/users", status_code=201)
def crear_usuario(
    body: CreateUserBody,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.rol not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="Sin permisos")

    # admin solo puede crear usuarios de su propia empresa
    if current_user.rol == "admin" and body.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Solo podés crear usuarios de tu empresa")

    existing = db.query(Usuario).filter(Usuario.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

    user = Usuario(
        empresa_id=body.empresa_id,
        nombre=body.nombre,
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        rol=body.rol,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


# ── GET /auth/users (superadmin — todos | admin — su empresa) ─────────────────
@router.get("/users")
def listar_usuarios(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.rol == "superadmin":
        users = db.query(Usuario).order_by(Usuario.empresa_id, Usuario.id).all()
    else:
        users = db.query(Usuario).filter(
            Usuario.empresa_id == current_user.empresa_id
        ).order_by(Usuario.id).all()
    return {"users": [_user_dict(u) for u in users]}


# ── Helper ────────────────────────────────────────────────────────────────────
def _user_dict(u: Usuario) -> dict:
    return {
        "id": u.id,
        "empresa_id": u.empresa_id,
        "nombre": u.nombre,
        "email": u.email,
        "rol": u.rol,
        "activo": u.activo,
        "ultimo_acceso": None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
