from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import Empresa, Cliente, Factura, Producto, Usuario, ItemFactura, Interaccion, Proveedor, Ticket
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from auth import get_current_superadmin

router = APIRouter(prefix="/empresas", tags=["Empresas"])


class EmpresaCreate(BaseModel):
    nombre: str
    rubro: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    moneda: Optional[str] = "USD"
    plan: Optional[str] = "basico"


class EmpresaUpdate(BaseModel):
    nombre: Optional[str] = None
    rubro: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    moneda: Optional[str] = None
    plan: Optional[str] = None
    estado: Optional[str] = None


def _empresa_dict(e: Empresa, db: Session) -> dict:
    cfg = e.configuracion or {}
    estado = cfg.get("estado", "activa")
    plan = cfg.get("plan", "basico")

    clientes_count = db.query(func.count(Cliente.id)).filter(
        Cliente.empresa_id == e.id
    ).scalar() or 0

    facturas_count = db.query(func.count(Factura.id)).filter(
        Factura.empresa_id == e.id
    ).scalar() or 0

    cobrado_total = db.query(func.coalesce(func.sum(Factura.total), 0)).filter(
        Factura.empresa_id == e.id,
        Factura.estado == "pagada"
    ).scalar() or 0

    pendiente_total = db.query(func.coalesce(func.sum(Factura.total), 0)).filter(
        Factura.empresa_id == e.id,
        Factura.estado.in_(["pendiente", "enviada", "vencida"])
    ).scalar() or 0

    return {
        "id": e.id,
        "nombre": e.nombre,
        "rubro": e.rubro,
        "email": e.email,
        "telefono": e.telefono,
        "moneda": e.moneda or "USD",
        "zona_horaria": e.zona_horaria,
        "estado": estado,
        "plan": plan,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "stats": {
            "clientes_count": clientes_count,
            "facturas_count": facturas_count,
            "cobrado_total": float(cobrado_total),
            "pendiente_total": float(pendiente_total),
        }
    }


@router.get("/")
def listar_empresas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_superadmin)
):
    empresas = db.query(Empresa).order_by(Empresa.id).all()
    return {"empresas": [_empresa_dict(e, db) for e in empresas]}


@router.post("/")
def crear_empresa(
    body: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_superadmin)
):
    cfg = {"plan": body.plan or "basico", "estado": "activa"}
    empresa = Empresa(
        nombre=body.nombre,
        rubro=body.rubro,
        email=body.email,
        telefono=body.telefono,
        moneda=body.moneda or "USD",
        configuracion=cfg,
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return _empresa_dict(empresa, db)


@router.put("/{empresa_id}")
def actualizar_empresa(
    empresa_id: int,
    body: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_superadmin)
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    if body.nombre is not None:
        empresa.nombre = body.nombre
    if body.rubro is not None:
        empresa.rubro = body.rubro
    if body.email is not None:
        empresa.email = body.email
    if body.telefono is not None:
        empresa.telefono = body.telefono
    if body.moneda is not None:
        empresa.moneda = body.moneda

    # plan y estado van al JSONB configuracion
    cfg = dict(empresa.configuracion or {})
    if body.plan is not None:
        cfg["plan"] = body.plan
    if body.estado is not None:
        cfg["estado"] = body.estado
    empresa.configuracion = cfg

    db.commit()
    db.refresh(empresa)
    return _empresa_dict(empresa, db)


@router.delete("/{empresa_id}")
def eliminar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_superadmin)
):
    """
    Elimina una empresa y TODOS sus datos asociados en cascada.
    Protección: no se puede eliminar la empresa con id=1 (SetubalAI principal).
    """
    if empresa_id == 1:
        raise HTTPException(
            status_code=403,
            detail="No se puede eliminar la empresa principal (id=1)"
        )

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    nombre = empresa.nombre

    # Eliminar en orden para respetar FK
    facturas = db.query(Factura).filter(Factura.empresa_id == empresa_id).all()
    for f in facturas:
        db.query(ItemFactura).filter(ItemFactura.factura_id == f.id).delete()
    db.query(Factura).filter(Factura.empresa_id == empresa_id).delete()

    clientes = db.query(Cliente).filter(Cliente.empresa_id == empresa_id).all()
    for c in clientes:
        db.query(Interaccion).filter(Interaccion.cliente_id == c.id).delete()
    db.query(Cliente).filter(Cliente.empresa_id == empresa_id).delete()

    db.query(Producto).filter(Producto.empresa_id == empresa_id).delete()
    db.query(Proveedor).filter(Proveedor.empresa_id == empresa_id).delete()
    db.query(Usuario).filter(Usuario.empresa_id == empresa_id).delete()
    db.query(Ticket).filter(Ticket.empresa_id == empresa_id).delete()

    db.delete(empresa)
    db.commit()

    return {"ok": True, "mensaje": f"Empresa '{nombre}' (id={empresa_id}) eliminada con todos sus datos"}


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

    # Últimas 5 facturas
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
