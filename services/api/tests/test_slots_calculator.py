"""
Tests para slots_calculator.py

Pruebas unitarias e integración para el calculador de slots libres.

Ejecutar con:
    cd /home/admin/setubalai-agente/services/api
    ./venv/bin/pytest tests/test_slots_calculator.py -v

Autor: SetubalAI Agent
Fecha: 2026-05-30
"""

import pytest
from datetime import date, datetime, time, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import Base
from models import (
    Empresa, Medico, GrillaMedica, BloqueoGrilla,
    DuracionPrestacion, Visita
)
from utils.slots_calculator import calcular_slots_libres, calcular_slots_por_medico


# Fixture: Base de datos en memoria para tests
@pytest.fixture(scope="function")
def db_session():
    """Crea una sesión de BD en memoria para cada test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    # Seed datos básicos
    empresa = Empresa(
        id=16,
        nombre="Centro Médico Santa Clara",
        rubro="salud",
        estado="activa"
    )
    session.add(empresa)
    session.commit()
    
    yield session
    
    session.close()


# Fixture: Datos de prueba (médicos, grillas, duraciones)
@pytest.fixture
def seed_data(db_session):
    """Inserta datos de prueba: médicos, grillas, duraciones."""
    
    # Médicos
    medico_clinica = Medico(
        id=1,
        empresa_id=16,
        nombre="Carlos",
        apellido="García",
        especialidades=["Clínica Médica"],
        activo=True
    )
    
    medico_cardio = Medico(
        id=2,
        empresa_id=16,
        nombre="Juan",
        apellido="Rodríguez",
        especialidades=["Cardiología"],
        activo=True
    )
    
    medico_trauma = Medico(
        id=3,
        empresa_id=16,
        nombre="Luis",
        apellido="Martínez",
        especialidades=["Traumatología"],
        activo=True
    )
    
    db_session.add_all([medico_clinica, medico_cardio, medico_trauma])
    db_session.commit()
    
    # Grillas médicas
    # Dr. García (Clínica Médica): Lunes 9-13h, 15-19h
    grilla1 = GrillaMedica(
        empresa_id=16,
        medico_id=1,
        dia_semana=1,  # Lunes
        hora_inicio=datetime.combine(date.today(), time(9, 0)),
        hora_fin=datetime.combine(date.today(), time(13, 0)),
        activo=True
    )
    grilla2 = GrillaMedica(
        empresa_id=16,
        medico_id=1,
        dia_semana=1,  # Lunes
        hora_inicio=datetime.combine(date.today(), time(15, 0)),
        hora_fin=datetime.combine(date.today(), time(19, 0)),
        activo=True
    )
    
    # Dr. Rodríguez (Cardiología): Lunes 14-20h
    grilla3 = GrillaMedica(
        empresa_id=16,
        medico_id=2,
        dia_semana=1,  # Lunes
        hora_inicio=datetime.combine(date.today(), time(14, 0)),
        hora_fin=datetime.combine(date.today(), time(20, 0)),
        activo=True
    )
    
    # Dr. Martínez (Traumatología): Martes 10-14h
    grilla4 = GrillaMedica(
        empresa_id=16,
        medico_id=3,
        dia_semana=2,  # Martes
        hora_inicio=datetime.combine(date.today(), time(10, 0)),
        hora_fin=datetime.combine(date.today(), time(14, 0)),
        activo=True
    )
    
    db_session.add_all([grilla1, grilla2, grilla3, grilla4])
    db_session.commit()
    
    # Duraciones por especialidad
    dur_clinica = DuracionPrestacion(
        empresa_id=16,
        especialidad="Clínica Médica",
        duracion_minutos=20,
        sobre_turnos_permitidos=2
    )
    
    dur_cardio = DuracionPrestacion(
        empresa_id=16,
        especialidad="Cardiología",
        duracion_minutos=30,
        sobre_turnos_permitidos=1
    )
    
    dur_trauma = DuracionPrestacion(
        empresa_id=16,
        especialidad="Traumatología",
        duracion_minutos=45,
        sobre_turnos_permitidos=0
    )
    
    db_session.add_all([dur_clinica, dur_cardio, dur_trauma])
    db_session.commit()
    
    return {
        "medicos": [medico_clinica, medico_cardio, medico_trauma],
        "grillas": [grilla1, grilla2, grilla3, grilla4],
        "duraciones": [dur_clinica, dur_cardio, dur_trauma]
    }


class TestSlotsCalculator:
    """Tests para calcular_slots_libres()"""
    
    def test_slots_libres_sin_medicos(self, db_session):
        """Test: Sin médicos retorna lista vacía."""
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Dermatología",
            fecha_desde=date(2026, 6, 2),
            fecha_hasta=date(2026, 6, 2),
            empresa_id=16
        )
        assert slots == []
    
    def test_slots_libres_clinica_medica(self, db_session, seed_data):
        """Test: Genera slots para Clínica Médica (duración 20min)."""
        # Calcular slots para el próximo lunes
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Clínica Médica",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        assert len(slots) > 0
        assert slots[0]["medico_id"] == 1
        assert slots[0]["especialidad"] == "Clínica Médica"
        assert slots[0]["disponible"] is True
        
        # Verificar que los slots están en intervalos de 20 minutos
        horas = [datetime.strptime(s["hora"], "%H:%M") for s in slots[:5]]
        for i in range(1, len(horas)):
            diff = (horas[i] - horas[i-1]).seconds / 60
            assert diff == 20, "Los slots deben estar separados por 20 minutos"
    
    def test_slots_libres_cardiologia(self, db_session, seed_data):
        """Test: Genera slots para Cardiología (duración 30min)."""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        assert len(slots) > 0
        assert slots[0]["medico_id"] == 2
        assert slots[0]["especialidad"] == "Cardiología"
        
        # Verificar intervalos de 30 minutos
        horas = [datetime.strptime(s["hora"], "%H:%M") for s in slots[:3]]
        for i in range(1, len(horas)):
            diff = (horas[i] - horas[i-1]).seconds / 60
            assert diff == 30, "Los slots deben estar separados por 30 minutos"
    
    def test_slots_libres_traumatologia(self, db_session, seed_data):
        """Test: Genera slots para Traumatología (duración 45min, martes)."""
        hoy = date.today()
        # Calcular próximo martes
        dias_hasta_martes = (1 - hoy.weekday()) % 7
        if dias_hasta_martes == 0:
            dias_hasta_martes = 7
        proximo_martes = hoy + timedelta(days=dias_hasta_martes)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Traumatología",
            fecha_desde=proximo_martes,
            fecha_hasta=proximo_martes,
            empresa_id=16
        )
        
        assert len(slots) > 0
        assert slots[0]["medico_id"] == 3
        assert slots[0]["especialidad"] == "Traumatología"
        
        # Verificar intervalos de 45 minutos
        if len(slots) >= 2:
            horas = [datetime.strptime(s["hora"], "%H:%M") for s in slots[:2]]
            diff = (horas[1] - horas[0]).seconds / 60
            assert diff == 45, "Los slots deben estar separados por 45 minutos"
    
    def test_slots_excluye_visitas_pendientes(self, db_session, seed_data):
        """Test: Excluye slots con visitas pendientes."""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        # Crear visita pendiente a las 14:30
        visita = Visita(
            empresa_id=16,
            medico_id=2,
            paciente_nuevo_id=1,
            fecha_hora=datetime.combine(proximo_lunes, time(14, 30)),
            estado="pendiente",
            duracion_minutos=30
        )
        db_session.add(visita)
        db_session.commit()
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        # Verificar que el slot 14:30 NO está disponible
        slots_1430 = [s for s in slots if s["hora"] == "14:30"]
        assert len(slots_1430) == 0, "El slot 14:30 debe estar ocupado"
        
        # Verificar que otros slots SÍ están disponibles
        assert len(slots) > 0
    
    def test_slots_excluye_dia_bloqueado(self, db_session, seed_data):
        """Test: Excluye días con bloqueo completo."""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        # Bloquear todo el día (sin hora_inicio/hora_fin)
        bloqueo = BloqueoGrilla(
            empresa_id=16,
            medico_id=2,
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            motivo="Congreso médico"
        )
        db_session.add(bloqueo)
        db_session.commit()
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        # No debe retornar slots para ese día
        assert len(slots) == 0, "Días bloqueados no deben generar slots"
    
    def test_calcular_slots_por_medico(self, db_session, seed_data):
        """Test: Wrapper calcular_slots_por_medico()"""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        slots = calcular_slots_por_medico(
            db=db_session,
            medico_id=2,
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        assert len(slots) > 0
        assert all(s["medico_id"] == 2 for s in slots)
    
    def test_slots_rango_multiple_dias(self, db_session, seed_data):
        """Test: Calcula slots para rango de varios días."""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        proximo_martes = proximo_lunes + timedelta(days=1)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id=None,  # Todas las especialidades
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_martes,
            empresa_id=16
        )
        
        # Debe haber slots de lunes (médicos 1 y 2) y martes (médico 3)
        assert len(slots) > 0
        
        fechas_unicas = set(s["fecha"] for s in slots)
        assert len(fechas_unicas) >= 2, "Debe haber slots para ambos días"
    
    def test_slots_ordenados(self, db_session, seed_data):
        """Test: Los slots están ordenados por fecha, hora, médico."""
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        proximo_martes = proximo_lunes + timedelta(days=1)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id=None,
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_martes,
            empresa_id=16
        )
        
        # Verificar orden
        for i in range(1, len(slots)):
            prev = (slots[i-1]["fecha"], slots[i-1]["hora"], slots[i-1]["medico_id"])
            curr = (slots[i]["fecha"], slots[i]["hora"], slots[i]["medico_id"])
            assert prev <= curr, "Los slots deben estar ordenados"


class TestEdgeCases:
    """Tests de casos extremos"""
    
    def test_sin_grillas_activas(self, db_session, seed_data):
        """Test: Médico sin grillas activas no genera slots."""
        # Desactivar todas las grillas del médico 2
        db_session.query(GrillaMedica).filter(
            GrillaMedica.medico_id == 2
        ).update({"activo": False})
        db_session.commit()
        
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        assert len(slots) == 0
    
    def test_sin_duracion_usa_default(self, db_session, seed_data):
        """Test: Sin duración configurada, usa 30min por defecto."""
        # Eliminar duración de Cardiología
        db_session.query(DuracionPrestacion).filter(
            DuracionPrestacion.especialidad == "Cardiología"
        ).delete()
        db_session.commit()
        
        hoy = date.today()
        dias_hasta_lunes = (7 - hoy.weekday()) % 7
        if dias_hasta_lunes == 0:
            dias_hasta_lunes = 7
        proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
        
        slots = calcular_slots_libres(
            db=db_session,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        # Debe generar slots (con duración default 30min)
        assert len(slots) > 0


if __name__ == "__main__":
    # Ejecutar tests con pytest
    pytest.main([__file__, "-v", "--tb=short"])
