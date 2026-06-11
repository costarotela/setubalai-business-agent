# Healthcare (Salud): Paciente, Medico, Visita, Grilla, Especialidad, etc.

from sqlalchemy import Column, Integer, String, Text, Boolean, DECIMAL, Date, DateTime, ARRAY, JSON, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime as TIMESTAMPTZ
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Paciente(Base):
    __tablename__ = "pacientes"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    nombre = Column(String(200), nullable=False)
    apellido = Column(String(200), nullable=False)
    dni = Column(String(20), nullable=False)
    fecha_nacimiento = Column(Date)
    sexo = Column(String(10))
    telefono = Column(String(50))
    email = Column(String(200))
    direccion = Column(Text)
    ciudad = Column(String(100))
    provincia = Column(String(100))
    obra_social = Column(String(200))
    numero_afiliado = Column(String(100))
    plan = Column(String(100))
    vigencia_afiliacion = Column(Date)
    activo = Column(Boolean, default=True)
    telegram_chat_id = Column(BigInteger, nullable=True)
    whatsapp_phone = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class MedicoEspecialidades(Base):
    """Relación many-to-many entre médicos y especialidades."""
    __tablename__ = "medico_especialidades"
    __table_args__ = {"schema": "setubalai"}
    
    medico_id = Column(Integer, ForeignKey("medicos.id", ondelete="CASCADE"), primary_key=True)
    especialidad_id = Column(Integer, ForeignKey("especialidades_medicas.id", ondelete="CASCADE"), primary_key=True)

class Medico(Base):
    __tablename__ = "medicos"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    nombre = Column(String(200), nullable=False)
    apellido = Column(String(200), nullable=False)
    matricula_provincial = Column(String(50))
    matricula_nacional = Column(String(50))
    duracion_turno_minutos = Column(Integer, default=30)
    horarios_atencion = Column(JSONB, default={})
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class Visita(Base):
    __tablename__ = "visitas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    fecha_hora = Column(TIMESTAMPTZ, nullable=False)
    duracion_minutos = Column(Integer, default=30)
    estado = Column(String(50), default="pendiente")
    motivo_consulta = Column(Text)
    tipo_visita = Column(String(50), default="consulta")
    recordatorio_enviado = Column(Boolean, default=False)
    recordatorio_fecha = Column(TIMESTAMPTZ)
    cancelacion_motivo = Column(Text)
    fecha_cancelacion = Column(TIMESTAMPTZ)
    cancelado_por_usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    reprogramado_a_visita_id = Column(Integer, ForeignKey("visitas.id"))
    cant_reprogramaciones = Column(Integer, default=0)
    ultima_reprogramacion = Column(TIMESTAMPTZ)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico")

class GrillaMedica(Base):
    __tablename__ = "grillas_medicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    especialidad_id = Column(Integer, ForeignKey("especialidades_medicas.id"), nullable=True)
    dia_semana = Column(Integer, nullable=False)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin = Column(DateTime, nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico")
    especialidad = relationship("EspecialidadMedica")

class BloqueoGrilla(Base):
    __tablename__ = "bloqueos_grilla"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    especialidad_id = Column(Integer, ForeignKey("especialidades_medicas.id"), nullable=True)
    fecha_desde = Column(Date, nullable=False)
    fecha_hasta = Column(Date, nullable=False)
    hora_inicio = Column(DateTime)
    hora_fin = Column(DateTime)
    motivo = Column(String(200))
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico")
    especialidad = relationship("EspecialidadMedica")

class EspecialidadMedica(Base):
    __tablename__ = "especialidades_medicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    codigo = Column(String(50))
    descripcion = Column(Text)
    duracion_turno_default = Column(Integer)
    color_hex = Column(String(10))
    requiere_equipos = Column(Boolean, default=False)
    activa = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class ObraSocial(Base):
    __tablename__ = "obras_sociales"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    rnic = Column(String(50))
    tipo = Column(String(20), default="OS")  # OS, PREPAGA, PARTICULAR
    cobertura_default = Column(DECIMAL(5,2), default=100.00)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class DuracionPrestacion(Base):
    __tablename__ = "duracion_prestaciones"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    especialidad_id = Column(Integer, ForeignKey("especialidades_medicas.id"))
    duracion_minutos = Column(Integer, nullable=False, default=30)
    sobre_turnos_permitidos = Column(Integer, default=0)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class HistoriaClinica(Base):
    __tablename__ = "historia_clinica"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    grupo_sanguineo = Column(String(10))
    alergias = Column(ARRAY(String), default=[])
    antecedentes_personales = Column(Text)
    antecedentes_familiares = Column(Text)
    medicacion_habitual = Column(ARRAY(String), default=[])
    cirugias_previas = Column(ARRAY(String), default=[])
    notas_adicionales = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())

