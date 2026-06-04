"""
Router: Configuración de Agenda (Grillas, Bloqueos, Duraciones)
Gestión de horarios médicos, excepciones y duraciones de turnos
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, time, datetime
from database import get_db
from models import GrillaMedica, BloqueoGrilla, DuracionPrestacion, Medico
from auth import get_current_user

router = APIRouter(prefix="/configuracion-agenda", tags=["Configuración Agenda"])

# ============================================================================
# SCHEMAS
# ============================================================================

class GrillaMedicaCreate(BaseModel):
    medico_id: int
    dia_semana: int  # 1=Lunes, 7=Domingo
    hora_inicio: time
    hora_fin: time
    activo: bool = True

class GrillaMedicaUpdate(BaseModel):
    dia_semana: Optional[int] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    activo: Optional[bool] = None

class GrillaMedicaResponse(BaseModel):
    id: int
    empresa_id: int
    medico_id: int
    medico_nombre: str
    medico_apellido: str
    dia_semana: int
    dia_semana_nombre: str
    hora_inicio: str
    hora_fin: str
    activo: bool

    class Config:
        from_attributes = True

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
# HELPERS
# ============================================================================

DIA_SEMANA_NOMBRES = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo"
}

def enriquecer_grilla(grilla: GrillaMedica, db: Session) -> dict:
    """Enriquece grilla con datos del médico"""
    medico = db.query(Medico).filter(Medico.id == grilla.medico_id).first()
    return {
        "id": grilla.id,
        "empresa_id": grilla.empresa_id,
        "medico_id": grilla.medico_id,
        "medico_nombre": medico.nombre if medico else "",
        "medico_apellido": medico.apellido if medico else "",
        "dia_semana": grilla.dia_semana,
        "dia_semana_nombre": DIA_SEMANA_NOMBRES.get(grilla.dia_semana, ""),
        "hora_inicio": grilla.hora_inicio.strftime("%H:%M") if grilla.hora_inicio else "",
        "hora_fin": grilla.hora_fin.strftime("%H:%M") if grilla.hora_fin else "",
        "activo": grilla.activo
    }

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
# ENDPOINTS: GRILLAS MÉDICAS
# ============================================================================

@router.get("/grillas-medicas/", response_model=List[GrillaMedicaResponse])
def listar_grillas(
    medico_id: Optional[int] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lista grillas médicas (horarios base)"""
    query = db.query(GrillaMedica).filter(GrillaMedica.empresa_id == current_user.empresa_id)
    
    if medico_id:
        query = query.filter(GrillaMedica.medico_id == medico_id)
    if activo is not None:
        query = query.filter(GrillaMedica.activo == activo)
    
    grillas = query.order_by(GrillaMedica.medico_id, GrillaMedica.dia_semana, GrillaMedica.hora_inicio).all()
    return [enriquecer_grilla(g, db) for g in grillas]

@router.post("/grillas-medicas/", response_model=GrillaMedicaResponse, status_code=201)
def crear_grilla(
    grilla: GrillaMedicaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea horario de atención para un médico"""
    
    # Validar que médico pertenece a la empresa
    medico = db.query(Medico).filter(
        Medico.id == grilla.medico_id,
        Medico.empresa_id == current_user.empresa_id
    ).first()
    
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    
    # Validar rango horario
    if grilla.hora_fin <= grilla.hora_inicio:
        raise HTTPException(status_code=400, detail="hora_fin debe ser mayor a hora_inicio")
    
    # Crear grilla
    nueva_grilla = GrillaMedica(
        empresa_id=current_user.empresa_id,
        medico_id=grilla.medico_id,
        dia_semana=grilla.dia_semana,
        hora_inicio=datetime.combine(date.today(), grilla.hora_inicio),
        hora_fin=datetime.combine(date.today(), grilla.hora_fin),
        activo=grilla.activo
    )
    
    db.add(nueva_grilla)
    db.commit()
    db.refresh(nueva_grilla)
    
    return enriquecer_grilla(nueva_grilla, db)

@router.put("/grillas-medicas/{grilla_id}", response_model=GrillaMedicaResponse)
def actualizar_grilla(
    grilla_id: int,
    grilla: GrillaMedicaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza horario de atención"""
    
    grilla_db = db.query(GrillaMedica).filter(
        GrillaMedica.id == grilla_id,
        GrillaMedica.empresa_id == current_user.empresa_id
    ).first()
    
    if not grilla_db:
        raise HTTPException(status_code=404, detail="Grilla no encontrada")
    
    # Aplicar cambios
    if grilla.dia_semana is not None:
        grilla_db.dia_semana = grilla.dia_semana
    if grilla.hora_inicio is not None:
        grilla_db.hora_inicio = datetime.combine(date.today(), grilla.hora_inicio)
    if grilla.hora_fin is not None:
        grilla_db.hora_fin = datetime.combine(date.today(), grilla.hora_fin)
    if grilla.activo is not None:
        grilla_db.activo = grilla.activo
    
    grilla_db.updated_at = datetime.now()
    
    db.commit()
    db.refresh(grilla_db)
    
    return enriquecer_grilla(grilla_db, db)

@router.delete("/grillas-medicas/{grilla_id}", status_code=204)
def eliminar_grilla(
    grilla_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina horario de atención"""
    
    grilla = db.query(GrillaMedica).filter(
        GrillaMedica.id == grilla_id,
        GrillaMedica.empresa_id == current_user.empresa_id
    ).first()
    
    if not grilla:
        raise HTTPException(status_code=404, detail="Grilla no encontrada")
    
    db.delete(grilla)
    db.commit()
    
    return None

# ============================================================================
# ENDPOINTS: BLOQUEOS GRILLA
# ============================================================================

@router.get("/bloqueos-grilla/", response_model=List[BloqueoGrillaResponse])
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

@router.post("/bloqueos-grilla/", response_model=BloqueoGrillaResponse, status_code=201)
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

@router.delete("/bloqueos-grilla/{bloqueo_id}", status_code=204)
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

@router.put("/bloqueos-grilla/{bloqueo_id}", response_model=BloqueoGrillaResponse)
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
        bloqueo.hora_inicio = bloqueo_data.hora_inicio
    if bloqueo_data.hora_fin is not None:
        bloqueo.hora_fin = bloqueo_data.hora_fin
    if bloqueo_data.motivo is not None:
        bloqueo.motivo = bloqueo_data.motivo
    
    db.commit()
    db.refresh(bloqueo)
    
    return enriquecer_bloqueo(bloqueo, db)

# ============================================================================
# ENDPOINTS: DURACIONES POR ESPECIALIDAD
# ============================================================================

@router.get("/duracion-prestaciones/", response_model=List[DuracionPrestacionResponse])
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

@router.put("/duracion-prestaciones/{duracion_id}", response_model=DuracionPrestacionResponse)
def actualizar_duracion(
    duracion_id: int,
    duracion: DuracionPrestacionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza duración de turno para una especialidad"""
    
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

@router.post("/duracion-prestaciones/", status_code=201)
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

@router.delete("/duracion-prestaciones/{duracion_id}/")
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
