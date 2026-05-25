"""
SetubalAI MCP Server
Conecta la API de SetubalAI como herramientas nativas de Hermes.

Cada expone como un tool MCP que Hermes puede llamar directamente sin curl.
"""
import os
import asyncio
from contextlib import asynccontextmanager
from datetime import date
from typing import Optional, List

from mcp.server.fastmcp import FastMCP

# Reutilizar la infraestructura de la API
# Importante: necesito usar SQLAlchemy para consultar directamente la DB
# en lugar de hacer HTTP a localhost:3010, así las tools son más rápidas
# y no dependen de que la API esté corriendo.

# Configurar path para imports del API real
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import (
    Factura, Cliente, Producto, ItemFactura,
    Ticket, Proveedor, Interaccion
)
from tenancy import resolve_empresa_id

# Crear servidor MCP
mcp = FastMCP(
    name="setubalai-api",
    instructions="Herramientas de negocio para SetubalAI: CRM, cobros, productos, reportes."
)

# ─── COBROS / FACTURAS ───────────────────────────────────────────────────────

@mcp.tool()
def get_facturas(
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    limite: int = 50,
) -> dict:
    """Lista facturas con filtros opcionales.
    
    Args:
        estado: Filtrar por estado: 'pendiente', 'pagada', 'enviada', 'vencida'
        cliente_id: Filtrar por ID de cliente
        limite: Máximo de resultados (default 50)
    """
    from fastapi import Depends
    empresa_id = 1  # Default SetubalAI
    
    db = next(get_db())
    try:
        q = db.query(Factura).filter(Factura.empresa_id == empresa_id)
        if estado:
            q = q.filter(Factura.estado == estado)
        if cliente_id:
            q = q.filter(Factura.cliente_id == cliente_id)
        
        total = q.count()
        facturas = q.order_by(Factura.fecha_emision.desc()).limit(limite).all()
        
        result = []
        for f in facturas:
            cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
            result.append({
                "id": f.id,
                "numero": f.numero,
                "cliente": cliente.nombre if cliente else "?",
                "cliente_empresa": cliente.empresa_nombre if cliente and cliente.empresa_nombre else None,
                "estado": f.estado,
                "total": float(f.total or 0),
                "moneda": f.moneda or "USD",
                "fecha_emision": str(f.fecha_emision) if f.fecha_emision else None,
                "fecha_vencimiento": str(f.fecha_vencimiento) if f.fecha_vencimiento else None,
                "fecha_pago": str(f.fecha_pago) if f.fecha_pago else None,
                "metodo_pago": f.metodo_pago,
            })
        
        return {"total": total, "facturas": result}
    finally:
        db.close()


@mcp.tool()
def get_facturas_vencidas() -> dict:
    """Retorna todas las facturas vencidas (no pagadas y con fecha vencida pasada).
    Actualiza el estado de pendientes/enviadas a 'vencida' automáticamente."""
    from sqlalchemy import or_
    db = next(get_db())
    try:
        hoy = date.today()
        primero = db.query(Factura.id).filter(
            Factura.empresa_id == 1,
            Factura.estado != "pagada",
            Factura.fecha_vencimiento < hoy
        ).all()
        
        # Actualizar estado
        db.query(Factura).filter(
            Factura.empresa_id == 1,
            Factura.estado.in_(["pendiente", "enviada"]),
            Factura.fecha_vencimiento < hoy
        ).update({"estado": "vencida"}, synchronize_session=False)
        db.commit()
        
        facturas = db.query(Factura).filter(
            Factura.empresa_id == 1,
            Factura.estado == "vencida"
        ).order_by(Factura.fecha_vencimiento).all()
        
        result = []
        for f in facturas:
            cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
            result.append({
                "id": f.id,
                "numero": f.numero,
                "cliente": cliente.nombre if cliente else "?",
                "cliente_empresa": cliente.empresa_nombre if cliente and cliente.empresa_nombre else None,
                "total": float(f.total or 0),
                "fecha_vencimiento": str(f.fecha_vencimiento),
                "dias_vencida": (hoy - f.fecha_vencimiento).days if f.fecha_vencimiento else 0,
            })
        
        return {"total_vencidas": len(result), "vencidas": result}
    finally:
        db.close()


