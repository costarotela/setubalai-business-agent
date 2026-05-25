"""
Router /public/catalogo — Catálogo público sin autenticación
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Producto, CategoriaProducto, Empresa
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/public/catalogo", tags=["Catálogo Público"])


@router.get("/{empresa_slug}")
def obtener_catalogo(empresa_slug: str, db: Session = Depends(get_db)):
    """Obtener catálogo público completo de una empresa por slug."""
    empresa = db.query(Empresa).filter(
        Empresa.configuracion.has_key("catalogo_slug"),
        Empresa.configuracion["catalogo_slug"].astext == empresa_slug
    ).first()
    if not empresa:
        raise HTTPException(404, "Catálogo no encontrado")

    if not empresa.configuracion.get("catalogo_activo", False):
        raise HTTPException(404, "Catálogo desactivado")

    # Obtener categorías públicas
    cats = db.query(CategoriaProducto).filter(
        CategoriaProducto.empresa_id == empresa.id,
        CategoriaProducto.activo == True
    ).order_by(CategoriaProducto.orden, CategoriaProducto.nombre).all()

    # Obtener productos públicos
    prods = db.query(Producto, CategoriaProducto).outerjoin(
        CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
    ).filter(
        Producto.empresa_id == empresa.id,
        Producto.activo == True,
        Producto.visible_en_catalogo == True
    ).order_by(Producto.orden_catalogo, Producto.nombre).all()

    # Construir árbol de categorías
    cat_dict = {}
    root_cats = []
    for c in cats:
        cd = {"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion, "hijos": []}
        cat_dict[c.id] = cd
        if c.categoria_padre_id:
            parent = cat_dict.get(c.categoria_padre_id)
            if parent:
                parent["hijos"].append(cd)
        else:
            root_cats.append(cd)

    # Construir mapa de categorías padres para productos
    cat_parent_map = {}
    for c in cats:
        if c.categoria_padre_id:
            parent_cat = db.query(CategoriaProducto).filter(
                CategoriaProducto.id == c.categoria_padre_id
            ).first()
            if parent_cat:
                cat_parent_map[c.id] = parent_cat.nombre

    return {
        "empresa": {
            "nombre": empresa.nombre,
            "rubro": empresa.rubro,
            "telefono": empresa.telefono,
            "email": empresa.email,
            "direccion": empresa.direccion,
            "web": empresa.web,
            "instagram": empresa.instagram,
            "moneda": empresa.moneda,
            "configuracion_catalogo": empresa.configuracion.get("catalogo_config", {}),
        },
        "categorias": root_cats,
        "productos": [{
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion_catalogo or p.descripcion,
            "categoria_nombre": c.nombre if c else None,
            "categoria_padre_nombre": cat_parent_map.get(c.id) if c else None,
            "precio": float(p.precio),
            "precio_oferta": float(p.precio_oferta) if p.precio_oferta else None,
            "precio_tipo": p.precio_tipo,
            "moneda": p.moneda,
            "imagen_url": p.imagen_url,
            "destacado": p.destacado_en_catalogo,
        } for p, c in prods],
    }


@router.get("/{empresa_slug}/categorias")
def get_public_categories(empresa_slug: str, db: Session = Depends(get_db)):
    """Obtener solo el árbol de categorías de un catálogo público."""
    empresa = db.query(Empresa).filter(
        Empresa.configuracion.has_key("catalogo_slug"),
        Empresa.configuracion["catalogo_slug"].astext == empresa_slug
    ).first()
    if not empresa:
        raise HTTPException(404, "Catálogo no encontrado")

    cats = db.query(CategoriaProducto).filter(
        CategoriaProducto.empresa_id == empresa.id,
        CategoriaProducto.activo == True
    ).order_by(CategoriaProducto.orden, CategoriaProducto.nombre).all()

    cat_dict = {}
    root_cats = []
    for c in cats:
        cd = {"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion, "hijos": []}
        cat_dict[c.id] = cd
        if c.categoria_padre_id:
            parent = cat_dict.get(c.categoria_padre_id)
            if parent:
                parent["hijos"].append(cd)
        else:
            root_cats.append(cd)

    return {"categorias": root_cats}


@router.get("/{empresa_slug}/productos")
def get_public_products(empresa_slug: str, db: Session = Depends(get_db)):
    """Obtener solo los productos de un catálogo público."""
    empresa = db.query(Empresa).filter(
        Empresa.configuracion.has_key("catalogo_slug"),
        Empresa.configuracion["catalogo_slug"].astext == empresa_slug
    ).first()
    if not empresa:
        raise HTTPException(404, "Catálogo no encontrado")

    prods = db.query(Producto, CategoriaProducto).outerjoin(
        CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
    ).filter(
        Producto.empresa_id == empresa.id,
        Producto.activo == True,
        Producto.visible_en_catalogo == True
    ).order_by(Producto.orden_catalogo, Producto.nombre).all()

    return {
        "total": len(prods),
        "productos": [{
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion_catalogo or p.descripcion,
            "categoria_nombre": c.nombre if c else None,
            "precio": float(p.precio),
            "precio_oferta": float(p.precio_oferta) if p.precio_oferta else None,
            "precio_tipo": p.precio_tipo,
            "moneda": p.moneda,
            "imagen_url": p.imagen_url,
            "destacado": p.destacado_en_catalogo,
        } for p, c in prods],
    }


@router.get("/{empresa_slug}/destacados")
def get_featured_products(empresa_slug: str, db: Session = Depends(get_db)):
    """Obtener productos destacados del catálogo público."""
    empresa = db.query(Empresa).filter(
        Empresa.configuracion.has_key("catalogo_slug"),
        Empresa.configuracion["catalogo_slug"].astext == empresa_slug
    ).first()
    if not empresa:
        raise HTTPException(404, "Catálogo no encontrado")

    prods = db.query(Producto, CategoriaProducto).outerjoin(
        CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
    ).filter(
        Producto.empresa_id == empresa.id,
        Producto.activo == True,
        Producto.visible_en_catalogo == True,
        Producto.destacado_en_catalogo == True
    ).order_by(Producto.orden_catalogo, Producto.nombre).all()

    return {
        "total": len(prods),
        "productos": [{
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion_catalogo or p.descripcion,
            "categoria_nombre": c.nombre if c else None,
            "precio": float(p.precio),
            "precio_oferta": float(p.precio_oferta) if p.precio_oferta else None,
            "precio_tipo": p.precio_tipo,
            "moneda": p.moneda,
            "imagen_url": p.imagen_url,
        } for p, c in prods],
    }
