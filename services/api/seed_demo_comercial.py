"""
Seed estratégico: 3 empresas demo para ventas
12: DiagCentro Santa Fe (Diagnóstico por Imágenes — basada en diagporimagenes.com)
13: CentroMedicIntegral (Centro Médico Multiespecialidad)
14: AsistenciaLogística SA (Logística + Asistencia de Seguros)
"""
import subprocess, json

def sql(query, db_url="postgresql://paperclip:paperclip@127.0.0.1:5432/business"):
    """Execute SQL via docker psql"""
    r = subprocess.run(
        ["docker", "exec", "paperclip-db", "psql", "-U", "paperclip", "-d", "business", "-t", "-A",
         "-c", f"SET search_path TO setubalai; {query}"],
        capture_output=True, text=True
    )
    # Take the FIRST non-empty line (SET returns "SET", INSERT returns "INSERT 0 1", RETURNING returns id on 1st line)
    lines = [l.strip() for l in r.stdout.strip().split("\n") if l.strip() and l.strip() not in ("SET", "INSERT 0 1")]
    return lines[0] if lines else ""

def sql_insert(table, **kwargs):
    """Insert and return id"""
    cols = ", ".join(kwargs.keys())
    vals = []
    for v in kwargs.values():
        if v is None:
            vals.append("NULL")
        elif isinstance(v, bool):
            vals.append("TRUE" if v else "FALSE")
        elif isinstance(v, (int, float)):
            vals.append(str(v))
        else:
            s = str(v).replace("'", "''")
            vals.append(f"'{s}'")
    query = f"INSERT INTO setubalai.{table} ({cols}) VALUES ({', '.join(vals)}) RETURNING id"
    result = sql(query)
    try:
        return int(result)
    except:
        print(f"  ERROR insert {table}: {result[:200]}")
        return None

def sql_multi(query):
    """Execute without RETURNING, for deletes etc"""
    return sql(f"SET search_path TO setubalai; {query}")

# ============================================================
#  EMPRESA 12: DiagCentro Santa Fe - Diagnóstico por Imágenes
# ============================================================
print("\n" + "="*60)
print("  DIAGNÓSTICO POR IMÁGENES (id=12) - Demo comercial")
print("="*60)

# Categorías (los estudios del centro - basado en diagporimagenes.com)
cat_resonancia = sql_insert("categorias_productos", empresa_id=12, nombre="Resonancia Magnética", activo=True, orden=1)
cat_tomografia = sql_insert("categorias_productos", empresa_id=12, nombre="Tomografía Computada", activo=True, orden=2)
cat_ecografia = sql_insert("categorias_productos", empresa_id=12, nombre="Ecografía", activo=True, orden=3)
cat_mamografia = sql_insert("categorias_productos", empresa_id=12, nombre="Mamografía", activo=True, orden=4)
cat_densitometria = sql_insert("categorias_productos", empresa_id=12, nombre="Densitometría", activo=True, orden=5)
cat_rayos_x = sql_insert("categorias_productos", empresa_id=12, nombre="Rayos X / Radiología", activo=True, orden=6)
cat_cristaloide = sql_insert("categorias_productos", empresa_id=12, nombre="Cámera Gamma", activo=True, orden=7)
print(f"   7 categorías de estudios creadas")

# Estudios / Servicios (son servicios, no productos físicos)
estudios = [
    # Resonancia Magnética
    ("Resonancia Magnética Cerebral", "Estudio de cerebro por RMN 1.5 Tesla", cat_resonancia, 45000, "servicio"),
    ("Resonancia Magnética de Rodilla", "Evaluación de estructuras articulares", cat_resonancia, 38000, "servicio"),
    ("Resonancia Magnética de Columna", "Columna cervical, dorsal o lumbar", cat_resonancia, 42000, "servicio"),
    ("Resonancia Magnética Abdominal", "Hígado, páncreas, riñones, bazo", cat_resonancia, 48000, "servicio"),
    ("Resonancia Magnética Cardíaca", "Evaluación cardíaca con contraste", cat_resonancia, 55000, "servicio"),
    # Tomografía
    ("Tomografía Computada de Cráneo", "TC multicorte de cráneo simple", cat_tomografia, 25000, "servicio"),
    ("Tomografía Computada de Tórax", "TC de tórax con contraste", cat_tomografia, 28000, "servicio"),
    ("Tomografía Computada Abdominal", "TC abdomen y pelvis con contraste", cat_tomografia, 32000, "servicio"),
    ("Angiotomografía", "Estudio vascular con contraste IV", cat_tomografia, 40000, "servicio"),
    # Ecografía
    ("Ecografía Abdominal Completa", "Hígado, vesícula, páncreas, riñones, bazo", cat_ecografia, 8500, "servicio"),
    ("Ecografía Ginecológica", "Transvaginal o abdominal", cat_ecografia, 7500, "servicio"),
    ("Ecografía Mamaria", "Complementaria a mamografía", cat_ecografia, 7000, "servicio"),
    ("Eco Doppler Vascular", "Arterial o venoso de miembros", cat_ecografia, 9000, "servicio"),
    ("Ecografía Tireoidea", "Evaluación de nódulos tiroideos", cat_ecografia, 6500, "servicio"),
    ("Ecografía Obstétrica", "Control de embarazo", cat_ecografia, 8000, "servicio"),
    # Mamografía (piso exclusivo mujer)
    ("Mamografía Digital Bilateral", "Estudio de detección precoz", cat_mamografia, 12000, "servicio"),
    ("Mamografía Digital + Ecografía", "Estudio combinado completo", cat_mamografia, 18000, "servicio"),
    ("Mamografía Digital Unilateral", "Control focalizado", cat_mamografia, 8000, "servicio"),
    # Densitometría
    ("Densitometría Ósea Corpórea", "Columna lumbar + fémur", cat_densitometria, 15000, "servicio"),
    ("Densitometría de Cadera", "Evaluación de densidad femoral", cat_densitometria, 12000, "servicio"),
    # Rayos X
    ("Radiografía de Tórax", "PA y lateral", cat_rayos_x, 3500, "servicio"),
    ("Radiografía Ósea", "Una o dos proyecciones", cat_rayos_x, 3000, "servicio"),
    ("Rx Columna Completa", "4 proyecciones", cat_rayos_x, 5500, "servicio"),
    # Cámara Gamma
    ("Gammagrafía Ósea", "Cuerpo entero con Tc99m", cat_cristaloide, 35000, "servicio"),
    ("Gammagrafía Renal", "DTPA o MAG3", cat_cristaloide, 28000, "servicio"),
    ("Gammagrafía Tiroidea", "Con Tc99m o I131", cat_cristaloide, 25000, "servicio"),
]