@mcp.tool()
def get_facturas_pendientes() -> dict:
    """Retorna facturas pendientes de cobro (activas, no pagadas)."""
    db = next(get_db())
    try:
        facturas = db.query(Factura).filter(
            Factura.empresa_id == 1,
            Factura.estado.in_(["pendiente", "enviada", "vencida"])
        ).order_by(Factura.fecha_vencimiento).all()
        
        total_pendiente = sum(float(f.total or 0) for f in facturas)
        
        result = []
        for f in facturas:
            cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first()
            result.append({
                "id": f.id,
                "numero": f.numero,
                "cliente": cliente.nombre if cliente else "?",
                "cliente_empresa": cliente.empresa_nombre if cliente and cliente.empresa_nombre else None,
                "estado": f.estado,
                "total": float(f.total or 0),
                "fecha_vencimiento": str(f.fecha_vencimiento) if f.fecha_vencimiento else None,
            })
        
        return {
            "total_pendiente": total_pendiente,
            "cantidad": len(result),
            "facturas": result
        }
    finally:
        db.close()


@mcp.tool()
def marcar_factura_pagada(factura_id: int, metodo_pago: str = "transferencia") -> dict:
    """Marca una factura como pagada.
    
    Args:
        factura_id: ID de la factura a marcar como pagada
        metodo_pago: Método de pago: 'transferencia', 'efectivo', 'tarjeta', etc.
    """
    db = next(get_db())
    try:
        f = db.query(Factura).filter(
            Factura.id == factura_id,
            Factura.empresa_id == 1
        ).first()
        
        if not f:
            return {"ok": False, "error": f"Factura #{factura_id} no encontrada"}
        
        old_estado = f.estado
        f.estado = "pagada"
        f.fecha_pago = date.today()
        f.metodo_pago = metodo_pago
        from datetime import datetime
        f.updated_at = datetime.now()
        db.commit()
        
        return {
            "ok": True,
            "factura_numero": f.numero,
            "total": float(f.total),
            "old_estado": old_estado,
            "mensaje": f"Factura {f.numero} marcada como pagada ({metodo_pago})"
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


@mcp.tool()
def get_cobros_stats() -> dict:
    """Retorna estadísticas generales de cobros: cobrado este mes, pendiente, vencido."""
    from sqlalchemy import func
    db = next(get_db())
    try:
        hoy = date.today()
        mes_inicio = hoy.replace(day=1)
        
        cobrado_mes = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == 1,
            Factura.estado == "pagada",
            Factura.fecha_pago >= mes_inicio
        ).scalar() or 0
        
        pendiente = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == 1,
            Factura.estado.in_(["pendiente", "enviada", "vencida"])
        ).scalar() or 0
        
        vencido = db.query(func.sum(Factura.total)).filter(
            Factura.empresa_id == 1,
            Factura.estado == "vencida"
        ).scalar() or 0
        
        return {
            "cobrado_este_mes": float(cobrado_mes),
            "pendiente_total": float(pendiente),
            "vencido_total": float(vencido),
            "moneda": "USD"
        }
    finally:
        db.close()


# ─── CRM / CLIENTES ──────────────────────────────────────────────────────────

@mcp.tool()
def get_clientes(
    limite: int = 100,
    estado: Optional[str] = None,
    busqueda: Optional[str] = None,
) -> dict:
    """Lista clientes con filtros opcionales.
    
    Args:
        limite: Máximo de resultados (default 100)
        estado: 'activo', 'prospecto', 'moroso', 'inactivo'
        busqueda: Buscar por nombre, email o empresa
    """
    db = next(get_db())
    try:
        q = db.query(Cliente).filter(Cliente.empresa_id == 1)
        if estado:
            q = q.filter(Cliente.estado == estado)
        if busqueda:
            b = f"%{busqueda}%"
            q = q.filter(
                (Cliente.nombre.ilike(b)) |
                (Cliente.email.ilike(b)) |
                (Cliente.empresa_nombre.ilike(b))
            )
        
        total = q.count()
        clientes = q.order_by(Cliente.nombre).limit(limite).all()
        
        result = []
        for c in clientes:
            result.append({
                "id": c.id,
                "nombre": c.nombre,
                "empresa_nombre": c.empresa_nombre,
                "email": c.email,
                "telefono": c.telefono,
                "estado": c.estado,
                "tipo": c.tipo,
                "valor_total": float(c.valor_total or 0),
            })
        
        return {"total": total, "clientes": result}
    finally:
        db.close()


