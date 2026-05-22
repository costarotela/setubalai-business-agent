from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import get_db
from models import Cliente, Interaccion
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/clientes", tags=["CRM"])

class ClienteCreate(BaseModel):
    nombre: str
    empresa_nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: str = "Argentina"
    estado: str = "activo"
    tipo: str = "empresa"
    notas: Optional[str] = None
    fuente: Optional[str] = None
    cuit: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    banco: Optional[str] = None
    contacto_nombre: Optional[str] = None
    instagram: Optional[str] = None
    web: Optional[str] = None
    limite_credito: float = 0
    descuento_pct: float = 0
class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    empresa_nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    estado: Optional[str] = None
    notas: Optional[str] = None
    cuit: Optional[str] = None
    cbu: Optional[str] = None
    alias_cbu: Optional[str] = None
    banco: Optional[str] = None
    contacto_nombre: Optional[str] = None
    instagram: Optional[str] = None
    web: Optional[str] = None
    limite_credito: Optional[float] = None
    descuento_pct: Optional[float] = None
    ciudad: Optional[str] = None

def _dict(c):
    return {
        "id": c.id,
        "nombre": c.nombre,
        "empresa_nombre": c.empresa_nombre or "",
        "email": c.email or "",
        "telefono": c.telefono or "",
        "direccion": c.direccion or "",
        "ciudad": c.ciudad or "",
        "pais": c.pais or "Argentina",
        "estado": c.estado or "activo",
        "tipo": c.tipo or "empresa",
        "valor_total": float(c.valor_total or 0),
        "notas": c.notas or "",
        "cuit": c.cuit or "",
        "cbu": c.cbu or "",
        "alias_cbu": c.alias_cbu or "",
        "banco": c.banco or "",
        "contacto_nombre": c.contacto_nombre or c.nombre,
        "instagram": c.instagram or "",
        "web": c.web or "",
        "limite_credito": float(c.limite_credito or 0),
        "descuento_pct": float(c.descuento_pct or 0),
        "created_at": str(c.created_at) if c.created_at else None,
    }

@router.get("/")
def listar_clientes(
    request: Request,
    estado: Optional[str] = None,
    ciudad: Optional[str] = None,
    tipo: Optional[str] = None,
    buscar: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    q = db.query(Cliente).filter(Cliente.empresa_id == empresa_id)
    if estado:
        q = q.filter(Cliente.estado == estado)
    if ciudad:
        q = q.filter(Cliente.ciudad.ilike(f"%{ciudad}%"))
    if tipo:
        q = q.filter(Cliente.tipo == tipo)
    if buscar:
        q = q.filter(or_(
            Cliente.nombre.ilike(f"%{buscar}%"),
            Cliente.empresa_nombre.ilike(f"%{buscar}%"),
            Cliente.email.ilike(f"%{buscar}%"),
            Cliente.cuit.ilike(f"%{buscar}%"),
            Cliente.contacto_nombre.ilike(f"%{buscar}%"),
        ))
    total = q.count()
    clientes = q.order_by(Cliente.nombre).offset(offset).limit(limit).all()
    return {"total": total, "clientes": [_dict(c) for c in clientes]}

@router.get("/morosos")
def morosos(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    clientes = db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.estado == "moroso"
    ).all()
    return {"total": len(clientes), "clientes": [_dict(c) for c in clientes]}

@router.get("/stats")
def stats(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    total = db.query(func.count(Cliente.id)).filter(Cliente.empresa_id == empresa_id).scalar()
    activos = db.query(func.count(Cliente.id)).filter(Cliente.empresa_id == empresa_id, Cliente.estado == "activo").scalar()
    morosos = db.query(func.count(Cliente.id)).filter(Cliente.empresa_id == empresa_id, Cliente.estado == "moroso").scalar()
    prospectos = db.query(func.count(Cliente.id)).filter(Cliente.empresa_id == empresa_id, Cliente.estado == "prospecto").scalar()
    valor = db.query(func.sum(Cliente.valor_total)).filter(Cliente.empresa_id == empresa_id).scalar()
    return {"total": total, "activos": activos, "morosos": morosos, "prospectos": prospectos, "valor_total": float(valor or 0)}

@router.get("/{cliente_id}")
def obtener(cliente_id: int, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    return _dict(c)

@router.get("/{cliente_id}/historial")
def historial(cliente_id: int, db: Session = Depends(get_db)):
    interacciones = db.query(Interaccion).filter(
        Interaccion.cliente_id == cliente_id
    ).order_by(Interaccion.fecha.desc()).limit(20).all()
    return {"interacciones": [{"id": i.id, "tipo": i.tipo, "descripcion": i.descripcion, "fecha": str(i.fecha)} for i in interacciones]}

@router.post("/", status_code=201)
def crear(request: Request, data: ClienteCreate, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    c = Cliente(**{**data.model_dump(), "empresa_id": empresa_id})
    db.add(c)
    db.commit()
    db.refresh(c)
    return _dict(c)

@router.put("/{cliente_id}")
def actualizar(cliente_id: int, data: ClienteUpdate, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.now()
    db.commit()
    db.refresh(c)
    return _dict(c)

@router.delete("/{cliente_id}")
def eliminar(cliente_id: int, db: Session = Depends(get_db)):
    c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    db.delete(c)
    db.commit()
    return {"ok": True}