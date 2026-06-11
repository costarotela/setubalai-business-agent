"""
Router: Configuración de Agenda — Grillas Médicas
Gestión de horarios médicos base

Jerarquía: Clínica → Especialidad (obligatoria) → Profesional (opcional)
- Especialidad sola: configura para TODOS los médicos de esa especialidad
- Especialidad + médico: configura SOLO para ese médico (granular)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, time, datetime
from database import get_db
from models import GrillaMedica, Medico, MedicoEspecialidades, EspecialidadMedica
from auth import get_current_user

router = APIRouter(prefix="/configuracion-agenda/grillas-medicas", tags=["Configuración Agenda"])

# ============================================================================
# SCHEMAS
# ============================================================================

class GrillaMedicaCreate(BaseModel):
    especialidad_id: int  # OBLIGATORIO
    medico_id: Optional[int] = None  # Opcional (None = para toda la especialidad)
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
    especialidad_id: Optional[int]
    especialidad_nombre: str
    medico_id: Optional[int]
    medico_nombre: str
    medico_apellido: str
    dia_semana: int
    dia_semana_nombre: str
    hora_inicio: str
    hora_fin: str
    activo: bool

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
    """Enriquece grilla con datos del médico y especialidad."""
    medico = db.query(Medico).filter(Medico.id == grilla.medico_id).first() if grilla.medico_id else None
    esp = grilla.especialidad
    if not esp and grilla.especialidad_id:
        esp = db.query(EspecialidadMedica).filter(EspecialidadMedica.id == grilla.especialidad_id).first()
    return {
        "id": grilla.id,
        "empresa_id": grilla.empresa_id,
        "especialidad_id": grilla.especialidad_id,
        "especialidad_nombre": esp.nombre if esp else "",
        "medico_id": grilla.medico_id,
        "medico_nombre": medico.nombre if medico else "",
        "medico_apellido": medico.apellido if medico else "",
        "dia_semana": grilla.dia_semana,
        "dia_semana_nombre": DIA_SEMANA_NOMBRES.get(grilla.dia_semana, ""),
        "hora_inicio": grilla.hora_inicio.strftime("%H:%M") if grilla.hora_inicio else "",
        "hora_fin": grilla.hora_fin.strftime("%H:%M") if grilla.hora_fin else "",
        "activo": grilla.activo
    }

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
@router.get("", include_in_schema=False)
def listar_grillas(
    especialidad_id: int = Query(..., description="ID de especialidad (obligatorio)"),
    medico_id: Optional[int] = Query(None, description="ID de médico específico (opcional)"),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Lista grillas médicas filtradas por especialidad.
    
    especialidad_id: OBLIGATORIO — filtra por especialidad
    medico_id: opcional — si se pasa, filtra por médico específico dentro de esa especialidad
    """
    query = db.query(GrillaMedica).filter(
        GrillaMedica.empresa_id == current_user.empresa_id,
        GrillaMedica.especialidad_id == especialidad_id
    )
    
    if medico_id:
        query = query.filter(GrillaMedica.medico_id == medico_id)
    if activo is not None:
        query = query.filter(GrillaMedica.activo == activo)
    
    grillas = query.order_by(GrillaMedica.medico_id, GrillaMedica.dia_semana, GrillaMedica.hora_inicio).all()
    return [enriquecer_grilla(g, db) for g in grillas]


