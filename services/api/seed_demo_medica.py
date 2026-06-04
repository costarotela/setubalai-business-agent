"""
Seed demo médica inteligente — crea datos realistas para empresa_id=16 (Centro Médico Santa Clara).

Objetivo: Demo SaaS profesional con:
- Múltiples médicos por especialidad (antes solo 1 c/u)
- Turnos para HOY y esta semana (antes todos pasados)
- Historia clínica, atenciones, recetas, estudios vinculados

Uso: cd /home/admin/setubalai-agente/services/api && ./venv/bin/python3 seed_demo_medica.py
       Para fecha específica: ./venv/bin/python3 seed_demo_medica.py --fecha 2026-07-15
       Para otra empresa:     ./venv/bin/python3 seed_demo_medica.py --empresa 20 --fecha 2026-08-01
"""
import argparse
import random
from datetime import date, datetime, timedelta, timezone
from database import SessionLocal, engine
from sqlalchemy import text
import json
import sys

# ── Argumentos ──────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Seed demo médica para SetubalAI")
parser.add_argument("--fecha", type=str, default=None,
                    help="Fecha central de la demo (YYYY-MM-DD). Default: hoy.")
parser.add_argument("--empresa", type=int, default=16,
                    help="Empresa ID para sembrar. Default: 16.")
args = parser.parse_args()

TARGET_DATE = date.fromisoformat(args.fecha) if args.fecha else date.today()
EMP = args.empresa
AR = timezone(timedelta(hours=-3))  # America/Argentina/Buenos_Aires

print(f"🎯 Seed demo médica — empresa_id={EMP}, fecha central={TARGET_DATE}")

db = SessionLocal()

def ins(table, **kwargs):
    """Insert into setubalai table and return id."""
    cols = ", ".join(kwargs.keys())
    vals = []
    for v in kwargs.values():
        if v is None:
            vals.append("NULL")
        elif isinstance(v, bool):
            vals.append("TRUE" if v else "FALSE")
        elif isinstance(v, (int, float)):
            vals.append(str(v))
        elif isinstance(v, date):
            vals.append(f"'{v.isoformat()}'")
        elif isinstance(v, datetime):
            vals.append(f"'{v.isoformat()}'")
        else:
            s = str(v).replace("'", "''")
            vals.append(f"'{s}'")
    sql = f"INSERT INTO setubalai.{table} ({cols}) VALUES ({', '.join(vals)}) RETURNING id"
    try:
        result = db.execute(text(sql))
        db.commit()
        return result.scalar()
    except Exception as e:
        db.rollback()
        # Skip duplicates silently for idempotent runs
        if "duplicate" in str(e).lower() or "unique" in str(e).lower() or "violates" in str(e).lower():
            return None
        print(f"  ERROR en {table}: {e}")
        return None


hoy = TARGET_DATE

# ───────────────────────────────────────────────────────
# 1. MÉDICOS NUEVOS POR ESPECIALIDAD
# ───────────────────────────────────────────────────────
print("\n" + "="*60)
print("SEED DEMO MÉDICA — Centro Médico Santa Clara (empresa_id=16)")
print("="*60)

print("\n📋 1. Creando médicos adicionales por especialidad...")

horarios_base = {
    "lunes": ["08:00-12:00", "14:00-18:00"],
    "martes": ["08:00-12:00", "14:00-18:00"],
    "miércoles": ["08:00-12:00", "14:00-18:00"],
    "jueves": ["08:00-12:00", "14:00-18:00"],
    "viernes": ["08:00-12:00"],
}