class PracticaMedica(Base):
    __tablename__ = "practicas_medicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    atencion_medica_id = Column(Integer, nullable=False)  # NOT NULL en DB
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    medico_id = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    tipo_practica = Column(String(100))
    codigo_nomenclador = Column(String(50))
    descripcion_nomenclador = Column(Text)
    precio_practica = Column(DECIMAL(15,2), default=0)
    coseguro_paciente = Column(DECIMAL(15,2), default=0)
    cobertura_obra_social = Column(DECIMAL(15,2), default=0)
    estado_facturacion = Column(String(20), default="pendiente")
    fecha_facturacion = Column(Date)
    numero_factura = Column(String(50))
    requiere_autorizacion = Column(Boolean, default=False)
    numero_autorizacion = Column(String(50))
    fecha_autorizacion = Column(Date)
    observaciones = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico")

class NomencladorPractica(Base):
    __tablename__ = "nomenclador_practicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    codigo = Column(String(50))
    descripcion = Column(Text)
    tipo = Column(String(50))
    especialidad_requerida = Column(String(100))
    precio_particular = Column(DECIMAL(15,2), default=0)
    valor_modulo = Column(DECIMAL(10,2))
    duracion_minutos = Column(Integer)
    requiere_autorizacion = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)

class AtencionMedica(Base):
    __tablename__ = "atenciones_medicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    visita_id = Column(Integer)
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    medico_id = Column(Integer, ForeignKey("medicos.id"))
    fecha_hora_inicio = Column(TIMESTAMPTZ)
    fecha_hora_fin = Column(TIMESTAMPTZ)
    estado = Column(String(20))
    anamnesis = Column(Text)
    examen_fisico = Column(Text)
    diagnostico = Column(Text)
    plan_tratamiento = Column(Text)
    observaciones = Column(Text)
    presion_arterial = Column(String(20))
    frecuencia_cardiaca = Column(Integer)
    frecuencia_respiratoria = Column(Integer)
    temperatura = Column(DECIMAL(5,2))
    saturacion_oxigeno = Column(Integer)
    peso = Column(DECIMAL(5,2))
    altura = Column(DECIMAL(4,2))
    imc = Column(DECIMAL(5,2))
    evolucion = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico", foreign_keys=[medico_id])

class Receta(Base):
    __tablename__ = "recetas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    atencion_medica_id = Column(Integer, ForeignKey("atenciones_medicas.id"), nullable=False)
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    medico_id = Column(Integer, ForeignKey("medicos.id"))
    medicamentos = Column(JSONB, nullable=False)
    indicaciones = Column(Text)
    valida_hasta = Column(Date)
    archivo_pdf_url = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    medico = relationship("Medico")

class EstudioAdjunto(Base):
    __tablename__ = "estudios_adjuntos"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    paciente_id = Column(Integer)
    paciente_nuevo_id = Column(Integer, ForeignKey("pacientes.id"))
    tipo_estudio = Column(String(100))
    descripcion = Column(Text)
    fecha_estudio = Column(Date)
    archivo_nombre = Column(String(255))
    archivo_url = Column(Text)
    archivo_tipo = Column(String(50))
    archivo_tamano_bytes = Column(Integer)
    consulta_id = Column(Integer, ForeignKey("visitas.id"))
    subido_por_usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(TIMESTAMPTZ, server_default=func.now())


class NotificacionProgramada(Base):
    __tablename__ = "notificaciones_programadas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))
    tipo = Column(String(50))
    referencia_tabla = Column(String(50))
    referencia_id = Column(Integer)
    mensaje = Column(Text)
    canal = Column(String(50))
    programado_para = Column(TIMESTAMPTZ)
    enviado = Column(Boolean, default=False)
    enviado_at = Column(TIMESTAMPTZ)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())

