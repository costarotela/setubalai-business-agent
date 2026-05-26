# 🧠 ANÁLISIS ULTRA-PROFUNDO: FLEXIBILIDAD PARA EMPRESAS DE SERVICIOS

**Autor:** Hermes Agent (SetubalAI)  
**Fecha:** 25 Mayo 2026  
**Contexto:** Opción C — Análisis de flexibilidad para múltiples rubros de servicios

---

## 🎯 OBJETIVO

Diseñar un **esquema de base de datos VERDADERAMENTE FLEXIBLE** que permita al **Agente IA operar empresas de servicios** con lógicas de negocio radicalmente diferentes:

1. **DiagCentro Santa Fe** (Diagnóstico por Imágenes)
2. **CentroMedicIntegral** (Centro Médico Multiespecialidad)
3. **AsistenciaLogística SA** (Coordinación de Grúas + Seguros)

---

## 📋 CASO REAL: DIAGCENTRO SANTA FE (mensaje WhatsApp Mayo 2026)

```
Hola buen dia, su turno para todos los estudios está reservado:

📅 Fecha: viernes 17.04.26
🕒 Hora: 16.30hs
📍 Sede: JUNIN 2474

🚨 Documentación a traer el día de tu turno 🚨

🪪 DNI (requisito esencial)
📄 Fotocopia del DNI
📑 Pedido médico original
💳 11 (ecografia) y 4 (radiografia) Bonos asistenciales (físicos o digitales)
   Los obtenidos por homebanking tienen 72 horas de validez
📚 Estudios previos relacionados
💵 $2500 en efectivo para abonar el estampillado

⚠️ Importante: Si no traes toda la documentación, 
   deberás dejar un depósito del valor total del estudio.

📍Debe asistir 20 minutos antes de tu turno⏰
```

### 🔍 LO QUE REVELA ESTE MENSAJE:

| **CONCEPTO** | **DATO CRÍTICO** | **¿ESTÁ EN EL ESQUEMA ACTUAL?** |
|--------------|------------------|----------------------------------|
| **Sede física** | Junín 2474 | ❌ NO (empresa tiene 1 dirección, pero ¿y si tiene 3 sedes?) |
| **Documentación requerida previa** | DNI, pedido médico, bonos, estudios previos | ❌ NO |
| **Validez temporal de docs** | Bonos homebanking válidos 72hs | ❌ NO |
| **Costos adicionales** | $2,500 estampillado (NO es el costo del estudio) | ❌ NO |
| **Depósito condicional** | Si falta doc → depósito = valor total | ❌ NO |
| **Portal de resultados** | URL donde paciente descarga PDFs | ❌ NO |
| **Estudios previos** | Historial médico del paciente | ❌ NO |
| **Tiempo pre-turno** | Llegar 20min antes | ❌ NO |

---

## 🏥 ANÁLISIS RUBRO 1: DIAGNÓSTICO POR IMÁGENES

### **Flujo Operativo Real:**

```
1. Cliente solicita turno (por WhatsApp/web/teléfono)
2. Secretaria verifica:
   - Disponibilidad de EQUIPO (Resonador 1 ocupado? → ofrecer Sede 2)
   - Disponibilidad de TÉCNICO especializado
   - Tipo de estudio → duración → bloqueo de agenda
3. Confirma turno + envía mensaje con requisitos
4. Cliente debe traer documentación específica
5. DÍA DEL TURNO:
   - Cliente llega 20min antes
   - Administrativo verifica documentación
   - Si falta algo → deposito equivalente al costo total
   - Paga estampillado ($2,500 en efectivo)
6. Técnico realiza estudio
7. Médico especialista redacta informe
8. Estudio + informe se suben al PORTAL DEL PACIENTE
9. Cliente recibe notificación (WhatsApp/email)
10. Facturación:
    - Si es particular → factura directa
    - Si es obra social → factura mensual consolidada
```

### **Entidades Críticas Faltantes:**

#### 1. **SEDES (sucursales físicas)**
```sql
CREATE TABLE sedes (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100),           -- "Sede Junín 2474"
  direccion TEXT,
  ciudad VARCHAR(100),
  telefono VARCHAR(50),
  horario_atencion JSONB,        -- {"lunes": "8-20", "sabados": "8-13"}
  activa BOOLEAN DEFAULT true
);
```

