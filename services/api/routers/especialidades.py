"""
Router CRUD para Especialidades Médicas.

Gestiona el catálogo de especialidades médicas de cada empresa:
- Listado con filtros
- Creación con validación de código único
- Actualización de especialidades
- Eliminación lógica/física

Multi-tenant: Todas las queries filtran por empresa_id del usuario autenticado.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from tenancy import resolve_empresa_id
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import EspecialidadMedica
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/especialidades", tags=["Salud - Especialidades"])


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────────────────────────────────────

class EspecialidadCreate(BaseModel):
    """Schema para crear una especialidad médica."""
    nombre: str = Field(..., min_length=1, max_length=200, description="Nombre de la especialidad")
    codigo: Optional[str] = Field(None, max_length=50, description="Código alfanumérico de la especialidad")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")
    duracion_turno_default: Optional[int] = Field(None, ge=5, le=300, description="Duración del turno en minutos (5-300)")
    color_hex: Optional[str] = Field(None, max_length=10, description="Color hex para UI (#RRGGBB)")
    requiere_equipos: bool = Field(False, description="Si requiere equipos especiales")
    activa: bool = Field(True, description="Estado activo/inactivo")

    @field_validator("codigo")
    @classmethod
    def codigo_uppercase(cls, v: Optional[str]) -> Optional[str]:
        """Convierte código a uppercase."""
        return v.upper() if v else None


class EspecialidadUpdate(BaseModel):
    """Schema para actualizar una especialidad médica."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    codigo: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = None
    duracion_turno_default: Optional[int] = Field(None, ge=5, le=300)
    color_hex: Optional[str] = Field(None, max_length=10)
    requiere_equipos: Optional[bool] = None
    activa: Optional[bool] = None

    @field_validator("codigo")
    @classmethod
    def codigo_uppercase(cls, v: Optional[str]) -> Optional[str]:
        """Convierte código a uppercase."""
        return v.upper() if v else None


class EspecialidadResponse(BaseModel):
    """Schema de respuesta para especialidad médica."""
    id: int
    empresa_id: int
    nombre: str
    codigo: Optional[str]
    descripcion: Optional[str]
    duracion_turno_default: Optional[int]
    color_hex: Optional[str]
    requiere_equipos: bool
    activa: bool
    created_at: Optional[str]
    updated_at: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def _to_dict(esp: EspecialidadMedica) -> dict:
    """Convierte modelo SQLAlchemy a dict JSON-serializable."""
    return {
        "id": esp.id,
        "empresa_id": esp.empresa_id,
        "nombre": esp.nombre,
        "codigo": esp.codigo,
        "descripcion": esp.descripcion,
        "duracion_turno_default": esp.duracion_turno_default,
        "color_hex": esp.color_hex,
        "requiere_equipos": esp.requiere_equipos or False,
        "activa": esp.activa if esp.activa is not None else True,
        "created_at": str(esp.created_at) if hasattr(esp, 'created_at') and esp.created_at is not None else None,
        "updated_at": str(esp.updated_at) if hasattr(esp, 'updated_at') and esp.updated_at is not None else None,
    }


def _validate_nombre_unico(
    db: Session, 
    empresa_id: int, 
    nombre: str, 
    especialidad_id: Optional[int] = None
) -> None:
    """
    Valida que el nombre sea único para la empresa.
    
    Args:
        db: Sesión de base de datos
        empresa_id: ID de la empresa
        nombre: Nombre de la especialidad
        especialidad_id: ID de especialidad (si es actualización)
        
    Raises:
        HTTPException: Si el nombre ya existe
    """
    query = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.empresa_id == empresa_id,
        func.lower(EspecialidadMedica.nombre) == nombre.lower()
    )
    if especialidad_id:
        query = query.filter(EspecialidadMedica.id != especialidad_id)
    
    if query.first():
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe una especialidad con el nombre '{nombre}' en esta empresa"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/")
def listar_especialidades(
    request: Request,
    activa: Optional[bool] = None,
    buscar: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Lista todas las especialidades médicas de la empresa.
    
    Filtros:
    - activa: bool - Filtrar por estado activo/inactivo
    - buscar: str - Búsqueda en nombre, código o descripción
    - limit: int - Máximo de resultados (default 100, max 500)
    - offset: int - Paginación
    
    Returns:
        {
            "total": int,
            "especialidades": [EspecialidadResponse, ...]
        }
    """
    q = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.empresa_id == empresa_id
    )
    
    if activa is not None:
        q = q.filter(EspecialidadMedica.activa == activa)
    
    if buscar:
        search_term = f"%{buscar}%"
        q = q.filter(
            (EspecialidadMedica.nombre.ilike(search_term)) |
            (EspecialidadMedica.codigo.ilike(search_term)) |
            (EspecialidadMedica.descripcion.ilike(search_term))
        )
    
    total = q.count()
    especialidades = q.order_by(EspecialidadMedica.nombre).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "especialidades": [_to_dict(e) for e in especialidades]
    }


@router.get("/{especialidad_id}")
def obtener_especialidad(
    especialidad_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Obtiene una especialidad médica por ID.
    
    Args:
        especialidad_id: ID de la especialidad
        
    Returns:
        EspecialidadResponse
        
    Raises:
        HTTPException 404: Si no existe la especialidad
    """
    esp = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == especialidad_id,
        EspecialidadMedica.empresa_id == empresa_id
    ).first()
    
    if not esp:
        raise HTTPException(
            status_code=404,
            detail=f"Especialidad con ID {especialidad_id} no encontrada"
        )
    
    return _to_dict(esp)


