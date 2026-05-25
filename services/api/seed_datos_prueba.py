"""
Seed script: datos de prueba realistas por empresa
Cada empresa tiene: clientes, categorias, productos/servicios, proveedores, facturas
Datos coherentes con el rubro de cada empresa.

Uso: cd /home/admin/setubalai-agente/services/api && ./venv/bin/python3 seed_datos_prueba.py
"""
import random
from datetime import date, timedelta
from database import SessionLocal, engine
from sqlalchemy import text

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
        print(f"  ERROR en {table}: {e}")
        print(f"  SQL: {sql[:200]}")
        return None

def rnd_date(far=60, near=5):
    """Random date between far and near days ago (far > near)."""
    return date.today() - timedelta(days=random.randint(near, far))

def fut_date(max_days=30):
    """Future date."""
    return date.today() + timedelta(days=random.randint(7, max_days))

def seed_9():
    """Pizzeria Don Pepe"""
    print("\n=== Pizzeria Don Pepe (id=9) ===")
    
    cat_pizzas = ins("categorias_productos", empresa_id=9, nombre="Pizzas", orden=1, activo=True)
    cat_empanadas = ins("categorias_productos", empresa_id=9, nombre="Empanadas", orden=2, activo=True)
    cat_bebidas = ins("categorias_productos", empresa_id=9, nombre="Bebidas", orden=3, activo=True)
    cat_postres = ins("categorias_productos", empresa_id=9, nombre="Postres", orden=4, activo=True)
    
    prods = [
        ("Pizza Muzzarella Grande", "Masa casera, salsa de tomate, muzzarella", cat_pizzas, 4500, 1800, 50, 10, "PIZ-MUZ"),
        ("Pizza Napolitana Grande", "Muzzarella, tomate, ajo, aceitunas verdes", cat_pizzas, 5200, 2100, 30, 5, "PIZ-NAP"),
        ("Pizza Fugazza Grande", "Cebolla caramelizada, muzzarella, oregano", cat_pizzas, 4800, 1900, 25, 5, "PIZ-FUG"),
        ("Pizza Cuatro Quesos", "Muzzarella, Roquefort, Parmesano, Provolone", cat_pizzas, 5800, 2500, 20, 5, "PIZ-4Q"),
        ("Empanadas de Carne (docena)", "Carne cortada a cuchillo, cebolla, huevo", cat_empanadas, 6000, 2400, 40, 10, "EMP-CAR"),
        ("Empanadas J y Q (docena)", "Jamon cocido, muzzarella", cat_empanadas, 5500, 2200, 30, 10, "EMP-JQ"),
        ("Coca-Cola 1.5L", "Botella Coca-Cola original", cat_bebidas, 2200, 1200, 100, 20, "BEB-COC"),
        ("Cerveza Quilmes 1L", "Cerveza Quilmes rubia", cat_bebidas, 1800, 900, 80, 15, "BEB-QUI"),
        ("Agua mineral 500ml", "Agua mineral sin gas", cat_bebidas, 800, 350, 200, 40, "BEB-AGU"),
        ("Flan casero", "Flan de huevo con d.de leche", cat_postres, 2500, 900, 15, 5, "POS-FLA"),
        ("Tiramisu", "Tiramisu clasico con mascarpone", cat_postres, 3200, 1300, 10, 3, "POS-TIR"),
    ]
    for nombre, desc, cat_id, precio, costo, stock, stock_min, cod in prods:
        ins("productos", nombre=nombre, descripcion=desc, empresa_id=9, precio=precio,
            costo=costo, stock_actual=stock, stock_minimo=stock_min, control_stock=True,
            activo=True, categoria_id=cat_id, codigo=cod, moneda="USD", precio_tipo="unico",
            tipo="producto", visible_en_catalogo=True, destacado_en_catalogo=True)
    
    ins("proveedores", empresa_id=9, nombre="Distribuidora El Molino", contacto_nombre="Roberto Diaz",
        email="pedidos@elmolino.com", telefono="+54 9 11 5555-8801", cuit="30-70889912-5",
        notas="Harinas, levadura, insumos basicos", activo=True, descuento_pct=5)
    ins("proveedores", empresa_id=9, nombre="Lacteos del Sur", contacto_nombre="Maria Gonzalez",
        email="ventas@lacteosdelsur.com", telefono="+54 9 11 5555-8802", cuit="30-70334455-8",
        notas="Muzzarella, crema, queso", activo=True, descuento_pct=8)
    
    clis = [
        ("Familia Rodriguez", "familiarodriguez@gmail.com", "activo", 45000, "persona", "Clientes habituales, piden los viernes"),
        ("Oficina Martinez SRL", "admin@oficinamartinez.com", "activo", 120000, "empresa", "Almuerzo semanal - 20 personas"),
        ("Torres Construcciones", "pedidos@torresconst.com", "moroso", 95000, "empresa", "Deben 3 facturas desde hace 2 meses"),
        ("Clinica San Jose", "cafeteria@clinicasanjose.com", "activo", 180000, "empresa", "Catering diario 50 personas"),
    ]
    cli_ids = []
    for nombre, email, estado, valor, tipo, notas in clis:
        cid = ins("clientes", nombre=nombre, email=email, empresa_id=9, ciudad="Buenos Aires",
                  estado=estado, tipo=tipo, valor_total=valor, notas=notas,
                  telefono="+54 9 11 4455-0011", fuente="referido", pais="Argentina")
        cli_ids.append(cid)
    
    # Facturas
    if cli_ids[0]:
        f = ins("facturas", empresa_id=9, cliente_id=cli_ids[0], numero="FAC-009-0001",
                estado="pendiente", fecha_emision=rnd_date(10, 2), fecha_vencimiento=fut_date(25),
                subtotal=18200, total=18200, notas="Pedido viernes")
        ins("items_factura", factura_id=f, descripcion="Pizza Muzzarella Grande x2", cantidad=2, precio_unitario=4500, subtotal=9000.0)
        ins("items_factura", factura_id=f, descripcion="Coca-Cola 1.5L x4", cantidad=4, precio_unitario=2200, subtotal=8800.0)
    
    if cli_ids[3]:
        f = ins("facturas", empresa_id=9, cliente_id=cli_ids[3], numero="FAC-009-0002",
                estado="pendiente", fecha_emision=rnd_date(15, 3), fecha_vencimiento=fut_date(15),
                subtotal=180000, total=180000, notas="Catering mensual mayo 2026")
        ins("items_factura", factura_id=f, descripcion="Pizza Muzzarella Grande x10", cantidad=10, precio_unitario=4500, subtotal=45000.0)
        ins("items_factura", factura_id=f, descripcion="Empanadas de Carne (docena) x5", cantidad=5, precio_unitario=6000, subtotal=30000.0)
    
    if cli_ids[2]:
        ins("facturas", empresa_id=9, cliente_id=cli_ids[2], numero="FAC-009-0003",
            estado="vencida", fecha_emision=date.today() - timedelta(days=45),
            fecha_vencimiento=date.today() - timedelta(days=15),
            subtotal=95000, total=95000, notas="3 facturas vencidas sin pagar")
    
    f = ins("facturas", empresa_id=9, cliente_id=cli_ids[1], numero="FAC-009-0004",
            estado="pagada", fecha_emision=rnd_date(40, 25),
            fecha_vencimiento=date.today() - timedelta(days=5),
            subtotal=52000, total=52000, notas="Almuerzo semanal")
    ins("items_factura", factura_id=f, descripcion="Pizza Napolitana x5", cantidad=5, precio_unitario=5200, subtotal=26000.0)
    ins("items_factura", factura_id=f, descripcion="Cerveza Quilmes 1L x10", cantidad=10, precio_unitario=1800, subtotal=18000.0)
    
    print("  OK")