medicos_nuevos = [
    # Cardiología (ya tiene 1: Carlos Rodríguez — id=2)
    ("Laura", "Bianchi", "MP 8821", 45, "Cardiología"),
    ("Ricardo", "Méndez", "MP 7734", 45, "Cardiología"),
    # Traumatología (ya tiene 1: Juan Martínez — id=3)
    ("Silvia", "Torres", "MP 5598", 30, "Traumatología"),
    ("Gustavo", "Ríos", "MP 6621", 30, "Traumatología"),
    # Pediatría (ya tiene 1: Roberto Fernández — id=5)
    ("Patricia", "Vega", "MP 4412", 25, "Pediatría"),
    ("Andrés", "Cabrera", "MP 3390", 25, "Pediatría"),
    # Dermatología (ya tiene 1: Ana López — id=4)
    ("Mariana", "Díaz", "MP 9901", 20, "Dermatología"),
    ("Fernando", "Silva", "MP 1187", 20, "Dermatología"),
    # Clínica Médica (ya tiene 1: María García — id=1)
    ("Diego", "Ramírez", "MP 2256", 30, "Clínica Médica"),
    ("Carolina", "Molina", "MP 7743", 30, "Clínica Médica"),
]

esp_map = {}  # nombre → id
esp_rows = db.execute(text("SELECT id, nombre FROM setubalai.especialidades_medicas WHERE empresa_id = :emp"), {"emp": EMP}).fetchall()
for r in esp_rows:
    esp_map[r.nombre] = r.id

print(f"  Especialidades existentes: {list(esp_map.keys())}")

nuevo_medico_ids = []  # (id_medico, especialidad_nombre)
for nombre, apellido, matricula, duracion, esp_nombre in medicos_nuevos:
    esp_id = esp_map.get(esp_nombre)
    if not esp_id:
        print(f"  ⚠️ Especialidad '{esp_nombre}' no encontrada, skip")
        continue

    h = json.dumps(horarios_base)
    mid = ins("medicos",
        empresa_id=EMP,
        nombre=nombre,
        apellido=apellido,
        matricula_provincial=matricula,
        duracion_turno_minutos=duracion,
        horarios_atencion=h,
        activo=True,
    )
    if mid:
        # Relacionar con especialidad (tabla junction sin id propio)
        try:
            db.execute(text(
                "INSERT INTO setubalai.medico_especialidades (medico_id, especialidad_id) VALUES (:mid, :eid)"
            ), {"mid": mid, "eid": esp_id})
            db.commit()
        except Exception as e:
            db.rollback()
            if "duplicate" not in str(e).lower():
                print(f"  ⚠️ Error medico_especialidades: {e}")
        nuevo_medico_ids.append((mid, esp_nombre))
        print(f"  ✅ Dr/a. {nombre} {apellido} → {esp_nombre} (id={mid})")

# También obtener médicos existentes para usarlos en turnos
medicos_existentes = db.execute(text(
    "SELECT m.id, m.nombre, m.apellido, e.nombre as esp "
    "FROM setubalai.medicos m "
    "JOIN setubalai.medico_especialidades me ON m.id = me.medico_id "
    "JOIN setubalai.especialidades_medicas e ON me.especialidad_id = e.id "
    "WHERE m.empresa_id = :emp AND m.activo = true"
), {"emp": EMP}).fetchall()

todos_medicos = [(m[0], m[3]) for m in medicos_existentes]  # (id, esp_nombre)
print(f"  Total médicos activos: {len(todos_medicos)}")

# ───────────────────────────────────────────────────────
# 2. PACIENTES NUEVOS (agregamos ~15 más a los 21 existentes)
# ───────────────────────────────────────────────────────
print("\n📋 2. Creando pacientes adicionales...")

