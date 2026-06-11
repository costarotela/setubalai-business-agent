from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Empresa, Cliente, Factura, Producto, Usuario
from pydantic import BaseModel
from datetime import date
from auth import get_current_superadmin

router = APIRouter(prefix="/empresas", tags=["Empresas"])


@router.get("/{empresa_id}/stats")
def stats_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_superadmin)
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    hoy = date.today()
    primer_dia_mes = hoy.replace(day=1)

    cobrado_este_mes = db.query(func.coalesce(func.sum(Factura.total), 0)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada",
        Factura.fecha_pago >= primer_dia_mes,
    ).scalar() or 0

    cobrado_total = db.query(func.coalesce(func.sum(Factura.total), 0)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado == "pagada"
    ).scalar() or 0

    clientes_activos = db.query(func.count(Cliente.id)).filter(
        Cliente.empresa_id == empresa_id,
        Cliente.estado == "activo"
    ).scalar() or 0

    facturas_pendientes = db.query(func.count(Factura.id)).filter(
        Factura.empresa_id == empresa_id,
        Factura.estado.in_(["pendiente", "enviada", "vencida"])
    ).scalar() or 0

    productos_count = db.query(func.count(Producto.id)).filter(
        Producto.empresa_id == empresa_id,
        Producto.activo == True
    ).scalar() or 0

    ultimas = db.query(Factura).filter(
        Factura.empresa_id == empresa_id
    ).order_by(Factura.created_at.desc()).limit(5).all()

    ultimas_5 = []
    for f in ultimas:
        cliente_nombre = ""
        if f.cliente_id:
            cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
            cliente_nombre = cliente.nombre if cliente else ""
        ultimas_5.append({
            "numero": f.numero or f"#{f.id}",
            "cliente": cliente_nombre,
            "total": float(f.total or 0),
            "estado": f.estado,
            "fecha_emision": f.fecha_emision.isoformat() if f.fecha_emision else None,
        })

    return {
        "empresa_id": empresa_id,
        "cobrado_este_mes": float(cobrado_este_mes),
        "cobrado_total": float(cobrado_total),
        "clientes_activos": clientes_activos,
        "facturas_pendientes": facturas_pendientes,
        "productos_count": productos_count,
        "ultimas_5_facturas": ultimas_5,
    }
