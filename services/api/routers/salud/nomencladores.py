"""
Nomencladores routes: listar, crear, editar, borrar
"""
from fastapi import APIRouter, Depends
from typing import Optional, List
from sqlalchemy.orm import Session

from .shared import (
    router as salud_router,
    get_db, resolve_empresa_id, get_medico_restriction,
    Request, NomencladorPractica,
    _dict_nomenclador, HTTPException,
)

router = salud_router

@router.get("/nomenclador_practicas/", response_model=List[dict])
def listar_nomencladores(
    request: Request,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    items = db.query(NomencladorPractica).filter(
        NomencladorPractica.empresa_id == empresa_id,
        NomencladorPractica.activo == True
    ).order_by(NomencladorPractica.codigo).all()
    return [_dict_nomenclador(n) for n in items]

@router.post("/nomenclador_practicas/", status_code=201)
def crear_nomenclador(
    request: Request,
    data: dict,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Crear nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden crear nomencladores")
    n = NomencladorPractica(**{
        **{k: v for k, v in data.items() if k != "codigo_nabon" and hasattr(NomencladorPractica, k)},
        "codigo": data.get("codigo_nabon") or data.get("codigo", "SIN-CODIGO"),
        "descripcion": data.get("nombre") or data.get("descripcion", ""),
        "precio_particular": data.get("precio_particular") or data.get("valor_base", 0),
        "empresa_id": empresa_id,
        "activo": data.get("activo", True),
    })
    db.add(n)
    db.commit()
    db.refresh(n)
    return _dict_nomenclador(n)

@router.put("/nomenclador_practicas/{np_id}/")
def editar_nomenclador(
    np_id: int,
    data: dict,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Editar nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden editar nomencladores")
    n = db.query(NomencladorPractica).filter(
        NomencladorPractica.id == np_id,
        NomencladorPractica.empresa_id == empresa_id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Práctica no encontrada")
    for key, val in data.items():
        if hasattr(NomencladorPractica, key) and key not in ("id", "empresa_id"):
            setattr(n, key, val)
    db.commit()
    db.refresh(n)
    return _dict_nomenclador(n)

@router.delete("/nomenclador_practicas/{np_id}/")
def borrar_nomenclador(
    np_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id),
    medico_restriccion: tuple = Depends(get_medico_restriction)
):
    """Borrar nomenclador. Solo admin."""
    medico_id_auth, es_admin, rol = medico_restriccion
    if rol == "operator":
        raise HTTPException(403, "Solo administradores pueden gestionar nomencladores")
    if medico_id_auth and not es_admin:
        raise HTTPException(403, "Solo administradores pueden borrar nomencladores")
    n = db.query(NomencladorPractica).filter(
        NomencladorPractica.id == np_id,
        NomencladorPractica.empresa_id == empresa_id
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Práctica no encontrada")
    db.delete(n)
    db.commit()
    return {"deleted": True, "id": np_id}
