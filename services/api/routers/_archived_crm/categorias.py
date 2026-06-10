"""
Router /categorias — CRUD de categorías de productos por empresa
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

from database import get_db
from models import CategoriaProducto, Producto
from tenancy import resolve_empresa_id
from pydantic import BaseModel

router = APIRouter(prefix="/categorias", tags=["Categorías"])


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria_padre_id: Optional[int] = None
    orden: int = 0


class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_padre_id: Optional[int] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None


def _cat_dict(cat: CategoriaProducto) -> dict:
    return {
        "id": cat.id,
        "nombre": cat.nombre,
        "descripcion": cat.descripcion,
        "categoria_padre_id": cat.categoria_padre_id,
        "orden": cat.orden,
        "activo": cat.activo,
        "created_at": cat.created_at.isoformat() if cat.created_at else None,
    }


@router.get("/")
def listar_categorias(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Listar categorías de MI empresa."""
    cats = (
        db.query(CategoriaProducto)
        .filter(CategoriaProducto.empresa_id == empresa_id)
        .order_by(CategoriaProducto.orden, CategoriaProducto.nombre)
        .all()
    )
    return {"total": len(cats), "categorias": [_cat_dict(c) for c in cats]}


@router.get("/arbol")
def obtener_arbol_categorias(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Obtener árbol de categorías de MI empresa."""
    cats = (
        db.query(CategoriaProducto)
        .filter(CategoriaProducto.empresa_id == empresa_id)
        .order_by(CategoriaProducto.orden, CategoriaProducto.nombre)
        .all()
    )
    
    cat_dict = {}
    root_cats = []
    for c in cats:
        cd = {
            "id": c.id,
            "nombre": c.nombre,
            "descripcion": c.descripcion,
            "orden": c.orden,
            "activo": c.activo,
            "hijos": [],
        }
        cat_dict[c.id] = cd
        if c.categoria_padre_id:
            parent = cat_dict.get(c.categoria_padre_id)
            if parent:
                parent["hijos"].append(cd)
        else:
            root_cats.append(cd)
    
    return {"categorias": root_cats}


@router.post("/", status_code=201)
def crear_categoria(
    data: CategoriaCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Crear categoría para MI empresa."""
    if not data.nombre or not data.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    if len(data.nombre) > 100:
        raise HTTPException(status_code=400, detail="El nombre no puede exceder 100 caracteres")

    # Check duplicado dentro de la misma empresa
    existing = db.query(CategoriaProducto).filter(
        CategoriaProducto.empresa_id == empresa_id,
        CategoriaProducto.nombre == data.nombre.strip()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")

    # Validate parent belongs to same empresa
    if data.categoria_padre_id is not None:
        parent = db.query(CategoriaProducto).filter(
            CategoriaProducto.id == data.categoria_padre_id,
            CategoriaProducto.empresa_id == empresa_id
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="La categoría padre no existe en tu empresa")

    cat = CategoriaProducto(
        empresa_id=empresa_id,
        nombre=data.nombre.strip(),
        descripcion=data.descripcion,
        categoria_padre_id=data.categoria_padre_id,
        orden=data.orden,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return _cat_dict(cat)


@router.put("/{categoria_id}")
def actualizar_categoria(
    categoria_id: int,
    data: CategoriaUpdate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """Editar categoría de MI empresa."""
    cat = db.query(CategoriaProducto).filter(
        CategoriaProducto.id == categoria_id,
        CategoriaProducto.empresa_id == empresa_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    if data.nombre is not None:
        if not data.nombre.strip():
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        if len(data.nombre) > 100:
            raise HTTPException(status_code=400, detail="El nombre no puede exceder 100 caracteres")

        # Check duplicado (excluyendo esta categoría)
        existing = db.query(CategoriaProducto).filter(
            CategoriaProducto.empresa_id == empresa_id,
            CategoriaProducto.nombre == data.nombre.strip(),
            CategoriaProducto.id != categoria_id
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")

        cat.nombre = data.nombre.strip()

    if data.descripcion is not None:
        cat.descripcion = data.descripcion

    if data.categoria_padre_id is not None:
        # Prevent self-reference
        if data.categoria_padre_id == categoria_id:
            raise HTTPException(status_code=400, detail="Una categoría no puede ser padre de sí misma")
        parent = db.query(CategoriaProducto).filter(
            CategoriaProducto.id == data.categoria_padre_id,
            CategoriaProducto.empresa_id == empresa_id
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="La categoría padre no existe en tu empresa")
        cat.categoria_padre_id = data.categoria_padre_id

    if data.orden is not None:
        cat.orden = data.orden

    if data.activo is not None:
        cat.activo = data.activo

    db.commit()
    db.refresh(cat)
    return _cat_dict(cat)


@router.delete("/{categoria_id}")
def eliminar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Eliminar categoría de MI empresa.
    Protegido: no se puede eliminar si tiene productos asignados.
    """
    cat = db.query(CategoriaProducto).filter(
        CategoriaProducto.id == categoria_id,
        CategoriaProducto.empresa_id == empresa_id
    ).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    # Check si tiene productos
    product_count = db.query(func.count(Producto.id)).filter(
        Producto.categoria_id == categoria_id,
        Producto.empresa_id == empresa_id
    ).scalar() or 0

    if product_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede eliminar: tiene {product_count} producto(s) asignado(s). Reasigná o eliminá los productos primero."
        )

    nombre = cat.nombre
    db.delete(cat)
    db.commit()
    return {"ok": True, "mensaje": f"Categoría '{nombre}' eliminada"}
