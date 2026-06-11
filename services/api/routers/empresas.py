# Compatibility shim — empresas.py has been split into routers/empresas/ package.
# This file re-exports everything so existing imports (if any) still work.
from routers.empresas.crud import (
    router,
    _empresa_dict,
    EmpresaCreate,
    EmpresaUpdate,
    MiEmpresaUpdate,
    mi_empresa,
    actualizar_mi_empresa,
    patch_mi_empresa,
    seed_configuracion,
    listar_empresas,
    crear_empresa,
    actualizar_empresa,
    eliminar_empresa,
)
from routers.empresas.dashboard import stats_empresa

__all__ = [
    "router",
    "crud_router",
    "dashboard_router",
    "_empresa_dict",
    "EmpresaCreate",
    "EmpresaUpdate",
    "MiEmpresaUpdate",
    "mi_empresa",
    "actualizar_mi_empresa",
    "patch_mi_empresa",
    "seed_configuracion",
    "listar_empresas",
    "crear_empresa",
    "actualizar_empresa",
    "eliminar_empresa",
    "stats_empresa",
]
