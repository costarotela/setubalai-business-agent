"""
Pacientes routes: listar, crear, obtener, historial completo
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, Paciente, AtencionMedica, Visita, Medico, MedicoEspecialidades,
    HistoriaClinica, PracticaMedica, PacienteCreate,
    _dict_paciente, _dict_historia, _get_medico_esp, HTTPException,
)

router = salud_router

@router.get("/pacientes/", response_model=List[dict])
def listar_pacientes(
    request: Request,
    buscar: Optional[str] = None,
    obra_social: Optional[str] = None,
    especialidad_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    limit: int = Query(200, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista pacientes. Admin: todos. Médico: solo pacientes que atendió."""
    medico_id_auth, es_admin, rol = medico_restriccion
    q = db.query(Paciente).filter(
        Paciente.empresa_id == empresa_id,
        Paciente.activo == True
    )
    if medico_id_auth and not es_admin:
        paciente_ids = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).distinct().subquery()
        q = q.filter(Paciente.id.in_(db.query(paciente_ids)))
    else:
        if medico_id_auth:
            paciente_ids = db.query(Visita.paciente_nuevo_id).filter(
                Visita.medico_id == medico_id,
                Visita.paciente_nuevo_id.isnot(None)
            ).distinct().subquery()
            q = q.filter(Paciente.id.in_(db.query(paciente_ids.c.paciente_nuevo_id)))
    if buscar:
        q = q.filter(or_(
            Paciente.nombre.ilike(f"%{buscar}%"),
            Paciente.apellido.ilike(f"%{buscar}%"),
            Paciente.dni.ilike(f"%{buscar}%"),
        ))
    if obra_social:
        q = q.filter(Paciente.obra_social.ilike(f"%{obra_social}%"))
    if especialidad_id:
        medico_ids_sub = db.query(MedicoEspecialidades.medico_id).filter(
            MedicoEspecialidades.especialidad_id == especialidad_id
        ).distinct().subquery()
        paciente_ids = db.query(Visita.paciente_nuevo_id).filter(
            Visita.medico_id.in_(db.query(medico_ids_sub.c.medico_id)),
            Visita.paciente_nuevo_id.isnot(None)
        ).distinct().subquery()
        q = q.filter(Paciente.id.in_(db.query(paciente_ids.c.paciente_nuevo_id)))
    pacientes = q.order_by(Paciente.apellido, Paciente.nombre).offset(offset).limit(limit).all()
    return [_dict_paciente(p) for p in pacientes]

@router.post("/pacientes/", status_code=201)
def crear_paciente(
    request: Request,
    data: PacienteCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear paciente. Admin o médico logueado."""
    p = Paciente(**{**data.model_dump(), "empresa_id": empresa_id, "activo": True})
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict_paciente(p)

@router.get("/pacientes/{paciente_id}")
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id), medico_restriccion: tuple = Depends(get_medico_restriction)):
    """Obtiene un paciente. Solo medico con acceso o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == paciente_id
        ).first()
        tiene_visita = db.query(Visita).filter(
            Visita.medico_id == medico_id_auth,
            (Visita.paciente_nuevo_id == paciente_id) | (Visita.paciente_id == paciente_id)
        ).first()
        if not atendido and not tiene_visita:
            raise HTTPException(403, "No tienes acceso a este paciente")
    return _dict_paciente(p)

# ===== HISTORIAL COMPLETO DEL PACIENTE =====
@router.get("/pacientes/{paciente_id}/historial")
def historial_paciente(paciente_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id), medico_restriccion: tuple = Depends(get_medico_restriction)):
    """Devuelve TODA la info clínica de un paciente: datos, historia, atenciones, prácticas, turnos.
    Si es médico, solo ve pacientes que atendió."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")

    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            or_(AtencionMedica.paciente_nuevo_id == paciente_id, AtencionMedica.paciente_id == paciente_id)
        ).first()
        if not atendido:
            raise HTTPException(403, "No tienes acceso a este paciente")

    hc = db.query(HistoriaClinica).filter(
        or_(HistoriaClinica.paciente_nuevo_id == paciente_id, HistoriaClinica.paciente_id == paciente_id)
    ).first()
    historia = _dict_historia(hc) if hc else None

    atenciones = db.query(AtencionMedica).filter(
        or_(AtencionMedica.paciente_nuevo_id == paciente_id, AtencionMedica.paciente_id == paciente_id)
    ).order_by(AtencionMedica.fecha_hora_inicio.desc()).limit(50).all()

    lista_atenciones = []
    for a in atenciones:
        med = db.query(Medico).filter(Medico.id == a.medico_id).first()
        lista_atenciones.append({
            "id": a.id,
            "fecha": str(a.fecha_hora_inicio)[:16] if a.fecha_hora_inicio else "",
            "medico": f"Dr/a. {med.nombre} {med.apellido}" if med else "Desconocido",
            "especialidad": _get_medico_esp(db, med.id)[0] if med else "General",
            "diagnostico": a.diagnostico or "",
            "estado": a.estado or "",
            "presion_arterial": a.presion_arterial or "",
            "temperatura": float(a.temperatura) if a.temperatura else None,
            "peso": float(a.peso) if a.peso else None,
        })

    practicas = db.query(PracticaMedica).filter(
        or_(PracticaMedica.paciente_nuevo_id == paciente_id, PracticaMedica.paciente_id == paciente_id)
    ).order_by(PracticaMedica.created_at.desc()).limit(100).all()

    lista_practicas = []
    for pr in practicas:
        med = db.query(Medico).filter(Medico.id == pr.medico_id).first()
        lista_practicas.append({
            "id": pr.id,
            "tipo": pr.tipo_practica or "",
            "descripcion": pr.descripcion_nomenclador or "",
            "codigo": pr.codigo_nomenclador or "",
            "medico": f"Dr/a. {med.nombre} {med.apellido}" if med else "",
            "precio": float(pr.precio_practica or 0),
            "coseguro": float(pr.coseguro_paciente or 0),
            "cobertura": float(pr.cobertura_obra_social or 0),
            "estado_facturacion": pr.estado_facturacion or "pendiente",
            "requiere_autorizacion": bool(pr.requiere_autorizacion),
            "fecha": str(pr.created_at)[:10] if pr.created_at else "",
        })

    visitas = db.query(Visita).filter(
        or_(Visita.paciente_nuevo_id == paciente_id, Visita.paciente_id == paciente_id)
    ).order_by(Visita.fecha_hora.desc()).limit(50).all()

    lista_visitas = []
    for v in visitas:
        med = db.query(Medico).filter(Medico.id == v.medico_id).first()
        lista_visitas.append({
            "id": v.id,
            "fecha_hora": str(v.fecha_hora)[:16] if v.fecha_hora else "",
            "medico": f"Dr/a. {med.nombre} {med.apellido}" if med else "",
            "tipo": v.tipo_visita or "Consulta",
            "motivo": v.motivo_consulta or "",
            "estado": v.estado or "pendiente",
        })

    return {
        "paciente": _dict_paciente(p),
        "historia_clinica": historia,
        "atenciones": lista_atenciones,
        "practicas": lista_practicas,
        "turnos": lista_visitas,
        "resumen": {
            "total_atenciones": len(lista_atenciones),
            "total_practicas": len(lista_practicas),
            "total_turnos": len(lista_visitas),
        }
    }
