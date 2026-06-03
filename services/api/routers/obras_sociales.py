"""
Router CRUD para Obras Sociales.

Gestiona el catálogo de obras sociales/prepagas de cada empresa.
Multi-tenant: Todas las queries filtran por empresa_id del usuario autenticado.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import ObraSocial
from tenancy import resolve_empresa_id
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/obras-sociales", tags=["Salud - Obras Sociales"])


class ObraSocialCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    codigo: str = Field(..., min_length=1, max_length=50)
    rnic: Optional[str] = None
    tipo: str = Field(default="OS", pattern="^(OS|PREPAGA|PARTICULAR)$")
    cobertura_default: float = Field(default=100.0, ge=0, le=100)
    activo: bool = True


class ObraSocialUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    rnic: Optional[str] = None
    tipo: Optional[str] = None
    cobertura_default: Optional[float] = None
    activo: Optional[bool] = None


def _to_dict(obj: ObraSocial) -> dict:
    return {
        "id": obj.id,
        "empresa_id": obj.empresa_id,
        "nombre": obj.nombre,
        "codigo": obj.codigo,
        "rnic": obj.rnic,
        "tipo": obj.tipo,
        "cobertura_default": float(obj.cobertura_default or 0),
        "activo": obj.activo,
        "created_at": obj.created_at.isoformat() if obj.created_at else None,
        "updated_at": obj.updated_at.isoformat() if obj.updated_at else None,
    }


@router.get("/")
def list_obras_sociales(
    empresa_id: int = Depends(resolve_empresa_id),
    db: Session = Depends(get_db),
    activo: Optional[bool] = None,
    tipo: Optional[str] = None,
    q: Optional[str] = Query(None, description="Buscar por nombre o código"),
):
    q_filter = db.query(ObraSocial).filter(ObraSocial.empresa_id == empresa_id)
    if activo is not None:
        q_filter = q_filter.filter(ObraSocial.activo == activo)
    if tipo:
        q_filter = q_filter.filter(ObraSocial.tipo == tipo)
    if q:
        q_filter = q_filter.filter(
            (ObraSocial.nombre.ilike(f"%{q}%")) |
            (ObraSocial.codigo.ilike(f"%{q}%"))
        )
    results = q_filter.order_by(ObraSocial.nombre).all()
    return {"obras_sociales": [_to_dict(o) for o in results]}


@router.get("/{os_id}")
def get_obra_social(
    os_id: int,
    empresa_id: int = Depends(resolve_empresa_id),
    db: Session = Depends(get_db),
):
    obj = db.query(ObraSocial).filter(
        ObraSocial.id == os_id, ObraSocial.empresa_id == empresa_id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Obra social no encontrada")
    return _to_dict(obj)


@router.post("/", status_code=201)
def create_obra_social(
    data: ObraSocialCreate,
    empresa_id: int = Depends(resolve_empresa_id),
    db: Session = Depends(get_db),
):
    existing = db.query(ObraSocial).filter(
        ObraSocial.codigo == data.codigo, ObraSocial.empresa_id == empresa_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Código '{data.codigo}' ya existe")
    obj = ObraSocial(
        empresa_id=empresa_id, nombre=data.nombre, codigo=data.codigo,
        rnic=data.rnic, tipo=data.tipo, cobertura_default=data.cobertura_default,
        activo=data.activo,
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_dict(obj)


@router.put("/{os_id}")
def update_obra_social(
    os_id: int,
    data: ObraSocialUpdate,
    empresa_id: int = Depends(resolve_empresa_id),
    db: Session = Depends(get_db),
):
    obj = db.query(ObraSocial).filter(
        ObraSocial.id == os_id, ObraSocial.empresa_id == empresa_id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Obra social no encontrada")
    if data.codigo is not None and data.codigo != obj.codigo:
        dup = db.query(ObraSocial).filter(
            ObraSocial.codigo == data.codigo, ObraSocial.empresa_id == empresa_id,
            ObraSocial.id != os_id
        ).first()
        if dup:
            raise HTTPException(status_code=409, detail=f"Código '{data.codigo}' ya existe")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return _to_dict(obj)


@router.delete("/{os_id}", status_code=204)
def delete_obra_social(
    os_id: int,
    empresa_id: int = Depends(resolve_empresa_id),
    db: Session = Depends(get_db),
):
    obj = db.query(ObraSocial).filter(
        ObraSocial.id == os_id, ObraSocial.empresa_id == empresa_id
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Obra social no encontrada")
    db.delete(obj)
    db.commit()
    return None
