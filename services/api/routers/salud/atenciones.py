"""
Atenciones Médicas routes: obtener por visita, crear, actualizar
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, AtencionMedica, Visita, AtencionCreate, AtencionUpdate, Medico,
    _dict_atencion, HTTPException,
)

router = salud_router

@router.get("/atenciones/visita/{visita_id}")
def obtener_atencion_por_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Buscar atención médica por visita_id. Permite al frontend detectar si ya hay atención creada."""
    medico_id_auth, es_admin, rol = medico_restriccion
    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.visita_id == visita_id,
        AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        return {"exists": False, "atencion": None}

    if medico_id_auth and not es_admin and atencion.medico_id != medico_id_auth:
        return {"exists": False, "atencion": None}

    return {"exists": True, "atencion": _dict_atencion(atencion, db=db)}

@router.post("/atenciones/", status_code=201)
def crear_atencion(
    request: Request,
    data: AtencionCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear una atencion medica completa. Actualiza visita si viene visita_id.
    Solo medico con acceso al paciente o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    if medico_id_auth and not es_admin:
        es_suyo = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == data.paciente_nuevo_id
        ).first()
        if data.medico_id != medico_id_auth and not es_suyo:
            raise HTTPException(403, "No tienes acceso a este paciente")

    visita_id = data.visita_id
    payload = data.model_dump()

    existente = db.query(AtencionMedica).filter(
        AtencionMedica.visita_id == visita_id
    ).first()
    if existente:
        for key, val in payload.items():
            if val is not None:
                setattr(existente, key, val)
        peso = existente.peso
        altura = existente.altura
        if peso and altura and altura > 0:
            existente.imc = round(peso / (altura ** 2), 2)
        existente.estado = "completado"
        db.commit()
        db.refresh(existente)
        return _dict_atencion(existente, db=db)

    peso = payload.get("peso")
    altura = payload.get("altura")
    if peso and altura and altura > 0:
        payload["imc"] = round(peso / (altura ** 2), 2)

    atencion = AtencionMedica(
        **payload,
        empresa_id=empresa_id
    )
    db.add(atencion)
    db.flush()

    if visita_id:
        visita = db.query(Visita).filter(
            Visita.id == visita_id, Visita.empresa_id == empresa_id
        ).first()
        if visita:
            visita.estado = "completado"
            db.flush()

    db.commit()
    db.refresh(atencion)

    return _dict_atencion(atencion, db=db)

@router.put("/atenciones/{atencion_id}/")
def actualizar_atencion(
    atencion_id: int,
    data: AtencionUpdate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Actualizar una atencion existente (evolucion, cierre, signos vitales).
    Solo el medico que atendio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == atencion_id, AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

    if medico_id_auth and not es_admin and atencion.medico_id != medico_id_auth:
        raise HTTPException(403, "No tienes acceso a esta atencion")

    payload = data.model_dump(exclude_unset=True)

    if "peso" in payload or "altura" in payload:
        peso = payload.get("peso", atencion.peso)
        altura = payload.get("altura", atencion.altura)
        if peso and altura and altura > 0:
            payload["imc"] = round(peso / (altura ** 2), 2)

    for key, val in payload.items():
        setattr(atencion, key, val)

    db.commit()
    db.refresh(atencion)
    return _dict_atencion(atencion, db=db)