pacientes_nuevos = [
    ("Martín", "Castro", "30111222", "11-5555-0101", "OSDE", "Plan 210"),
    ("Lucía", "Fernández", "28333444", "11-5555-0102", "Swiss Medical", "Plan 300"),
    ("Nicolás", "García", "35222111", "11-5555-0103", "Galeno", "Plan Básico"),
    ("Valentina", "López", "29444555", "11-5555-0104", "Particular", None),
    ("Joaquín", "Ruiz", "33666777", "11-5555-0105", "IOMA", "Plan Obligatorio"),
    ("Camila", "Sosa", "31888999", "11-5555-0106", "Medifé", "Plan Oro"),
    ("Tomás", "Herrera", "27111000", "11-5555-0107", "PAMI", None),
    ("Sofía", "Morales", "32555666", "11-5555-0108", "OSDE", "Plan 310"),
    ("Mateo", "Romero", "36777888", "11-5555-0109", "Particular", None),
    ("Isabella", "Navarro", "29999111", "11-5555-0110", "IAPOS", "Plan Integral"),
    ("Benjamín", "Acosta", "34111222", "11-5555-0111", "Galeno", "Plan Plus"),
    ("Mía", "Vargas", "30333444", "11-5555-0112", "Swiss Medical", "Plan 500"),
    ("Santiago", "Pereyra", "28555666", "11-5555-0113", "OSDE", "Plan 210"),
    ("Emma", "Giménez", "37777888", "11-5555-0114", "Particular", None),
    ("Thiago", "Medina", "31222333", "11-5555-0115", "IOMA", "Plan Básico"),
]

os_map = {}
os_rows = db.execute(text("SELECT id, nombre FROM setubalai.obras_sociales WHERE empresa_id = :emp"), {"emp": EMP}).fetchall()
for r in os_rows:
    os_map[r.nombre] = r.id

nuevo_paciente_ids = []
for nombre, apellido, dni, tel, os_nombre, plan in pacientes_nuevos:
    os_id = os_map.get(os_nombre)
    pid = ins("pacientes",
        empresa_id=EMP,
        nombre=nombre,
        apellido=apellido,
        dni=dni,
        telefono=tel,
        obra_social=os_nombre,
        obra_social_id=os_id,
        plan=plan,
        email=f"{nombre.lower()}.{apellido.lower()}@email.com",
        fecha_nacimiento=date(1990, 1, 1) + timedelta(days=random.randint(0, 10000)),
    )
    if pid:
        nuevo_paciente_ids.append((pid, os_nombre))
        print(f"  ✅ {nombre} {apellido} (DNI: {dni}) — {os_nombre}")

# Pacientes existentes
pacientes_existentes = db.execute(text(
    "SELECT id, nombre, apellido FROM setubalai.pacientes WHERE empresa_id = :emp"
), {"emp": EMP}).fetchall()

todos_pacientes = [(p[0], f"{p[1]} {p[2]}") for p in pacientes_existentes]
print(f"  Total pacientes: {len(todos_pacientes)}")

# ───────────────────────────────────────────────────────
# 3. TURNOS PARA HOY Y ESTA SEMANA
# ───────────────────────────────────────────────────────
print("\n📋 3. Creando turnos para HOY y esta semana...")

motivos = [
    "Consulta de rutina", "Control periódico", "Dolor torácico", "Dolor de espalda",
    "Control pediátrico", "Dermatitis", "Chequeo general", "Dolor articular",
    "Segunda opinión", "Resultados de estudios", "Control post-operatorio",
    "Vacunación", "Dolor de cabeza persistente", "Erupción cutánea",
    "Control de presión arterial", "Evaluación cardiológica",
]

estados_posibles = ["pendiente", "en-curso", "completado"]
# hoy ya está definido como TARGET_DATE al inicio del script

# Agrupar médicos por especialidad para asignar turnos consistentes
medicos_por_esp = {}
for mid, esp in todos_medicos:
    medicos_por_esp.setdefault(esp, []).append(mid)

# Turnos HOY (hacer 3 bloques: mañana 8-12, tarde 14-18)
turnos_creados = []
horarios_hoy = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
]

random.seed(42)  # Reproducible

