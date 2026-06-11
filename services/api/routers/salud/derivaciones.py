"""
Derivaciones routes: derivar paciente a otra especialidad
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, DerivacionCreate, Visita, AtencionMedica, Medico,
    MedicoEspecialidades, EspecialidadMedica,
    HTTPException,
)

router = salud_router

@router.post("/derivacion/", status_code=201)
def crear_derivacion(
    request: Request,
    data: DerivacionCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Derivar paciente a otra especialidad - crea turno automatico.
    Solo medico que atendio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    if medico_id_auth and not es_admin:
        if not db.query(AtencionMedica).filter(
            AtencionMedica.id == data.atencion_id,
            AtencionMedica.medico_id == medico_id_auth
        ).first():
            raise HTTPException(403, "No puedes derivar de una atencion ajena")

    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == data.atencion_id,
        AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

    medico_destino = db.query(Medico).join(
        MedicoEspecialidades, Medico.id == MedicoEspecialidades.medico_id
    ).filter(
        Medico.empresa_id == empresa_id,
        Medico.activo == True,
        MedicoEspecialidades.especialidad_id == data.especialidad_destino_id
    ).first()

    if not medico_destino:
        raise HTTPException(404, "No hay medico disponible para esa especialidad")

    fecha_futura = datetime.now() + timedelta(days=data.dias)
    motivo = f"Derivacion: {data.motivo or 'De especialidad origen'} (Atencion #{data.atencion_id})"

    nueva_visita = Visita(
        empresa_id=empresa_id,
        paciente_nuevo_id=data.paciente_nuevo_id,
        medico_id=medico_destino.id,
        fecha_hora=fecha_futura,
        motivo_consulta=motivo,
        tipo_visita="Derivacion",
        estado="pendiente",
    )
    db.add(nueva_visita)
    db.flush()

    med_origen = db.query(Medico).filter(Medico.id == data.medico_origen_id).first()
    esp_destino = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == data.especialidad_destino_id
    ).first()

    return {
        "ok": True,
        "visita_creada_id": nueva_visita.id,
        "medico_destino": f"Dr/a. {medico_destino.nombre} {medico_destino.apellido}",
        "especialidad_destino": esp_destino.nombre if esp_destino else "Especialidad",
        "fecha_programada": str(fecha_futura),
        "atencion_origen_id": data.atencion_id,
        "medico_origen": f"Dr/a. {med_origen.nombre} {med_origen.apellido}" if med_origen else "",
    }