@router.post("/", status_code=201)
def crear_especialidad(
    request: Request,
    data: EspecialidadCreate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Crea una nueva especialidad médica.
    
    Validaciones:
    - Nombre único por empresa
    - Código siempre en uppercase
    
    Args:
        data: EspecialidadCreate
        
    Returns:
        EspecialidadResponse
        
    Raises:
        HTTPException 400: Si ya existe una especialidad con ese nombre
    """
    # Validar nombre único
    _validate_nombre_unico(db, empresa_id, data.nombre)
    
    # Crear especialidad
    esp = EspecialidadMedica(
        empresa_id=empresa_id,
        nombre=data.nombre,
        codigo=data.codigo,
        descripcion=data.descripcion,
        duracion_turno_default=data.duracion_turno_default,
        color_hex=data.color_hex,
        requiere_equipos=data.requiere_equipos,
        activa=data.activa
    )
    
    db.add(esp)
    db.commit()
    db.refresh(esp)
    
    return _to_dict(esp)


@router.put("/{especialidad_id}")
def actualizar_especialidad(
    especialidad_id: int,
    data: EspecialidadUpdate,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Actualiza una especialidad médica existente.
    
    Validaciones:
    - Nombre único por empresa (si se actualiza)
    - Código siempre en uppercase (si se actualiza)
    
    Args:
        especialidad_id: ID de la especialidad
        data: EspecialidadUpdate
        
    Returns:
        EspecialidadResponse
        
    Raises:
        HTTPException 404: Si no existe la especialidad
        HTTPException 400: Si el nuevo nombre ya existe
    """
    esp = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == especialidad_id,
        EspecialidadMedica.empresa_id == empresa_id
    ).first()
    
    if not esp:
        raise HTTPException(
            status_code=404,
            detail=f"Especialidad con ID {especialidad_id} no encontrada"
        )
    
    # Validar nombre único si se actualiza
    if data.nombre and data.nombre != esp.nombre:
        _validate_nombre_unico(db, empresa_id, data.nombre, especialidad_id)
    
    # Actualizar campos
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(esp, field, value)
    
    # Actualizar timestamp (usar func.now() para que lo maneje la DB)
    from sqlalchemy import func as sql_func
    db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == especialidad_id
    ).update({"updated_at": sql_func.now()})
    
    db.commit()
    db.refresh(esp)
    
    return _to_dict(esp)


@router.delete("/{especialidad_id}")
def eliminar_especialidad(
    especialidad_id: int,
    db: Session = Depends(get_db),
    empresa_id: int = Depends(resolve_empresa_id)
):
    """
    Elimina una especialidad médica.
    
    IMPORTANTE: Esta operación es física (DELETE).
    Si hay registros relacionados, considerar eliminación lógica (activa=False).
    
    Args:
        especialidad_id: ID de la especialidad
        
    Returns:
        {"ok": True, "message": "..."}
        
    Raises:
        HTTPException 404: Si no existe la especialidad
    """
    esp = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.id == especialidad_id,
        EspecialidadMedica.empresa_id == empresa_id
    ).first()
    
    if not esp:
        raise HTTPException(
            status_code=404,
            detail=f"Especialidad con ID {especialidad_id} no encontrada"
        )
    
    db.delete(esp)
    db.commit()
    
    return {
        "ok": True,
        "message": f"Especialidad '{esp.nombre}' eliminada correctamente"
    }
