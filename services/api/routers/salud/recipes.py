"""
Recetas routes: listar, obtener, recetas por paciente, crear receta con PDF
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, Receta, AtencionMedica, Paciente, Medico, RecetaCreate,
    _dict_receta, HTTPException,
)

router = salud_router

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

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "RECETA MEDICA", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 11)
    med_nombre = f"Dr/a. {medico.nombre} {medico.apellido}" if medico else "Medico"
    pdf.cell(0, 8, med_nombre, new_x="LMARGIN", new_y="NEXT")
    if medico and medico.matricula_provincial:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 6, f"Matricula: {medico.matricula_provincial}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 11)
    if paciente:
        pdf.cell(0, 8, f"Paciente: {paciente.nombre} {paciente.apellido}", new_x="LMARGIN", new_y="NEXT")
        pdf.cell(0, 6, f"DNI: {paciente.dni}", new_x="LMARGIN", new_y="NEXT")
        if paciente.obra_social:
            pdf.cell(0, 6, f"Obra Social: {paciente.obra_social}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

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

    if receta.indicaciones:
        pdf.ln(5)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "Indicaciones:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, receta.indicaciones)

    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 9)
    valida = str(receta.valida_hasta)[:10] if receta.valida_hasta else "30 dias"
    pdf.cell(0, 6, f"Valida hasta: {valida}", new_x="LMARGIN", new_y="NEXT")

    pdf_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "recetas")
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = os.path.join(pdf_dir, f"receta_{receta.id}.pdf")
    pdf.output(pdf_path)

    return f"/data/recetas/receta_{receta.id}.pdf"


@router.get("/recetas/", response_model=List[dict])
def listar_recetas(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Lista recetas. Admin: todas. Médico: solo de pacientes que atendió."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if not es_admin and not medico_id_auth:
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
    if not es_admin and not medico_id_auth:
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
    if not es_admin and not medico_id_auth:
        raise HTTPException(403, "Acceso solo para médicos autorizados")

    if medico_id_auth and not es_admin:
        atencion_medico = db.query(AtencionMedica).filter(
            AtencionMedica.id == data.atencion_medica_id,
            AtencionMedica.medico_id == medico_id_auth
        ).first()
        if not atencion_medico:
            raise HTTPException(403, "Solo puedes crear recetas de atenciones propias")

    atencion = db.query(AtencionMedica).filter(
        AtencionMedica.id == data.atencion_medica_id,
        AtencionMedica.empresa_id == empresa_id
    ).first()
    if not atencion:
        raise HTTPException(404, "Atencion no encontrada")

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

    try:
        pdf_url = _generar_pdf_receta(receta, db, empresa_id)
        receta.archivo_pdf_url = pdf_url
        db.commit()
    except Exception as e:
        db.commit()

    db.refresh(receta)

    return {
        **_dict_receta(receta),
        "pdf_generado": receta.archivo_pdf_url is not None,
    }