for nombre, desc, cat_id, precio, tipo in estudios:
    sid = sql_insert("productos", nombre=nombre, descripcion=desc, empresa_id=12, precio=precio,
                     costo=precio*0.3, stock_actual=0, stock_minimo=0, control_stock=False,
                     activo=True, categoria_id=cat_id, moneda="ARS", precio_tipo="unico",
                     tipo=tipo, visible_en_catalogo=True, destacado_en_catalogo=True)
    if sid:
        pass  # silent success

print(f"   {len(estudios)} estudios cargados")

# Insumos físicos para el stock
insumos = [
    ("Contraste Gadolinio (Resonancia)", "Medio de contraste para RMN - 10ml", 0, 45000, 20000, 3),
    ("Contraste Yodado TC", "Medio de contraste para TC - 100ml", 0, 12000, 6000, 5),
    ("Jeringas Descartables x100", "Jeringas esterilizadas 20ml", 200, 5000, 2500, 50),
    ("Agulhas de Punción x50", "Agujas para venopunción", 150, 8000, 4000, 30),
    ("Papel de Impresión Térmica", "Rollo para impresora DICOM", 50, 15000, 9000, 10),
]

for nombre, desc, stock, precio, costo, min_stock in insumos:
    sql_insert("productos", nombre=nombre, descripcion=desc, empresa_id=12, precio=precio,
               costo=costo, stock_actual=stock, stock_minimo=min_stock, control_stock=True,
               activo=True, moneda="ARS", precio_tipo="unico", tipo="producto",
               visible_en_catalogo=False, destacado_en_catalogo=False)

print(f"   5 insumos físicos de stock")

# Clientes: pacientes y referentes médicos
clientes_diag = [
    ("PAC-001", "María González", "maria.gonzalez@gmail.com", "activo", 45000, "Paciente particular - mamografía anual, seguimiento"),
    ("PAC-002", "Roberto Martínez", "roberto.m@hotmail.com", "activo", 38000, "Referido por Dr. López - resonancia de rodilla"),
    ("PAC-003", "Ana Laura Pérez", "ana.perez@outlook.com", "activo", 12000, "Ecografía abdominal de control"),
    ("PAC-004", "Jorge Fernández", "jorge.f@gmail.com", "moroso", 85000, "Deuda de 2 resonancias + TC de hace 3 meses"),
    ("PAC-005", "Susana Bianchi", "susana.b@hotmail.com", "activo", 15000, "Densitometría ósea + mamografía combo"),
    ("PAC-006", "Carlos Domínguez", "carlos.d@gmail.com", "activo", 95000, "Paciente recurrente - seguimiento oncológico trimestral"),
    ("PAC-007", "Lucía Herrera", "lucia.h@outlook.com", "prospecto", 0, "Solicitó turno, no vino aún"),
    ("PAC-008", "Dr. Martín López (Traumatólogo)", "dr.lopez@clinicasantafe.com", "activo", 120000, "Médico referente - envía 15 pacientes/mes"),
    ("PAC-009", "Dra. Carolina Ruiz (Ginecóloga)", "dra.ruiz@centromujer.com", "activo", 85000, "Médica referente - envía pacientes al piso de la mujer"),
    ("PAC-010", "Dr. Alejandro Suárez (Cardiólogo)", "dr.suarez@cardio.com", "activo", 65000, "Médico referente - RMN cardíaca, eco doppler vascular"),
    ("OS-001", "OSPEC - Obra Social del Personal Especializado", "admin@ospec.com.ar", "activo", 350000, "Obra social - convenio, facturación mensual"),
    ("OS-002", "Swiss Medical", "pagos@swissmedical.com.ar", "activo", 280000, "Prepaga - convenio, facturación mensual"),
    ("OS-003", "Galeno Seguros", "facturacion@galeno.com.ar", "activo", 195000, "Obra social - convenio vigente"),
]

