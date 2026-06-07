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
    from models import Empresa

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

    # Verificar que la empresa del usuario está activa
    empresa = db.query(Empresa).filter(Empresa.id == user.empresa_id).first()
    if not empresa or empresa.estado != "activa":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu empresa está inactiva. Contactá a soporte.",
        )

    # Actualizar último acceso
    # user.ultimo_acceso no existe en el modelo — omitir
    db.commit()

    token_data = {
        "sub": str(user.id),
        "empresa_id": user.empresa_id,
        "rol": user.rol,
        "nombre": user.nombre,
    }
    if user.medico_id:
        token_data["medico_id"] = user.medico_id
    token = create_access_token(token_data)

    return TokenResponse(
        access_token=token,
        user=_user_dict(user, db),
    )


# ── GET /auth/me ──────────────────────────────────────────────────────────────
@router.get("/me")
def me(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _user_dict(current_user, db)


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
    return _user_dict(user, db)


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
    return {"users": [_user_dict(u, db) for u in users]}


# ── PUT /auth/users/{user_id}/toggle-activo ────────────────────────
@router.put("/users/{user_id}/toggle-activo")
def toggle_usuario(
    user_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Superadmin o admin de la empresa puede activar/desactivar un usuario."""
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Admin solo puede modificar usuarios de su empresa
    if current_user.rol == "admin" and user.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="No podés modificar usuarios de otra empresa")
    if current_user.rol == "operador":
        raise HTTPException(status_code=403, detail="Sin permisos")

    # No permitir desactivar al único admin de la empresa
    if user.rol == "admin" and not user.activo:
        admins_count = db.query(Usuario).filter(
            Usuario.empresa_id == user.empresa_id,
            Usuario.rol == "admin",
            Usuario.activo == True,
            Usuario.id != user_id,
        ).count()
        if admins_count == 0:
            raise HTTPException(status_code=400, detail="No se puede desactivar al único admin de la empresa")

    user.activo = not user.activo
    db.commit()
    db.refresh(user)
    return _user_dict(user, db)


# ── POST /auth/users/{user_id}/reset-password ──────────────────────
@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genera una nueva password temporal. Retorna la password en texto plano."""
    import secrets
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_user.rol == "admin" and user.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="No podés resetear passwords de otra empresa")
    if current_user.rol not in ("superadmin", "admin"):
        raise HTTPException(status_code=403, detail="Sin permisos")

    new_password = secrets.token_urlsafe(12)
    user.password_hash = hash_password(new_password)
    db.commit()
    return {
        "ok": True,
        "email": user.email,
        "password_temporal": new_password,
        "message": "Password reseteada. Enviá la nueva contraseña al usuario.",
    }


# ── Helper ────────────────────────────────────────────────────────────────────
def _user_dict(u: Usuario, db: Session = None) -> dict:
    user_data = {
        "id": u.id,
        "empresa_id": u.empresa_id,
        "nombre": u.nombre,
        "email": u.email,
        "rol": u.rol,
        "activo": u.activo,
        "medico_id": getattr(u, "medico_id", None),
        "ultimo_acceso": None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
    
    # Incluir datos de la empresa si se proporciona db
    if db:
        from models import Empresa
        empresa = db.query(Empresa).filter(Empresa.id == u.empresa_id).first()
        if empresa:
            user_data["empresa"] = {
                "id": empresa.id,
                "nombre": empresa.nombre,
                "rubro": empresa.rubro,
                "email": empresa.email,
                "moneda": empresa.moneda or "USD",
            }
    
    return user_data
