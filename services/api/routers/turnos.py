"""
Router para gestión de turnos y slots disponibles.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from database import get_db
from utils.slots_calculator import calcular_slots_libres

router = APIRouter(prefix="/agenda", tags=["turnos"])


class SlotDisponible(BaseModel):
    """Slot de turno disponible."""
    medico_id: int
    medico_nombre: str
    especialidad: str
    fecha: date
    hora: str
    disponible: bool = True
    duracion_minutos: int


class SlotsResponse(BaseModel):
    """Respuesta con slots disponibles."""
    total: int
    fecha_desde: date
    fecha_hasta: date
    especialidad: Optional[str] = None
    medico_id: Optional[int] = None
    slots: List[SlotDisponible]


@router.get("/slots-libres", response_model=SlotsResponse)
def obtener_slots_libres(
    empresa_id: int = Query(..., description="ID de la empresa"),
    especialidad_id: Optional[int] = Query(None, description="ID de especialidad médica"),
    fecha_desde: date = Query(..., description="Fecha inicio rango (YYYY-MM-DD)"),
    fecha_hasta: date = Query(..., description="Fecha fin rango (YYYY-MM-DD)"),
    medico_id: Optional[int] = Query(None, description="Filtrar por médico específico"),
    db: Session = Depends(get_db)
):
    """
    Obtener slots disponibles para agendar turnos.
    
    Calcula disponibilidad basada en:
    - Grillas médicas (horarios semanales)
    - Duraciones por especialidad
    - Bloqueos de agenda
    - Turnos ya reservados
    
    **Parámetros:**
    - empresa_id: ID de la clínica
    - especialidad_id: (Opcional) Filtrar por especialidad
    - fecha_desde: Fecha inicio búsqueda
    - fecha_hasta: Fecha fin búsqueda (máx 30 días)
    - medico_id: (Opcional) Filtrar por médico específico
    
    **Retorna:**
    Lista de slots disponibles con médico, fecha, hora y duración.
    
    **Ejemplo:**
    ```
    GET /turnos/slots-libres?empresa_id=16&especialidad_id=1&fecha_desde=2026-06-01&fecha_hasta=2026-06-07
    ```
    """
    # Validar rango de fechas
    if fecha_hasta < fecha_desde:
        raise HTTPException(400, "fecha_hasta debe ser >= fecha_desde")
    
    delta = (fecha_hasta - fecha_desde).days
    if delta > 30:
        raise HTTPException(400, "Rango máximo: 30 días")
    
    # Calcular slots
    try:
        slots = calcular_slots_libres(
            db=db,
            especialidad_id=especialidad_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            empresa_id=empresa_id,
            medico_id=medico_id
        )
        
        # Convertir a Pydantic models
        slots_response = [
            SlotDisponible(
                medico_id=s["medico_id"],
                medico_nombre=s["medico_nombre"],
                especialidad=s["especialidad"],
                fecha=s["fecha"],
                hora=s["hora"],
                disponible=s["disponible"],
                duracion_minutos=s["duracion_minutos"]
            )
            for s in slots
        ]
        
        return SlotsResponse(
            total=len(slots_response),
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            especialidad=None,  # TODO: obtener nombre especialidad
            medico_id=medico_id,
            slots=slots_response
        )
        
    except Exception as e:
        raise HTTPException(500, f"Error calculando slots: {str(e)}")