clinente_ids = {}
for ref, nombre, email, estado, valor, notas in clientes_diag:
    tipo = "persona"
    if nombre.startswith("Dr.") or nombre.startswith("Dra."):
        tipo = "persona"
    elif "OS-" in ref or "Swiss" in nombre or "Galeno" in nombre:
        tipo = "empresa"
    elif "PAC" in ref:
        tipo = "persona"
    
    cid = sql_insert("clientes", nombre=nombre, email=email, empresa_id=12,
                     ciudad="Santa Fe", estado=estado, tipo=tipo, valor_total=valor,
                     notas=notas, telefono="0342-155-0001", fuente="referido_medico", pais="Argentina")
    if cid:
        clinente_ids[ref] = cid
        print(f"   ✅ {nombre} (id={cid})")

# Facturas con items realistas
print("\n   Facturas:")

# Factura 1: Paciente - RMN de rodilla (pendiente)
if clinente_ids.get("PAC-002") and clinente_ids.get("Resonancia Magnética de Rodilla"):
    fac1 = sql_insert("facturas", empresa_id=12, cliente_id=clinente_ids["PAC-002"],
                      numero="DIAG-012-0001", estado="pendiente",
                      fecha_emision="2026-05-20", fecha_vencimiento="2026-06-19",
                      subtotal=38000, total=38000, notas="Turno 20/05 - Dr. López (ref)")
    if fac1:
        sql_insert("items_factura", factura_id=fac1, descripcion="Resonancia Magnética de Rodilla",
                   cantidad=1, precio_unitario=38000, subtotal=38000)
        print(f"   ✅ FACT-001: RMN Rodilla $38.000 (PAC-002)")

# Factura 2: OSPEC - múltiples estudios (pendiente - facturación mensual)
if clinente_ids.get("OS-001"):
    fac2 = sql_insert("facturas", empresa_id=12, cliente_id=clinente_ids["OS-001"],
                      numero="DIAG-012-0002", estado="pendiente",
                      fecha_emision="2026-05-15", fecha_vencimiento="2026-06-14",
                      subtotal=142000, total=142000, notas="Facturación mayo 2026 - 18 estudios")
    if fac2:
        sql_insert("items_factura", factura_id=fac2, descripcion="Ecografía Abdominal Completa",
                   cantidad=5, precio_unitario=8500, subtotal=42500)
        sql_insert("items_factura", factura_id=fac2, descripcion="Mamografía Digital Bilateral",
                   cantidad=4, precio_unitario=12000, subtotal=48000)
        sql_insert("items_factura", factura_id=fac2, descripcion="RMN de Columna",
                   cantidad=2, precio_unitario=42000, subtotal=84000)
        print(f"   ✅ FACT-002: OSPEC mensual $142.000 (18 estudios)")

# Factura 3: Jorge Fernández - deuda (vencida)
if clinente_ids.get("PAC-004"):
    fac3 = sql_insert("facturas", empresa_id=12, cliente_id=clinente_ids["PAC-004"],
                      numero="DIAG-012-0003", estado="vencida",
                      fecha_emision="2026-03-15", fecha_vencimiento="2026-04-14",
                      subtotal=85000, total=85000, notas="2 estudios impagos hace 2 meses")
    if fac3:
        sql_insert("items_factura", factura_id=fac3, descripcion="Resonancia Magnética Cerebral",
                   cantidad=1, precio_unitario=45000, subtotal=45000)
        sql_insert("items_factura", factura_id=fac3, descripcion="TC de Tórax",
                   cantidad=1, precio_unitario=28000, subtotal=28000)
        sql_insert("items_factura", factura_id=fac3, descripcion="Contraste Gadolinio",
                   cantidad=1, precio_unitario=12000, subtotal=12000)
        print(f"   ✅ FACT-003: Jorge F. VENCIDA $85.000")

# Factura 4: Swiss Medical (pagada)
if clinente_ids.get("OS-002"):
    fac4 = sql_insert("facturas", empresa_id=12, cliente_id=clinente_ids["OS-002"],
                      numero="DIAG-012-0004", estado="pagada",
                      fecha_emision="2026-04-20", fecha_vencimiento="2026-05-20",
                      subtotal=280000, total=280000, notas="Abril 2026 - 35 estudios")
    if fac4:
        sql_insert("items_factura", factura_id=fac4, descripcion="Ecografías varias",
                   cantidad=15, precio_unitario=8000, subtotal=120000)
        sql_insert("items_factura", factura_id=fac4, descripcion="RMN varias",
                   cantidad=4, precio_unitario=40000, subtotal=160000)
        print(f"   ✅ FACT-004: Swiss Medical PAGADA $280.000")

