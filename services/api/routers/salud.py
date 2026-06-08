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
from datetime import datetime, timedelta

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

# ===== CONTROL DE ACCESO POR ROL =====
# 3 niveles: superadmin (plataforma), admin_clinica, medico, recepcionista

def get_medico_restriction(request: Request, db: Session = Depends(get_db)):
    """Devuelve (medico_id, es_admin, rol) para filtrar acceso.
    
    - superadmin: (None, True, 'superadmin') → ve todo clínico
    - admin clínica: (None, False, 'admin') → SOLO gestión, NO clínico
    - médico: (medico_id_auth, False, 'medico') → SOLO pacientes propios
    - recepcionista: (None, False, 'operator') → SOLO turnos, NO clínico
    - Sin JWT: (None, True, 'anonymous') → acceso CLI/frontend
    """
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, True, "anonymous"

    try:
        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None, True, "anonymous"
        current_user = db.query(Usuario).filter(
            Usuario.id == int(user_id), Usuario.activo == True
        ).first()
        if not current_user:
            return None, True, "anonymous"
    except Exception:
        return None, True, "anonymous"

    rol = current_user.rol
    medico_id = current_user.medico_id

    if rol == "superadmin":
        return None, True, "superadmin"
    if rol in ("admin", "contador"):
        # Admin de clínica: puede gestionar turnos pero NO ve datos clínicos
        return None, False, "admin"
    if medico_id:
        return medico_id, False, "medico"
    # Operador sin medico_id = recepcionista
    return None, False, "operator"

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

class MedicamentoItem(BaseModel):
    medicamento: str
    dosis: str
    frecuencia: str
    duracion: str

class AtencionCreate(BaseModel):
    visita_id: int
    paciente_nuevo_id: int
    medico_id: int
    fecha_hora_inicio: Optional[str] = None
    fecha_hora_fin: Optional[str] = None
    anamnesis: Optional[str] = None
    examen_fisico: Optional[str] = None
    diagnostico: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    frecuencia_respiratoria: Optional[int] = None
    temperatura: Optional[float] = None
    saturacion_oxigeno: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[float] = None
    imc: Optional[float] = None
    evolucion: Optional[str] = None
    estado: Optional[str] = "completado"

class AtencionUpdate(BaseModel):
    anamnesis: Optional[str] = None
    examen_fisico: Optional[str] = None
    diagnostico: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    frecuencia_respiratoria: Optional[int] = None
    temperatura: Optional[float] = None
    saturacion_oxigeno: Optional[int] = None
    peso: Optional[float] = None
    altura: Optional[float] = None
    imc: Optional[float] = None
    evolucion: Optional[str] = None
    estado: Optional[str] = None
    fecha_hora_fin: Optional[str] = None

class RecetaCreate(BaseModel):
    atencion_medica_id: int
    paciente_nuevo_id: int
    medico_id: int
    medicamentos: List[MedicamentoItem]
    indicaciones: Optional[str] = None
    valida_hasta: Optional[str] = None

class EstudioCreate(BaseModel):
    paciente_nuevo_id: int
    tipo_estudio: str
    descripcion: Optional[str] = None
    fecha_estudio: Optional[str] = None
    archivo_nombre: Optional[str] = None
    archivo_url: Optional[str] = None
    archivo_tipo: Optional[str] = None
    consulta_id: Optional[int] = None

class SeguimientoCreate(BaseModel):
    atencion_id: int
    dias_seguimiento: int = 15
    especialidad_id: Optional[int] = None
    medico_id: Optional[int] = None

