from fastapi import APIRouter, Depends, HTTPException, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Proveedor
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

class ProveedorCreate(BaseModel):
    nombre: str
    contacto_nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    notas: Optional[str] = None
    cuit: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    banco: Optional[str] = None
    condiciones_pago: Optional[str] = None
    descuento_pct: float = 0
    categoria: Optional[str] = None
    web: Optional[str] = None
    instagram: Optional[str] = None

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto_nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None
    cuit: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    banco: Optional[str] = None
    condiciones_pago: Optional[str] = None
    descuento_pct: Optional[float] = None
    categoria: Optional[str] = None

def _dict(p):
    return {
        "id": p.id,
        "nombre": p.nombre,
        "contacto_nombre": p.contacto_nombre or "",
        "email": p.email or "",
        "telefono": p.telefono or "",
        "notas": p.notas or "",
        "activo": p.activo,
        "cuit": p.cuit or "",
        "cbu": p.cbu or "",
        "alias_cbu": p.alias_cbu or "",
        "banco": p.banco or "",
        "condiciones_pago": p.condiciones_pago or "",
        "descuento_pct": float(p.descuento_pct or 0),
        "categoria": p.categoria or "",
        "web": p.web or "",
        "instagram": p.instagram or "",
        "created_at": str(p.created_at) if p.created_at else None,
    }

@router.get("/")
def listar(
    categoria: Optional[str] = None,
    buscar: Optional[str] = None,
    empresa_id: int = 1,
    db: Session = Depends(get_db)
):
    q = db.query(Proveedor).filter(
        Proveedor.empresa_id == empresa_id,
        Proveedor.activo == True
    )
    if categoria:
        q = q.filter(Proveedor.categoria.ilike(f"%{categoria}%"))
    if buscar:
        q = q.filter(or_(
            Proveedor.nombre.ilike(f"%{buscar}%"),
            Proveedor.contacto_nombre.ilike(f"%{buscar}%"),
            Proveedor.cuit.ilike(f"%{buscar}%"),
            Proveedor.email.ilike(f"%{buscar}%"),
        ))
    provs = q.order_by(Proveedor.nombre).all()
    return {"total": len(provs), "proveedores": [_dict(p) for p in provs]}

@router.get("/{proveedor_id}")
def obtener(proveedor_id: int, db: Session = Depends(get_db)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    return _dict(p)

@router.post("/", status_code=201)
def crear(data: ProveedorCreate, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    p = Proveedor(**{**data.model_dump(), "empresa_id": empresa_id})
    p.activo = True
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict(p)

@router.put("/{proveedor_id}")
def actualizar(proveedor_id: int, data: ProveedorUpdate, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id, Proveedor.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    p.updated_at = datetime.now()
    db.commit()
    db.refresh(p)
    return _dict(p)

@router.delete("/{proveedor_id}")
def eliminar(proveedor_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    p = db.query(Proveedor).filter(Proveedor.id == proveedor_id, Proveedor.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Proveedor no encontrado")
    p.activo = False
    db.commit()
    return {"ok": True}