@mcp.tool()
def get_cliente(cliente_id: int) -> dict:
    """Retorna el detalle completo de un cliente por ID."""
    db = next(get_db())
    try:
        c = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not c:
            return {"ok": False, "error": f"Cliente #{cliente_id} no encontrado"}
        
        # Count facturas del cliente
        facturas_count = db.query(Factura).filter(
            Factura.cliente_id == cliente_id
        ).count()
        
        return {
            "ok": True,
            "id": c.id,
            "nombre": c.nombre,
            "empresa_nombre": c.empresa_nombre,
            "email": c.email,
            "telefono": c.telefono,
            "direccion": c.direccion,
            "ciudad": c.ciudad,
            "estado": c.estado,
            "tipo": c.tipo,
            "valor_total": float(c.valor_total or 0),
            "notas": c.notas,
            "cuit": c.cuit,
            "banco": c.banco,
            "alias_cbu": c.alias_cbu,
            "contacto_nombre": c.contacto_nombre,
            "instagram": c.instagram,
            "web": c.web,
            "facturas_count": facturas_count,
        }
    finally:
        db.close()


# ─── PRODUCTOS ───────────────────────────────────────────────────────────────

@mcp.tool()
def get_productos(
    tipo: Optional[str] = None,
    activo: bool = True,
) -> dict:
    """Lista productos y servicios.
    
    Args:
        tipo: Filtrar por tipo: 'producto', 'servicio', 'digital'
        activo: Solo activos (default True)
    """
    from models import CategoriaProducto
    from sqlalchemy.orm import aliased
    db = next(get_db())
    try:
        # Join manual con CategoriaProducto para obtener nombre de categoría
        q = db.query(Producto, CategoriaProducto.nombre).outerjoin(
            CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
        ).filter(
            Producto.empresa_id == 1,
            Producto.activo == activo
        )
        
        if tipo:
            q = q.filter(Producto.tipo == tipo)
        
        rows = q.order_by(Producto.nombre).all()
        
        result = []
        for p, cat_nombre in rows:
            result.append({
                "id": p.id,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "tipo": p.tipo,
                "categoria": cat_nombre,
                "precio": float(p.precio),
                "precio_tipo": p.precio_tipo,
                "stock_actual": p.stock_actual,
                "stock_minimo": p.stock_minimo,
                "control_stock": p.control_stock,
                "activo": p.activo,
            })
        
        return {"total": len(result), "productos": result}
    finally:
        db.close()


@mcp.tool()
def get_stock_critico() -> dict:
    """Retorna productos con stock por debajo del mínimo."""
    from models import CategoriaProducto
    db = next(get_db())
    try:
        criticos = db.query(Producto).outerjoin(
            CategoriaProducto, Producto.categoria_id == CategoriaProducto.id
        ).filter(
            Producto.empresa_id == 1,
            Producto.control_stock == True,
            Producto.stock_actual <= Producto.stock_minimo
        ).order_by(Producto.stock_actual).all()
        
        result = []
        for p, _cat in criticos:
            result.append({
                "id": p.id,
                "nombre": p.nombre,
                "stock_actual": p.stock_actual,
                "stock_minimo": p.stock_minimo,
                "falta": p.stock_minimo - p.stock_actual,
            })
        
        return {"criticos": result}
    finally:
        db.close()


# ─── TICKETS / SOPORTE ───────────────────────────────────────────────────────

@mcp.tool()
def get_tickets(estado: Optional[str] = None, limite: int = 50) -> dict:
    """Lista tickets de soporte.
    
    Args:
        estado: 'abierto', 'en_progreso', 'cerrado'
        limite: Máximo de resultados
    """
    db = next(get_db())
    try:
        q = db.query(Ticket).filter(Ticket.empresa_id == 1)
        if estado:
            q = q.filter(Ticket.estado == estado)
        
        total = q.count()
        tickets = q.order_by(Ticket.created_at.desc()).limit(limite).all()
        
        result = []
        for t in tickets:
            cliente = db.query(Cliente).filter(Cliente.id == t.cliente_id).first()
            result.append({
                "id": t.id,
                "titulo": t.titulo,
                "descripcion": str(t.descripcion or "")[:200],
                "estado": t.estado,
                "prioridad": t.prioridad,
                "canal": t.canal,
                "cliente": cliente.nombre if cliente else "?",
                "created_at": str(t.created_at),
            })
        
        return {"total": total, "tickets": result}
    finally:
        db.close()


# ─── EJECUTAR ────────────────────────────────────────────────────────────────

def main():
    print("Iniciando SetubalAI MCP Server...")
    print("Tools disponibles: get_facturas, get_facturas_vencidas, get_facturas_pendientes,")
    print("                   marcar_factura_pagada, get_cobros_stats, get_clientes, get_cliente,")
    print("                   get_productos, get_stock_critico, get_tickets")
    mcp.run()

if __name__ == "__main__":
    main()