class DerivacionCreate(BaseModel):
    atencion_id: int
    paciente_nuevo_id: int
    medico_origen_id: int
    especialidad_destino_id: int
    motivo: Optional[str] = None
    dias: int = 7

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
        "alergias": list(h.alergias) if isinstance(h.alergias, (list, tuple)) else [h.alergias] if h.alergias else [],
        "antecedentes_personales": h.antecedentes_personales or "",
        "antecedentes_familiares": h.antecedentes_familiares or "",
        "medicacion_habitual": list(h.medicacion_habitual) if isinstance(h.medicacion_habitual, (list, tuple)) else [h.medicacion_habitual] if h.medicacion_habitual else [],
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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista pacientes. Admin: todos. Médico: solo pacientes que atendió."""
    medico_id_auth, es_admin, rol = medico_restriccion
    q = db.query(Paciente).filter(
        Paciente.empresa_id == empresa_id,
        Paciente.activo == True
    )
    # Si es médico (no admin), filtrar solo a pacientes que atendió
    if medico_id_auth and not es_admin:
        paciente_ids = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).distinct().subquery()
        q = q.filter(Paciente.id.in_(db.query(paciente_ids)))
    else:
        # Admin o sin auth: aplicar filtros manuales si vienen
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
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    p = db.query(Paciente).filter(Paciente.id == paciente_id, Paciente.empresa_id == empresa_id).first()
    if not p:
        raise HTTPException(404, "Paciente no encontrado")

    # Restricción: médico solo ve pacientes que atendió
    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == paciente_id
        ).first()
        if not atendido:
            raise HTTPException(403, "No tienes acceso a este paciente")

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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear médico. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden crear médicos")
    m = Medico(**{**data.model_dump(), "empresa_id": empresa_id, "activo": True})
    db.add(m)
    db.commit()
    db.refresh(m)
    # Asignar especialidades si vienen en el payload
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
            continue  # se maneja aparte
        if val is not None:
            setattr(m, key, val)
    db.commit()
    # Actualizar especialidades: borrar viejas, poner nuevas
    if data.especialidades is not None:
        db.query(MedicoEspecialidades).filter(
            MedicoEspecialidades.medico_id == medico_id
        ).delete()
        for esp_id in data.especialidades:
            db.add(MedicoEspecialidades(medico_id=medico_id_auth, especialidad_id=esp_id))
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
    # Contar registros asociados para info de borrado
    count_turnos = db.query(Visita).filter(Visita.medico_id == medico_id).count()
    count_atenciones = db.query(AtencionMedica).filter(
        AtencionMedica.medico_id == medico_id_auth
    ).count()
    # CASCADE: al borrar el médico se borran visitas, atenciones, recetas, grillas, etc.
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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Retorna todos los turnos del mes especificado para la empresa, con filtros reactivos.
    Admin: todos. Médico: solo los suyos."""
    medico_id_auth, es_admin, rol = medico_restriccion
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
    # Si es medico (no admin), filtrar solo sus turnos (si no viene medico_id como filtro)
    if medico_id_auth and not es_admin and not medico_id:
        query = query.filter(Visita.medico_id == medico_id_auth)
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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear turno. Admin: cualquier médico. Médico: solo turnos propios."""
    medico_id_auth, es_admin, rol = medico_restriccion
    # Si es médico, forzar que el turno sea para él
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
    medico_id_auth, es_admin, rol = medico_restriccion
    
    q = db.query(PracticaMedica).filter(
        PracticaMedica.empresa_id == empresa_id
    )
    
    # Si es médico (no admin), solo ve prácticas de pacientes que atendió
    if medico_id_auth and not es_admin:
        # Subquery: pacientes que este médico atendió
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(
        or_(
            PracticaMedica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)),
            PracticaMedica.medico_id == medico_id,
            )
        )
    elif not medico_id_auth and not es_admin:
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

# ===== HISTORIA CLÍNICA =====
# Protección: los médicos solo ven la HC de pacientes que atendieron

@router.get("/historia_clinica/", response_model=List[dict])
def listar_historias(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion = Depends(get_medico_restriction)
):
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    
    q = db.query(HistoriaClinica).filter(
        HistoriaClinica.empresa_id == empresa_id
    )
    
    # Si es médico (no admin), solo ve HC de pacientes que atendió
    if medico_id_auth and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(HistoriaClinica.paciente_nuevo_id.in_(db.query(pacientes_atendidos)))
    elif not medico_id_auth and not es_admin:
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
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    
    # Admin: ve todos los pacientes
    # Médico: solo los que atendió
    if es_admin:
        pacientes = db.query(Paciente).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.activo == True
        ).order_by(Paciente.apellido, Paciente.nombre).all()
    elif medico_id_auth:
        # Pacientes que este médico atendió
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

@router.post("/nomenclador_practicas/", status_code=201)
def crear_nomenclador(
    request: Request,
    data: dict,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden crear nomencladores")
    n = NomencladorPractica(**{
        **{k: v for k, v in data.items() if hasattr(NomencladorPractica, k)},
        "empresa_id": empresa_id,
        "activo": data.get("activo", True),
    })
    db.add(n)
    db.commit()
    db.refresh(n)
    return _dict_nomenclador(n)

@router.put("/nomenclador_practicas/{np_id}/")
def editar_nomenclador(
    np_id: int,
    data: dict,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Editar nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden editar nomencladores")
    n = db.query(NomencladorPractica).filter(
        NomencladorPractica.id == np_id,
        NomencladorPractica.empresa_id == empresa_id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Práctica no encontrada")
    for key, val in data.items():
        if hasattr(NomencladorPractica, key) and key not in ("id", "empresa_id"):
            setattr(n, key, val)
    db.commit()
    db.refresh(n)
    return _dict_nomenclador(n)

@router.delete("/nomenclador_practicas/{np_id}/")
def borrar_nomenclador(
    np_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Borrar nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden borrar nomencladores")
    n = db.query(NomencladorPractica).filter(
        NomencladorPractica.id == np_id,
        NomencladorPractica.empresa_id == empresa_id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Práctica no encontrada")
    db.delete(n)
    db.commit()
    return {"deleted": True, "id": np_id}

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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista recetas. Admin: todas. Médico: solo de pacientes que atendió."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    q = db.query(Receta).filter(Receta.empresa_id == empresa_id)
    if medico_id_auth and not es_admin:
        pacientes_atendidos = db.query(AtencionMedica.paciente_nuevo_id).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id.isnot(None)
        ).subquery()
        q = q.filter(Receta.paciente_nuevo_id.in_(db.query(pacientes_atendidos)))
    items = q.order_by(Receta.created_at.desc()).limit(200).all()
    
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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Obtiene una receta específica por ID. Solo medico que atendio al paciente."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")
    receta = db.query(Receta).filter(Receta.id == receta_id, Receta.empresa_id == empresa_id).first()
    if not receta:
        raise HTTPException(404, "Receta no encontrada")
    if medico_id_auth and not es_admin:
        atendido = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == receta.paciente_nuevo_id
        ).first()
        if not atendido:
            raise HTTPException(403, "No tienes acceso a esta receta")
    return _dict_receta(receta)

@router.get("/pacientes/{paciente_id}/recetas/", response_model=List[dict])
def recetas_paciente(
    paciente_id: int,
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Todas las recetas de un paciente específico. Solo medico con acceso."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
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
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista estudios. Admin: todos. Médico: solo de pacientes atendidos."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
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
    if not es_admin and rol not in ("medico", "superadmin"):
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

# ===== ATENCIONES MEDICAS =====

def _dict_atencion(a, db=None):
    med = db.query(Medico).filter(Medico.id == a.medico_id).first() if db else None
    return {
        "id": a.id,
        "visita_id": a.visita_id,
        "paciente_id": a.paciente_nuevo_id or a.paciente_id,
        "medico_id": a.medico_id,
        "medico_nombre": f"Dr/a. {med.nombre} {med.apellido}" if med else "",
        "fecha_hora_inicio": str(a.fecha_hora_inicio) if a.fecha_hora_inicio else None,
        "fecha_hora_fin": str(a.fecha_hora_fin) if a.fecha_hora_fin else None,
        "estado": a.estado or "",
        "anamnesis": a.anamnesis or "",
        "examen_fisico": a.examen_fisico or "",
        "diagnostico": a.diagnostico or "",
        "plan_tratamiento": a.plan_tratamiento or "",
        "observaciones": a.observaciones or "",
        "presion_arterial": a.presion_arterial or "",
        "frecuencia_cardiaca": a.frecuencia_cardiaca,
        "frecuencia_respiratoria": a.frecuencia_respiratoria,
        "temperatura": a.temperatura,
        "saturacion_oxigeno": a.saturacion_oxigeno,
        "peso": a.peso,
        "altura": a.altura,
        "imc": a.imc,
        "evolucion": a.evolucion or "",
        "created_at": str(a.created_at) if a.created_at else None,
    }

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

    # Restricción: medico solo ve atenciones propias (admin ve todas)
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
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    # Restricción: medico solo puede atender pacientes que YA atendió
    if medico_id_auth and not es_admin:
        es_suyo = db.query(AtencionMedica).filter(
            AtencionMedica.medico_id == medico_id_auth,
            AtencionMedica.paciente_nuevo_id == data.paciente_nuevo_id
        ).first()
        if data.medico_id != medico_id_auth and not es_suyo:
            raise HTTPException(403, "No tienes acceso a este paciente")

    visita_id = data.visita_id
    payload = data.model_dump()

    # Calcular IMC si hay peso + altura
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

    # Marcar visita como completada
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
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == atencion_id, AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

    # Restricción: medico solo modifica atenciones propias
    if medico_id_auth and not es_admin and atencion.medico_id != medico_id_auth:
        raise HTTPException(403, "No tienes acceso a esta atencion")

    payload = data.model_dump(exclude_unset=True)

    # Recalcular IMC si cambia peso o altura
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

# ===== RECETAS CON PDF =====

@router.post("/recetas/", status_code=201)
def crear_receta(
    request: Request,
    data: RecetaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear receta + generar PDF profesional.
    Solo medico que atendio al paciente o admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and rol not in ("medico", "superadmin"):
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    # Restricción: medico solo receta a pacientes que atendió
    if medico_id_auth and not es_admin:
        atencion_medico = db.query(AtencionMedica).filter(
            AtencionMedica.id == data.atencion_medica_id,
            AtencionMedica.medico_id == medico_id_auth
        ).first()
        if not atencion_medico:
            raise HTTPException(403, "Solo puedes crear recetas de atenciones propias")
    # Validar que la atencion existe
    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == data.atencion_medica_id,
        AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

    # Convertir medicamentos a formato JSONB
    meds = [m.model_dump() for m in data.medicamentos]

    receta = Receta(
        empresa_id=empresa_id,
        atencion_medica_id=data.atencion_medica_id,
        paciente_nuevo_id=data.paciente_nuevo_id,
        medico_id=data.medico_id,
        medicamentos=meds,
        indicaciones=data.indicaciones or "",
        valida_hasta=data.valida_hasta,
    )
    db.add(receta)
    db.flush()

    # Generar PDF
    try:
        pdf_url = _generar_pdf_receta(receta, db, empresa_id)
        receta.archivo_pdf_url = pdf_url
        db.commit()
    except Exception as e:
        db.commit()  # Guardar receta aunque falle PDF

    db.refresh(receta)

    return {
        **_dict_receta(receta),
        "pdf_generado": receta.archivo_pdf_url is not None,
    }

def _generar_pdf_receta(receta, db: Session, empresa_id: int) -> Optional[str]:
    """Genera PDF profesional de receta. Devuelve URL/ruta del archivo."""
    import os
    try:
        from fpdf import FPDF
    except ImportError:
        return None

    paciente = db.query(Paciente).filter(Paciente.id == receta.paciente_nuevo_id).first()
    medico = db.query(Medico).filter(Medico.id == receta.medico_id).first()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "RECETA MEDICA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    # Datos del medico
    pdf.set_font("Helvetica", "B", 11)
    med_nombre = f"Dr/a. {medico.nombre} {medico.apellido}" if medico else "Medico"
    pdf.cell(0, 8, med_nombre, new_x="LMARGIN", new_y="NEXT")
    if medico and medico.matricula_provincial:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, f"Matricula: {medico.matricula_provincial}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    # Datos del paciente
    pdf.set_font("Helvetica", "B", 11)
    if paciente:
        pdf.cell(0, 8, f"Paciente: {paciente.nombre} {paciente.apellido}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 6, f"DNI: {paciente.dni}", new_x="LMARGIN", new_y="NEXT")
        if paciente.obra_social:
            pdf.cell(0, 6, f"Obra Social: {paciente.obra_social}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # Medicamentos
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Medicamentos:", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(0, 0, 0)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)

    if receta.medicamentos:
        pdf.set_font("Helvetica", "", 10)
        for i, m in enumerate(receta.medicamentos, 1):
            if isinstance(m, dict):
                pdf.cell(0, 7, f"{i}. {m.get('medicamento', '')} - {m.get('dosis', '')}", new_x="LMARGIN", new_y="NEXT")
                pdf.cell(0, 6, f"   Frecuencia: {m.get('frecuencia', '')}", new_x="LMARGIN", new_y="NEXT")
                pdf.cell(0, 6, f"   Duracion: {m.get('duracion', '')}", new_x="LMARGIN", new_y="NEXT")
            else:
                pdf.cell(0, 7, f"{i}. {str(m)}", new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
    else:
        pdf.cell(0, 7, "Sin medicamentos", new_x="LMARGIN", new_y="NEXT")

    # Indicaciones
    if receta.indicaciones:
        pdf.ln(5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Indicaciones:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, receta.indicaciones)

    # Validez
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 9)
    valida = str(receta.valida_hasta)[:10] if receta.valida_hasta else "30 dias"
    pdf.cell(0, 6, f"Valida hasta: {valida}", new_x="LMARGIN", new_y="NEXT")

    # PDF directory
    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "recetas")
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, f"receta_{receta.id}.pdf")
    pdf.output(pdf_path)

    return f"/data/recetas/receta_{receta.id}.pdf"

# ===== ESTUDIOS ADJUNTOS =====

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
    if not es_admin and rol not in ("medico", "superadmin"):
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
    # Set defaults for NOT NULL DB columns
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

# ===== SEGUIMIENTO AUTOMATICO =====

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
    if not es_admin and rol not in ("medico", "superadmin"):
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

    # Fecha futura
    ahora = datetime.now()
    fecha_futura = ahora + timedelta(days=data.dias_seguimiento)

    # Usar mismo medico o asignar uno nuevo por especialidad
    medico_id = data.medico_id or atencion.medico_id

    # Crear nueva visita
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

# ===== DERIVACION ENTRE ESPECIALIDADES =====

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
    if not es_admin and rol not in ("medico", "superadmin"):
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

    # Buscar medico de la especialidad destino
    medico_destino = db.query(Medico).join(
        MedicoEspecialidades, Medico.id == MedicoEspecialidades.medico_id
    ).filter(
        Medico.empresa_id == empresa_id,
        Medico.activo == True,
        MedicoEspecialidades.especialidad_id == data.especialidad_destino_id
    ).first()

    if not medico_destino:
        raise HTTPException(404, "No hay medico disponible para esa especialidad")

    # Crear visita de derivacion
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


