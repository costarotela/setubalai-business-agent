"""
routers/salud/ package — all health-domain routes split by entity.

Usage in main.py:
    from routers.salud import salud_router
    app.include_router(salud_router)
"""

# Import the shared router instance
from .shared import router as salud_router
from .shared import get_medico_restriction, resolve_empresa_id, get_db

# Import all sub-modules so their routes register on the shared router
from . import pacientes
from . import medicos
from . import turnos_agenda
from . import atenciones
from . import historia_clinica
from . import recipes
from . import estudios
from . import nomencladores
from . import seguimiento
from . import derivaciones

# Export the combined router
__all__ = ["salud_router", "get_medico_restriction", "resolve_empresa_id", "get_db"]