# Proveedores (insumos médicos)
print("\n   Proveedores:")
prov1 = sql_insert("proveedores", empresa_id=12, nombre="GE Healthcare Argentina",
                   contacto_nombre="Ricardo Gómez", email="ventas.ge@gehealthcare.com.ar",
                   telefono="011 5555-8801", notas="Equipos de RMN, TC, ecógrafos. Servicio técnico.", activo=True, descuento_pct=0)
prov2 = sql_insert("proveedores", empresa_id=12, nombre="Bayer Argentina",
                   contacto_nombre="Laura Fernández", email="lab.bayer@bayer.com",
                   telefono="011 5555-8802", notas="Contraste gadolinio y yodado. Insumos radiología.", activo=True, descuento_pct=5)
prov3 = sql_insert("proveedores", empresa_id=12, nombre="MedSupply Distribuciones",
                   contacto_nombre="Marta Sánchez", email="pedidos@medsupply.com.ar",
                   telefono="011 5555-8803", notas="Jeringas, agujas, guantes, papel térmico DICOM.", activo=True, descuento_pct=10)
prov4 = sql_insert("proveedores", empresa_id=12, nombre="Siemens Healthineers",
                   contacto_nombre="Andrés Martín", email="info.siemens@siemens-health.com",
                   telefono="011 5555-8804", notas="Equipos de TC multicorte. Mantenimiento preventivo.", activo=True, descuento_pct=0)
print(f"   4 proveedores médicos")

# ============================================================
#  EMPRESA 13: CentroMedicIntegral - Centro Médico Multiespecialidad
# ============================================================
print("\n" + "="*60)
print("  CENTRO MÉDICO MULTIESPECIALIDAD (id=13) - Demo comercial")
print("="*60)

# Todas las especialidades de un centro médico grande
especialidades = [
    ("Cardiología", 1), ("Traumatología", 2), ("Pediatría", 3),
    ("Dermatología", 4), ("Ginecología", 5), ("Oftalmología", 6),
    ("Otorrinolaringología", 7), ("Gastroenterología", 8), ("Neurología", 9),
    ("Urología", 10), ("Psicología", 11), ("Nutrición", 12),
    ("Clínica Médica", 13), ("Cirugía General", 14),
]

cat_dict_med = {}
for esp, orden in especialidades:
    cid = sql_insert("categorias_productos", empresa_id=13, nombre=esp, activo=True, orden=orden)
    if cid:
        cat_dict_med[esp] = cid
print(f"   14 especialidades médicas")

# Consultas médicas (servicios)
consultas = [
    # Cardiología
    ("Consulta Cardiológica", "Evaluación cardiológica completa con ECG", cat_dict_med.get("Cardiología"), 15000),
    ("Ecocardiograma", "Estudio ecocardiográfico completo", cat_dict_med.get("Cardiología"), 22000),
    ("Holter 24hs", "Monitoreo cardíaco 24 horas", cat_dict_med.get("Cardiología"), 18000),
    # Traumatología
    ("Consulta Traumatológica", "Evaluación traumatológica", cat_dict_med.get("Traumatología"), 14000),
    ("Artroscopia Diagnóstica", "Artroscopia de rodilla ambulatoria", cat_dict_med.get("Traumatología"), 85000),
    # Pediatría
    ("Consulta Pediátrica", "Control pediátrico", cat_dict_med.get("Pediatría"), 10000),
    ("Control de Niño Sano", "Chequeo completo + carnet de vacunación", cat_dict_med.get("Pediatría"), 8000),
    # Dermatología
    ("Consulta Dermatológica", "Evaluación dermatológica", cat_dict_med.get("Dermatología"), 12000),
    ("Mapeo de Lunares", "Dermatoscopia corporal completa", cat_dict_med.get("Dermatología"), 18000),
    # Ginecología
    ("Consulta Ginecológica", "Evaluación ginecológica", cat_dict_med.get("Ginecología"), 13000),
    ("Papanicolaou + Colposcopía", "Estudio de cuello uterino", cat_dict_med.get("Ginecología"), 15000),
    # Oftalmología
    ("Consulta Oftalmológica", "Evaluación visual completa", cat_dict_med.get("Oftalmología"), 11000),
    ("Campo Visual", "Perimetría computarizada", cat_dict_med.get("Oftalmología"), 8000),
    # Neurología
    ("Consulta Neurológica", "Evaluación neurológica completa", cat_dict_med.get("Neurología"), 16000),
    ("Electroencefalograma", "EEG de rutina", cat_dict_med.get("Neurología"), 20000),
    # Clínica Médica
    ("Consulta Clínica Médica", "Clínica general, control anual", cat_dict_med.get("Clínica Médica"), 9000),
    ("Check-up Empresarial", "Plan de medicina ocupacional - completo", cat_dict_med.get("Clínica Médica"), 35000),
    # Psicología
    ("Sesión Psicología", "Consulta individual - 50 minutos", cat_dict_med.get("Psicología"), 8000),
    # Nutrición
    ("Consulta Nutricional", "Evaluación + plan alimentario", cat_dict_med.get("Nutrición"), 9000),
    ("Seguimiento Nutricional", "Control mensual", cat_dict_med.get("Nutrición"), 6000),
]