for i, hora_str in enumerate(horarios_hoy):
    esp_nombre = random.choice(list(medicos_por_esp.keys()))
    mid_list = medicos_por_esp[esp_nombre]
    mid = random.choice(mid_list)
    pid = random.choice(todos_pacientes)[0]
    oid_row = random.choice(os_rows) if os_rows else None
    oid = oid_row[0] if oid_row else None
    hora = int(hora_str.split(":")[0])
    estado = "completado" if hora < 12 else ("en-curso" if hora == 14 else "pendiente")

    fecha_hora = datetime(hoy.year, hoy.month, hoy.day, hora, int(hora_str.split(":")[1]), tzinfo=AR)

    tid = ins("visitas",
        empresa_id=EMP,
        paciente_nuevo_id=pid,
        medico_id=mid,
        fecha_hora=fecha_hora,
        duracion_minutos=30,
        estado=estado,
        motivo_consulta=random.choice(motivos),
        tipo_visita="consulta",
        especialidad_id=esp_map.get(esp_nombre),
        obra_social_id=oid,
        canal_reserva="web",
    )
    if tid:
        turnos_creados.append((tid, estado, mid, pid, esp_nombre, fecha_hora))

# Turnos para los próximos 5 días
for dia_offset in range(1, 6):
    fecha = hoy + timedelta(days=dia_offset)
    slots = random.sample(horarios_hoy, min(6, len(horarios_hoy)))
    for hora_str in slots:
        esp_nombre = random.choice(list(medicos_por_esp.keys()))
        mid_list = medicos_por_esp[esp_nombre]
        mid = random.choice(mid_list)
        pid = random.choice(todos_pacientes)[0]
        hora = int(hora_str.split(":")[0])
        fecha_hora = datetime(fecha.year, fecha.month, fecha.day, hora, int(hora_str.split(":")[1]), tzinfo=AR)

        tid = ins("visitas",
            empresa_id=EMP,
            paciente_nuevo_id=pid,
            medico_id=mid,
            fecha_hora=fecha_hora,
            duracion_minutos=30,
            estado="pendiente",
            motivo_consulta=random.choice(motivos),
            tipo_visita="consulta",
            especialidad_id=esp_map.get(esp_nombre),
            canal_reserva=random.choice(["web", "bot"]),
        )
        if tid:
            turnos_creados.append((tid, "pendiente", mid, pid, esp_nombre, fecha_hora))

print(f"  ✅ {len(turnos_creados)} turnos creados")
hoy_count = sum(1 for _, _, _, _, _, fh in turnos_creados if fh.date() == hoy)
print(f"     - {hoy_count} turnos para HOY")
semana_count = sum(1 for _, _, _, _, _, fh in turnos_creados if fh.date() != hoy)
print(f"     - {semana_count} turnos esta semana")

# ───────────────────────────────────────────────────────
# 4. ATENCIONES + HC + PRÁCTICAS + RECETAS + ESTUDIOS
#    (para turnos completados de HOY)
# ───────────────────────────────────────────────────────
print("\n📋 4. Creando atenciones, historia clínica, recetas y estudios...")

diagnosticos = [
    "Hipertensión arterial leve", "Lumbalgia mecánica", "Rinitis alérgica estacional",
    "Dermatitis de contacto", "Infección de vías urinarias", "Control glucémico estable",
    "Faringoamigdalitis aguda", "Gastritis crónica", "Otitis media aguda",
    "Síndrome de intestino irritable", "Cefalea tensional", "Bronquitis aguda",
]

plan_tratamientos = [
    "Enalapol 10mg c/12hs + control en 30 días",
    "Ibuprofeno 400mg c/8hs x 7 días + reposo relativo",
    "Loratadina 10mg c/24hs x 15 días",
    "Crema de hidrocortisona 1% tópica c/12hs x 10 días",
    "Ciprofloxacina 500mg c/12hs x 7 días + abundante líquido",
    "Metformina 850mg c/12hs + dieta hipocalórica",
    "Amoxicilina 500mg c/8hs x 10 días",
    "Omeprazol 20mg c/24hs en ayunas x 30 días",
]