#### 2. **EQUIPOS MÉDICOS**
```sql
CREATE TABLE equipos_medicos (
  id SERIAL PRIMARY KEY,
  sede_id INT NOT NULL,
  nombre VARCHAR(100),           -- "Resonador Magnético 1"
  tipo VARCHAR(50),              -- "RMN", "Tomógrafo", "Ecógrafo"
  marca_modelo VARCHAR(100),
  requiere_mantenimiento BOOLEAN,
  proximo_mantenimiento DATE,
  estado VARCHAR(20)             -- "disponible", "mantenimiento", "fuera_servicio"
);
```

#### 3. **REQUISITOS DE SERVICIO (documentación)**
```sql
CREATE TABLE requisitos_servicio (
  id SERIAL PRIMARY KEY,
  producto_id INT NOT NULL,      -- Ej: RMN Cerebral
  tipo_requisito VARCHAR(50),    -- "documento", "pago_previo", "ayuno", "preparacion"
  descripcion TEXT,              -- "DNI original y fotocopia"
  obligatorio BOOLEAN,
  validez_horas INT,             -- Para bonos homebanking: 72hs
  penalidad_falta TEXT           -- "Depósito equivalente al valor total"
);
```

#### 4. **PORTAL DE RESULTADOS**
```sql
CREATE TABLE portal_resultados (
  id SERIAL PRIMARY KEY,
  turno_id INT NOT NULL,
  paciente_id INT NOT NULL,
  url_acceso VARCHAR(500),       -- https://portal.diagcentro.com.ar/paciente/12345
  token_acceso VARCHAR(100),     -- Token único para acceso
  fecha_disponible TIMESTAMP,
  notificado BOOLEAN DEFAULT false
);
```

#### 5. **ARCHIVOS ADJUNTOS (estudios, informes)**
```sql
CREATE TABLE archivos_estudio (
  id SERIAL PRIMARY KEY,
  estudio_realizado_id INT NOT NULL,
  tipo VARCHAR(50),              -- "imagenes_dicom", "informe_pdf", "cd_grabado"
  archivo_url TEXT,
  nombre_archivo VARCHAR(200),
  tamano_mb NUMERIC(10,2),
  fecha_subida TIMESTAMP DEFAULT NOW()
);
```

#### 6. **HISTORIAL MÉDICO PACIENTE**
```sql
CREATE TABLE historial_estudios (
  id SERIAL PRIMARY KEY,
  paciente_id INT NOT NULL,
  tipo_estudio VARCHAR(100),
  fecha_realizacion DATE,
  diagnostico_resumido TEXT,
  adjunto_url TEXT,
  relevante_para JSONB          -- ["columna", "rodilla"] → para sugerir traer al próximo turno
);
```

---

## 🏥 ANÁLISIS RUBRO 2: CENTRO MÉDICO MULTIESPECIALIDAD

### **Diferencias Clave vs. Diagnóstico por Imágenes:**

| **CONCEPTO** | **DIAGCENTRO** | **CENTRO MÉDICO** |
|--------------|----------------|-------------------|
| **Profesionales** | Técnicos + 1 médico informante | 14 especialidades (cardiólogo, traumatólogo, pediatra, etc.) |
| **Turnos** | 1 turno = 1 estudio | 1 turno = 1 consulta médica |
| **Duración variable** | Fija por estudio (RMN = 45min) | Variable por especialidad (pediatría 15min, cirugía 30min) |
| **Equipos** | Resonadores, tomógrafos | Consultorio + equipamiento básico |
| **Resultados** | PDF + imágenes DICOM | Receta médica + indicaciones + pedidos estudios |
| **Facturación** | Por estudio realizado | Por consulta médica |
| **Obras sociales** | Mensual consolidado | Por acto médico (módulos/coseguros) |

### **Entidades Adicionales Necesarias:**

#### 1. **CONSULTORIOS (espacios físicos)**
```sql
CREATE TABLE consultorios (
  id SERIAL PRIMARY KEY,
  sede_id INT NOT NULL,
  numero VARCHAR(20),            -- "Consultorio 3B"
  tipo VARCHAR(50),              -- "general", "quirofano_menor", "ecografia"
  equipamiento JSONB,            -- {"camilla": true, "ecocardio": true}
  activo BOOLEAN DEFAULT true
);
```

