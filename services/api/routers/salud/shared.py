"""
Shared imports, helpers, Pydantic models, and access control for the salud module.
Imported by all salud sub-routers.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from database import get_db
from models import (
    Paciente, Medico, Visita, HistoriaClinica,
    PracticaMedica, NomencladorPractica, AtencionMedica, Usuario,
    Receta, EstudioAdjunto, Cliente,
    MedicoEspecialidades, EspecialidadMedica,
)
from auth import decode_token, get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

router = APIRouter(tags=["Salud"])

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
        # Admin de clínica: clave maestra, ve todo de su empresa
        return None, True, "admin"
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

# Helper: get medico's especialidad names from M:N table
def _get_medico_esp(db, medico_id) -> list:
    esps = db.query(EspecialidadMedica).join(
        MedicoEspecialidades, EspecialidadMedica.id == MedicoEspecialidades.especialidad_id
    ).filter(MedicoEspecialidades.medico_id == medico_id).all()
    return [e.nombre for e in esps]


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
