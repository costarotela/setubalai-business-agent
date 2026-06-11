"""
Médicos routes: listar, crear, editar, eliminar
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, Medico, MedicoEspecialidades, Visita, AtencionMedica, MedicoCreate,
    _dict_medico, HTTPException,
)

router = salud_router

@router.get("/medicos/", response_model=List[dict])
def listar_medicos(
    request: Request,
    especialidad_id: Optional[int] = None,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    if especialidad_id:
        medicos = db.query(Medico).join(
            MedicoEspecialidades, Medico.id == MedicoEspecialidades.medico_id
        ).filter(
            Medico.empresa_id == empresa_id,
            Medico.activo == True,
            MedicoEspecialidades.especialidad_id == especialidad_id
        ).order_by(Medico.apellido).all()
    else:
        medicos = db.query(Medico).filter(
            Medico.empresa_id == empresa_id,
            Medico.activo == True
        ).order_by(Medico.apellido).all()
    return [_dict_medico(m, db) for m in medicos]

@router.post("/medicos/", status_code=201)
def crear_medico(
    request: Request,
    data: MedicoCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear médico. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden crear médicos")
    md = data.model_dump(exclude={"especialidades", "email", "telefono"})
    m = Medico(**{**md, "empresa_id": empresa_id, "activo": True})
    db.add(m)
    db.commit()
    db.refresh(m)
    if data.especialidades:
        for esp_id in data.especialidades:
            me = MedicoEspecialidades(medico_id=m.id, especialidad_id=esp_id)
            db.add(me)
        db.commit()
        db.refresh(m)
    return _dict_medico(m, db)

@router.put("/medicos/{medico_id}/")
def editar_medico(
    medico_id: int,
    data: MedicoCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Editar médico. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden editar médicos")
    m = db.query(Medico).filter(Medico.id == medico_id, Medico.empresa_id == empresa_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    for key, val in data.model_dump().items():
        if key == "especialidades":
            continue
        if val is not None:
            setattr(m, key, val)
    db.commit()
    if data.especialidades is not None:
        db.query(MedicoEspecialidades).filter(
            MedicoEspecialidades.medico_id == medico_id
        ).delete()
        for esp_id in data.especialidades:
            db.add(MedicoEspecialidades(medico_id=medico_id, especialidad_id=esp_id))
        db.commit()
    db.refresh(m)
    return _dict_medico(m, db)

@router.delete("/medicos/{medico_id}/")
def eliminar_medico(
    medico_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Eliminar médico. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden eliminar médicos")
    m = db.query(Medico).filter(Medico.id == medico_id, Medico.empresa_id == empresa_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
    count_turnos = db.query(Visita).filter(Visita.medico_id == medico_id).count()
    count_atenciones = db.query(AtencionMedica).filter(
        AtencionMedica.medico_id == medico_id
    ).count()
    db.delete(m)
    db.commit()
    return {
        "deleted": True,
        "medico_id": medico_id,
        "impacto": {
            "turnos_eliminados": count_turnos,
            "atenciones_eliminadas": count_atenciones,
        },
    }
