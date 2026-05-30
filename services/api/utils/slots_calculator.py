"""
Calculador de slots libres para turnos médicos - VERSIÓN SIMPLIFICADA
"""
from datetime import date, datetime, time, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import Date

def calcular_slots_libres(
    db: Session,
    especialidad_id: Optional[int],
    fecha_desde: date,
    fecha_hasta: date,
    empresa_id: int,
    medico_id: Optional[int] = None
) -> List[Dict]:
    """
    Calcula slots disponibles para turnos médicos.
    """
    from models import Medico, GrillaMedica, BloqueoGrilla, DuracionPrestacion, Visita, MedicoEspecialidades, EspecialidadMedica
    from sqlalchemy import and_
    
    slots_libres = []
    
    # 1. Buscar médicos con la especialidad
    medicos_query = db.query(Medico).filter(
        Medico.empresa_id == empresa_id,
        Medico.activo == True
    )
    
    if especialidad_id:
        medicos_query = medicos_query.join(
            MedicoEspecialidades,
            Medico.id == MedicoEspecialidades.medico_id
        ).filter(
            MedicoEspecialidades.especialidad_id == especialidad_id
        )
    
    if medico_id:
        medicos_query = medicos_query.filter(Medico.id == medico_id)
    
    medicos = medicos_query.all()
    
    if not medicos:
        return []
    
    # Obtener nombre especialidad
    especialidad_nombre = "General"
    if especialidad_id:
        esp = db.query(EspecialidadMedica).filter(EspecialidadMedica.id == especialidad_id).first()
        if esp:
            especialidad_nombre = esp.nombre
    
    # 2. Obtener duración de turno
    duracion_minutos = 30  # default
    if especialidad_id:
        duracion_obj = db.query(DuracionPrestacion).filter(
            DuracionPrestacion.empresa_id == empresa_id,
            DuracionPrestacion.especialidad_id == especialidad_id
        ).first()
        if duracion_obj:
            duracion_minutos = duracion_obj.duracion_minutos
    
    # 3. Para cada médico, generar slots
    for medico in medicos:
        # Obtener grillas activas
        grillas = db.query(GrillaMedica).filter(
            GrillaMedica.empresa_id == empresa_id,
            GrillaMedica.medico_id == medico.id,
            GrillaMedica.activo == True
        ).all()
        
        if not grillas:
            continue
        
        # Recorrer cada día del rango
        fecha_actual = fecha_desde
        while fecha_actual <= fecha_hasta:
            # Verificar si hay bloqueo para este día
            bloqueo = db.query(BloqueoGrilla).filter(
                BloqueoGrilla.medico_id == medico.id,
                BloqueoGrilla.fecha_desde <= fecha_actual,
                BloqueoGrilla.fecha_hasta >= fecha_actual
            ).first()
            
            if bloqueo:
                fecha_actual += timedelta(days=1)
                continue
            
            # Día de semana (1=Lunes, 7=Domingo)
            dia_semana = fecha_actual.isoweekday()
            
            # Buscar grillas para este día
            grillas_dia = [g for g in grillas if g.dia_semana == dia_semana]
            
            for grilla in grillas_dia:
                # Generar slots desde hora_inicio hasta hora_fin
                hora_actual = grilla.hora_inicio
                hora_fin = grilla.hora_fin
                
                while hora_actual < hora_fin:
                    # Verificar si hay turno ocupado
                    turno_existente = db.query(Visita).filter(
                        Visita.medico_id == medico.id,
                        Visita.fecha_hora.cast(Date) == fecha_actual,
                        Visita.estado.in_(['confirmado', 'pendiente'])
                    ).first()
                    
                    if not turno_existente:
                        # Slot disponible
                        slots_libres.append({
                            "medico_id": medico.id,
                            "medico_nombre": f"Dr. {medico.apellido}",
                            "especialidad": especialidad_nombre,
                            "fecha": fecha_actual,
                            "hora": hora_actual.strftime("%H:%M"),
                            "disponible": True,
                            "duracion_minutos": duracion_minutos
                        })
                    
                    # Siguiente slot
                    hora_actual = (datetime.combine(date.today(), hora_actual) + timedelta(minutes=duracion_minutos)).time()
            
            fecha_actual += timedelta(days=1)
    
    # Ordenar por fecha y hora
    slots_libres.sort(key=lambda x: (x["fecha"], x["hora"]))
    
    return slots_libres
