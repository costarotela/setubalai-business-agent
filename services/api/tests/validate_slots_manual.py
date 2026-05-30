"""
Script de validación manual para calcular_slots_libres()

Este script valida la función contra la base de datos real de PostgreSQL.
Ejecutar:
    cd /home/admin/setubalai-agente/services/api
    ./venv/bin/python3 tests/validate_slots_manual.py

Requiere: Base de datos con seed de empresa 16 cargado.
"""

import sys
from datetime import date, timedelta
from database import SessionLocal
from utils.slots_calculator import calcular_slots_libres, calcular_slots_por_medico


def test_basic_functionality():
    """Test básico: Calcular slots para Cardiología."""
    print("\n" + "="*70)
    print("TEST 1: Calcular slots para Cardiología (próximo lunes)")
    print("="*70)
    
    db = SessionLocal()
    
    # Calcular próximo lunes
    hoy = date.today()
    dias_hasta_lunes = (7 - hoy.weekday()) % 7
    if dias_hasta_lunes == 0:
        dias_hasta_lunes = 7
    proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
    
    print(f"Fecha de búsqueda: {proximo_lunes} (lunes)")
    
    try:
        slots = calcular_slots_libres(
            db=db,
            especialidad_id="Cardiología",
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_lunes,
            empresa_id=16
        )
        
        print(f"✅ Slots encontrados: {len(slots)}")
        
        if slots:
            print("\n📋 Primeros 5 slots:")
            for i, slot in enumerate(slots[:5]):
                print(f"  {i+1}. {slot['medico_nombre']} - {slot['fecha']} {slot['hora']} - {slot['especialidad']}")
        else:
            print("⚠️  No hay slots disponibles (puede ser que no haya médicos ese día)")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        return False


def test_multiple_dias():
    """Test: Rango de múltiples días."""
    print("\n" + "="*70)
    print("TEST 2: Slots para toda la semana (todas las especialidades)")
    print("="*70)
    
    db = SessionLocal()
    
    # Próxima semana (lunes a viernes)
    hoy = date.today()
    dias_hasta_lunes = (7 - hoy.weekday()) % 7
    if dias_hasta_lunes == 0:
        dias_hasta_lunes = 7
    proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
    proximo_viernes = proximo_lunes + timedelta(days=4)
    
    print(f"Rango: {proximo_lunes} a {proximo_viernes}")
    
    try:
        slots = calcular_slots_libres(
            db=db,
            especialidad_id=None,  # Todas las especialidades
            fecha_desde=proximo_lunes,
            fecha_hasta=proximo_viernes,
            empresa_id=16
        )
        
        print(f"✅ Total slots encontrados: {len(slots)}")
        
        # Agrupar por día
        slots_por_dia = {}
        for slot in slots:
            fecha = slot['fecha']
            if fecha not in slots_por_dia:
                slots_por_dia[fecha] = []
            slots_por_dia[fecha].append(slot)
        
        print(f"\n📊 Distribución por día:")
        for fecha in sorted(slots_por_dia.keys()):
            count = len(slots_por_dia[fecha])
            print(f"  {fecha}: {count} slots")
        
        # Agrupar por médico
        slots_por_medico = {}
        for slot in slots:
            medico = slot['medico_nombre']
            if medico not in slots_por_medico:
                slots_por_medico[medico] = 0
            slots_por_medico[medico] += 1
        
        print(f"\n👨‍⚕️ Por médico:")
        for medico, count in slots_por_medico.items():
            print(f"  {medico}: {count} slots")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        return False


def test_medico_especifico():
    """Test: Slots de un médico específico."""
    print("\n" + "="*70)
    print("TEST 3: Slots del médico ID=2 (próximos 7 días)")
    print("="*70)
    
    db = SessionLocal()
    
    hoy = date.today()
    dias_hasta_lunes = (7 - hoy.weekday()) % 7
    if dias_hasta_lunes == 0:
        dias_hasta_lunes = 7
    proximo_lunes = hoy + timedelta(days=dias_hasta_lunes)
    fin_semana = proximo_lunes + timedelta(days=6)
    
    print(f"Médico: ID=2")
    print(f"Rango: {proximo_lunes} a {fin_semana}")
    
    try:
        slots = calcular_slots_por_medico(
            db=db,
            medico_id=2,
            fecha_desde=proximo_lunes,
            fecha_hasta=fin_semana,
            empresa_id=16
        )
        
        print(f"✅ Slots encontrados: {len(slots)}")
        
        if slots:
            print(f"\n📋 Primeros 10 slots:")
            for i, slot in enumerate(slots[:10]):
                print(f"  {i+1}. {slot['fecha']} {slot['hora']} - {slot['especialidad']}")
        
        # Verificar que todos son del médico 2
        if slots:
            todos_medico_2 = all(s['medico_id'] == 2 for s in slots)
            if todos_medico_2:
                print("\n✅ Todos los slots son del médico ID=2")
            else:
                print("\n❌ ERROR: Hay slots de otros médicos")
                return False
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        db.close()
        return False


def test_especialidad_inexistente():
    """Test: Especialidad que no existe."""
    print("\n" + "="*70)
    print("TEST 4: Especialidad inexistente (debe retornar lista vacía)")
    print("="*70)
    
    db = SessionLocal()
    
    hoy = date.today()
    
    try:
        slots = calcular_slots_libres(
            db=db,
            especialidad_id="Dermatología",  # No existe en seed
            fecha_desde=hoy,
            fecha_hasta=hoy + timedelta(days=7),
            empresa_id=16
        )
        
        if len(slots) == 0:
            print("✅ Retorna lista vacía correctamente")
            db.close()
            return True
        else:
            print(f"❌ ERROR: Debería retornar lista vacía, pero retornó {len(slots)} slots")
            db.close()
            return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        db.close()
        return False


def main():
    """Ejecuta todos los tests de validación."""
    print("\n" + "🧪"*35)
    print(" "*20 + "VALIDACIÓN DE SLOTS CALCULATOR")
    print("🧪"*35)
    
    tests = [
        ("Funcionalidad básica", test_basic_functionality),
        ("Múltiples días", test_multiple_dias),
        ("Médico específico", test_medico_especifico),
        ("Especialidad inexistente", test_especialidad_inexistente),
    ]
    
    results = []
    for nombre, test_func in tests:
        try:
            resultado = test_func()
            results.append((nombre, resultado))
        except Exception as e:
            print(f"\n❌ Test '{nombre}' falló con excepción: {e}")
            results.append((nombre, False))
    
    # Resumen
    print("\n" + "="*70)
    print("RESUMEN DE TESTS")
    print("="*70)
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    for nombre, resultado in results:
        status = "✅ PASS" if resultado else "❌ FAIL"
        print(f"{status} - {nombre}")
    
    print(f"\n{'✅' if passed == total else '❌'} {passed}/{total} tests pasaron")
    
    if passed == total:
        print("\n🎉 ¡Todos los tests pasaron exitosamente!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) fallaron")
        return 1


if __name__ == "__main__":
    sys.exit(main())
