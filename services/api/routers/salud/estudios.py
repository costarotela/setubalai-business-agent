"""
Estudios adjuntos routes: listar, por paciente, crear/subir
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, EstudioAdjunto, Paciente, AtencionMedica, EstudioCreate,
    _dict_estudio, HTTPException,
)

router = salud_router

@router.get("/estudios_adjuntos/", response_model=List[dict])
def listar_estudios(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista estudios. Admin: todos. Médico: solo de pacientes atendidos."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    q = db.query(EstudioAdjunto).filter(EstudioAdjunto.empresa_id == empresa_id)
    if medico_id_auth and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).distinct().subquery()
        q = q.filter(EstudioAdjunto.paciente_nuevo_id.in_(db.query(pacientes_atendidos)))
    items = q.order_by(EstudioAdjunto.created_at.desc()).limit(200).all()
    
    result = []
    for e in items:
        d = _dict_estudio(e)
        pac = db.query(Paciente).filter(Paciente.id == (e.paciente_nuevo_id or e.paciente_id)).first()
        d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
        result.append(d)
    return result

@router.get("/pacientes/{paciente_id}/estudios/", response_model=List[dict])
def estudios_paciente(
    paciente_id: int,
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Todos los estudios adjuntos de un paciente específico. Solo medico con acceso."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == paciente_id
        ).first()
        if not atendido:
            raise HTTPException(403, "No tienes acceso a este paciente")
    items = db.query(EstudioAdjunto).filter(
        or_(EstudioAdjunto.paciente_nuevo_id == paciente_id, EstudioAdjunto.paciente_id == paciente_id),
        EstudioAdjunto.empresa_id == empresa_id
    ).order_by(EstudioAdjunto.created_at.desc()).all()
    
    return [_dict_estudio(e) for e in items]

# ===== ESTUDIOS ADJUNTOS POST =====

@router.post("/estudios_adjuntos/", status_code=201)
def crear_estudio(
    request: Request,
    data: EstudioCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Subir/crear un estudio adjunto.
    Solo medico que atendio al paciente o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    if medico_id_auth and not es_admin:
        es_suyo = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == data.paciente_nuevo_id
        ).first()
        if not es_suyo:
            raise HTTPException(403, "No tienes acceso a este paciente")

    estudio = EstudioAdjunto(
        **data.model_dump(),
        empresa_id=empresa_id
    )
    if not estudio.archivo_nombre:
        estudio.archivo_nombre = ""
    if not estudio.archivo_url:
        estudio.archivo_url = ""
    if not estudio.archivo_tipo:
        estudio.archivo_tipo = ""
    if not estudio.archivo_tamano_bytes:
        estudio.archivo_tamano_bytes = 0
    db.add(estudio)
    db.commit()
    db.refresh(estudio)
    return _dict_estudio(estudio)