for nombre, desc, cat_id, precio in consultas:
    sql_insert("productos", nombre=nombre, descripcion=desc, empresa_id=13, precio=precio,
               costo=precio*0.4, stock_actual=0, stock_minimo=0, control_stock=False,
               activo=True, categoria_id=cat_id, moneda="ARS", precio_tipo="unico",
               tipo="servicio", visible_en_catalogo=True, destacado_en_catalogo=True)
print(f"   20 servicios médicos")

# Clientes: pacientes + empresas (check-ups) + obras sociales
clientes_med = [
    ("PAC-M01", "Laura Méndez", "laura.mendez@gmail.com", "activo", 52000, "Paciente frecuente - cardiología + dermatología"),
    ("PAC-M02", "Pedro Rodríguez", "pedro.r@hotmail.com", "activo", 30000, "Check-up anual + seguimiento traumatólogo"),
    ("PAC-M03", "Valentina Torres", "vale.torres@outlook.com", "activo", 45000, "Paciente ginecología mensual"),
    ("PAC-M04", "Martín Sánchez", "martin.s@gmail.com", "moroso", 24000, "Debe 2 consultas de psicología"),
    ("EMP-M01", "Industrias del Litoral SRL", "rrhh@lindustrial.com", "activo", 450000, "Empresa - 50 empleados, check-ups anuales, convenio mensual"),
    ("EMP-M02", "Banco Nación - Sucursal Santa Fe", "bienestar@bna.com.ar", "activo", 280000, "Empresa - 30 empleados, medicina ocupacional"),
    ("EMP-M03", "Municipalidad de Santa Fe", "salud@munistafe.gob.ar", "activo", 180000, "Empresa - empleados municipales, chequeos periódicos"),
    ("OS-M01", "OSDE", "facturacion@osde.com.ar", "activo", 320000, "Obra social - 45 atenciones/mes"),
    ("OS-M02", "Galeno", "pagos@galeno.com.ar", "activo", 195000, "Obra social - convenio"),
]

cli_med_ids = {}
for ref, nombre, email, estado, valor, notas in clientes_med:
    tipo = "persona" if "PAC" in ref else "empresa"
    cid = sql_insert("clientes", nombre=nombre, email=email, empresa_id=13,
                     ciudad="Santa Fe", estado=estado, tipo=tipo, valor_total=valor,
                     notas=notas, telefono="0342-155-0010", fuente="referido", pais="Argentina")
    if cid:
        cli_med_ids[ref] = cid
        print(f"   ✅ {nombre} (id={cid})")

# Facturas
print("\n   Facturas:")
# Factura 1: Check-up Empresarial (Industrias del Litoral)
if cli_med_ids.get("EMP-M01"):
    fac5 = sql_insert("facturas", empresa_id=13, cliente_id=cli_med_ids["EMP-M01"],
                      numero="MED-013-0001", estado="pendiente",
                      fecha_emision="2026-05-18", fecha_vencimiento="2026-06-17",
                      subtotal=350000, total=350000, notas="Mayo 2026 - 10 check-ups empresariales")
    if fac5:
        sql_insert("items_factura", factura_id=fac5, descripcion="Check-up Empresarial",
                   cantidad=10, precio_unitario=35000, subtotal=350000)
        print(f"   ✅ FACT-001: Industrias del Litoral $350.000 (10 check-ups)")

# Factura 2: Paciente particular (Laura Méndez)
if cli_med_ids.get("PAC-M01"):
    fac6 = sql_insert("facturas", empresa_id=13, cliente_id=cli_med_ids["PAC-M01"],
                      numero="MED-013-0002", estado="pendiente",
                      fecha_emision="2026-05-22", fecha_vencimiento="2026-06-21",
                      subtotal=22000, total=22000, notas="Ecocardiograma - turno 22/05")
    if fac6:
        sql_insert("items_factura", factura_id=fac6, descripcion="Ecocardiograma",
                   cantidad=1, precio_unitario=22000, subtotal=22000)
        print(f"   ✅ FACT-002: Laura Méndez $22.000 (ecocardiograma)")

# Factura 3: Martín Sánchez (vencida - deuda)
if cli_med_ids.get("PAC-M04"):
    fac7 = sql_insert("facturas", empresa_id=13, cliente_id=cli_med_ids["PAC-M04"],
                      numero="MED-013-0003", estado="vencida",
                      fecha_emision="2026-03-20", fecha_vencimiento="2026-04-19",
                      subtotal=16000, total=16000, notas="2 sesiones de psicología impagas")
    if fac7:
        sql_insert("items_factura", factura_id=fac7, descripcion="Sesión Psicología",
                   cantidad=2, precio_unitario=8000, subtotal=16000)
        print(f"   ✅ FACT-003: Martín S. VENCIDA $16.000 (2 sesiones)")

