from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, Date, DateTime, ARRAY, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime as TIMESTAMPTZ
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Empresa(Base):
    __tablename__ = "empresa"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)
    rubro = Column(String(100))
    email = Column(String(200))
    telefono = Column(String(50))
    moneda = Column(String(10), default="USD")
    zona_horaria = Column(String(50), default="America/Argentina/Buenos_Aires")
    configuracion = Column(JSONB, default={})
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    nombre = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(200))
    rol = Column(String(20), default="operador")
    telegram_id = Column(String(50))
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    nombre = Column(String(200), nullable=False)
    empresa_nombre = Column(String(200))
    email = Column(String(200))
    telefono = Column(String(50))
    direccion = Column(Text)
    ciudad = Column(String(100))
    pais = Column(String(100), default="Argentina")
    estado = Column(String(20), default="activo")
    tipo = Column(String(20), default="empresa")
    valor_total = Column(DECIMAL(15,2), default=0)
    etiquetas = Column(Text)
    notas = Column(Text)
    fuente = Column(String(50))
    # Campos financieros
    cuit = Column(String(20))
    cbu = Column(String(25))
    alias_cbu = Column(String(50))
    banco = Column(String(100))
    contacto_nombre = Column(String(200))
    instagram = Column(String(100))
    web = Column(String(200))
    limite_credito = Column(DECIMAL(15,2), default=0)
    descuento_pct = Column(DECIMAL(5,2), default=0)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    interacciones = relationship("Interaccion", back_populates="cliente")

class Producto(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    categoria_id = Column(Integer, ForeignKey("categorias_productos.id"))
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    tipo = Column(String(20), default="servicio")
    precio = Column(DECIMAL(15,2), nullable=False, default=0)
    precio_tipo = Column(String(20), default="unico")
    moneda = Column(String(10), default="USD")
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=0)
    control_stock = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    codigo = Column(String(50))
    imagen_url = Column(String(500))
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class CategoriaProducto(Base):
    __tablename__ = "categorias_productos"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())

class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    nombre = Column(String(200), nullable=False)
    contacto_nombre = Column(String(200))
    email = Column(String(200))
    telefono = Column(String(50))
    notas = Column(Text)
    activo = Column(Boolean, default=True)
    # Campos financieros
    cuit = Column(String(20))
    cbu = Column(String(25))
    alias_cbu = Column(String(50))
    banco = Column(String(100))
    condiciones_pago = Column(Text)
    descuento_pct = Column(DECIMAL(5,2), default=0)
    categoria = Column(String(100))
    web = Column(String(200))
    instagram = Column(String(100))
    created_at = Column(TIMESTAMPTZ, server_default=func.now())

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

class Interaccion(Base):
    __tablename__ = "interacciones"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    tipo = Column(String(50))
    descripcion = Column(Text, nullable=False)
    fecha = Column(TIMESTAMPTZ, server_default=func.now())
    cliente = relationship("Cliente", back_populates="interacciones")
