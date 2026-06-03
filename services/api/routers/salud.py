"""
Routers de Salud - Pacientes, Médicos, Visitas (Turnos), Prácticas, Historia Clínica
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from database import get_db
from models import (
    Paciente, Medico, Visita, HistoriaClinica,
    PracticaMedica, NomencladorPractica, AtencionMedica, Usuario,
    Receta, EstudioAdjunto,
    MedicoEspecialidades, EspecialidadMedica,
)
from auth import decode_token, get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(tags=["Salud"])

# Helper: get medico's especialidad names from M:N table
def _get_medico_esp(db, medico_id) -> list:
    esps = db.query(EspecialidadMedica).join(
        MedicoEspecialidades, EspecialidadMedica.id == MedicoEspecialidades.especialidad_id
    ).filter(MedicoEspecialidades.medico_id == medico_id).all()
    return [e.nombre for e in esps]

# ===== CONTROL DE ACCESO MÉDICO =====
# Si el usuario tiene medico_id vinculado, solo puede ver pacientes que atendió.
# Si es admin/superadmin, ve todo (sin filtro).

def get_medico_restriction(request: Request, db: Session = Depends(get_db)):
    """Devuelve (medico_id, es_admin) para filtrar acceso.
    Sin JWT → (None, True): acceso completo por empresa_id (compatibilidad frontend).
    Con JWT médico → filtra por pacientes atendidos.
    """
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, True

    try:
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None, True
        current_user = db.query(Usuario).filter(
            Usuario.id == int(user_id), Usuario.activo == True
        ).first()
        if not current_user:
            return None, True
    except Exception:
        return None, True

    if current_user.rol in ('admin', 'superadmin', 'contador'):
        return None, True
    if current_user.medico_id:
        return current_user.medico_id, False
    return None, False

# ===== MODELS PYDANTIC =====

class PacienteCreate(BaseModel):
    nombre: str
    apellido: str
    dni: str
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    obra_social: Optional[str] = None
    numero_afiliado: Optional[str] = None
    plan: Optional[str] = None

class MedicoCreate(BaseModel):
    nombre: str
    apellido: str
    matricula_provincial: Optional[str] = None
    matricula_nacional: Optional[str] = None
    especialidades: Optional[list] = None
    duracion_turno_minutos: int = 30
    email: Optional[str] = None
    telefono: Optional[str] = None

class VisitaCreate(BaseModel):
    paciente_nuevo_id: int
    medico_id: int
    fecha: str
    hora: str
    motivo: Optional[str] = None
    tipo_visita: Optional[str] = None

class PracticaMedicaCreate(BaseModel):
    paciente_nuevo_id: int
    medico_id: int
    codigo_nabon: Optional[str] = None
    descripcion: str
    valor: float = 0
    fecha_realizacion: Optional[str] = None
    requiere_autorizacion: bool = False

# ===== HELPERS =====

def _dict_paciente(p):
    return {
        "id": p.id,
        "nombre": p.nombre or "",
        "apellido": p.apellido or "",
        "dni": p.dni or "",
        "fecha_nacimiento": str(p.fecha_nacimiento) if p.fecha_nacimiento else None,
        "sexo": p.sexo or None,
        "telefono": p.telefono or None,
        "email": p.email or None,
        "direccion": p.direccion or None,
        "ciudad": p.ciudad or None,
        "provincia": p.provincia or None,
        "obra_social": p.obra_social or None,
        "numero_afiliado": p.numero_afiliado or None,
        "plan": p.plan or None,
        "activo": p.activo,
        "created_at": str(p.created_at) if p.created_at else None,
    }

def _dict_medico(m, db=None):
    esp = _get_medico_esp(db, m.id) if db else []
    return {
        "id": m.id,
        "nombre": m.nombre or "",
        "apellido": m.apellido or "",
        "matricula": m.matricula_provincial or m.matricula_nacional or "",
        "matricula_provincial": m.matricula_provincial or "",
        "matricula_nacional": m.matricula_nacional or "",
        "especialidad": esp[0] if esp else "General",
        "especialidades": esp,
        "email": m.usuario_id or None,
        "telefono": None,
        "activo": m.activo,
    }

def _dict_visita(v):
    fh = v.fecha_hora
    return {
        "id": v.id,
        "paciente_id": v.paciente_nuevo_id or v.paciente_id,
        "medico_id": v.medico_id,
        "fecha_hora": str(fh) if fh else None,
        "fecha": str(fh)[:10] if fh else None,
        "hora": str(fh)[11:16] if fh else "",
        "motivo": v.motivo_consulta or v.tipo_visita or "",
        "estado": v.estado or "pendiente",
        "tipo_visita": v.tipo_visita or "",
        "duracion_minutos": v.duracion_minutos or 30,
        "cancelacion_motivo": v.cancelacion_motivo or None,
        "created_at": str(v.created_at) if v.created_at else None,
    }

def _dict_practica(p):
    return {
        "id": p.id,
        "paciente_id": p.paciente_nuevo_id or p.paciente_id,
        "medico_id": p.medico_id,
        "tipo_practica": p.tipo_practica or "",
        "codigo_nomenclador": p.codigo_nomenclador or "",
        "descripcion_nomenclador": p.descripcion_nomenclador or "",
        "precio_practica": float(p.precio_practica or 0),
        "coseguro_paciente": float(p.coseguro_paciente or 0),
        "cobertura_obra_social": float(p.cobertura_obra_social or 0),
        "estado_facturacion": p.estado_facturacion or "pendiente",
        "requiere_autorizacion": bool(p.requiere_autorizacion),
        "atencion_medica_id": p.atencion_medica_id,
        "created_at": str(p.created_at) if p.created_at else None,
        "updated_at": str(p.updated_at) if p.updated_at else None,
    }

def _dict_historia(h):
    return {
        "id": h.id,
        "paciente_id": h.paciente_nuevo_id or h.paciente_id,
        "grupo_sanguineo": h.grupo_sanguineo or "",
        "alergias": ", ".join(h.alergias) if h.alergias else "",
        "antecedentes_personales": h.antecedentes_personales or "",
        "antecedentes_familiares": h.antecedentes_familiares or "",
        "medicacion_habitual": ", ".join(h.medicacion_habitual) if h.medicacion_habitual else "",
        "notas": h.notas_adicionales or "",
        "ultima_actualizacion": str(h.updated_at) if h.updated_at else None,
    }

def _dict_nomenclador(n):
    return {
        "id": n.id,
        "codigo_nabon": n.codigo or "",
        "nombre": n.descripcion or "",
        "descripcion": n.descripcion or "",
        "tipo": n.tipo or "",
        "especialidad_requerida": n.especialidad_requerida or "",
        "valor_base": float(n.precio_particular or 0),
        "activo": n.activo,
    }

# ===== PACIENTES =====

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
    empresa_id: int = Depends(resolve_empresa_id)
):
    q = db.query(Paciente).filter(
        Paciente.empresa_id == empresa_id,
        Paciente.activo == True
    )
    if buscar:
        q = q.filter(or_(
            Paciente.nombre.ilike(f"%{buscar}%"),
            Paciente.apellido.ilike(f"%{buscar}%"),
            Paciente.dni.ilike(f"%{buscar}%"),
        ))
    if obra_social:
        q = q.filter(Paciente.obra_social.ilike(f"%{obra_social}%"))
    
    # Filtrar por médico: pacientes que tienen visitas con ese médico
    if medico_id:
        paciente_ids = db.query(Visita.paciente_nuevo_id).filter(
            Visita.medico_id == medico_id,
            Visita.paciente_nuevo_id.isnot(None)
        ).distinct().subquery()
        q = q.filter(Paciente.id.in_(db.query(paciente_ids.c.paciente_nuevo_id)))
    
    # Filtrar por especialidad: pacientes que tienen visitas con médicos de esa especialidad
    if especialidad_id:
        # Buscar médicos de esa especialidad
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    p = Paciente(**{**data.model_dump(), "empresa_id": empresa_id, "activo": True})
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict_paciente(p)

@router.get("/pacientes/{paciente_id}")
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    return _dict_paciente(p)

# ===== HISTORIAL COMPLETO DEL PACIENTE =====
@router.get("/pacientes/{paciente_id}/historial")
def historial_paciente(paciente_id: int, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    """Devuelve TODA la info clínica de un paciente: datos, historia, atenciones, prácticas, turnos."""
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")

    # Historia clínica
    hc = db.query(HistoriaClinica).filter(
        or_(HistoriaClinica.paciente_nuevo_id == paciente_id, HistoriaClinica.paciente_id == paciente_id)
    ).first()
    historia = _dict_historia(hc) if hc else None

    # Atenciones médicas
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
            "especialidad": _get_medico_esp(db, med.id)[0] if med else "General",  # type: ignore
            "diagnostico": a.diagnostico or "",
            "estado": a.estado or "",
            "presion_arterial": a.presion_arterial or "",
            "temperatura": float(a.temperatura) if a.temperatura else None,
            "peso": float(a.peso) if a.peso else None,
        })

    # Prácticas médicas
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

    # Turnos/visitas
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

# ===== MÉDICOS =====

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
    empresa_id: int = Depends(resolve_empresa_id)
):
    m = Medico(**{**data.model_dump(), "empresa_id": empresa_id, "activo": True})
    db.add(m)
    db.commit()
    db.refresh(m)
    return _dict_medico(m, db)

# ===== CALENDARIO TURNO (agregado 2026-05-28) =====

def _dict_calendario_turno(v, paciente=None, medico=None, db=None):
    """Version enriquecida de visita para el calendario dashboard."""
    fh = v.fecha_hora
    fecha_str = fh.strftime("%Y-%m-%d") if fh else None
    hora_str = fh.strftime("%H:%M") if fh else ""
    pac_nombre = ""
    pac_apellido = ""
    pac_os = None
    if paciente:
        pac_nombre = paciente.nombre or ""
        pac_apellido = paciente.apellido or ""
        pac_os = getattr(paciente, "obra_social", None)
    med_nombre = ""
    med_apellido = ""
    med_especialidades = _get_medico_esp(db, medico.id) if db and medico else []  # type: ignore
    if medico:
        med_nombre = medico.nombre or ""
        med_apellido = medico.apellido or ""
    return {
        "id": v.id,
        "fecha_hora": str(fh) if fh else None,
        "fecha": fecha_str,
        "hora": hora_str,
        "duracion_minutos": v.duracion_minutos or 30,
        "paciente_id": v.paciente_nuevo_id or v.paciente_id,
        "paciente_nombre": pac_nombre,
        "paciente_apellido": pac_apellido,
        "obra_social": pac_os,
        "medico_id": v.medico_id,
        "medico_nombre": med_nombre,
        "medico_apellido": med_apellido,
        "especialidades": med_especialidades,
        "estado": v.estado or "pendiente",
        "motivo": v.motivo_consulta or v.tipo_visita or "",
        "tipo_visita": v.tipo_visita or "",
        "cancelacion_motivo": v.cancelacion_motivo or None,
        "reprogramado_a_visita_id": v.reprogramado_a_visita_id,
        "created_at": str(v.created_at) if v.created_at else None,
    }


@router.get("/calendario")
def turnos_calendario(
    request: Request,
    mes: str = Query(..., description="Mes en formato YYYY-MM, ej: 2026-06"),
    especialidad_id: Optional[int] = None,
    medico_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Retorna todos los turnos del mes especificado para la empresa, con filtros reactivos."""
    from sqlalchemy import extract
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
    # Filtro reactivo por especialidad
    if especialidad_id:
        query = query.join(
            MedicoEspecialidades, MedicoEspecialidades.medico_id == Visita.medico_id
        ).filter(MedicoEspecialidades.especialidad_id == especialidad_id)
    # Filtro reactivo por médico
    if medico_id:
        query = query.filter(Visita.medico_id == medico_id)
    # Filtro por estado
    if estado:
        query = query.filter(Visita.estado == estado)
    query = query.order_by(Visita.fecha_hora.asc())
    resultados = query.all()
    turnos = []
    for v in resultados:
        if v.paciente_nuevo_id:
            from models import Paciente as P
            paciente = db.query(P).filter(P.id == v.paciente_nuevo_id).first() if not (hasattr(v, 'paciente_nuevo') and v.paciente_nuevo) else v.paciente_nuevo
        elif v.paciente_id:
            from models import Cliente
            cliente = db.query(Cliente).filter(Cliente.id == v.paciente_id).first()
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
    estado: Optional[str] = None
):
    q = db.query(Visita).filter(Visita.empresa_id == empresa_id)
    if especialidad_id:
        q = q.join(
            MedicoEspecialidades, MedicoEspecialidades.medico_id == Visita.medico_id
        ).filter(MedicoEspecialidades.especialidad_id == especialidad_id)
    if medico_id:
        q = q.filter(Visita.medico_id == medico_id)
    if estado:
        q = q.filter(Visita.estado == estado)
    visitas = q.order_by(Visita.fecha_hora.asc()).limit(200).all()

    # Enriquecer con nombres
    result = []
    for v in visitas:
        d = _dict_visita(v)
        pac = db.query(Paciente).filter(Paciente.id == (v.paciente_nuevo_id or v.paciente_id)).first()
        d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
        med = db.query(Medico).filter(Medico.id == v.medico_id).first()
        d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
        d["servicio"] = v.tipo_visita or "Consulta"
        result.append(d)
    return result