practicas_map = {}
prac_rows = db.execute(text(
    "SELECT id, descripcion, tipo FROM setubalai.nomenclador_practicas WHERE empresa_id = :emp"
), {"emp": EMP}).fetchall()
for r in prac_rows:
    practicas_map[r.descripcion] = r.id

completados_hoy = [(tid, mid, pid, esp) for tid, st, mid, pid, esp, _ in turnos_creados if st == "completado"]

for tid, mid, pid, esp_nombre in completados_hoy:
    # Historia clínica (una por paciente)
    alergias_val = random.choice([None, "{Penicilina,Sulfamidas,Aspirina}", "{Sulfamidas,Aspirina}", "{}"])
    medicacion_val = random.choice([None, "{Enalaprol 10mg}", "{Metformina 850mg}", "{}"])
    ins("historia_clinica",
        empresa_id=EMP,
        paciente_nuevo_id=pid,
        grupo_sanguineo=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
        alergias=alergias_val,
        medicacion_habitual=medicacion_val,
        antecedentes_personales="Paciente sin antecedentes quirúrgicos relevantes",
        notas_adicionales=f"Paciente derivado a {esp_nombre}",
    )

    # Atención médica vinculada al turno
    diag = random.choice(diagnosticos)
    plan = random.choice(plan_tratamientos)
    aid = ins("atenciones_medicas",
        empresa_id=EMP,
        visita_id=tid,
        medico_id=mid,
        paciente_nuevo_id=pid,
        fecha_hora_inicio=datetime(hoy.year, hoy.month, hoy.day, 9, 0, tzinfo=AR),
        estado="completada",
        anamnesis=f"Paciente consulta por {diag.lower()}. Refiere síntomas desde hace 3-5 días.",
        examen_fisico=random.choice([
            "PA: 130/85, FC: 78, T: 36.5°C",
            "PA: 120/80, FR: 16, SatO2: 98%",
            "Paciente consciente, orientado, sin signos de distress",
        ]),
        diagnostico=diag,
        plan_tratamiento=plan,
        presion_arterial=random.choice(["120/80", "130/85", "140/90", "110/70"]),
        frecuencia_cardiaca=random.randint(65, 95),
        temperatura=round(random.uniform(36.0, 37.5), 1),
        peso=round(random.uniform(60, 100), 1),
        altura=round(random.uniform(1.55, 1.85), 2),
    )

    if aid:
        # 1-3 prácticas por atención
        n_practicas = random.randint(1, 3)
        prac_keys = list(practicas_map.keys())
        for _ in range(n_practicas):
            pnombre = random.choice(prac_keys)
            ins("practicas_medicas",
                empresa_id=EMP,
                atencion_medica_id=aid,
                medico_id=mid,
                paciente_nuevo_id=pid,
                tipo_practica=pnombre,
                codigo_nomenclador=f"NAB-{random.randint(100,999)}",
                descripcion_nomenclador=f"Práctica de {esp_nombre}: {pnombre}",
                estado_facturacion="pendiente",
                observaciones=f"Práctica indicada en consulta de {esp_nombre}",
            )

        # Receta (50% de probabilidad)
        if random.random() > 0.5:
            medicamentos = [
                [{"nombre": "Ibuprofeno", "dosis": "400mg", "frecuencia": "c/8hs", "duracion": "7 días", "cantidad": 20}],
                [{"nombre": "Amoxicilina", "dosis": "500mg", "frecuencia": "c/8hs", "duracion": "10 días", "cantidad": 30}],
                [{"nombre": "Loratadina", "dosis": "10mg", "frecuencia": "c/24hs", "duracion": "15 días", "cantidad": 15}],
                [{"nombre": "Omeprazol", "dosis": "20mg", "frecuencia": "c/24hs", "duracion": "30 días", "cantidad": 30}],
            ]
            meds = random.choice(medicamentos)
            ins("recetas",
                empresa_id=EMP,
                atencion_medica_id=aid,
                medico_id=mid,
                paciente_nuevo_id=pid,
                medicamentos=json.dumps(meds),
                indicaciones="Tomar según indicación médica. Consultar si persisten los síntomas.",
                valida_hasta=hoy + timedelta(days=30),
            )

        # Estudio adjunto (30% de probabilidad)
        if random.random() > 0.7:
            ins("estudios_adjuntos",
                empresa_id=EMP,
                paciente_nuevo_id=pid,
                tipo_estudio=random.choice(["Hemograma completo", "Perfil lipídico", "Glucemia en ayunas", "Electrocardiograma", "Radiografía de tórax"]),
                descripcion=f"Estudio solicitado durante consulta de {esp_nombre}",
                fecha_estudio=hoy,
                archivo_nombre="estudio_pendiente.pdf",
                archivo_url="",
                archivo_tipo="application/pdf",
                archivo_tamano_bytes=0,
                consulta_id=tid,
            )