#### 2. **DISPONIBILIDAD PROFESIONALES (agenda semanal)**
```sql
CREATE TABLE disponibilidad_profesionales (
  id SERIAL PRIMARY KEY,
  profesional_id INT NOT NULL,
  dia_semana INT,                -- 1=lunes, 7=domingo
  hora_inicio TIME,
  hora_fin TIME,
  consultorio_id INT,
  activo BOOLEAN DEFAULT true,
  
  UNIQUE(profesional_id, dia_semana, hora_inicio)
);
```

#### 3. **RECETAS Y PRESCRIPCIONES**
```sql
CREATE TABLE recetas (
  id SERIAL PRIMARY KEY,
  turno_id INT NOT NULL,         -- Consulta que generó la receta
  profesional_id INT NOT NULL,
  paciente_id INT NOT NULL,
  medicamentos JSONB,            -- [{"nombre": "Ibuprofeno 600mg", "dosis": "1 cada 8hs", "dias": 5}]
  indicaciones TEXT,
  valida_hasta DATE,
  archivo_pdf_url TEXT
);
```

#### 4. **PEDIDOS DE ESTUDIOS COMPLEMENTARIOS**
```sql
CREATE TABLE pedidos_estudios (
  id SERIAL PRIMARY KEY,
  turno_id INT NOT NULL,
  profesional_id INT NOT NULL,
  tipo_estudio VARCHAR(100),     -- "Radiografía de rodilla", "Laboratorio completo"
  urgente BOOLEAN DEFAULT false,
  indicaciones TEXT,
  realizado BOOLEAN DEFAULT false,
  resultado_url TEXT
);
```

---

## 🚛 ANÁLISIS RUBRO 3: ASISTENCIA LOGÍSTICA (Seguros)

### **Diferencias Clave vs. Rubros Médicos:**

| **CONCEPTO** | **MÉDICOS** | **LOGÍSTICA SEGUROS** |
|--------------|-------------|------------------------|
| **"Cliente"** | Paciente que necesita atención | Aseguradora que necesita coordinar auxilio |
| **"Turno"** | Agenda fija de consultorio | Evento impredecible (siniestro) |
| **"Profesional"** | Médico con especialidad | Chofer de grúa / Perito / Gestor |
| **"Resultado"** | Informe médico | Acta de pericia + fotos + informe daños |
| **Urgencia** | Puede esperar días | Inmediata (auto varado en ruta) |
| **Ubicación** | Sede fija | Cualquier punto geográfico |
| **Facturación** | Por acto médico | Por servicio logístico (km recorridos, horas, tipo grúa) |

### **Flujo Operativo Real:**

```
1. ASEGURADORA llama: "Tengo un auto varado en Ruta 33 km 142"
2. OPERADOR registra:
   - Aseguradora solicitante
   - Datos del asegurado
   - Ubicación GPS
   - Tipo de vehículo
   - Tipo de servicio (auxilio mecánico / grúa corta / grúa larga)
3. SISTEMA asigna:
   - Grúa disponible más cercana
   - Chofer con disponibilidad
4. CHOFER recibe orden de servicio en app móvil:
   - Datos asegurado
   - Ubicación origen
   - Destino (taller autorizado más cercano)
5. Grúa llega → CHOFER actualiza estado "en curso"
6. Grúa finaliza traslado → CHOFER sube:
   - Fotos del vehículo
   - Km recorridos
   - Firma del asegurado
7. SISTEMA genera:
   - Acta de servicio
   - Orden de facturación (precio según km + tipo grúa)
8. FACTURACIÓN MENSUAL a aseguradora (consolidado de todos los servicios)
```

### **Entidades Críticas:**

