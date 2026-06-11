"""
Turnos y agenda: calendario, listar, crear, cancelar, eliminar, editar, cambiar estado, timeline
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import datetime
from sqlalchemy import extract, or_
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, Visita, Paciente, Medico, MedicoEspecialidades, AtencionMedica,
    PracticaMedica, VisitaCreate, PracticaMedicaCreate,
    Cliente, EspecialidadMedica,
    _dict_visita, _dict_calendario_turno, _dict_practica, _get_medico_esp,
    HTTPException,
)

router = salud_router

# ===== CALENDARIO TURNO (agregado 2026-05-28) =====

@router.get("/calendario")
def turnos_calendario(
    request: Request,
    mes: str = Query(..., description="Mes en formato YYYY-MM, ej: 2026-06"),
    especialidad_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Retorna todos los turnos del mes especificado para la empresa, con filtros reactivos.
    Admin: todos. Médico: solo los suyos."""
    medico_id_auth, es_admin, rol = medico_restriccion
    try:
        parts = mes.split("-")
        year = int(parts[0])
        month = int(parts[1])
    except (ValueError, IndexError):
        raise HTTPException(400, "Formato invalido. Usar YYYY-MM")
    query = (
        db.query(Visita)
        .outerjoin(
            Paciente,
            (Visita.paciente_nuevo_id.isnot(None)) & (Visita.paciente_nuevo_id == Paciente.id)
        )
        .outerjoin(Medico, Visita.medico_id == Medico.id)
        .filter(
            Visita.empresa_id == empresa_id,
            extract('year', Visita.fecha_hora) == year,
            extract('month', Visita.fecha_hora) == month,
        )
    )
    if especialidad_id:
        query = query.join(
            MedicoEspecialidades, MedicoEspecialidades.medico_id == Visita.medico_id
        ).filter(MedicoEspecialidades.especialidad_id == especialidad_id)
    if medico_id_auth and not es_admin and not medico_id:
        query = query.filter(Visita.medico_id == medico_id_auth)
    if medico_id:
        query = query.filter(Visita.medico_id == medico_id)
    if estado:
        query = query.filter(Visita.estado == estado)
    query = query.order_by(Visita.fecha_hora.asc())
    resultados = query.all()
    turnos = []
    if resultados:
        new_pac_ids = set()
        old_pac_ids = set()
        for v in resultados:
            if v.paciente_nuevo_id: new_pac_ids.add(v.paciente_nuevo_id)
            if v.paciente_id: old_pac_ids.add(v.paciente_id)
        
        pacientes_cache = {p.id: p for p in db.query(Paciente).filter(Paciente.id.in_(new_pac_ids)).all()}
        clientes_cache = {c.id: c for c in db.query(Cliente).filter(Cliente.id.in_(old_pac_ids)).all()} if old_pac_ids else {}
        
        for v in resultados:
            if v.paciente_nuevo_id:
                paciente = pacientes_cache.get(v.paciente_nuevo_id)
            elif v.paciente_id:
                cliente = clientes_cache.get(v.paciente_id)
                if cliente:
                    class FakePaciente:
                        nombre = cliente.nombre or ""
                        apellido = cliente.apellido or ""
                        obra_social = getattr(cliente, 'obra_social', None)
                    paciente = FakePaciente()
                else:
                    paciente = None
            else:
                paciente = None
            turno = _dict_calendario_turno(v, paciente=paciente, medico=v.medico, db=db)
            turno["paciente_completo"] = f"{turno['paciente_apellido']}, {turno['paciente_nombre']}".strip(", ") or "Desconocido"
            turno["medico_completo"] = f"Dr/a. {turno['medico_nombre']} {turno['medico_apellido']}".strip() or ""
            turno["medico_display"] = f"{turno['medico_apellido']}, {turno['medico_nombre']}".strip(", ") or ""
            turnos.append(turno)
    return {"mes": mes, "total": len(turnos), "turnos": turnos}


# ===== TURNOS (VISITAS) =====