atenciones_count = db.execute(text(
    "SELECT COUNT(*) FROM setubalai.atenciones_medicas a JOIN setubalai.visitas v ON a.visita_id = v.id WHERE v.empresa_id = :emp"
), {"emp": EMP}).scalar()

recetas_count = db.execute(text(
    "SELECT COUNT(*) FROM setubalai.recetas WHERE empresa_id = :emp"
), {"emp": EMP}).scalar()

estudios_count = db.execute(text(
    "SELECT COUNT(*) FROM setubalai.estudios_adjuntos WHERE empresa_id = :emp"
), {"emp": EMP}).scalar()

print(f"  ✅ Atenciones totales: {atenciones_count}")
print(f"  ✅ Recetas totales: {recetas_count}")
print(f"  ✅ Estudios totales: {estudios_count}")

# ───────────────────────────────────────────────────────
# RESUMEN FINAL
# ───────────────────────────────────────────────────────
print("\n" + "="*60)
print("RESUMEN FINAL — DEMO MÉDICA")
print("="*60)

stats = {
    "Especialidades": "SELECT COUNT(*) FROM setubalai.especialidades_medicas WHERE empresa_id = :emp",
    "Médicos": "SELECT COUNT(*) FROM setubalai.medicos WHERE empresa_id = :emp",
    "Pacientes": "SELECT COUNT(*) FROM setubalai.pacientes WHERE empresa_id = :emp",
    "Turnos totales": "SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id = :emp",
    "Turnos HOY": "SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id = :emp AND fecha_hora::date = CURRENT_DATE",
    "Turnos esta semana": "SELECT COUNT(*) FROM setubalai.visitas WHERE empresa_id = :emp AND fecha_hora::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6",
    "Prácticas": "SELECT COUNT(*) FROM setubalai.nomenclador_practicas WHERE empresa_id = :emp",
    "Historia Clínica": "SELECT COUNT(*) FROM setubalai.historia_clinica WHERE empresa_id = :emp",
    "Atenciones": "SELECT COUNT(*) FROM setubalai.atenciones_medicas WHERE empresa_id = :emp",
    "Recetas": "SELECT COUNT(*) FROM setubalai.recetas WHERE empresa_id = :emp",
    "Estudios": "SELECT COUNT(*) FROM setubalai.estudios_adjuntos WHERE empresa_id = :emp",
    "Obras Sociales": "SELECT COUNT(*) FROM setubalai.obras_sociales WHERE empresa_id = :emp",
}

for label, query in stats.items():
    count = db.execute(text(query), {"emp": EMP}).scalar()
    marker = "📅" if "HOY" in label or "semana" in label else " "
    print(f"  {marker} {label}: {count}")

print("\n✅ Seed demo médica completado.")
print("   Login: admin@centromedicosantaclara.com.ar / Pablo2024!")
print("   Ver en: dev.setubalai.org/turnos")

db.close()
