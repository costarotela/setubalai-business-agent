from fastapi import APIRouter, Depends, Request, HTTPException, Query
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Factura, Cliente, Producto, Ticket, ItemFactura
from datetime import date, timedelta
from calendar import monthrange

router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    hoy = date.today()
    mes_inicio = hoy.replace(day=1)
    mes_pasado_inicio = (mes_inicio - timedelta(days=1)).replace(day=1)

    # Cobrado este mes
    cobrado_mes = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada",
        Factura.fecha_pago >= mes_inicio
    ).scalar() or 0

    # Cobrado mes pasado
    cobrado_mes_pasado = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada",
        Factura.fecha_pago >= mes_pasado_inicio,
        Factura.fecha_pago < mes_inicio
    ).scalar() or 0

    # Pendiente de cobro
    pendiente = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado.in_(["pendiente", "enviada", "vencida"])
    ).scalar() or 0

    # Clientes activos
    clientes_activos = db.query(func.count(Cliente.id)).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.estado == "activo"
    ).scalar() or 0

    # Clientes nuevos este mes
    clientes_nuevos = db.query(func.count(Cliente.id)).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.created_at >= mes_inicio
    ).scalar() or 0

    # Tickets abiertos
    tickets_abiertos = db.query(func.count(Ticket.id)).filter(
        Ticket.empresa_id == empresa_id,
        Ticket.estado.in_(["abierto", "en_proceso"])
    ).scalar() or 0

    # Variacion vs mes anterior
    variacion = 0
    if cobrado_mes_pasado > 0:
        variacion = round(((float(cobrado_mes) - float(cobrado_mes_pasado)) / float(cobrado_mes_pasado)) * 100, 1)

    return {
        "cobrado_este_mes": float(cobrado_mes),
        "cobrado_mes_pasado": float(cobrado_mes_pasado),
        "variacion_pct": variacion,
        "pendiente_cobro": float(pendiente),
        "clientes_activos": clientes_activos,
        "clientes_nuevos_mes": clientes_nuevos,
        "tickets_abiertos": tickets_abiertos,
        "moneda": "USD",
        "periodo": str(mes_inicio)
    }

@router.get("/resumen-semanal")
def resumen_semanal(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    hoy = date.today()
    semana_inicio = hoy - timedelta(days=7)

    cobrado = db.query(func.sum(Factura.total)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada",
        Factura.fecha_pago >= semana_inicio
    ).scalar() or 0

    facturas_emitidas = db.query(func.count(Factura.id)).filter(
        Factura.empresa_id == empresa_id,
        Factura.created_at >= semana_inicio
    ).scalar() or 0

    clientes_nuevos = db.query(func.count(Cliente.id)).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.created_at >= semana_inicio
    ).scalar() or 0

    morosos = db.query(func.count(Factura.id)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "vencida"
    ).scalar() or 0

    return {
        "periodo": f"{semana_inicio} → {hoy}",
        "cobrado": float(cobrado),
        "facturas_emitidas": facturas_emitidas,
        "clientes_nuevos": clientes_nuevos,
        "facturas_vencidas": morosos
    }

@router.get("/top-clientes")
def top_clientes(empresa_id: int = 1, limit: int = 5, db: Session = Depends(get_db)):
    top = db.query(Cliente).filter(
        Cliente.empresa_id == empresa_id
    ).order_by(Cliente.valor_total.desc()).limit(limit).all()
    return {"top": [{"nombre": c.nombre, "valor_total": float(c.valor_total or 0)} for c in top]}

@router.get("/evolucion-mensual")
def evolucion_mensual(
    empresa_id: int = 1,
    meses: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """Retorna la evolución mensual de cobros para los últimos N meses."""
    hoy = date.today()
    resultado = []

    for i in range(meses - 1, -1, -1):
        # Calcular primer día del mes i meses atrás
        # Restar i meses desde el mes actual
        year = hoy.year
        month = hoy.month - i
        while month <= 0:
            month += 12
            year -= 1
        mes_inicio = date(year, month, 1)
        ultimo_dia = monthrange(year, month)[1]
        mes_fin = date(year, month, ultimo_dia)
        mes_str = f"{year:04d}-{month:02d}"

        cobrado = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == empresa_id,
            Factura.estado == "pagada",
            Factura.fecha_pago >= mes_inicio,
            Factura.fecha_pago <= mes_fin
        ).scalar() or 0

        emitido = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == empresa_id,
            Factura.fecha_emision >= mes_inicio,
            Factura.fecha_emision <= mes_fin
        ).scalar() or 0

        pendiente = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == empresa_id,
            Factura.estado.in_(["pendiente", "enviada", "vencida"]),
            Factura.fecha_emision >= mes_inicio,
            Factura.fecha_emision <= mes_fin
        ).scalar() or 0

        resultado.append({
            "mes": mes_str,
            "cobrado": float(cobrado),
            "emitido": float(emitido),
            "pendiente": float(pendiente),
        })

    return {"meses": meses, "evolucion": resultado}

@router.get("/productos-top")
def productos_top(
    empresa_id: int = 1,
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Retorna los productos más vendidos por cantidad total."""
    rows = (
        db.query(
            Producto.id,
            Producto.nombre,
            func.sum(ItemFactura.cantidad).label("cantidad_total"),
            func.sum(ItemFactura.subtotal).label("monto_total"),
        )
        .join(ItemFactura, ItemFactura.producto_id == Producto.id)
        .join(Factura, Factura.id == ItemFactura.factura_id)
        .filter(Factura.empresa_id == empresa_id)
        .group_by(Producto.id, Producto.nombre)
        .order_by(func.sum(ItemFactura.cantidad).desc())
        .limit(limit)
        .all()
    )
    return {
        "top": [
            {
                "producto_id": r.id,
                "nombre": r.nombre,
                "cantidad_total": float(r.cantidad_total or 0),
                "monto_total": float(r.monto_total or 0),
            }
            for r in rows
        ]
    }