@router.post("/turnos/", status_code=201)
def crear_turno(
    request: Request,
    data: VisitaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    db.delete(v)
    db.commit()
    return {"ok": True, "message": "Turno eliminado"}

@router.put("/turnos/{turno_id}")
def editar_turno(
    turno_id: int,
    data: VisitaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Cambia el estado de un turno. Usado por botones ▶Iniciar y ✅Completar en calendario."""
    estados_validos = ["pendiente", "en-curso", "en_curso", "completado", "cancelado"]
    if nuevo_estado not in estados_validos:
        raise HTTPException(400, f"Estado inválido. Válidos: {estados_validos}")
    
    v = db.query(Visita).filter(Visita.id == turno_id, Visita.empresa_id == empresa_id).first()
    if not v:
        raise HTTPException(404, "Turno no encontrado")
    
    estado_anterior = v.estado
    v.estado = nuevo_estado.replace("_", "-")  # normalize en-curso
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Timeline del día con turnos ordenados por hora. Usado por vista recepcionista."""
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
    if especialidad_id:
        q = q.join(Medico, Visita.medico_id == Medico.id).join(MedicoEspecialidades).filter(
            MedicoEspecialidades.especialidad_id == especialidad_id
        )
    if medico_id:
        q = q.filter(Visita.medico_id == medico_id)
    
    visitas = q.order_by(Visita.fecha_hora).all()
    
    result = []
    for v in visitas:
        d = _dict_visita(v)
        paciente = db.query(Paciente).filter(Paciente.id == v.paciente_nuevo_id).first()
        medico = db.query(Medico).filter(Medico.id == v.medico_id).first()
        if paciente:
            d["paciente_nombre"] = f"{paciente.nombre} {paciente.apellido}"
            d["paciente_dni"] = paciente.dni
            d["obra_social"] = paciente.obra_social
        if medico:
            d["medico_nombre"] = f"Dr/a. {medico.nombre} {medico.apellido}"
            esp_result = db.query(MedicoEspecialidades).filter(
                MedicoEspecialidades.medico_id == medico.id
            ).all()
            d["especialidades"] = [
                db.query(EspecialidadMedica).filter(
                    EspecialidadMedica.id == me.especialidad_id
                ).first().nombre for me in esp_result if db.query(EspecialidadMedica).filter(
                    EspecialidadMedica.id == me.especialidad_id
                ).first()
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
    medico_id, es_admin = medico_restriccion
    
    q = db.query(PracticaMedica).filter(
        PracticaMedica.empresa_id == empresa_id
    )
    
    # Si es médico (no admin), solo ve prácticas de pacientes que atendió
    if medico_id and not es_admin:
        # Subquery: pacientes que este médico atendió
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(
        or_(
            PracticaMedica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)),
            PracticaMedica.medico_id == medico_id,
            )
        )
    elif not medico_id and not es_admin:
        # Operador sin medico_id: NO puede ver prácticas médicas
        return []
    
    practicas = q.order_by(PracticaMedica.created_at.desc()).limit(200).all()
    
    # Enriquecer con nombres de pacientes
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    p = PracticaMedica(**{**data.model_dump(), "empresa_id": empresa_id, "estado": "pendiente"})
    db.add(p)
    db.commit()
    db.refresh(p)
    return _dict_practica(p)

# ===== HISTORIA CLÍNICA =====
# Protección: los médicos solo ven la HC de pacientes que atendieron

@router.get("/historia_clinica/", response_model=List[dict])
def listar_historias(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion = Depends(get_medico_restriction)
):
    medico_id, es_admin = medico_restriccion
    
    q = db.query(HistoriaClinica).filter(
        HistoriaClinica.empresa_id == empresa_id
    )
    
    # Si es médico (no admin), solo ve HC de pacientes que atendió
    if medico_id and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(HistoriaClinica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)))
    elif not medico_id and not es_admin:
        # Operador sin medico_id: NO puede ver historias clínicas
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
    medico_id, es_admin = medico_restriccion
    
    # Admin: ve todos los pacientes
    # Médico: solo los que atendió
    if es_admin:
        pacientes = db.query(Paciente).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.activo == True
        ).order_by(Paciente.apellido, Paciente.nombre).all()
    elif medico_id:
        # Pacientes que este médico atendió
        query = db.query(Paciente).join(
            AtencionMedica, Paciente.id == AtencionMedica.paciente_nuevo_id
        ).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.activo == True,
            AtencionMedica.medico_id == medico_id
        ).distinct().order_by(Paciente.apellido, Paciente.nombre)
        pacientes = query.all()
    else:
        return []
    
    result = []
    for p in pacientes:
        d = _dict_paciente(p)
        # Contar atenciones de este paciente
        cant_atenciones = db.query(func.count(AtencionMedica.id)).filter(
            AtencionMedica.paciente_nuevo_id == p.id
        ).scalar() or 0
        d["cant_atenciones"] = cant_atenciones
        
        # Último médico que lo atendió
        ultima_atencion = db.query(AtencionMedica).filter(
            AtencionMedica.paciente_nuevo_id == p.id
        ).order_by(AtencionMedica.fecha_hora_inicio.desc()).first()
        if ultima_atencion:
            med = db.query(Medico).filter(Medico.id == ultima_atencion.medico_id).first()
            d["ultimo_medico"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
            d["ultima_fecha"] = str(ultima_atencion.fecha_hora_inicio)[:16] if ultima_atencion.fecha_hora_inicio else ""
        
        result.append(d)
    return result

# ===== NOMENCLADORES =====

@router.get("/nomenclador_practicas/", response_model=List[dict])
def listar_nomencladores(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    items = db.query(NomencladorPractica).filter(
        NomencladorPractica.empresa_id == empresa_id,
        NomencladorPractica.activo == True
    ).order_by(NomencladorPractica.codigo).all()
    return [_dict_nomenclador(n) for n in items]

# ===== RECETAS =====

def _dict_receta(r):
    return {
        "id": r.id,
        "atencion_medica_id": r.atencion_medica_id,
        "paciente_id": r.paciente_nuevo_id or r.paciente_id,
        "medico_id": r.medico_id,
        "medicamentos": r.medicamentos or [],
        "indicaciones": r.indicaciones or "",
        "valida_hasta": str(r.valida_hasta) if r.valida_hasta else None,
        "archivo_pdf_url": r.archivo_pdf_url or None,
        "created_at": str(r.created_at) if r.created_at else None,
    }

@router.get("/recetas/", response_model=List[dict])
def listar_recetas(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Lista todas las recetas de la empresa"""
    items = db.query(Receta).filter(
        Receta.empresa_id == empresa_id
    ).order_by(Receta.created_at.desc()).limit(200).all()
    
    result = []
    for r in items:
        d = _dict_receta(r)
        pac = db.query(Paciente).filter(Paciente.id == (r.paciente_nuevo_id or r.paciente_id)).first()
        d["paciente_nombre"] = f"{pac.nombre} {pac.apellido}" if pac else "Desconocido"
        med = db.query(Medico).filter(Medico.id == r.medico_id).first()
        d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
        result.append(d)
    return result

@router.get("/recetas/{receta_id}")
def obtener_receta(
    receta_id: int,
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Obtiene una receta específica por ID"""
    receta = db.query(Receta).filter(Receta.id == receta_id, Receta.empresa_id == empresa_id).first()
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    return _dict_receta(receta)

@router.get("/pacientes/{paciente_id}/recetas/", response_model=List[dict])
def recetas_paciente(
    paciente_id: int,
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Todas las recetas de un paciente específico"""
    # Verificar que el paciente existe en la empresa
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    
    items = db.query(Receta).filter(
        or_(Receta.paciente_nuevo_id == paciente_id, Receta.paciente_id == paciente_id),
        Receta.empresa_id == empresa_id
    ).order_by(Receta.created_at.desc()).all()
    
    result = []
    for r in items:
        d = _dict_receta(r)
        med = db.query(Medico).filter(Medico.id == r.medico_id).first()
        d["medico_nombre"] = f"Dr/a. {med.nombre} {med.apellido}" if med else ""
        result.append(d)
    return result

# ===== ESTUDIOS ADJUNTOS =====

def _dict_estudio(e):
    return {
        "id": e.id,
        "paciente_id": e.paciente_nuevo_id or e.paciente_id,
        "tipo_estudio": e.tipo_estudio or "",
        "descripcion": e.descripcion or "",
        "fecha_estudio": str(e.fecha_estudio) if e.fecha_estudio else None,
        "archivo_nombre": e.archivo_nombre or "",
        "archivo_url": e.archivo_url or "",
        "archivo_tipo": e.archivo_tipo or "",
        "archivo_tamano_bytes": e.archivo_tamano_bytes or 0,
        "consulta_id": e.consulta_id,
        "created_at": str(e.created_at) if e.created_at else None,
    }

@router.get("/estudios_adjuntos/", response_model=List[dict])
def listar_estudios(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Lista todos los estudios adjuntos de la empresa"""
    items = db.query(EstudioAdjunto).filter(
        EstudioAdjunto.empresa_id == empresa_id
    ).order_by(EstudioAdjunto.created_at.desc()).limit(200).all()
    
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
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Todos los estudios adjuntos de un paciente específico"""
    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")
    
    items = db.query(EstudioAdjunto).filter(
        or_(EstudioAdjunto.paciente_nuevo_id == paciente_id, EstudioAdjunto.paciente_id == paciente_id),
        EstudioAdjunto.empresa_id == empresa_id
    ).order_by(EstudioAdjunto.created_at.desc()).all()
    
    return [_dict_estudio(e) for e in items]
