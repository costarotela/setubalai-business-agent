# Billing: Factura, ItemFactura, Ticket

from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, Date, DateTime, ARRAY, JSON, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime as TIMESTAMPTZ
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Factura(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    numero = Column(String(50))
    estado = Column(String(20), default="pendiente")
    fecha_emision = Column(Date)
    fecha_vencimiento = Column(Date)
    fecha_pago = Column(Date)
    subtotal = Column(DECIMAL(15,2), default=0)
    total = Column(DECIMAL(15,2), default=0)
    moneda = Column(String(10), default="USD")
    notas = Column(Text)
    metodo_pago = Column(String(50))
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    cliente = relationship("Cliente", foreign_keys=[cliente_id])
    items = relationship("ItemFactura", back_populates="factura")

class ItemFactura(Base):
    __tablename__ = "items_factura"
    id = Column(Integer, primary_key=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    descripcion = Column(String(500), nullable=False)
    cantidad = Column(DECIMAL(10,2), default=1)
    precio_unitario = Column(DECIMAL(15,2), nullable=False)
    subtotal = Column(DECIMAL(15,2), nullable=False)
    factura = relationship("Factura", back_populates="items")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    titulo = Column(String(500), nullable=False)
    descripcion = Column(Text)
    estado = Column(String(20), default="abierto")
    prioridad = Column(String(20), default="media")
    canal = Column(String(50), default="telegram")
    resolucion = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