def seed_10():
    """Tienda La Esquina"""
    print("\n=== Tienda La Esquina (id=10) ===")
    
    cat_alimentos = ins("categorias_productos", empresa_id=10, nombre="Alimentos", orden=1, activo=True)
    cat_limpieza = ins("categorias_productos", empresa_id=10, nombre="Limpieza", orden=2, activo=True)
    cat_bebidas = ins("categorias_productos", empresa_id=10, nombre="Bebidas", orden=3, activo=True)
    cat_bazar = ins("categorias_productos", empresa_id=10, nombre="Bazar", orden=4, activo=True)
    
    prods = [
        ("Arroz Gallo Oro 1kg", "Arroz largo fino", cat_alimentos, 1.80, 1.20, 40, 10),
        ("Fideos Lucchetti 500g", "Mostachol", cat_alimentos, 1.20, 0.80, 35, 8),
        ("Aceite Natura 1.5L", "Aceite de girasol", cat_alimentos, 2.80, 1.90, 20, 5),
        ("Leche Serenisima 1L", "Leche entera pasteurizada", cat_alimentos, 0.95, 0.65, 30, 10),
        ("Lavandina Ayudin 2.5L", "", cat_limpieza, 1.50, 0.90, 25, 5),
        ("Coca-Cola 2.25L", "", cat_bebidas, 2.40, 1.50, 60, 12),
        ("Agua Villavicencio 1.5L", "", cat_bebidas, 0.70, 0.35, 100, 20),
        ("Papel higienico x4", "", cat_bazar, 1.60, 1.00, 45, 10),
    ]
    for nombre, desc, cat_id, precio, costo, stock, stock_min in prods:
        ins("productos", nombre=nombre, descripcion=desc, empresa_id=10, precio=precio,
            costo=costo, stock_actual=stock, stock_minimo=stock_min, control_stock=True,
            activo=True, categoria_id=cat_id, moneda="EUR", precio_tipo="unico",
            tipo="producto", visible_en_catalogo=True, destacado_en_catalogo=True)
    
    ins("proveedores", empresa_id=10, nombre="Distribuidora Norte SRL", contacto_nombre="Miguel Herrera",
        email="pedidos@distnorte.com", telefono="+34 600 112 233", cuit="B12345678",
        notas="Alimentos secos, bebidas", activo=True, descuento_pct=10)
    
    clis = [
        ("Ana Beltran", "ana.b@gmail.es", "activo", 120.50, "persona", "Vecina del barrio"),
        ("Restaurante El Rincon", "admin@elrincon.es", "activo", 890.00, "empresa", "Compra semanal al por mayor"),
        ("Bar La Terraza", "info@laterraza.es", "moroso", 450.00, "empresa", "Facturas pendientes"),
        ("Elena Vazquez", "elena.v@gmail.com", "prospecto", 0, "persona", "Pregunto por delivery"),
    ]
    cli_ids = []
    for nombre, email, estado, valor, tipo, notas in clis:
        cid = ins("clientes", nombre=nombre, email=email, empresa_id=10, ciudad="Madrid",
                  estado=estado, tipo=tipo, valor_total=valor, notas=notas,
                  telefono="+34 611 223 344", fuente="referido", pais="Espana")
        cli_ids.append(cid)
    
    if cli_ids[1]:
        f = ins("facturas", empresa_id=10, cliente_id=cli_ids[1], numero="FAC-010-0001",
                estado="pendiente", fecha_emision=rnd_date(10, 2), fecha_vencimiento=fut_date(25),
                subtotal=890.00, total=890.00, notas="Pedido semanal")
    
    if cli_ids[2]:
        ins("facturas", empresa_id=10, cliente_id=cli_ids[2], numero="FAC-010-0002",
            estado="vencida", fecha_emision=date.today() - timedelta(days=40),
            fecha_vencimiento=date.today() - timedelta(days=10),
            subtotal=450.00, total=450.00, notas="Factura atrasada")
    
    print("  OK")