#### 1. **ÓRDENES DE SERVICIO (reemplaza "turnos")**
```sql
CREATE TABLE ordenes_servicio (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT NOT NULL,       -- Aseguradora (Sancor, Mapfre)
  asegurado_nombre VARCHAR(200), -- Persona que tuvo el siniestro
  asegurado_telefono VARCHAR(50),
  poliza_numero VARCHAR(100),
  
  tipo_servicio VARCHAR(100),    -- "Grúa 100km", "Auxilio mecánico", "Pericia"
  
  ubicacion_origen JSONB,        -- {"lat": -32.123, "lon": -60.456, "direccion": "Ruta 33 km 142"}
  ubicacion_destino JSONB,
  
  estado VARCHAR(50),            -- "pendiente", "asignado", "en_curso", "completado", "cancelado"
  urgencia VARCHAR(20),          -- "baja", "media", "alta", "critica"
  
  profesional_asignado_id INT,   -- Chofer de grúa
  vehiculo_asignado_id INT,      -- Grúa 3 (placa ABC123)
  
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_asignacion TIMESTAMP,
  fecha_inicio TIMESTAMP,
  fecha_finalizacion TIMESTAMP,
  
  observaciones TEXT,
  costo_calculado NUMERIC(15,2),
  km_recorridos NUMERIC(8,2),
  
  facturado BOOLEAN DEFAULT false
);
```

#### 2. **VEHÍCULOS (grúas, móviles)**
```sql
CREATE TABLE vehiculos (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  tipo VARCHAR(50),              -- "grua_corta", "grua_larga", "auxilio"
  marca_modelo VARCHAR(100),
  patente VARCHAR(20),
  capacidad_toneladas NUMERIC(5,2),
  estado VARCHAR(20),            -- "disponible", "en_servicio", "mantenimiento"
  ubicacion_actual JSONB,        -- GPS en tiempo real
  ultimo_update TIMESTAMP
);
```

#### 3. **EVIDENCIAS (fotos, firmas)**
```sql
CREATE TABLE evidencias_servicio (
  id SERIAL PRIMARY KEY,
  orden_servicio_id INT NOT NULL,
  tipo VARCHAR(50),              -- "foto_vehiculo", "foto_danos", "firma_asegurado", "acta_pdf"
  archivo_url TEXT,
  descripcion TEXT,
  fecha_subida TIMESTAMP DEFAULT NOW()
);
```

#### 4. **TARIFARIO DINÁMICO**
```sql
CREATE TABLE tarifas_servicios (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  cliente_id INT,                -- NULL = tarifa general, si tiene cliente = tarifa especial
  tipo_servicio VARCHAR(100),
  precio_base NUMERIC(15,2),
  precio_por_km NUMERIC(10,2),   -- Para grúas
  precio_por_hora NUMERIC(10,2), -- Para pericias
  moneda VARCHAR(10),
  vigente_desde DATE,
  vigente_hasta DATE
);
```

---

## 🧠 CONCLUSIÓN: ESQUEMA UNIVERSAL FLEXIBLE

### **PROBLEMA CENTRAL:**

**No existe un esquema único que sirva para todos los rubros.**

- **DiagCentro:** Necesita equipos médicos + requisitos documentales + portal de resultados
- **CentroMédico:** Necesita consultorios + agenda profesionales + recetas médicas
- **AsistenciaLogística:** Necesita GPS + vehículos + evidencias fotográficas + tarifario por km

### **SOLUCIÓN PROPUESTA: ARQUITECTURA EN 3 CAPAS**

```
CAPA 1: NÚCLEO UNIVERSAL (para TODAS las empresas)
├── empresas
├── usuarios
├── clientes
├── profesionales           ← NUEVO (médicos, técnicos, choferes)
├── productos/servicios     ← EXTENDIDA (con campos condicionales)
└── facturas

CAPA 2: MÓDULOS ESPECIALIZADOS POR RUBRO
├── MÓDULO_SALUD:
│   ├── sedes
│   ├── equipos_medicos
│   ├── turnos_medicos
│   ├── requisitos_servicio
│   ├── estudios_realizados
│   ├── archivos_estudio
│   ├── portal_resultados
│   ├── consultorios
│   ├── recetas
│   └── pedidos_estudios
│
├── MÓDULO_LOGÍSTICA:
│   ├── ordenes_servicio
│   ├── vehiculos
│   ├── evidencias_servicio
│   └── tarifas_servicios
│
└── MÓDULO_EDUCACIÓN (futuro):
    ├── cursos
    ├── inscripciones
    ├── asistencias
    └── calificaciones

CAPA 3: CONFIGURACIÓN FLEXIBLE
├── empresa_config
│   ├── empresa_id
│   ├── modulos_activos     ← ["salud", "logística"]
│   └── campos_personalizados (JSONB)
```