@router.post("/", response_model=GrillaMedicaResponse, status_code=201)
@router.post("", include_in_schema=False)
def crear_grilla(
    grilla: GrillaMedicaCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea horario de atención para una especialidad (con o sin médico específico)."""
    
    # Validar que la especialidad pertenece a la empresa
    esp = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == grilla.especialidad_id,
        EspecialidadMedica.empresa_id == current_user.empresa_id
    ).first()
    if not esp:
        raise HTTPException(status_code=404, detail="Especialidad no encontrada")
    
    # Si hay médico, validar que pertenece a esa especialidad
    if grilla.medico_id:
        rel = db.query(MedicoEspecialidades).filter(
            MedicoEspecialidades.medico_id == grilla.medico_id,
            MedicoEspecialidades.especialidad_id == grilla.especialidad_id
        ).first()
        if not rel:
            raise HTTPException(status_code=400, detail="El médico no pertenece a esta especialidad")
        
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
        especialidad_id=grilla.especialidad_id,
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


@router.put("/{grilla_id}", response_model=GrillaMedicaResponse)
def actualizar_grilla(
    grilla_id: int,
    grilla: GrillaMedicaUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza horario de atención."""
    
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


@router.delete("/{grilla_id}", status_code=204)
def eliminar_grilla(
    grilla_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina horario de atención."""
    
    grilla = db.query(GrillaMedica).filter(
        GrillaMedica.id == grilla_id,
        GrillaMedica.empresa_id == current_user.empresa_id
    ).first()
    
    if not grilla:
        raise HTTPException(status_code=404, detail="Grilla no encontrada")
    
    db.delete(grilla)
    db.commit()
    
    return None


class ProvisionarGrillaRequest(BaseModel):
    medico_id: int
    especialidad_id: int

@router.post("/provisionar/", status_code=201)
@router.post("/provisionar", include_in_schema=False)
def provisionar_grilla_default(
    datos: ProvisionarGrillaRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crea grilla default para un médico nuevo.
    Lunes a Viernes 8:00-18:00, Sábado 8:00-13:00.
    """
    # Validar médico
    medico = db.query(Medico).filter(
        Medico.id == datos.medico_id,
        Medico.empresa_id == current_user.empresa_id
    ).first()
    if not medico:
        raise HTTPException(404, "Médico no encontrado")
    
    # Validar que el médico pertenece a esta especialidad
    rel = db.query(MedicoEspecialidades).filter(
        MedicoEspecialidades.medico_id == datos.medico_id,
        MedicoEspecialidades.especialidad_id == datos.especialidad_id
    ).first()
    if not rel:
        raise HTTPException(400, "El médico no pertenece a esta especialidad")
    
    # Verificar si ya tiene grilla para evitar duplicados
    existentes = db.query(GrillaMedica).filter(
        GrillaMedica.medico_id == datos.medico_id,
        GrillaMedica.especialidad_id == datos.especialidad_id
    ).count()
    if existentes > 0:
        raise HTTPException(409, f"El médico ya tiene {existentes} grilla(s) configurada(s)")
    
    # Horarios default
    dias_default = [
        (1, "08:00", "18:00"),  # Lunes
        (2, "08:00", "18:00"),  # Martes
        (3, "08:00", "18:00"),  # Miércoles
        (4, "08:00", "18:00"),  # Jueves
        (5, "08:00", "18:00"),  # Viernes
        (6, "08:00", "13:00"),  # Sábado
    ]
    
    creadas = []
    for dia, inicio, fin in dias_default:
        desde = datetime.strptime(inicio, "%H:%M").replace(year=2000, month=1, day=1)
        hasta = datetime.strptime(fin, "%H:%M").replace(year=2000, month=1, day=1)
        nueva = GrillaMedica(
            empresa_id=current_user.empresa_id,
            especialidad_id=datos.especialidad_id,
            medico_id=datos.medico_id,
            dia_semana=dia,
            hora_inicio=desde,
            hora_fin=hasta,
            activo=True
        )
        db.add(nueva)
        creadas.append(DIA_SEMANA_NOMBRES.get(dia, f"Día {dia}"))
    
    db.commit()
    
    return {
        "medico_id": datos.medico_id,
        "medico_nombre": f"{medico.nombre} {medico.apellido}",
        "especialidad_id": datos.especialidad_id,
        "grillas_creadas": len(creadas),
        "dias": creadas
    }