# Factura 4: OSDE (pagada)
if cli_med_ids.get("OS-M01"):
    fac8 = sql_insert("facturas", empresa_id=13, cliente_id=cli_med_ids["OS-M01"],
                      numero="MED-013-0004", estado="pagada",
                      fecha_emision="2026-04-15", fecha_vencimiento="2026-05-15",
                      subtotal=320000, total=320000, notas="Abril 2026 - 45 atenciones")
    if fac8:
        sql_insert("items_factura", factura_id=fac8, descripcion="Consultas varias OSDE",
                   cantidad=45, precio_unitario=7111, subtotal=320000)
        print(f"   ✅ FACT-004: OSDE PAGADA $320.000")

# Proveedores médicos
print("\n   Proveedores:")
sql_insert("proveedores", empresa_id=13, nombre="Laboratorios Bago",
           contacto_nombre="María Torres", email="ventas@bago.com.ar",
           telefono="011 5555-9901", notas="Medicamentos para consultorio", activo=True, descuento_pct=8)
sql_insert("proveedores", empresa_id=13, nombre="Medicorp Insumos",
           contacto_nombre="Juan Pérez", email="info@medicorp.com.ar",
           telefono="011 5555-9902", notas="Insumos médicos: gasas, guantes, alcohol, etc.", activo=True, descuento_pct=12)
sql_insert("proveedores", empresa_id=13, nombre="Philips Healthcare",
           contacto_nombre="Ricardo Díaz", email="argentina.sales@philips.com",
           telefono="011 5555-9903", notas="Equipos: ecógrafos, electrocardiógrafos. Servicio técnico.", activo=True, descuento_pct=0)
print(f"   3 proveedores médicos")


# ============================================================
#  EMPRESA 14: AsistenciaLogística SA - Logística de Seguros
# ============================================================
print("\n" + "="*60)
print("  ASISTENCIA LOGÍSTICA DE SEGUROS (id=14) - Demo comercial")
print("="*60)

# Categorías de servicios
categorias_log = [
    ("Auxilios Mecánicos", 1), ("Servicio de Grúas", 2), ("Gestión de Siniestros", 3),
    ("Asistencia en Ruta", 4), ("Logística de Repuestos", 5), ("Talleres Afiliados", 6),
    ("Coordinación de Reparaciones", 7), ("Pericias y Tasaciones", 8),
]

cat_dict_log = {}
for nombre, orden in categorias_log:
    cid = sql_insert("categorias_productos", empresa_id=14, nombre=nombre, activo=True, orden=orden)
    if cid:
        cat_dict_log[nombre] = cid
print(f"   8 categorías de servicios logísticos")

# Servicios
servicios_log = [
    ("Auxilio Mecánico Urbano", "Asistencia mecánica dentro de radio urbano", cat_dict_log.get("Auxilios Mecánicos"), 15000),
    ("Auxilio Mecánico Interurbano", "Asistencia mecánica fuera de radio urbano", cat_dict_log.get("Auxilios Mecánicos"), 25000),
    ("Envío de Combustible", "Repostaje de emergencia", cat_dict_log.get("Auxilios Mecánicos"), 8000),
    ("Cambio de Neumático", "Cambio en ruta", cat_dict_log.get("Auxilios Mecánicos"), 10000),
    ("Paso de Corriente", "Jump start en ruta", cat_dict_log.get("Auxilios Mecánicos"), 6000),
    ("Grúa hasta 50km", "Remolque hasta 50 kilómetros", cat_dict_log.get("Servicio de Grúas"), 35000),
    ("Grúa hasta 100km", "Remolque hasta 100 kilómetros", cat_dict_log.get("Servicio de Grúas"), 65000),
    ("Grúa hasta 200km", "Remolque hasta 200 kilómetros", cat_dict_log.get("Servicio de Grúas"), 110000),
    ("Grúa Nacional (cualquier distancia)", "Remolque a cualquier punto del país", cat_dict_log.get("Servicio de Grúas"), 180000),
    ("Gestión de Siniestro Simple", "Trámite de reclamo ante aseguradora", cat_dict_log.get("Gestión de Siniestros"), 25000),
    ("Gestión de Siniestro Complejo", "Coordinación completa con perito, taller, repuestos", cat_dict_log.get("Gestión de Siniestros"), 85000),
    ("Coord. Reparación Integral", "Gestión completa de reparación del vehículo", cat_dict_log.get("Coordinación de Reparaciones"), 120000),
    ("Pericia de Daños", "Evaluación tasación de daños vehiculares", cat_dict_log.get("Pericias y Tasaciones"), 20000),
    ("Logística de Repuestos", "Búsqueda y envío de repuestos a taller", cat_dict_log.get("Logística de Repuestos"), 15000),
    ("Asistencia Legal", "Asesoramiento legal post-siniestro", cat_dict_log.get("Gestión de Siniestros"), 30000),
]