### **TABLA CLAVE: `empresa_config`**

```sql
CREATE TABLE empresa_config (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL UNIQUE,
  rubro VARCHAR(100),
  
  -- Módulos activados
  modulo_salud BOOLEAN DEFAULT false,
  modulo_logistica BOOLEAN DEFAULT false,
  modulo_educacion BOOLEAN DEFAULT false,
  
  -- Configuraciones específicas (JSONB flexible)
  config_salud JSONB,           -- {"requiere_portal": true, "multisede": true}
  config_logistica JSONB,       -- {"gps_tracking": true, "evidencias_obligatorias": ["foto", "firma"]}
  
  -- Campos personalizados del cliente
  campos_custom JSONB,          -- Lo que el cliente necesite que no esté en el core
  
  -- Interfaz personalizada
  ui_custom JSONB               -- {"color_primario": "#1e40af", "logo_url": "..."}
);
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **FASE 1: NÚCLEO UNIVERSAL (1 semana)**
✅ Extender `productos` con campos servicios  
✅ Crear `profesionales`  
✅ Crear `empresa_config`

### **FASE 2: MÓDULO SALUD (2 semanas)**
- Implementar 10 tablas del módulo salud
- Migrar DiagCentro + CentroMédico a nuevo esquema
- Frontend: UI específica para turnos médicos

### **FASE 3: MÓDULO LOGÍSTICA (2 semanas)**
- Implementar 4 tablas del módulo logística
- Migrar AsistenciaLogística SA
- Frontend: UI para órdenes de servicio + GPS

### **FASE 4: AGENTE IA MULTI-RUBRO (1 semana)**
- Entrenar agente para detectar tipo de empresa
- Skills especializados por módulo
- Comandos naturales contextuales:
  - "Agendar turno" → si módulo_salud
  - "Asignar grúa" → si módulo_logistica

---

## 💡 CAPACIDADES DEL AGENTE POR MÓDULO

### **MÓDULO SALUD:**
```
Usuario: "Quiero agendar una RMN de columna para el jueves"

Agente:
1. Consulta disponibilidad equipos (resonador libre jueves 10-12hs)
2. Consulta disponibilidad técnico (Dr. López disponible)
3. Crea turno
4. Envía mensaje WhatsApp con requisitos:
   - DNI original + fotocopia
   - 11 bonos asistenciales
   - Llegar 20min antes
   - $2,500 para estampillado
5. Agrega recordatorio 24hs antes
```

### **MÓDULO LOGÍSTICA:**
```
Usuario: "Auto varado en Ruta 9 km 215, necesito grúa"

Agente:
1. Registra orden_servicio (ubicación GPS)
2. Consulta vehiculos disponibles más cercanos
3. Asigna Grúa 2 (a 15km, tiempo estimado 18min)
4. Notifica al chofer (app móvil)
5. Envía WhatsApp al asegurado:
   - Grúa en camino
   - Chofer: Juan Pérez
   - Patente: ABC123
   - Llegada estimada: 18min
6. Genera orden de servicio PDF
```

---

## 🚨 ADVERTENCIA CRÍTICA

**SIN este esquema flexible:**
- ❌ DiagCentro no puede operar (falta agenda + equipos + portal)
- ❌ AsistenciaLogística no puede operar (falta GPS + vehículos + evidencias)
- ❌ El agente IA queda limitado a "listar precios" como un catálogo muerto

**CON este esquema:**
- ✅ El agente OPERA la empresa (agenda, asigna, coordina, factura)
- ✅ Cada cliente ve una interfaz adaptada a SU negocio
- ✅ SetubalAI puede vender a CUALQUIER rubro de servicios

---

## 📊 PRÓXIMOS PASOS SUGERIDOS

1. **Validar este análisis** contigo, Pablo
2. **Priorizar:** ¿Empezamos con Módulo Salud o Logística?
3. **Generar diagramas HTML interactivos** de:
   - Flujo DiagCentro (turno → estudio → portal)
   - Flujo AsistenciaLogística (siniestro → grúa → evidencias)
4. **Escribir el SQL completo** del esquema flexible
5. **Migrar datos demo** a nueva estructura

**¿Seguimos?**
