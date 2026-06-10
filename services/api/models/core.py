# Core: Empresa, Usuario

from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, Date, DateTime, ARRAY, JSON, ForeignKey, BigInteger
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
    direccion = Column(Text)
    moneda = Column(String(10), default="USD")
    zona_horaria = Column(String(50), default="America/Argentina/Buenos_Aires")
    configuracion = Column(JSONB, default={})
    # Campos fiscales y bancarios
    cuit = Column(String(20))
    cbu = Column(String(50))
    alias_cbu = Column(String(50))
    banco = Column(String(100))
    # Plan y estado
    plan = Column(String(20), default="basico")
    estado = Column(String(20), default="activa")
    # Contacto y web
    contacto_nombre = Column(String(200))
    web = Column(String(500))
    instagram = Column(String(100))
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
    medico_id = Column(Integer, ForeignKey("medicos.id"))
    telegram_id = Column(String(50))
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())

