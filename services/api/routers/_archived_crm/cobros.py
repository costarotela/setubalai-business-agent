from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import Factura, Cliente, ItemFactura, Producto
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
import io
import csv

router = APIRouter(prefix="/cobros", tags=["Cobros"])

class ItemFacturaCreate(BaseModel):
    producto_id: Optional[int] = None
    descripcion: Optional[str] = None  # Se genera desde producto si no se envía
    cantidad: float = 1
    precio_unitario: float

class FacturaCreate(BaseModel):
    cliente_id: int
    fecha_vencimiento: Optional[date] = None
    notas: Optional[str] = None
    items: List[ItemFacturaCreate] = []

class PagoFactura(BaseModel):
    metodo_pago: Optional[str] = "transferencia"
    fecha_pago: Optional[date] = None

@router.get("/")
def listar_facturas(
    request: Request,
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    q = db.query(Factura).filter(Factura.empresa_id == empresa_id)
    if estado:
        q = q.filter(Factura.estado == estado)
    if cliente_id:
        q = q.filter(Factura.cliente_id == cliente_id)
    total = q.count()
    facturas = q.order_by(Factura.created_at.desc()).limit(limit).all()
    return {"total": total, "facturas": [_factura_dict(f, db) for f in facturas]}

@router.get("/pendientes")
def facturas_pendientes(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    facturas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado.in_(["pendiente", "enviada", "vencida"])
    ).order_by(Factura.fecha_vencimiento).all()
    total_pendiente = sum(float(f.total or 0) for f in facturas)
    return {
        "total_pendiente": total_pendiente,
        "cantidad": len(facturas),
        "facturas": [_factura_dict(f, db) for f in facturas]
    }

@router.get("/vencidas")
def facturas_vencidas(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    hoy = date.today()
    # Actualizar estado de vencidas
    db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado.in_(["pendiente", "enviada"]),
        Factura.fecha_vencimiento < hoy
    ).update({"estado": "vencida"})
    db.commit()
    facturas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "vencida"
    ).order_by(Factura.fecha_vencimiento).all()
    return {"vencidas": [_factura_dict(f, db) for f in facturas]}

@router.get("/stats")
def stats_cobros(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    hoy = date.today()
    mes_inicio = hoy.replace(day=1)
    cobrado_mes = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada",
        Factura.fecha_pago >= mes_inicio
    ).scalar() or 0
    pendiente = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado.in_(["pendiente", "enviada", "vencida"])
    ).scalar() or 0
    vencido = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "vencida"
    ).scalar() or 0
    return {
        "cobrado_este_mes": float(cobrado_mes),
        "pendiente_total": float(pendiente),
        "vencido_total": float(vencido),
        "moneda": "USD"
    }

@router.get("/historial")
def historial_facturas_pagadas(
    empresa_id: int = 1,
    cliente_id: Optional[int] = None,
    desde_fecha: Optional[date] = None,
    hasta_fecha: Optional[date] = None,
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db)
):
    """Retorna facturas pagadas con filtros opcionales."""
    q = db.query(Factura).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada"
    )
    if cliente_id:
        q = q.filter(Factura.cliente_id == cliente_id)
    if desde_fecha:
        q = q.filter(Factura.fecha_pago >= desde_fecha)
    if hasta_fecha:
        q = q.filter(Factura.fecha_pago <= hasta_fecha)
    facturas = q.order_by(Factura.fecha_pago.desc()).limit(limit).all()
    result = []
    for f in facturas:
        cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
        result.append({
            "id": f.id,
            "numero": f.numero,
            "cliente": cliente.nombre if cliente else "?",
            "cliente_id": f.cliente_id,
            "fecha_emision": str(f.fecha_emision) if f.fecha_emision else None,
            "fecha_pago": str(f.fecha_pago) if f.fecha_pago else None,
            "total": float(f.total or 0),
            "metodo_pago": f.metodo_pago,
        })
    return {"total": len(result), "historial": result}