@router.get("/turnos/", response_model=List[dict])
def listar_turnos(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    especialidad_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    estado: Optional[str] = None,
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista turnos. Admin: todos. Médico: solo los suyos."""
    medico_id_auth, es_admin, rol = medico_restriccion
    q = db.query(Visita).filter(Visita.empresa_id == empresa_id)
    if especialidad_id:
        q = q.join(
            MedicoEspecialidades, MedicoEspecialidades.medico_id == Visita.medico_id
        ).filter(MedicoEspecialidades.especialidad_id == especialidad_id)
    if medico_id_auth and not es_admin and not medico_id:
        q = q.filter(Visita.medico_id == medico_id_auth)
    if medico_id:
        q = q.filter(Visita.medico_id == medico_id)
    if estado:
        q = q.filter(Visita.estado == estado)
    visitas = q.order_by(Visita.fecha_hora.asc()).limit(200).all()

    result = []
    if visitas:
        pac_ids = set()
        med_ids = set()
        for v in visitas:
            if v.paciente_nuevo_id: pac_ids.add(v.paciente_nuevo_id)
            if v.paciente_id: pac_ids.add(v.paciente_id)
            med_ids.add(v.medico_id)
        pac_cache = {p.id: p for p in db.query(Paciente).filter(Paciente.id.in_(pac_ids)).all()}
        med_cache = {m.id: m for m in db.query(Medico).filter(Medico.id.in_(med_ids)).all()}
        
        for v in visitas:
            d = _dict_visita(v)
            pac_id = v.paciente_nuevo_id or v.paciente_id
            pac = pac_cache.get(pac_id)
            d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
            med = med_cache.get(v.medico_id)
            d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
            d["servicio"] = v.tipo_visita or "Consulta"
            result.append(d)
    return result

@router.post("/turnos/", status_code=201)
def crear_turno(
    request: Request,
    data: VisitaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear turno. Admin: cualquier médico. Médico: solo turnos propios."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        data.medico_id = medico_id_auth
    fecha_hora = f"{data.fecha}T{data.hora}:00"
    v = Visita(
        empresa_id=empresa_id,
        paciente_nuevo_id=data.paciente_nuevo_id,
        medico_id=data.medico_id,
        fecha_hora=fecha_hora,
        motivo_consulta=data.motivo or "",
        tipo_visita=data.tipo_visita or "Consulta General",
        estado="pendiente",
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return _dict_visita(v)

@router.post("/turnos/{turno_id}/cancelar")
def cancelar_turno(
    turno_id: int,
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Cancelar turno. Solo medico propio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    if medico_id_auth and not es_admin and v.medico_id != medico_id_auth:
        raise HTTPException(403, "No puedes cancelar un turno ajeno")
    if v.estado == "cancelado":
        return {"ok": True, "message": "Ya estaba cancelado"}
    v.estado = "cancelado"
    v.cancelacion_motivo = "Cancelado por administración"
    db.commit()
    return {"ok": True, "message": "Turno cancelado"}

@router.delete("/turnos/{turno_id}")
def eliminar_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Eliminar turno. Solo medico propio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    if medico_id_auth and not es_admin and v.medico_id != medico_id_auth:
        raise HTTPException(403, "No puedes eliminar un turno ajeno")
    db.delete(v)
    db.commit()
    return {"ok": True, "message": "Turno eliminado"}

@router.get("/turnos/{turno_id}")
def obtener_turno(
    turno_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Obtener un turno por ID. Medico solo ve propios."""
    medico_id_auth, es_admin, rol = medico_restriccion
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    if medico_id_auth and not es_admin and v.medico_id != medico_id_auth:
        raise HTTPException(403, "No puedes ver un turno ajeno")

    d = _dict_visita(v)
    pac = db.query(Paciente).filter(Paciente.id == (v.paciente_nuevo_id or v.paciente_id)).first()
    d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
    d["paciente_dni"] = pac.dni if pac else ""
    d["paciente_id"] = v.paciente_nuevo_id or v.paciente_id
    med = db.query(Medico).filter(Medico.id == v.medico_id).first()
    d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
    d["servicio"] = v.tipo_visita or "Consulta"
    return d


@router.put("/turnos/{turno_id}")
def editar_turno(
    turno_id: int,
    data: VisitaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Editar turno. Solo medico propio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    if medico_id_auth and not es_admin and v.medico_id != medico_id_auth:
        raise HTTPException(403, "No puedes editar un turno ajeno")
    v.paciente_nuevo_id = data.paciente_nuevo_id
    v.medico_id = data.medico_id
    v.fecha_hora = f"{data.fecha}T{data.hora}:00"
    if data.motivo:
        v.motivo_consulta = data.motivo
    if data.tipo_visita:
        v.tipo_visita = data.tipo_visita
    db.commit()
    db.refresh(v)
    return _dict_visita(v)


# ===== NUEVOS ENDPOINTS (FASE 2 - Jun 2026) =====

@router.put("/turnos/{turno_id}/estado")
def cambiar_estado_turno(
    turno_id: int,
    request: Request,
    nuevo_estado: str = Query(..., description="pendiente, en-curso, completado, cancelado"),
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Cambia el estado de un turno. Usado por botones ▶Iniciar y ✅Completar en calendario.
    Solo medico propio o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    estados_validos = ["pendiente", "en-curso", "en_curso", "completado", "cancelado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(400, f"Estado inválido. Válidos: {estados_validos}")
    
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    if medico_id_auth and not es_admin and v.medico_id != medico_id_auth:
        raise HTTPException(403, "No puedes cambiar estado de un turno ajeno")
    
    estado_anterior = v.estado
    v.estado = nuevo_estado.replace("_", "-")
    db.commit()
    db.refresh(v)
    
    return {
        "ok": True,
        "turno_id": turno_id,
        "estado_anterior": estado_anterior,
        "estado_nuevo": v.estado,
        "mensaje": f"Turno #{turno_id} cambiado de '{estado_anterior}' a '{v.estado}'"
    }


@router.get("/agenda/timeline")
def agenda_timeline(
    request: Request,
    fecha: str = Query(..., description="YYYY-MM-DD"),
    especialidad_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Timeline del día con turnos ordenados por hora. Admin: todos. Médico: solo los suyos."""
    medico_id_auth, es_admin, rol = medico_restriccion
    try:
        fd = datetime.strptime(fecha, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(400, "fecha debe ser YYYY-MM-DD")
    
    fh_start = fd.replace(hour=0, minute=0, second=0)
    fh_end = fd.replace(hour=23, minute=59, second=59)
    
    q = db.query(Visita).filter(
        Visita.empresa_id == empresa_id,
        Visita.fecha_hora >= fh_start,
        Visita.fecha_hora <= fh_end
    )
    if medico_id_auth and not es_admin and not medico_id:
        q = q.filter(Visita.medico_id == medico_id_auth)
    if especialidad_id:
        q = q.join(Medico, Visita.medico_id == Medico.id).join(MedicoEspecialidades).filter(
            MedicoEspecialidades.especialidad_id == especialidad_id
        )
    if medico_id_auth:
        q = q.filter(Visita.medico_id == medico_id_auth)
    
    visitas = q.order_by(Visita.fecha_hora).all()
    
    result = []
    if visitas:
        paciente_ids = set()
        medico_ids = set()
        for v in visitas:
            if v.paciente_nuevo_id: paciente_ids.add(v.paciente_nuevo_id)
            if v.paciente_id: paciente_ids.add(v.paciente_id)
            medico_ids.add(v.medico_id)
        
        pacientes_cache = {p.id: p for p in db.query(Paciente).filter(Paciente.id.in_(paciente_ids)).all()}
        medicos_cache = {m.id: m for m in db.query(Medico).filter(Medico.id.in_(medico_ids)).all()}
        
        esp_medico_ids = list(medicos_cache.keys())
        esp_links = db.query(MedicoEspecialidades).filter(
            MedicoEspecialidades.medico_id.in_(esp_medico_ids)
        ).all() if esp_medico_ids else []
        esp_ids = set(me.especialidad_id for me in esp_links)
        esp_cache = {e.id: e for e in db.query(EspecialidadMedica).filter(
            EspecialidadMedica.id.in_(esp_ids)
        ).all()} if esp_ids else {}
        
        for v in visitas:
            d = _dict_visita(v)
            paciente = pacientes_cache.get(v.paciente_nuevo_id)
            medico = medicos_cache.get(v.medico_id)
            if paciente:
                d["paciente_nombre"] = f"{paciente.nombre} {paciente.apellido}"
                d["paciente_dni"] = paciente.dni
                d["obra_social"] = paciente.obra_social
            if medico:
                d["medico_nombre"] = f"Dr/a. {medico.nombre} {medico.apellido}"
                d["especialidades"] = [
                    esp_cache[me.especialidad_id].nombre 
                    for me in esp_links 
                    if me.medico_id == medico.id and me.especialidad_id in esp_cache
                ]
            result.append(d)
    
    return {
        "fecha": fecha,
        "total": len(result),
        "turnos": result
    }

# Protegido: solo médicos con acceso al paciente o admin

@router.get("/practicas_medicas/", response_model=List[dict])
def listar_practicas(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion = Depends(get_medico_restriction)
):
    medico_id_auth, es_admin, rol = medico_restriccion
    
    q = db.query(PracticaMedica).filter(
        PracticaMedica.empresa_id == empresa_id
    )
    
    if medico_id_auth and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(
        or_(
            PracticaMedica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)),
            PracticaMedica.medico_id == medico_id_auth,
            )
        )
    elif not medico_id_auth and not es_admin:
        return []
    
    practicas = q.order_by(PracticaMedica.created_at.desc()).limit(200).all()
    
    result = []
    for p in practicas:
        d = _dict_practica(p)
        pac = db.query(Paciente).filter(Paciente.id == (p.paciente_nuevo_id or p.paciente_id)).first()
        d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
        med = db.query(Medico).filter(Medico.id == p.medico_id).first()
        d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
        d["codigo_nomenclador"] = p.codigo_nomenclador or ""
        d["descripcion_nomenclador"] = p.descripcion_nomenclador or ""
        d["precio_practica"] = float(p.precio_practica or 0)
        d["coseguro_paciente"] = float(p.coseguro_paciente or 0)
        d["cobertura_obra_social"] = float(p.cobertura_obra_social or 0)
        d["estado_facturacion"] = p.estado_facturacion or "pendiente"
        d["atencion_medica_id"] = p.atencion_medica_id
        result.append(d)
    return result

@router.post("/practicas_medicas/", status_code=201)
def crear_practica(
    request: Request,
    data: PracticaMedicaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear practica medica. Solo medico con acceso al paciente o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == data.paciente_nuevo_id
        ).first()
        if not atendido:
            raise HTTPException(403, "No tienes acceso a este paciente")
    p = PracticaMedica(**{**data.model_dump(), "empresa_id": empresa_id, "estado": "pendiente"})
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict_practica(p)