def seed_11():
    """Barberia Don Carlos"""
    print("\n=== Barberia Don Carlos (id=11) ===")
    
    cat_cortes = ins("categorias_productos", empresa_id=11, nombre="Cortes", orden=1, activo=True)
    cat_arreglos = ins("categorias_productos", empresa_id=11, nombre="Arreglos", orden=2, activo=True)
    cat_productos = ins("categorias_productos", empresa_id=11, nombre="Productos", orden=3, activo=True)
    
    prods = [
        ("Corte Clasico", "Corte de pelo masculino", cat_cortes, 1200, "servicio"),
        ("Corte + Barba", "Corte clasico + arreglo de barba", cat_cortes, 1800, "servicio"),
        ("Degradado (Fade)", "Fade con navaja", cat_cortes, 1500, "servicio"),
        ("Arreglo de Barba", "Perfilado y recorte de barba", cat_arreglos, 800, "servicio"),
        ("Afeitado Clasico", "Navaja + toalla caliente", cat_arreglos, 1000, "servicio"),
        ("Cera para Peinar", "Cera mate 100ml", cat_productos, 1500, "producto"),
        ("Pomada Vintage", "Pomada brillo 120ml", cat_productos, 1800, "producto"),
        ("Aceite para Barba", "Aceite natural 30ml", cat_productos, 1200, "producto"),
    ]
    for nombre, desc, cat_id, precio, tipo in prods:
        stock = 0 if tipo == "servicio" else random.randint(10, 30)
        cost = 0 if tipo == "servicio" else precio * 0.5
        ins("productos", nombre=nombre, descripcion=desc, empresa_id=11, precio=precio,
            costo=cost, stock_actual=stock, stock_minimo=5, control_stock=(tipo=="producto"),
            activo=True, categoria_id=cat_id, moneda="USD", precio_tipo="unico",
            tipo=tipo, visible_en_catalogo=True, destacado_en_catalogo=True)
    
    ins("proveedores", empresa_id=11, nombre="Merkapa Distribuciones", contacto_nombre="Diego Ruiz",
        email="ventas@merkapa.com", telefono="+54 9 11 5566-7788", cuit="30-74445566-2",
        notas="Productos capilares", activo=True, descuento_pct=15)
    
    clis = [
        ("Martin Suarez", "martin.suarez@gmail.com", "activo", 36000, "persona", "Viene cada 2 semanas"),
        ("Ramiro Gomez", "ramiro.gomez@outlook.com", "activo", 14400, "persona", "Fan del fade"),
        ("Diego Aguilar", "diego.aguilar@yahoo.com", "activo", 21600, "persona", "Va todos los jueves"),
        ("Gabriel Torres", "gabri.torres@hotmail.com", "moroso", 5000, "persona", "Debe un corte"),
        ("Nicolas Paredes", "nico.paredes@gmail.com", "activo", 48000, "persona", "VIP - corte semanal"),
    ]
    cli_ids = []
    for nombre, email, estado, valor, tipo, notas in clis:
        cid = ins("clientes", nombre=nombre, email=email, empresa_id=11, ciudad="Buenos Aires",
                  estado=estado, tipo=tipo, valor_total=valor, notas=notas,
                  telefono="+54 9 11 4466-1122", fuente="referido", pais="Argentina")
        cli_ids.append(cid)
    
    if cli_ids[4]:
        ins("facturas", empresa_id=11, cliente_id=cli_ids[4], numero="FAC-011-0001",
            estado="pendiente", fecha_emision=rnd_date(5, 1), fecha_vencimiento=fut_date(27),
            subtotal=1800, total=1800, notas="Corte semanal")
    
    if cli_ids[3]:
        ins("facturas", empresa_id=11, cliente_id=cli_ids[3], numero="FAC-011-0002",
            estado="vencida", fecha_emision=date.today() - timedelta(days=30),
            fecha_vencimiento=date.today() - timedelta(days=15),
            subtotal=5000, total=5000, notas="Corte sin pagar")
    
    print("  OK")

# ── Main ──
print("SEEDING DATOS DE PRUEBA")
seed_9()
seed_10()
seed_11()

print("\n" + "="*50)
print("RESUMEN FINAL")
print("="*50)
for emp_id, name in [(9, "Pizzeria Don Pepe"), (10, "Tienda La Esquina"), (11, "Barberia Don Carlos")]:
    c = db.execute(text(f"SELECT count(*) FROM setubalai.clientes WHERE empresa_id={emp_id}")).scalar()
    p = db.execute(text(f"SELECT count(*) FROM setubalai.productos WHERE empresa_id={emp_id}")).scalar()
    pr = db.execute(text(f"SELECT count(*) FROM setubalai.proveedores WHERE empresa_id={emp_id}")).scalar()
    cat = db.execute(text(f"SELECT count(*) FROM setubalai.categorias_productos WHERE empresa_id={emp_id}")).scalar()
    f = db.execute(text(f"SELECT count(*) FROM setubalai.facturas WHERE empresa_id={emp_id}")).scalar()
    print(f"  {name}: {c} clientes, {p} productos, {pr} proveedores, {cat} cat, {f} facturas")

db.close()
print("Done")