@router.get("/exportar-csv")
def exportar_facturas_csv(
    empresa_id: int = 1,
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Exporta facturas en formato CSV con filtros opcionales."""
    q = db.query(Factura).filter(Factura.empresa_id == empresa_id)
    if estado:
        q = q.filter(Factura.estado == estado)
    if cliente_id:
        q = q.filter(Factura.cliente_id == cliente_id)
    facturas = q.order_by(Factura.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["numero", "cliente", "fecha_emision", "fecha_vencimiento", "fecha_pago", "total", "estado"])
    for f in facturas:
        cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
        writer.writerow([
            f.numero,
            cliente.nombre if cliente else "?",
            str(f.fecha_emision) if f.fecha_emision else "",
            str(f.fecha_vencimiento) if f.fecha_vencimiento else "",
            str(f.fecha_pago) if f.fecha_pago else "",
            float(f.total or 0),
            f.estado,
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=facturas.csv"}
    )

@router.post("/", status_code=201)
def crear_factura(data: FacturaCreate, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    # Calcular total
    subtotal = sum(item.cantidad * item.precio_unitario for item in data.items)
    # Numero auto
    ultima = db.query(func.count(Factura.id)).filter(Factura.empresa_id == empresa_id).scalar()
    numero = f"FAC-{empresa_id:03d}-{(ultima+1):04d}"
    factura = Factura(
        empresa_id=empresa_id,
        cliente_id=data.cliente_id,
        numero=numero,
        estado="pendiente",
        fecha_emision=date.today(),
        fecha_vencimiento=data.fecha_vencimiento or (date.today() + timedelta(days=30)),
        subtotal=subtotal,
        total=subtotal,
        notas=data.notas
    )
    db.add(factura)
    db.flush()
    for item in data.items:
        # Resolver descripcion desde producto si no se envía
        prod = None
        if item.producto_id:
            prod = db.query(Producto).filter(Producto.id == item.producto_id).first()
        desc = item.descripcion or (prod.nombre if prod else "Producto genérico")
        precio = float(item.precio_unitario) or (float(prod.precio or prod.precio_venta) if prod else 0)
        subtotal = round(item.cantidad * precio, 2)
        db.add(ItemFactura(
            factura_id=factura.id,
            producto_id=item.producto_id,
            descripcion=desc,
            cantidad=item.cantidad,
            precio_unitario=precio,
            subtotal=subtotal
        ))
    # Actualizar valor_total del cliente
    db.query(Cliente).filter(Cliente.id == data.cliente_id).update(
        {"valor_total": Cliente.valor_total + subtotal}
    )
    db.commit()
    db.refresh(factura)
    return _factura_dict(factura, db)

@router.put("/{factura_id}/pagar")
def pagar_factura(factura_id: int, body: PagoFactura, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.empresa_id == empresa_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    f.estado = "pagada"
    f.fecha_pago = body.fecha_pago or date.today()
    f.metodo_pago = body.metodo_pago
    f.updated_at = datetime.now()
    db.commit()
    return {"ok": True, "factura": f.numero, "total": float(f.total), "mensaje": f"Factura {f.numero} marcada como pagada"}

@router.get("/{factura_id}/recibo")
def generar_recibo_pdf(factura_id: int, db: Session = Depends(get_db)):
    """Genera y retorna un recibo PDF de la factura indicada."""
    f = db.query(Factura).filter(Factura.id == factura_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
    cliente_nombre = cliente.nombre if cliente else "?"

    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        "Title", parent=styles["Heading1"],
        fontSize=22, alignment=TA_CENTER, spaceAfter=12,
        textColor=colors.HexColor("#1a1a2e")
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=11, alignment=TA_CENTER, spaceAfter=6,
        textColor=colors.HexColor("#555555")
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontSize=11, spaceAfter=4
    )

    story.append(Paragraph("RECIBO DE PAGO", title_style))
    story.append(Paragraph("SetubalAI — Sistema de Gestión", subtitle_style))
    story.append(Spacer(1, 0.5*cm))

    data_table = [
        ["Número de Factura:", f.numero or "—"],
        ["Cliente:", cliente_nombre],
        ["Monto Total:", f"${float(f.total or 0):,.2f} {f.moneda or 'USD'}"],
        ["Fecha de Pago:", str(f.fecha_pago) if f.fecha_pago else "—"],
        ["Método de Pago:", f.metodo_pago or "—"],
        ["Estado:", f.estado.upper() if f.estado else "—"],
    ]
    table = Table(data_table, colWidths=[5*cm, 11*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f0f0")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        f"Documento generado el {date.today().strftime('%d/%m/%Y')} — SetubalAI",
        subtitle_style
    ))

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=recibo-{f.numero or factura_id}.pdf"}
    )

@router.get("/{factura_id}")
def obtener_factura(factura_id: int, db: Session = Depends(get_db)):
    f = db.query(Factura).filter(Factura.id == factura_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return _factura_dict(f, db)

def _factura_dict(f, db):
    cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
    return {
        "id": f.id, "numero": f.numero, "estado": f.estado,
        "cliente": cliente.nombre if cliente else "?",
        "cliente_id": f.cliente_id,
        "fecha_emision": str(f.fecha_emision) if f.fecha_emision else None,
        "fecha_vencimiento": str(f.fecha_vencimiento) if f.fecha_vencimiento else None,
        "fecha_pago": str(f.fecha_pago) if f.fecha_pago else None,
        "total": float(f.total or 0),
        "moneda": f.moneda,
        "notas": f.notas
    }