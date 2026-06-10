"""models package — models por dominio, export centralizado.

Dominios:
  core.py         → Empresa, Usuario (SaaS multi-tenant)
  healthcare.py   → 16 modelos médicos (vertical clínico activo)
  crm.py          → Cliente, Producto, Proveedor, Interaccion (SaaS infra)
  billing.py      → Factura, ItemFactura, Ticket (SaaS infra)

Nota: Los modelos CRM se mantienen porque empresas.py los usa para
stats de empresa, cascade delete on delete empresa, y mcp_server para
MCP tools de cobros. Los routers CRM frontend están archivados en
routers/_archived_crm/ (no se registran en main.py).
"""

from models.core import Empresa, Usuario
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
from models.crm import Cliente, Producto, CategoriaProducto, Proveedor, Interaccion
from models.billing import Factura, ItemFactura, Ticket
