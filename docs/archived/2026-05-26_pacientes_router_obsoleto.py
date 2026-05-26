from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import or_
from database import get_db
from models import Paciente
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/pacientes", tags=["Salud - Pacientes"])

class PacienteCreate(BaseModel):
    nombre: str
    apellido: str
    dni: str
    fecha_nacimiento: str
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    obra_social: Optional[str] = None
    numero_afiliado: Optional[str] = None
    plan: Optional[str] = None

def _dict(p):
    return {
        "id": p.id,
        "nombre": p.nombre or "",
        "apellido": p.apellido or "",
        "dni": p.dni or "",
        "fecha_nacimiento": str(p.fecha_nacimiento) if p.fecha_nacimiento else None,
        "sexo": p.sexo or None,
        "telefono": p.telefono or None,
        "email": p.email or None,
        "direccion": p.direccion or None,
        "ciudad": p.ciudad or None,
        "provincia": p.provincia or None,
        "obra_social": p.obra_social or None,
        "numero_afiliado": p.numero_afiliado or None,
        "plan": p.plan or None,
        "activo": p.activo,
        "created_at": str(p.created_at) if p.created_at else None,
    }

@router.get("/")
def listar_pacientes(
    request: Request,
    buscar: Optional[str] = None,
    obra_social: Optional[str] = None,
    limit: int = Query(200, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    q = db.query(Paciente).filter(
        Paciente.empresa_id == empresa_id,
        Paciente.activo == True
    )
    if buscar:
        q = q.filter(or_(
            Paciente.nombre.ilike(f"%{buscar}%"),
            Paciente.apellido.ilike(f"%{buscar}%"),
            Paciente.dni.ilike(f"%{buscar}%"),
        ))
    if obra_social:
        q = q.filter(Paciente.obra_social.ilike(f"%{obra_social}%"))
    total = q.count()
    pacientes = q.order_by(Paciente.apellido, Paciente.nombre).offset(offset).limit(limit).all()
    return [_dict(p) for p in pacientes]

@router.get("/{paciente_id}")
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    return _dict(p)

@router.post("/", status_code=201)
def crear_paciente(
    request: Request,
    data: PacienteCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    p = Paciente(**{**data.model_dump(), "empresa_id": empresa_id, "activo": True})
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict(p)

@router.put("/{paciente_id}")
def actualizar_paciente(
    paciente_id: int,
    data: PacienteCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return _dict(p)

@router.delete("/{paciente_id}")
def eliminar_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    p.activo = False
    db.commit()
    return {"ok": True, "message": "Paciente desactivado (soft delete)"}
