from fastapi import APIRouter, Depends, HTTPException, Request, Query
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from database import get_db
from models import Producto, CategoriaProducto
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/productos", tags=["Productos"])

class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: str = "producto"
    precio: float
    precio_tipo: str = "unico"
    moneda: str = "USD"
    stock_actual: int = 0
    stock_minimo: int = 0
    control_stock: bool = False
    categoria_id: Optional[int] = None

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    stock_actual: Optional[int] = None
    activo: Optional[bool] = None
    descripcion: Optional[str] = None

def _q(db, empresa_id):
    return db.query(Producto, CategoriaProducto).outerjoin(
        CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
    ).filter(Producto.empresa_id == empresa_id)

def _prod_dict(p, cat):
    return {
        "id": p.id,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "tipo": p.tipo,
        "categoria": cat.nombre if cat else None,
        "categoria_id": p.categoria_id,
        "precio": float(p.precio),
        "precio_tipo": p.precio_tipo,
        "moneda": p.moneda,
        "stock_actual": p.stock_actual,
        "stock_minimo": p.stock_minimo,
        "control_stock": p.control_stock,
        "imagen_url": p.imagen_url,
        "activo": p.activo,
    }

@router.get("/")
def listar_productos(request: Request, activo: bool = True, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    rows = _q(db, empresa_id).filter(Producto.activo == activo).order_by(Producto.nombre).all()
    return {"total": len(rows), "productos": [_prod_dict(p, c) for p, c in rows]}

@router.get("/stock-critico")
def stock_critico(request: Request, db: Session = Depends(get_db), empresa_id: int = Depends(resolve_empresa_id)):
    rows = _q(db, empresa_id).filter(
        Producto.control_stock == True,
        Producto.stock_actual <= Producto.stock_minimo
    ).all()
    return {"criticos": [_prod_dict(p, c) for p, c in rows]}

@router.get("/{producto_id}")
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    row = db.query(Producto, CategoriaProducto).outerjoin(
        CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
    ).filter(Producto.id == producto_id).first()
    if not row:
        raise HTTPException(404, "Producto no encontrado")
    return _prod_dict(row[0], row[1])

@router.post("/", status_code=201)
def crear_producto(data: ProductoCreate, db: Session = Depends(get_db)):
    p = Producto(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return _prod_dict(p, None)

@router.put("/{producto_id}")
def actualizar_producto(producto_id: int, data: ProductoUpdate, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    p.updated_at = datetime.now()
    db.commit()
    db.refresh(p)
    return _prod_dict(p, None)

@router.put("/{producto_id}/stock")
def actualizar_stock(producto_id: int, cantidad: int, db: Session = Depends(get_db)):
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(404, "Producto no encontrado")
    p.stock_actual = cantidad
    p.updated_at = datetime.now()
    db.commit()
    alerta = p.control_stock and p.stock_actual <= p.stock_minimo
    return {"ok": True, "stock": p.stock_actual, "alerta_stock_bajo": alerta}