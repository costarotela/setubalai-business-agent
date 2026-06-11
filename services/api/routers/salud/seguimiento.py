"""
Seguimiento Automático routes: crear turno de seguimiento post-atención
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, SeguimientoCreate, Visita, AtencionMedica, Medico,
    HTTPException,
)

router = salud_router

@router.post("/seguimiento/", status_code=201)
def crear_seguimiento(
    request: Request,
    data: SeguimientoCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Generar proximo turno post-atencion para seguimiento.
    Solo medico que atendio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    if medico_id_auth and not es_admin:
        if not db.query(AtencionMedica).filter(
            AtencionMedica.id == data.atencion_id,
            AtencionMedica.medico_id == medico_id_auth
        ).first():
            raise HTTPException(403, "No puedes crear seguimiento de una atencion ajena")

    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == data.atencion_id,
        AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

    ahora = datetime.now()
    fecha_futura = ahora + timedelta(days=data.dias_seguimiento)

    medico_id = data.medico_id or atencion.medico_id

    nueva_visita = Visita(
        empresa_id=empresa_id,
        paciente_nuevo_id=atencion.paciente_nuevo_id or atencion.paciente_id,
        medico_id=medico_id_auth,
        fecha_hora=fecha_futura,
        motivo_consulta="Seguimiento",
        tipo_visita="Seguimiento",
        estado="pendiente",
    )
    db.add(nueva_visita)
    db.flush()

    return {
        "ok": True,
        "visita_creada_id": nueva_visita.id,
        "fecha_programada": str(fecha_futura),
        "dias_seguimiento": data.dias_seguimiento,
        "atencion_origen_id": data.atencion_id,
    }