for nombre, desc, cat_id, precio in servicios_log:
    sql_insert("productos", nombre=nombre, descripcion=desc, empresa_id=14, precio=precio,
               costo=precio*0.5, stock_actual=0, stock_minimo=0, control_stock=False,
               activo=True, categoria_id=cat_id, moneda="ARS", precio_tipo="unico",
               tipo="servicio", visible_en_catalogo=False, destacado_en_catalogo=True)
print(f"   15 servicios de asistencia logística")

# Clientes: aseguradoras grandes (B2B clave)
clientes_log = [
    ("ASEG-01", "Sancor Seguros", "operaciones@sancor.com", "activo", 850000, "Aseguradora - principal cliente. Auxilios, grúas, gestión siniestros."),
    ("ASEG-02", "Mapfre Argentina", "asistencia@mapfre.com.ar", "activo", 620000, "Aseguradora - servicios de grúa y asistencia en ruta"),
    ("ASEG-03", "San Cristóbal Seguros", "clientes@sanristobal.com", "activo", 450000, "Aseguradora - siniestros + pericias + gestión"),
    ("ASEG-04", "Allianz Seguros", "asistencia@allianz.com.ar", "activo", 380000, "Aseguradora - asistencia en ruta y grúas"),
    ("ASEG-05", "La Caja Seguros", "siniestros@lacaja.com.ar", "activo", 290000, "Aseguradora - gestión de siniestros integrales"),
    ("ASEG-06", "Federación Patronal", "auxilio@fedpatronal.com.ar", "activo", 180000, "Aseguradora - auxilios mecánicos y grúas"),
    ("TALL-01", "Taller Mecánico El Rápido (Rosario)", "info@elrapido-rosario.com", "activo", 95000, "Taller afiliado - recibe derivaciones de siniestros"),
    ("TALL-02", "Carroz Santa Fe S.A.", "admin@carrozsantafe.com", "activo", 145000, "Taller afiliado - reparaciones integrales desde hace 3 años"),
    ("TALL-03", "Talleres del Sur (CABA)", "contacto@talleressur.com", "activo", 78000, "Taller afiliado - zona sur CABA"),
    ("EMP-LOG", "Transportes Roca SRL", "admin@transroca.com", "moroso", 52000, "Empresa cliente directo - 5 grúas para su flota"),
]

cli_log_ids = {}
for ref, nombre, email, estado, valor, notas in clientes_log:
    tipo = "empresa"
    cid = sql_insert("clientes", nombre=nombre, email=email, empresa_id=14,
                     ciudad="Santa Fe", estado=estado, tipo=tipo, valor_total=valor,
                     notas=notas, telefono="011-5555-0001", fuente="contacto_comercial", pais="Argentina")
    if cid:
        cli_log_ids[ref] = cid
        print(f"   ✅ {nombre} (id={cid})")

# Facturas B2B grandes
print("\n   Facturas:")
# Factura 1: Sancor (pendiente mensual)
if cli_log_ids.get("ASEG-01"):
    fac9 = sql_insert("facturas", empresa_id=14, cliente_id=cli_log_ids["ASEG-01"],
                      numero="LOG-014-0001", estado="pendiente",
                      fecha_emision="2026-05-20", fecha_vencimiento="2026-06-19",
                      subtotal=485000, total=485000, notas="Mayo 2026 - Sancor: 28 auxilios + 15 grúas + 8 siniestros")
    if fac9:
        sql_insert("items_factura", factura_id=fac9, descripcion="Auxilios Mecánicos Urbanos",
                   cantidad=28, precio_unitario=15000, subtotal=420000)
        sql_insert("items_factura", factura_id=fac9, descripcion="Grúa hasta 50km",
                   cantidad=8, precio_unitario=35000, subtotal=280000)
        sql_insert("items_factura", factura_id=fac9, descripcion="Gestión Siniestro Simple",
                   cantidad=5, precio_unitario=25000, subtotal=125000)
        sql_insert("items_factura", factura_id=fac9, descripcion="Pericia de Daños",
                   cantidad=3, precio_unitario=20000, subtotal=60000)
        print(f"   ✅ FACT-001: Sancor $485.000 (54 servicios)")

# Factura 2: Mapfre (pendiente)
if cli_log_ids.get("ASEG-02"):
    fac10 = sql_insert("facturas", empresa_id=14, cliente_id=cli_log_ids["ASEG-02"],
                       numero="LOG-014-0002", estado="pendiente",
                       fecha_emision="2026-05-15", fecha_vencimiento="2026-06-14",
                       subtotal=320000, total=320000, notas="Mapfre: 20 grúas + 5 gestiones")
    if fac10:
        sql_insert("items_factura", factura_id=fac10, descripcion="Grúa hasta 100km",
                   cantidad=12, precio_unitario=65000, subtotal=780000)
        sql_insert("items_factura", factura_id=fac10, descripcion="Gestión Siniestro Complejo",
                   cantidad=5, precio_unitario=85000, subtotal=425000)
        print(f"   ✅ FACT-002: Mapfre $320.000 (25 servicios)")

