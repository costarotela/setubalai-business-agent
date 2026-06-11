"""
Historia Clínica routes: listar historias, mis_pacientes
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy import func

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, HistoriaClinica, Paciente, AtencionMedica, Medico,
    _dict_historia, _dict_paciente, HTTPException,
)

router = salud_router

# ===== HISTORIA CLÍNICA =====
@router.get("/historia_clinica/", response_model=List[dict])
def listar_historias(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion = Depends(get_medico_restriction)
):
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    
    q = db.query(HistoriaClinica).filter(
        HistoriaClinica.empresa_id == empresa_id
    )
    
    if medico_id_auth and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(HistoriaClinica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)))
    elif not medico_id_auth and not es_admin:
        return []
    
    historias = q.order_by(HistoriaClinica.updated_at.desc()).limit(100).all()

    result = []
    for h in historias:
        d = _dict_historia(h)
        pac = db.query(Paciente).filter(Paciente.id == (h.paciente_nuevo_id or h.paciente_id)).first()
        d["paciente"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
        d["dni_paciente"] = pac.dni if pac else ""
        result.append(d)
    return result

# ===== ACCESO DIRECTO: pacientes de un médico =====
@router.get("/mis_pacientes/", response_model=List[dict])
def mis_pacientes(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion = Depends(get_medico_restriction)
):
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    
    if es_admin:
        pacientes = db.query(Paciente).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.activo == True
        ).order_by(Paciente.apellido, Paciente.nombre).all()
    elif medico_id_auth:
        query = db.query(Paciente).join(
            AtencionMedica, Paciente.id == AtencionMedica.paciente_nuevo_id
        ).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.activo == True,
            AtencionMedica.medico_id == medico_id_auth
        ).distinct().order_by(Paciente.apellido, Paciente.nombre)
        pacientes = query.all()
    else:
        return []
    
    result = []
    for p in pacientes:
        d = _dict_paciente(p)
        cant_atenciones = db.query(func.count(AtencionMedica.id)).filter(
            AtencionMedica.paciente_nuevo_id == p.id
        ).scalar() or 0
        d["cant_atenciones"] = cant_atenciones
        
        ultima_atencion = db.query(AtencionMedica).filter(
            AtencionMedica.paciente_nuevo_id == p.id
        ).order_by(AtencionMedica.fecha_hora_inicio.desc()).first()
        if ultima_atencion:
            med = db.query(Medico).filter(Medico.id == ultima_atencion.medico_id).first()
            d["ultimo_medico"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
            d["ultima_fecha"] = str(ultima_atencion.fecha_hora_inicio)[:16] if ultima_atencion.fecha_hora_inicio else ""
        
        result.append(d)
    return result
