"""models package — split by domain for maintainability.

All models are re-exported here so existing imports like
    from models import Usuario, Paciente, Factura
continue to work without modification.
"""

from models.core import Empresa, Usuario
from models.crm import Cliente, Producto, CategoriaProducto, Proveedor, Interaccion
from models.billing import Factura, ItemFactura, Ticket
from models.healthcare import (
    Paciente,
    MedicoEspecialidades,
    Medico,
    Visita,
    GrillaMedica,
    BloqueoGrilla,
    EspecialidadMedica,
    ObraSocial,
    DuracionPrestacion,
    HistoriaClinica,
    PracticaMedica,
    NomencladorPractica,
    AtencionMedica,
    Receta,
    EstudioAdjunto,
    NotificacionProgramada,
)

__all__ = [
    # core
    "Empresa",
    "Usuario",
    # crm
    "Cliente",
    "Producto",
    "CategoriaProducto",
    "Proveedor",
    "Interaccion",
    # billing
    "Factura",
    "ItemFactura",
    "Ticket",
    # healthcare
    "Paciente",
    "MedicoEspecialidades",
    "Medico",
    "Visita",
    "GrillaMedica",
    "BloqueoGrilla",
    "EspecialidadMedica",
    "ObraSocial",
    "DuracionPrestacion",
    "HistoriaClinica",
    "PracticaMedica",
    "NomencladorPractica",
    "AtencionMedica",
    "Receta",
    "EstudioAdjunto",
    "NotificacionProgramada",
]
