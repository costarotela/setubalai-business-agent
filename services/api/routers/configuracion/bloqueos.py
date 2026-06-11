"""
Router: Configuración de Agenda — Bloqueos de Grilla
Gestión de excepciones (vacaciones, congresos)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, time, datetime
from database import get_db
from models import BloqueoGrilla, Medico
from auth import get_current_user

router = APIRouter(prefix="/configuracion-agenda/bloqueos-grilla", tags=["Configuración Agenda"])

# ============================================================================
# SCHEMAS
# ============================================================================

class BloqueoGrillaCreate(BaseModel):
    medico_id: int
    fecha_desde: date
    fecha_hasta: date
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    motivo: Optional[str] = None

class BloqueoGrillaResponse(BaseModel):
    id: int
    empresa_id: int
    medico_id: int
    medico_nombre: str
    medico_apellido: str
    fecha_desde: date
    fecha_hasta: date
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    motivo: Optional[str] = None

    class Config:
        from_attributes = True

class BloqueoGrillaUpdate(BaseModel):
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    motivo: Optional[str] = None

# ============================================================================
# HELPERS
# ============================================================================

def enriquecer_bloqueo(bloqueo: BloqueoGrilla, db: Session) -> dict:
    """Enriquece bloqueo con datos del médico"""
    medico = db.query(Medico).filter(Medico.id == bloqueo.medico_id).first()
    return {
        "id": bloqueo.id,
        "empresa_id": bloqueo.empresa_id,
        "medico_id": bloqueo.medico_id,
        "medico_nombre": medico.nombre if medico else "",
        "medico_apellido": medico.apellido if medico else "",
        "fecha_desde": bloqueo.fecha_desde,
        "fecha_hasta": bloqueo.fecha_hasta,
        "hora_inicio": bloqueo.hora_inicio.strftime("%H:%M") if bloqueo.hora_inicio else None,
        "hora_fin": bloqueo.hora_fin.strftime("%H:%M") if bloqueo.hora_fin else None,
        "motivo": bloqueo.motivo
    }

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
@router.get("", include_in_schema=False)
def listar_bloqueos(
    medico_id: Optional[int] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista bloqueos de agenda (vacaciones, congresos)"""
    query = db.query(BloqueoGrilla).filter(BloqueoGrilla.empresa_id == current_user.empresa_id)

    if medico_id:
        query = query.filter(BloqueoGrilla.medico_id == medico_id)
    if fecha_desde:
        query = query.filter(BloqueoGrilla.fecha_hasta >= fecha_desde)

    bloqueos = query.order_by(BloqueoGrilla.fecha_desde).all()
    return [enriquecer_bloqueo(b, db) for b in bloqueos]

@router.post("/", response_model=BloqueoGrillaResponse, status_code=201)
@router.post("", include_in_schema=False)
def crear_bloqueo(
    bloqueo: BloqueoGrillaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea bloqueo de agenda"""

    # Validar médico
    medico = db.query(Medico).filter(
        Medico.id == bloqueo.medico_id,
        Medico.empresa_id == current_user.empresa_id
    ).first()

    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")

    # Validar fechas
    if bloqueo.fecha_hasta < bloqueo.fecha_desde:
        raise HTTPException(status_code=400, detail="fecha_hasta debe ser >= fecha_desde")

    # Crear bloqueo
    nuevo_bloqueo = BloqueoGrilla(
        empresa_id=current_user.empresa_id,
        medico_id=bloqueo.medico_id,
        fecha_desde=bloqueo.fecha_desde,
        fecha_hasta=bloqueo.fecha_hasta,
        hora_inicio=datetime.combine(date.today(), bloqueo.hora_inicio) if bloqueo.hora_inicio else None,
        hora_fin=datetime.combine(date.today(), bloqueo.hora_fin) if bloqueo.hora_fin else None,
        motivo=bloqueo.motivo
    )

    db.add(nuevo_bloqueo)
    db.commit()
    db.refresh(nuevo_bloqueo)

    return enriquecer_bloqueo(nuevo_bloqueo, db)

@router.delete("/{bloqueo_id}", status_code=204)
def eliminar_bloqueo(
    bloqueo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina bloqueo de agenda"""

    bloqueo = db.query(BloqueoGrilla).filter(
        BloqueoGrilla.id == bloqueo_id,
        BloqueoGrilla.empresa_id == current_user.empresa_id
    ).first()

    if not bloqueo:
        raise HTTPException(status_code=404, detail="Bloqueo no encontrado")

    db.delete(bloqueo)
    db.commit()

    return None

@router.put("/{bloqueo_id}", response_model=BloqueoGrillaResponse)
def actualizar_bloqueo(
    bloqueo_id: int,
    bloqueo_data: BloqueoGrillaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza bloqueo de agenda"""

    bloqueo = db.query(BloqueoGrilla).filter(
        BloqueoGrilla.id == bloqueo_id,
        BloqueoGrilla.empresa_id == current_user.empresa_id
    ).first()

    if not bloqueo:
        raise HTTPException(status_code=404, detail="Bloqueo no encontrado")

    if bloqueo_data.fecha_desde is not None:
        bloqueo.fecha_desde = bloqueo_data.fecha_desde
    if bloqueo_data.fecha_hasta is not None:
        bloqueo.fecha_hasta = bloqueo_data.fecha_hasta
    if bloqueo_data.hora_inicio is not None:
        bloqueo.hora_inicio = datetime.combine(date.today(), bloqueo_data.hora_inicio)
    if bloqueo_data.hora_fin is not None:
        bloqueo.hora_fin = datetime.combine(date.today(), bloqueo_data.hora_fin)
    if bloqueo_data.motivo is not None:
        bloqueo.motivo = bloqueo_data.motivo

    db.commit()
    db.refresh(bloqueo)

    return enriquecer_bloqueo(bloqueo, db)