# Factura 3: San Cristóbal (vencida)
if cli_log_ids.get("ASEG-03"):
    fac11 = sql_insert("facturas", empresa_id=14, cliente_id=cli_log_ids["ASEG-03"],
                       numero="LOG-014-0003", estado="vencida",
                       fecha_emision="2026-03-25", fecha_vencimiento="2026-04-24",
                       subtotal=180000, total=180000, notas="Deuda pendiente de regularización")
    if fac11:
        sql_insert("items_factura", factura_id=fac11, descripcion="Grúa hasta 200km",
                   cantidad=3, precio_unitario=110000, subtotal=330000)
        sql_insert("items_factura", factura_id=fac11, descripcion="Coord. Reparación Integral",
                   cantidad=2, precio_unitario=120000, subtotal=240000)
        print(f"   ✅ FACT-003: San Cristóbal VENCIDA $180.000")

# Factura 4: Transportes Roca (moroso)
if cli_log_ids.get("EMP-LOG"):
    fac12 = sql_insert("facturas", empresa_id=14, cliente_id=cli_log_ids["EMP-LOG"],
                       numero="LOG-014-0004", estado="vencida",
                       fecha_emision="2026-02-15", fecha_vencimiento="2026-03-17",
                       subtotal=52000, total=52000, notas="Flota - 3 grúas impagas hace 2 meses")
    if fac12:
        sql_insert("items_factura", factura_id=fac12, descripcion="Grúa hasta 50km",
                   cantidad=3, precio_unitario=35000, subtotal=105000)
        print(f"   ✅ FACT-004: Trans. Roca VENCIDA $52.000")

# Factura 5: Allianz (pagada)
if cli_log_ids.get("ASEG-04"):
    fac13 = sql_insert("facturas", empresa_id=14, cliente_id=cli_log_ids["ASEG-04"],
                       numero="LOG-014-0005", estado="pagada",
                       fecha_emision="2026-04-20", fecha_vencimiento="2026-05-20",
                       subtotal=380000, total=380000, notas="Abril 2026 - 30 servicios")
    if fac13:
        sql_insert("items_factura", factura_id=fac13, descripcion="Auxilios Mecánicos",
                   cantidad=15, precio_unitario=15000, subtotal=225000)
        sql_insert("items_factura", factura_id=fac13, descripcion="Grúa hasta 100km",
                   cantidad=5, precio_unitario=65000, subtotal=325000)
        sql_insert("items_factura", factura_id=fac13, descripcion="Pericia de Daños",
                   cantidad=2, precio_unitario=20000, subtotal=40000)
        print(f"   ✅ FACT-005: Allianz PAGADA $380.000")

# Proveedores logísticos
print("\n   Proveedores:")
sql_insert("proveedores", empresa_id=14, nombre="Autopartes Gigena",
           contacto_nombre="Carlos Gigena", email="ventas@gigena.com.ar",
           telefono="0342 455-6677", notas="Repuestos automotrices - todas las marcas", activo=True, descuento_pct=10)
sql_insert("proveedores", empresa_id=14, nombre="Red Grúas del Litoral",
           contacto_nombre="Miguel Torres", email="admin@redgruas.com.ar",
           telefono="0342 455-7788", notas="Subcontratación de grúas en zona litoral", activo=True, descuento_pct=15)
sql_insert("proveedores", empresa_id=14, nombre="FlotTrack GPS",
           contacto_nombre="Luciana Gómez", email="info@flottrackgps.com",
           telefono="011 5555-3344", notas="Sistema GPS para seguimiento de grúas", activo=True, descuento_pct=0)
print(f"   3 proveedores logísticos")

# ============================================================
#  RESUMEN FINAL
# ============================================================
print("\n" + "="*60)
print("  RESUMEN SEED COMPLETO")
print("="*60)

for emp_id, nombre in [(9, "Pizzeria Don Pepe"), (10, "Tienda La Esquina"), 
                        (11, "Barbería Don Carlos"), (12, "DiagCentro Santa Fe"),
                        (13, "CentroMedicIntegral"), (14, "AsistenciaLogística SA")]:
    result = sql(f"SELECT \n"
                 f"  (SELECT count(*) FROM setubalai.clientes WHERE empresa_id={emp_id}) as cli,\n"
                 f"  (SELECT count(*) FROM setubalai.productos WHERE empresa_id={emp_id}) as prods,\n"
                 f"  (SELECT count(*) FROM setubalai.facturas WHERE empresa_id={emp_id}) as facts,\n"
                 f"  (SELECT count(*) FROM setubalai.proveedores WHERE empresa_id={emp_id}) as provs,\n"
                 f"  (SELECT count(*) FROM setubalai.categorias_productos WHERE empresa_id={emp_id}) as cats")
    print(f"  [{emp_id}] {nombre}: {result.replace(chr(10), ' ')}")

print("\n  ✅ Seed estratégico completado!")