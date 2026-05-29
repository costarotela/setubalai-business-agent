"""
SetubalAI MCP Server
Conecta la API de SetubalAI como herramientas nativas de Hermes.

Cada expone como un tool MCP que Hermes puede llamar directamente sin curl.
"""
import os
import asyncio
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
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
    Ticket, Proveedor, Interaccion,
    Paciente, Medico, Visita, AtencionMedica,
    HistoriaClinica, PracticaMedica, NomencladorPractica,
    Receta, EstudioAdjunto, NotificacionProgramada,
)
from tenancy import resolve_empresa_id

# Crear servidor MCP
mcp = FastMCP(
    name="setubalai-api",
    instructions="Herramientas de negocio para SetubalAI: CRM, cobros, productos, reportes Y herramientas médicas completas para centros de salud."
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


# ─── SALUD / CENTRO MÉDICO ───────────────────────────────────────────────────

DAY_MAP = {
    0: "lunes", 1: "martes", 2: "miércoles", 3: "jueves",
    4: "viernes", 5: "sábado", 6: "domingo"
}


def _parse_horario(horario_str):
    """Parsea '09:00-13:00' → (9*60, 13*60) en minutos desde medianoche."""
    start_str, end_str = horario_str.strip().split("-")
    sh, sm = map(int, start_str.split(":"))
    eh, em = map(int, end_str.split(":"))
    return sh * 60 + sm, eh * 60 + em


def _get_slots_for_day(horarios, dt_utc, occupied_slots, duracion_min):
    """Genera slots disponibles para un día dado según horarios_atencion."""
    dia = DAY_MAP[dt_utc.weekday()]
    day_horarios = horarios.get(dia, [])
    if not day_horarios:
        return []

    slots = []
    # Evitar slots en el pasado
    now_utc = datetime.now(timezone.utc)

    for horario_str in day_horarios:
        start_min, end_min = _parse_horario(horario_str)
        current = start_min
        while current + duracion_min <= end_min:
            h, m = divmod(current, 60)
            slot_dt = dt_utc.replace(hour=h, minute=m, second=0, microsecond=0)
            # Skip past slots
            if slot_dt <= now_utc:
                current += duracion_min
                continue
            # Check if occupied (compare with 2-min tolerance)
            is_free = True
            for occ in occupied_slots:
                diff = abs((slot_dt - occ).total_seconds())
                if diff < 120:  # 2 min tolerance
                    is_free = False
                    break
            if is_free:
                slots.append(slot_dt.isoformat())
            current += duracion_min
    return slots


@mcp.tool()
def med_especialidades_disponibles(empresa_id: int = 16) -> dict:
    """Lista todas las especialidades médicas disponibles en el centro."""
    from sqlalchemy import distinct
    db = next(get_db())
    try:
        rows = db.query(distinct(Medico.especialidades)).filter(
            Medico.empresa_id == empresa_id,
            Medico.activo == True
        ).all()
        # especialidades es ARRAY, need to unnest
        all_rows = db.query(Medico).filter(
            Medico.empresa_id == empresa_id,
            Medico.activo == True
        ).all()
        specs = set()
        for m in all_rows:
            if m.especialidades:
                for s in m.especialidades:
                    specs.add(s)
        return {"especialidades": sorted(specs)}
    finally:
        db.close()


@mcp.tool()
def med_buscar_paciente(
    dni: Optional[str] = None,
    nombre: Optional[str] = None,
    apellido: Optional[str] = None,
    telefono: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Busca pacientes por DNI, nombre, apellido o teléfono.
    Retorna lista de coincidencias. Ideal para identificar si existe."""
    db = next(get_db())
    try:
        q = db.query(Paciente).filter(Paciente.empresa_id == empresa_id)
        if dni:
            q = q.filter(Paciente.dni == dni)
        if nombre:
            q = q.filter(Paciente.nombre.ilike(f"%{nombre}%"))
        if apellido:
            q = q.filter(Paciente.apellido.ilike(f"%{apellido}%"))
        if telefono:
            q = q.filter(Paciente.telefono == telefono)

        result = []
        for p in q.order_by(Paciente.apellido).limit(20).all():
            result.append({
                "id": p.id,
                "nombre": p.nombre,
                "apellido": p.apellido,
                "dni": p.dni,
                "telefono": p.telefono,
                "email": p.email,
                "obra_social": p.obra_social,
                "numero_afiliado": p.numero_afiliado,
                "plan": p.plan,
            })
        return {"total": len(result), "pacientes": result}
    finally:
        db.close()


@mcp.tool()
def med_crear_paciente(
    nombre: str,
    apellido: str,
    dni: str,
    fecha_nacimiento: Optional[str] = None,
    obra_social: Optional[str] = None,
    numero_afiliado: Optional[str] = None,
    plan: Optional[str] = None,
    telefono: Optional[str] = None,
    email: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Crea un nuevo paciente en el sistema.
    Retorna datos del paciente creado con su ID."""
    db = next(get_db())
    try:
        # Check DNI duplicate
        existing = db.query(Paciente).filter(
            Paciente.empresa_id == empresa_id,
            Paciente.dni == dni
        ).first()
        if existing:
            return {
                "ok": False,
                "error": f"Ya existe un paciente con DNI {dni}: {existing.nombre} {existing.apellido} (ID: {existing.id})"
            }

        fn = None
        if fecha_nacimiento:
            try:
                fn = datetime.strptime(fecha_nacimiento, "%Y-%m-%d").date()
            except ValueError:
                return {"ok": False, "error": "fecha_nacimiento debe ser YYYY-MM-DD"}
        else:
            # fecha_nacimiento es NOT NULL, usar fecha por defecto
            fn = date(1980, 1, 1)

        p = Paciente(
            empresa_id=empresa_id,
            nombre=nombre,
            apellido=apellido,
            dni=dni,
            fecha_nacimiento=fn,
            obra_social=obra_social,
            numero_afiliado=numero_afiliado,
            plan=plan,
            telefono=telefono,
            email=email,
            activo=True,
        )
        db.add(p)
        db.commit()
        db.refresh(p)

        return {
            "ok": True,
            "id": p.id,
            "nombre": p.nombre,
            "apellido": p.apellido,
            "dni": p.dni,
            "obra_social": p.obra_social,
            "mensaje": f"Paciente creado: {nombre} {apellido} (ID: {p.id})"
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


@mcp.tool()
def med_listar_medicos(
    especialidad: Optional[str] = None,
    activo: bool = True,
    empresa_id: int = 16
) -> dict:
    """Lista médicos activos, opcionalmente filtrados por especialidad."""
    from sqlalchemy import cast, String
    db = next(get_db())
    try:
        q = db.query(Medico).filter(
            Medico.empresa_id == empresa_id,
            Medico.activo == activo
        )
        if especialidad:
            # PostgreSQL array contains
            medics_actual = []
            for m in q.all():
                if m.especialidades and especialidad in m.especialidades:
                    medics_actual.append(m)
        else:
            medics_actual = q.all()

        result = []
        for m in medics_actual:
            result.append({
                "id": m.id,
                "nombre": m.nombre,
                "apellido": m.apellido,
                "especialidades": m.especialidades or [],
                "duracion_turno_minutos": m.duracion_turno_minutos,
                "horarios_atencion": m.horarios_atencion,
                "matricula_provincial": m.matricula_provincial,
                "matricula_nacional": m.matricula_nacional,
            })
        return {"total": len(result), "medicos": result}
    finally:
        db.close()


@mcp.tool()
def med_buscar_slots_disponibles(
    medico_id: int,
    fecha_desde: str,  # YYYY-MM-DD
    fecha_hasta: str,   # YYYY-MM-DD
    empresa_id: int = 16
) -> dict:
    """Busca slots disponibles para un médico en un rango de fechas.
    Considera horarios_atencion del médico y turnos ya agendados.
    Retorna slots en formato ISO."""
    db = next(get_db())
    try:
        medico = db.query(Medico).filter(
            Medico.id == medico_id,
            Medico.empresa_id == empresa_id
        ).first()
        if not medico:
            return {"ok": False, "error": f"Médico #{medico_id} no encontrado"}

        duracion = medico.duracion_turno_minutos
        horarios = medico.horarios_atencion or {}

        # Get existing turnos
        try:
            fd = datetime.strptime(fecha_desde, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            fh = datetime.strptime(fecha_hasta, "%Y-%m-%d").replace(
                hour=23, minute=59, second=59, tzinfo=timezone.utc
            )
        except ValueError:
            return {"ok": False, "error": "Fechas deben ser YYYY-MM-DD"}

        turnos = db.query(Visita).filter(
            Visita.empresa_id == empresa_id,
            Visita.medico_id == medico_id,
            Visita.fecha_hora >= fd,
            Visita.fecha_hora <= fh,
            Visita.estado.in_(["pendiente", "confirmado", "en_curso", "en-curso"])
        ).all()

        occupied = [t.fecha_hora for t in turnos if t.fecha_hora]

        slots = []
        delta = timedelta(days=1)
        current_date = fd.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = fh.replace(hour=0, minute=0, second=0, microsecond=0)

        while current_date <= end_date:
            day_slots = _get_slots_for_day(horarios, current_date, occupied, duracion)
            for s in day_slots:
                slots.append(s)
            current_date += delta

        return {
            "ok": True,
            "medico": f"{medico.nombre} {medico.apellido}",
            "duracion_minutos": duracion,
            "total_slots": len(slots),
            "slots": slots
        }
    finally:
        db.close()


@mcp.tool()
def med_crear_turno(
    paciente_id: int,
    medico_id: int,
    fecha_hora: str,  # ISO format: YYYY-MM-DDTHH:MM:SS
    motivo_consulta: Optional[str] = None,
    tipo_visita: str = "consulta",
    empresa_id: int = 16
) -> dict:
    """Crea un turno (visita) en la DB.
    Verifica: paciente existe, médico existe, slot disponible, no duplicados."""
    db = next(get_db())
    try:
        # Verify paciente
        paciente = db.query(Paciente).filter(
            Paciente.id == paciente_id,
            Paciente.empresa_id == empresa_id
        ).first()
        if not paciente:
            return {"ok": False, "error": f"Paciente #{paciente_id} no encontrado"}

        # Verify medico
        medico = db.query(Medico).filter(
            Medico.id == medico_id,
            Medico.empresa_id == empresa_id
        ).first()
        if not medico:
            return {"ok": False, "error": f"Médico #{medico_id} no encontrado"}

        # Parse fecha
        try:
            fh = datetime.fromisoformat(fecha_hora)
            if fh.tzinfo is None:
                fh = fh.replace(tzinfo=timezone.utc)
        except ValueError:
            return {"ok": False, "error": "fecha_hora debe ser ISO (YYYY-MM-DDTHH:MM:SS)"}

        # Check slot not already taken
        existing = db.query(Visita).filter(
            Visita.medico_id == medico_id,
            Visita.fecha_hora == fh,
            Visita.estado.in_(["pendiente", "confirmado", "en_curso", "en-curso"])
        ).first()
        if existing:
            return {"ok": False, "error": "Ese horario ya está ocupado"}

        # Check patient doesn't already have a pending turn
        dup = db.query(Visita).filter(
            Visita.paciente_nuevo_id == paciente_id,
            Visita.estado.in_(["pendiente", "confirmado"]),
        ).all()
        for d in dup:
            d_medico = db.query(Medico).filter(Medico.id == d.medico_id).first()
            if d_medico and d_medico.especialidades:
                if set(medico.especialidades) & set(d_medico.especialidades):
                    return {
                        "ok": False,
                        "error": f"Ya tenés un turno pendiente con Dr/a. {d_medico.apellido} ({', '.join(d_medico.especialidades)}). No se pueden tener 2 turnos para la misma especialidad."
                    }

        duracion = medico.duracion_turno_minutos

        v = Visita(
            empresa_id=empresa_id,
            paciente_nuevo_id=paciente_id,
            medico_id=medico_id,
            fecha_hora=fh,
            duracion_minutos=duracion,
            estado="pendiente",
            motivo_consulta=motivo_consulta or "Consulta general",
            tipo_visita=tipo_visita,
        )
        db.add(v)
        db.commit()
        db.refresh(v)

        especialidad = medico.especialidades[0] if medico.especialidades else "General"
        return {
            "ok": True,
            "turno_id": v.id,
            "paciente": f"{paciente.nombre} {paciente.apellido}",
            "medico": f"{medico.nombre} {medico.apellido} ({especialidad})",
            "fecha_hora": v.fecha_hora.isoformat(),
            "duracion_minutos": duracion,
            "estado": "pendiente",
            "mensaje": f"Turno #{v.id} creado para {paciente.nombre} {paciente.apellido} con Dr/a. {medico.apellido}"
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


@mcp.tool()
def med_listar_turnos(
    medico_id: Optional[int] = None,
    paciente_id: Optional[int] = None,
    fecha: Optional[str] = None,
    estado: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Lista turnos con filtros. Retorna datos con nombres de paciente y médico."""
    db = next(get_db())
    try:
        q = db.query(Visita).filter(Visita.empresa_id == empresa_id)
        if medico_id:
            q = q.filter(Visita.medico_id == medico_id)
        if paciente_id:
            q = q.filter(Visita.paciente_nuevo_id == paciente_id)
        if fecha:
            try:
                fd = datetime.strptime(fecha, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                fh = fd + timedelta(days=1)
                q = q.filter(Visita.fecha_hora >= fd, Visita.fecha_hora < fh)
            except ValueError:
                return {"ok": False, "error": "fecha debe ser YYYY-MM-DD"}
        if estado:
            q = q.filter(Visita.estado == estado)
        else:
            # Default: exclude cancelled
            q = q.filter(Visita.estado != "cancelado")

        turnos = q.order_by(Visita.fecha_hora).limit(100).all()

        result = []
        for t in turnos:
            paciente = db.query(Paciente).filter(Paciente.id == t.paciente_nuevo_id).first()
            medico = db.query(Medico).filter(Medico.id == t.medico_id).first()
            esp = medico.especialidades[0] if medico and medico.especialidades else ""
            result.append({
                "id": t.id,
                "paciente": f"{paciente.nombre} {paciente.apellido}" if paciente else "?",
                "medico": f"{medico.nombre} {medico.apellido}" if medico else "?",
                "especialidad": esp,
                "fecha_hora": str(t.fecha_hora) if t.fecha_hora else None,
                "duracion_minutos": t.duracion_minutos,
                "estado": t.estado,
                "motivo_consulta": str(t.motivo_consulta or "")[:100],
                "tipo_visita": t.tipo_visita,
            })
        return {"total": len(result), "turnos": result}
    finally:
        db.close()


@mcp.tool()
def med_cancelar_turno(
    turno_id: int,
    motivo: Optional[str] = None,
    empresa_id: int = 16
) -> dict:
    """Cancela un turno. Siempre se puede cancelar.
    Calcula si fue con 24h de anticipación para la reprogramación posterior:
    - Cancelación con +24h: reprograma con prioridad normal
    - Cancelación con -24h: reprograma fuera del rango urgente, sin prioridad"""
    db = next(get_db())
    try:
        turno = db.query(Visita).filter(
            Visita.id == turno_id,
            Visita.empresa_id == empresa_id
        ).first()
        if not turno:
            return {"ok": False, "error": f"Turno #{turno_id} no encontrado"}

        if turno.estado == "cancelado":
            return {"ok": False, "error": "El turno ya fue cancelado"}

        now_utc = datetime.now(timezone.utc)
        cancelo_con_anticipacion = True  # default
        turno_fecha_str = "N/A"

        if turno.fecha_hora:
            fh = turno.fecha_hora
            if fh.tzinfo is None:
                fh = fh.replace(tzinfo=timezone.utc)
            turno_fecha_str = fh.strftime("%d/%m/%Y a las %H:%M")
            diff = (fh - now_utc).total_seconds()
            if diff < 86400:
                cancelo_con_anticipacion = False

        turno.estado = "cancelado"
        turno.cancelacion_motivo = motivo or "Cancelado por paciente"
        turno.fecha_cancelacion = now_utc
        turno.updated_at = now_utc
        db.commit()

        if cancelo_con_anticipacion:
            reprogramacion_msg = (
                "Turno cancelado con suficiente anticipación. Puedes reprogramar normalmente."
            )
        else:
            reprogramacion_msg = (
                "Atención: cancelaste con menos de 24h de anticipación. "
                "Si deseas reprogramar, se te asignará disponibilidad sin prioridad "
                "(solo fuera del rango urgente). Contacta a recepción para asistencia."
            )

        return {
            "ok": True,
            "turno_id": turno_id,
            "estado": "cancelado",
            "cancelo_con_anticipacion": cancelo_con_anticipacion,
            "turno_fecha_original": turno_fecha_str,
            "mensaje": f"Turno cancelado. {reprogramacion_msg}"
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


@mcp.tool()
def med_modificar_turno(
    turno_id: int,
    nueva_fecha_hora: str,
    empresa_id: int = 16
) -> dict:
    """Modifica la fecha/hora de un turno existente.
    Siempre se puede modificar, pero con < 24h se asigna sin prioridad."""
    db = next(get_db())
    try:
        turno = db.query(Visita).filter(
            Visita.id == turno_id,
            Visita.empresa_id == empresa_id
        ).first()
        if not turno:
            return {"ok": False, "error": f"Turno #{turno_id} no encontrado"}

        if turno.estado == "cancelado":
            return {"ok": False, "error": "No se puede modificar un turno cancelado"}

        now_utc = datetime.now(timezone.utc)
        fh_original = turno.fecha_hora
        modifica_con_anticipacion = True
        turno_fecha_str = "N/A"

        if fh_original:
            if fh_original.tzinfo is None:
                fh_original = fh_original.replace(tzinfo=timezone.utc)
            turno_fecha_str = fh_original.strftime("%d/%m/%Y a las %H:%M")
            diff = (fh_original - now_utc).total_seconds()
            if diff < 86400:
                modifica_con_anticipacion = False

        try:
            new_fh = datetime.fromisoformat(nueva_fecha_hora)
            if new_fh.tzinfo is None:
                new_fh = new_fh.replace(tzinfo=timezone.utc)
        except ValueError:
            return {"ok": False, "error": "nueva_fecha_hora debe ser ISO format"}

        # Check slot not taken
        existing = db.query(Visita).filter(
            Visita.medico_id == turno.medico_id,
            Visita.fecha_hora == new_fh,
            Visita.id != turno_id,
            Visita.estado.in_(["pendiente", "confirmado", "en_curso", "en-curso"])
        ).first()
        if existing:
            return {"ok": False, "error": "Ese nuevo horario ya está ocupado"}

        old_fh = turno.fecha_hora
        turno.fecha_hora = new_fh
        turno.updated_at = now_utc
        db.commit()

        if modifica_con_anticipacion:
            reprogramacion_msg = f"Turno reprogramado de {old_fh.strftime('%d/%m %H:%M')} a {new_fh.strftime('%d/%m %H:%M')}"
        else:
            reprogramacion_msg = (
                f"Turno reprogramado de {old_fh.strftime('%d/%m %H:%M')} a {new_fh.strftime('%d/%m %H:%M')}. "
                f"Modificaste con menos de 24h, se asignó disponibilidad sin prioridad."
            )

        return {
            "ok": True,
            "turno_id": turno_id,
            "modifica_con_anticipacion": modifica_con_anticipacion,
            "fecha_anterior": str(old_fh),
            "fecha_nueva": str(new_fh),
            "mensaje": reprogramacion_msg
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()


# ─── EJECUTAR ────────────────────────────────────────────────────────────────

def main():
    print("Iniciando SetubalAI MCP Server...")
    print("CRM/Cobros: get_facturas, get_facturas_vencidas, get_facturas_pendientes,")
    print("            marcar_factura_pagada, get_cobros_stats, get_clientes, get_cliente,")
    print("            get_productos, get_stock_critico, get_tickets")
    print("MÉDICAS: med_especialidades_disponibles, med_buscar_paciente, med_crear_paciente,")
    print("         med_listar_medicos, med_buscar_slots_disponibles, med_crear_turno,")
    print("         med_listar_turnos, med_cancelar_turno, med_modificar_turno")
    mcp.run()

if __name__ == "__main__":
    main()
