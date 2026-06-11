"""
Router: Configuración de Agenda — Duraciones de Prestaciones
Gestión de duraciones de turno por especialidad
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models import DuracionPrestacion
from auth import get_current_user

router = APIRouter(prefix="/configuracion-agenda/duracion-prestaciones", tags=["Configuración Agenda"])

# ============================================================================
# SCHEMAS
# ============================================================================

class DuracionPrestacionCreate(BaseModel):
    especialidad_id: Optional[int] = None
    duracion_minutos: int = 30
    sobre_turnos_permitidos: int = 1

class DuracionPrestacionUpdate(BaseModel):
    duracion_minutos: int
    sobre_turnos_permitidos: Optional[int] = 0

class DuracionPrestacionResponse(BaseModel):
    id: int
    empresa_id: int
    especialidad: str
    duracion_minutos: int
    sobre_turnos_permitidos: int

    class Config:
        from_attributes = True

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
@router.get("", include_in_schema=False)
def listar_duraciones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista duraciones de turno por especialidad"""
    from models import EspecialidadMedica
    results = db.query(DuracionPrestacion, EspecialidadMedica.nombre).outerjoin(
        EspecialidadMedica,
        DuracionPrestacion.especialidad_id == EspecialidadMedica.id
    ).filter(
        DuracionPrestacion.empresa_id == current_user.empresa_id
    ).order_by(DuracionPrestacion.especialidad_id).all()

    return [
        DuracionPrestacionResponse(
            id=d.id,
            empresa_id=d.empresa_id,
            especialidad=especialidad or "Sin asignar",
            duracion_minutos=d.duracion_minutos,
            sobre_turnos_permitidos=d.sobre_turnos_permitidos,
        )
        for d, especialidad in results
    ]

@router.put("/{duracion_id}", response_model=DuracionPrestacionResponse)
def actualizar_duracion(
    duracion_id: int,
    duracion: DuracionPrestacionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza duración de turno para una especialidad"""
    from datetime import datetime

    duracion_db = db.query(DuracionPrestacion).filter(
        DuracionPrestacion.id == duracion_id,
        DuracionPrestacion.empresa_id == current_user.empresa_id
    ).first()

    if not duracion_db:
        raise HTTPException(status_code=404, detail="Duración no encontrada")

    duracion_db.duracion_minutos = duracion.duracion_minutos
    if duracion.sobre_turnos_permitidos is not None:
        duracion_db.sobre_turnos_permitidos = duracion.sobre_turnos_permitidos

    duracion_db.updated_at = datetime.now()

    db.commit()
    db.refresh(duracion_db)

    return duracion_db

@router.post("/", status_code=201)
def crear_duracion(
    data: DuracionPrestacionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea una nueva duración de turno para una especialidad"""
    from sqlalchemy import text
    result = db.execute(text(
        "INSERT INTO setubalai.duracion_prestaciones (empresa_id, especialidad_id, duracion_minutos, sobre_turnos_permitidos) "
        "VALUES (:emp, :esp, :dur, :sobre) RETURNING id"
    ), {"emp": current_user.empresa_id, "esp": data.especialidad_id, "dur": data.duracion_minutos, "sobre": data.sobre_turnos_permitidos})
    db.commit()
    new_id = result.scalar()
    # Return via existing endpoint
    d = db.execute(text(
        "SELECT dp.id, dp.empresa_id, dp.duracion_minutos, dp.sobre_turnos_permitidos, e.nombre as esp "
        "FROM setubalai.duracion_prestaciones dp LEFT JOIN setubalai.especialidades_medicas e ON dp.especialidad_id = e.id "
        "WHERE dp.id = :id"
    ), {"id": new_id}).mappings().first()
    return {"id": d["id"], "empresa_id": d["empresa_id"], "especialidad": d["esp"] or "Sin asignar", "duracion_minutos": d["duracion_minutos"], "sobre_turnos_permitidos": d["sobre_turnos_permitidos"]}

@router.delete("/{duracion_id}/")
@router.delete("/{duracion_id}", include_in_schema=False)
def borrar_duracion(
    duracion_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina una duración de turno de especialidad"""
    from sqlalchemy import text
    result = db.execute(text(
        "DELETE FROM setubalai.duracion_prestaciones WHERE id = :id AND empresa_id = :emp"
    ), {"id": duracion_id, "emp": current_user.empresa_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Duración no encontrada")
    return {"deleted": True, "id": duracion_id}
