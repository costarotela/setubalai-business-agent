-- ============================================================
-- SetubalAI Business Agent - Schema PostgreSQL
-- Version: 1.0.0 | Fecha: 2026-05-21
-- ============================================================

-- Crear base de datos (ejecutar como superuser)
-- CREATE DATABASE business OWNER paperclip;

-- ============================================================
-- SCHEMA: setubalai (primer cliente / tenant)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS setubalai;
SET search_path TO setubalai;

-- ============================================================
-- TABLA: empresa (configuracion del negocio del cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS empresa (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(200) NOT NULL,
    rubro           VARCHAR(100),
    email           VARCHAR(200),
    telefono        VARCHAR(50),
    direccion       TEXT,
    moneda          VARCHAR(10) DEFAULT 'USD',
    zona_horaria    VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    logo_url        VARCHAR(500),
    configuracion   JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: usuarios (dueños y empleados de la empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    nombre          VARCHAR(200) NOT NULL,
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(200),
    rol             VARCHAR(20) DEFAULT 'operador' CHECK (rol IN ('admin','operador','readonly')),
    telegram_id     VARCHAR(50),
    activo          BOOLEAN DEFAULT TRUE,
    ultimo_acceso   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: clientes (CRM - base de clientes del negocio)
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    nombre          VARCHAR(200) NOT NULL,
    empresa_nombre  VARCHAR(200),
    email           VARCHAR(200),
    telefono        VARCHAR(50),
    direccion       TEXT,
    ciudad          VARCHAR(100),
    pais            VARCHAR(100) DEFAULT 'Argentina',
    estado          VARCHAR(20) DEFAULT 'prospecto'
                    CHECK (estado IN ('prospecto','activo','inactivo','moroso','bloqueado')),
    tipo            VARCHAR(20) DEFAULT 'persona'
                    CHECK (tipo IN ('persona','empresa')),
    valor_total     DECIMAL(15,2) DEFAULT 0,
    etiquetas       TEXT[],
    notas           TEXT,
    fuente          VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: contactos (contactos de clientes empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS contactos (
    id              SERIAL PRIMARY KEY,
    cliente_id      INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    nombre          VARCHAR(200) NOT NULL,
    cargo           VARCHAR(100),
    email           VARCHAR(200),
    telefono        VARCHAR(50),
    es_principal    BOOLEAN DEFAULT FALSE,
    notas           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: categorias_productos (para organizar catálogo)
-- ============================================================
CREATE TABLE IF NOT EXISTS categorias_productos (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    nombre          VARCHAR(100) NOT NULL,
    descripcion     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: productos (catálogo dual: productos físicos y servicios)
-- ============================================================
CREATE TABLE IF NOT EXISTS productos (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    categoria_id    INTEGER REFERENCES categorias_productos(id),
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(20) DEFAULT 'servicio'
                    CHECK (tipo IN ('producto','servicio','digital')),
    precio          DECIMAL(15,2) NOT NULL DEFAULT 0,
    precio_tipo     VARCHAR(20) DEFAULT 'unico'
                    CHECK (precio_tipo IN ('unico','mensual','anual','por_hora')),
    moneda          VARCHAR(10) DEFAULT 'USD',
    stock_actual    INTEGER DEFAULT 0,
    stock_minimo    INTEGER DEFAULT 0,
    control_stock   BOOLEAN DEFAULT FALSE,
    activo          BOOLEAN DEFAULT TRUE,
    codigo          VARCHAR(100),
    imagen_url      VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: proveedores
-- ============================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    nombre          VARCHAR(200) NOT NULL,
    contacto_nombre VARCHAR(200),
    email           VARCHAR(200),
    telefono        VARCHAR(50),
    direccion       TEXT,
    cuit            VARCHAR(50),
    condiciones_pago TEXT,
    notas           TEXT,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: facturas (cobros a clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS facturas (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    cliente_id      INTEGER REFERENCES clientes(id),
    numero          VARCHAR(50),
    estado          VARCHAR(20) DEFAULT 'pendiente'
                    CHECK (estado IN ('borrador','enviada','pendiente','pagada','vencida','cancelada')),
    fecha_emision   DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    fecha_pago      DATE,
    subtotal        DECIMAL(15,2) DEFAULT 0,
    descuento       DECIMAL(15,2) DEFAULT 0,
    impuestos       DECIMAL(15,2) DEFAULT 0,
    total           DECIMAL(15,2) DEFAULT 0,
    moneda          VARCHAR(10) DEFAULT 'USD',
    notas           TEXT,
    metodo_pago     VARCHAR(50),
    created_by      INTEGER REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: items_factura (líneas de cada factura)
-- ============================================================
CREATE TABLE IF NOT EXISTS items_factura (
    id              SERIAL PRIMARY KEY,
    factura_id      INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id     INTEGER REFERENCES productos(id),
    descripcion     VARCHAR(500) NOT NULL,
    cantidad        DECIMAL(10,2) DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL,
    descuento       DECIMAL(15,2) DEFAULT 0,
    subtotal        DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: ordenes_compra (compras a proveedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    proveedor_id    INTEGER REFERENCES proveedores(id),
    numero          VARCHAR(50),
    estado          VARCHAR(20) DEFAULT 'pendiente'
                    CHECK (estado IN ('borrador','enviada','pendiente','recibida','cancelada')),
    fecha_orden     DATE DEFAULT CURRENT_DATE,
    fecha_esperada  DATE,
    fecha_recepcion DATE,
    total           DECIMAL(15,2) DEFAULT 0,
    moneda          VARCHAR(10) DEFAULT 'USD',
    notas           TEXT,
    created_by      INTEGER REFERENCES usuarios(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: items_orden_compra
-- ============================================================
CREATE TABLE IF NOT EXISTS items_orden_compra (
    id              SERIAL PRIMARY KEY,
    orden_id        INTEGER REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id     INTEGER REFERENCES productos(id),
    descripcion     VARCHAR(500) NOT NULL,
    cantidad        DECIMAL(10,2) DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL,
    subtotal        DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: tickets (atención al cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    cliente_id      INTEGER REFERENCES clientes(id),
    asignado_a      INTEGER REFERENCES usuarios(id),
    titulo          VARCHAR(500) NOT NULL,
    descripcion     TEXT,
    estado          VARCHAR(20) DEFAULT 'abierto'
                    CHECK (estado IN ('abierto','en_proceso','esperando','resuelto','cerrado')),
    prioridad       VARCHAR(20) DEFAULT 'media'
                    CHECK (prioridad IN ('baja','media','alta','urgente')),
    canal           VARCHAR(50) DEFAULT 'telegram',
    resolucion      TEXT,
    tiempo_resolucion INTEGER, -- minutos
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    resuelto_at     TIMESTAMPTZ
);

-- ============================================================
-- TABLA: comentarios_ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS comentarios_ticket (
    id              SERIAL PRIMARY KEY,
    ticket_id       INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id      INTEGER REFERENCES usuarios(id),
    comentario      TEXT NOT NULL,
    es_interno      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: interacciones (historial de cada cliente)
-- ============================================================
CREATE TABLE IF NOT EXISTS interacciones (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    cliente_id      INTEGER REFERENCES clientes(id),
    usuario_id      INTEGER REFERENCES usuarios(id),
    tipo            VARCHAR(50) CHECK (tipo IN ('llamada','email','reunion','telegram','nota','venta','cobro','ticket')),
    descripcion     TEXT NOT NULL,
    fecha           TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_log (trazabilidad de acciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    usuario_id      INTEGER REFERENCES usuarios(id),
    tabla           VARCHAR(100) NOT NULL,
    registro_id     INTEGER,
    accion          VARCHAR(20) CHECK (accion IN ('crear','editar','eliminar','ver')),
    datos_antes     JSONB,
    datos_despues   JSONB,
    ip              VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: notificaciones_programadas (cron de recordatorios)
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones_programadas (
    id              SERIAL PRIMARY KEY,
    empresa_id      INTEGER REFERENCES empresa(id) ON DELETE CASCADE,
    tipo            VARCHAR(50) CHECK (tipo IN ('recordatorio_cobro','vencimiento_stock','reporte_semanal','custom')),
    referencia_tabla VARCHAR(100),
    referencia_id   INTEGER,
    mensaje         TEXT NOT NULL,
    canal           VARCHAR(20) DEFAULT 'telegram',
    programado_para TIMESTAMPTZ NOT NULL,
    enviado         BOOLEAN DEFAULT FALSE,
    enviado_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_empresa ON facturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_vencimiento ON facturas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_empresa ON audit_log(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notif_programado ON notificaciones_programadas(programado_para) WHERE enviado = FALSE;

-- ============================================================
-- DATOS INICIALES: SetubalAI como primer cliente
-- ============================================================
INSERT INTO empresa (nombre, rubro, email, moneda, zona_horaria, configuracion)
VALUES (
    'SetubalAI',
    'Agencia de Inteligencia Artificial',
    'pcostarotela@gmail.com',
    'USD',
    'America/Argentina/Buenos_Aires',
    '{"telegram_bot": "@SetubalCEObot", "idioma": "es", "formato_fecha": "DD/MM/YYYY"}'
) ON CONFLICT DO NOTHING;

-- Usuario admin
INSERT INTO usuarios (empresa_id, nombre, email, rol, telegram_id)
SELECT id, 'Pablo Costarotela', 'pcostarotela@gmail.com', 'admin', '6968003886'
FROM empresa WHERE nombre = 'SetubalAI'
ON CONFLICT (email) DO NOTHING;

-- Categorias de productos
INSERT INTO categorias_productos (empresa_id, nombre, descripcion)
SELECT id, 'Agentes AI', 'Servicios de agentes inteligentes' FROM empresa WHERE nombre = 'SetubalAI'
ON CONFLICT DO NOTHING;

INSERT INTO categorias_productos (empresa_id, nombre, descripcion)
SELECT id, 'Templates', 'Plantillas y herramientas digitales' FROM empresa WHERE nombre = 'SetubalAI'
ON CONFLICT DO NOTHING;

INSERT INTO categorias_productos (empresa_id, nombre, descripcion)
SELECT id, 'Consultoría', 'Servicios de consultoría en AI' FROM empresa WHERE nombre = 'SetubalAI'
ON CONFLICT DO NOTHING;

-- Productos/servicios de SetubalAI
INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock)
SELECT e.id, c.id, 'Agente AI Starter', 'Agente empresarial básico: CRM + Cobros + Telegram', 'servicio', 99.00, 'mensual', FALSE
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Agentes AI'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock)
SELECT e.id, c.id, 'Agente AI Business', 'Agente empresarial completo: CRM + Cobros + Web App + Reportes', 'servicio', 249.00, 'mensual', FALSE
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Agentes AI'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock)
SELECT e.id, c.id, 'Agente AI Enterprise', 'Agente empresarial premium con personalización total', 'servicio', 499.00, 'mensual', FALSE
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Agentes AI'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock)
SELECT e.id, c.id, 'Setup e Instalación', 'Instalación y configuración inicial del agente', 'servicio', 300.00, 'unico', FALSE
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Agentes AI'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock)
SELECT e.id, c.id, 'Consultoría AI (hora)', 'Servicio de consultoría estratégica en inteligencia artificial', 'servicio', 80.00, 'por_hora', FALSE
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Consultoría'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock, stock_actual)
SELECT e.id, c.id, 'Template CRM', 'Plantilla CRM lista para usar', 'digital', 50.00, 'unico', FALSE, 999
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Templates'
ON CONFLICT DO NOTHING;

INSERT INTO productos (empresa_id, categoria_id, nombre, descripcion, tipo, precio, precio_tipo, control_stock, stock_actual)
SELECT e.id, c.id, 'Pack Templates', 'Pack completo de templates (CRM + Reportes + Automatizaciones)', 'digital', 99.00, 'unico', FALSE, 999
FROM empresa e, categorias_productos c WHERE e.nombre = 'SetubalAI' AND c.nombre = 'Templates'
ON CONFLICT DO NOTHING;
