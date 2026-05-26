# Análisis Técnico: Logística de Seguros (Empresas de Asistencia Vehicular)

⚠️ **ESTADO: RELEVAMIENTO INICIAL - NADA IMPLEMENTADO** ⚠️

Este documento es parte del **análisis y relevamiento** para el futuro módulo de servicios del agente SetubalAI.  
**NO hay código implementado, NO hay tablas creadas, NO hay endpoints funcionando.**  
Todo lo descrito aquí es **propuesta de diseño** pendiente de aprobación e implementación.

---

**Fecha:** 2026-05-26  
**Vertical Analizado:** Logística de Seguros (Asistencia Vehicular)  
**Cliente Objetivo:** Empresas de logística que prestan servicios de grúas/auxilio mecánico a aseguradoras  
**Ejemplo Real:** Assist North (CABA/GBA, +40 unidades, contratos con múltiples aseguradoras)

---

## RESUMEN EJECUTIVO

### ¿Qué es este vertical?

**Empresa de Logística de Seguros** = PYME que opera flota de grúas/auxilio mecánico con contratos B2B con múltiples aseguradoras.

**Flujo:**
```
Asegurado (Juan, La Caja Seguros) → WhatsApp → Empresa Logística → Despacho Grúa → Servicio → Facturación a La Caja
```

### ¿Quién es el cliente de SetubalAI?

✅ **LA EMPRESA DE LOGÍSTICA** (Assist North, grueros, etc.)  
❌ NO la aseguradora  
❌ NO el asegurado final

### ¿Qué vende SetubalAI?

**Hermes Agent instalado EN la empresa de logística** para automatizar:
1. Atención 24/7 via WhatsApp (sin operadores humanos)
2. Verificación instantánea de pólizas
3. Despacho automático de unidades más cercanas
4. Tracking en tiempo real para asegurados
5. Registro automático de servicios
6. Facturación consolidada por aseguradora

### Pain Points del Cliente

| Problema Actual | Solución con Hermes |
|-----------------|---------------------|
| 3 operadores 24/7 = $3M/mes | WhatsApp automatizado = $0 |
| Verificación manual póliza = 5-10 min | BD local = instantáneo |
| Despacho manual de unidades | Automático por GPS + disponibilidad |
| Facturación Excel = errores | Generación automática PDF |
| Sin tracking en tiempo real | Link público con mapa Google Maps |

### ROI

**Inversión:** $5k-$10k USD setup + $300-$800 USD/mes  
**Ahorro:** $4.5M ARS/mes (operadores + eficiencia + errores)  
**Recupero:** 3-6 meses

---

## 1. EL NEGOCIO: EMPRESA DE LOGÍSTICA DE SEGUROS

### 1.1 ¿Qué es una Empresa de Logística de Seguros?

**Definición:**  
Empresa que brinda servicios de **auxilio mecánico, grúas y asistencia vehicular** a asegurados de múltiples compañías de seguros mediante contratos B2B.

**Ejemplo real: Assist North (CABA/GBA)**
- Flota propia: +40 unidades (grúas livianas, semipesadas, pesadas, auxilio mecánico)
- Cobertura: CABA + Gran Buenos Aires
- Contratos con: múltiples aseguradoras (La Caja, Rivadavia, San Cristóbal, etc.)
- Operación: 24/7, 365 días al año
- Tiempo promedio de respuesta: 60-90 minutos

---

### 1.2 Modelo de Negocio

**Contratos B2B con Aseguradoras:**
```
Aseguradora (La Caja Seguros)
   │
   ├─ Contrato de Prestación de Servicios
   │
   └──→ Empresa de Logística (Assist North) ← CLIENTE DE SETUBALAI
          │
          ├─ Recibe llamadas/WhatsApp de asegurados
          ├─ Verifica cobertura de póliza
          ├─ Despacha unidad (grúa, auxilio, gomero)
          ├─ Realiza el servicio
          └─ Factura mensualmente a la aseguradora
```

**Servicios que presta:**
- ✅ Grúa / Remolque (siniestros + averías mecánicas)
- ✅ Cambio de neumático / gomería móvil
- ✅ Auxilio de batería (puente, reemplazo)
- ✅ Abastecimiento de combustible
- ✅ Mecánica ligera en ruta
- ✅ Apertura de cerraduras
- ✅ Extracción vehicular (4x4, encajados)

**Facturación:**
- Por servicio realizado (cada grúa, cada cambio de neumático)
- Consolidado mensual por aseguradora
- Cada aseguradora tiene tarifas/condiciones distintas

---

### 1.3 Pain Points del Negocio (¿Por qué necesitan Hermes?)

**Problema 1: Volumen de Llamadas**
- 50-200 llamadas/día de asegurados con emergencias
- Operadores humanos contestan 24/7
- Mucha información repetitiva: "¿Dónde estás? ¿Qué te pasó? ¿Qué seguro tenés?"

**Problema 2: Verificación de Pólizas**
- Cada aseguradora tiene su propio sistema
- Operador debe llamar/consultar portal de la aseguradora
- Demora 5-10 minutos por consulta
- Riesgo de enviar grúa a alguien sin cobertura

**Problema 3: Despacho de Unidades**
- Operador debe decidir: ¿qué grúa mandar? ¿liviana, pesada?
- ¿Qué chofer está más cerca?
- ¿Cuánto tarda en llegar?
- Comunicación por radio/WhatsApp manual

**Problema 4: Facturación Compleja**
- Cada servicio debe registrarse con: fecha, hora, patente, tipo servicio, aseguradora
- Fin de mes: consolidar servicios por aseguradora
- Errores en facturación = pérdida de dinero

**Problema 5: Tracking para Asegurados**
- Asegurado pregunta: "¿Cuánto falta?"
- Operador debe llamar al chofer para preguntar
- No hay visibilidad en tiempo real

---

### 1.4 Rol de SetubalAI en Este Ecosistema

**SetubalAI vende Hermes Agent INSTALADO en la empresa de logística.**

```
┌─────────────────────────────────────────────────────┐
│  EMPRESA DE LOGÍSTICA (Cliente de SetubalAI)       │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  HERMES AGENT (instalado por SetubalAI)   │    │
│  │                                            │    │
│  │  • Atiende WhatsApp/llamadas de asegurados│    │
│  │  • Verifica pólizas automáticamente       │    │
│  │  • Despacha unidad más cercana            │    │
│  │  • Envía tracking en tiempo real          │    │
│  │  • Registra servicio para facturación     │    │
│  │  • Genera factura mensual por aseguradora │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  Flota: 40+ unidades                               │
│  Operadores: reducidos de 8 a 2 (automatización)   │
│  Contratos: 10+ aseguradoras                       │
└─────────────────────────────────────────────────────┘
           ↑                              ↑
           │                              │
    Asegurados                      Aseguradoras
    (usuarios finales)              (contratos B2B)
```

**Lo que automatiza Hermes:**
1. ✅ Atención 24/7 via WhatsApp (sin operadores humanos)
2. ✅ Verificación instantánea de pólizas
3. ✅ Despacho inteligente de unidades
4. ✅ Tracking en tiempo real para asegurados
5. ✅ Registro automático de servicios
6. ✅ Facturación consolidada por aseguradora

---

## 2. FLUJO OPERATIVO COMPLETO (CON HERMES)

### 2.1 Caso Real: Asegurado Necesita Grúa

**Situación:** Juan Pérez (asegurado de La Caja Seguros) tiene un pinchazo en Av. Corrientes 3500, CABA.

#### **SIN Hermes (Operación Manual):**
```
1. Juan llama al call center de Assist North: "+54 11 5555-1234"
2. Operador humano contesta (si hay líneas libres, sino espera)
3. Operador pregunta: "¿Dónde estás? ¿Qué te pasó? ¿Qué seguro tenés?"
4. Juan responde: "Av. Corrientes 3500, pinchazo, La Caja Seguros"
5. Operador busca en sistema: ¿La Caja tiene contrato con nosotros?
6. Operador llama/consulta portal de La Caja: ¿Juan tiene cobertura?
   → Espera 5-10 minutos
7. Confirma cobertura → Operador asigna grúa manualmente
8. Operador llama por radio al chofer: "Andá a Corrientes 3500"
9. Juan pregunta: "¿Cuánto falta?" → Operador llama al chofer
10. Servicio se completa → Operador registra en planilla Excel
11. Fin de mes → Alguien consolida Excel y factura a La Caja

Tiempo total: 15-20 minutos desde llamada hasta grúa en camino
Personal necesario: 2-3 operadores 24/7
```

#### **CON Hermes (Automatizado):**
```
1. Juan escribe por WhatsApp al +54 9 11 5555-1234 de Assist North:
   "Me quedé sin batería en Av. Corrientes 3500"

2. Hermes Agent responde instantáneamente:
   "Hola Juan, identifico que sos asegurado de La Caja Seguros.
    Póliza 12345-ABC válida hasta 31/12/2026.
    Cobertura: ✅ Grúa incluida.
    
    Confirmo: ¿Necesitás grúa por problema de batería en Av. Corrientes 3500, CABA?"

3. Juan: "Sí"

4. Hermes Agent (automático):
   ✅ Valida póliza en base de datos local (instantáneo)
   ✅ Crea orden de servicio #12345
   ✅ Consulta unidades disponibles cercanas
   ✅ Asigna Grúa #7 (chofer: Carlos, 5km de distancia)
   ✅ Notifica a Carlos por WhatsApp: "Servicio #12345 - Av. Corrientes 3500 - Batería"
   ✅ Envía a Juan link de tracking: "Tu grúa llega en 35 min [link en tiempo real]"

5. Carlos (chofer) recibe notificación y actualiza estado via WhatsApp:
   "Salgo" → Hermes actualiza tracking automáticamente

6. Juan hace click en link y ve mapa con ubicación de la grúa en tiempo real

7. Carlos actualiza: "Llegué" → Juan recibe notificación

8. Carlos actualiza: "Servicio completado - Cambio de batería"
   → Hermes registra automáticamente en BD:
      - Fecha: 2026-05-26 15:30
      - Servicio: Auxilio batería
      - Aseguradora: La Caja Seguros
      - Patente: ABC123
      - Precio: $15.000 (tarifa contrato La Caja)

9. Fin de mes: Hermes genera automáticamente factura consolidada para La Caja
   → PDF con detalle de todos los servicios del mes

Tiempo total: 2-3 minutos desde mensaje hasta grúa asignada
Personal necesario: 0 operadores (solo choferes)
```

---

### 2.2 Actores del Sistema

#### A) Asegurado (Usuario Final)
- **Rol:** Persona con vehículo asegurado que necesita asistencia
- **Interacción:** WhatsApp con Assist North
- **Qué hace:**
  - Solicita servicio describiendo problema
  - Recibe link de tracking
  - Califica el servicio (opcional)

#### B) Empresa de Logística (Cliente de SetubalAI)
**Ejemplo:** Assist North
- **Tiene instalado:** Hermes Agent
- **Flota:** 40+ unidades (grúas, auxilio mecánico)
- **Contratos:** 10+ aseguradoras
- **Dashboard:** Panel web para supervisar operaciones

#### C) Chofer/Operario
- **Rol:** Conduce grúa o presta servicio mecánico
- **Interacción:** WhatsApp con Hermes Agent
- **Qué hace:**
  - Recibe notificación de servicio asignado
  - Actualiza estado (salgo, llegué, completado)
  - Reporta novedades (cliente ausente, cambio de ubicación)

#### D) Aseguradora (Contraparte B2B)
**Ejemplo:** La Caja Seguros
- **Rol:** Paga los servicios prestados a sus asegurados
- **Interacción:** Recibe factura mensual
- **Qué hace:**
  - Envía lista de pólizas activas a Assist North (actualización mensual)
  - Recibe factura consolidada fin de mes
  - Paga según contrato

#### E) Admin de Assist North
- **Rol:** Dueño/gerente de la empresa de logística
- **Interacción:** Dashboard web + WhatsApp con Hermes
- **Qué hace:**
  - Supervisa operaciones en tiempo real
  - Gestiona flota (alta/baja de unidades)
  - Gestiona contratos con aseguradoras
  - Revisa métricas (tiempos, facturación, calificaciones)
  - Interviene en casos excepcionales

---

## 3. SERVICIOS DEL RUBRO

### 3.1 Tipos de Asistencia Vehicular

| Servicio | Descripción | Equipamiento Necesario |
|----------|-------------|------------------------|
| **Grúa / Remolque** | Traslado de vehículo a taller o domicilio | Grúa liviana, semipesada o pesada |
| **Cambio de neumático** | Instalación de auxilio o reparación in-situ | Gomería móvil, herramientas |
| **Auxilio de batería** | Puente de batería o reemplazo | Cables, booster, baterías stock |
| **Abastecimiento combustible** | Entrega de combustible de emergencia | Bidón homologado (hasta 10lts) |
| **Mecánica ligera** | Diagnóstico y reparación menor en ruta | Herramientas básicas, scanner OBD |
| **Apertura de cerraduras** | Acceso al vehículo sin llaves | Herramientas de cerrajería |
| **Extracción vehicular** | Rescate de vehículos encajados/hundidos | Grúa 4x4, winches, cadenas |

---

### 3.2 Categorización de Vehículos

| Categoría | Ejemplos | Tipo de Grúa Requerida |
|-----------|----------|------------------------|
| **Livianos** | Autos, SUVs, pickups | Grúa liviana (<3.5 ton) |
| **Semipesados** | Camionetas grandes, motorhomes | Grúa semipesada (3.5-7 ton) |
| **Pesados** | Camiones, buses | Grúa pesada (>7 ton) |
| **Motos** | Motocicletas, cuatriciclos | Grúa liviana o transporte específico |

---

## 4. ACTORES Y SUS NECESIDADES (ESPECIFICACIÓN DETALLADA)

### 4.1 Aseguradoras (Contratos B2B con Empresa de Logística)

**Grandes aseguradoras en Argentina:**
- Seguros Rivadavia
- La Caja
- Federación Patronal
- Sancor Seguros
- San Cristóbal
- Allianz
- Zurich
- Meridional Seguros
- etc.

**Lo que ELLAS necesitan de la empresa de logística:**
- ✅ Cobertura nacional o regional
- ✅ Tiempos de respuesta garantizados (<90 min)
- ✅ Facturación mensual consolidada
- ✅ Reportes de servicios prestados
- ✅ Calidad de servicio medible (calificaciones de asegurados)

**Lo que PROVEEN a la empresa de logística:**
- Lista de pólizas activas (CSV o integración API)
- Tarifas por tipo de servicio
- Condiciones especiales (ej: máximo 3 servicios por año por póliza)

**Interacción con Hermes:**
- **NO interactúan directamente** con Hermes
- Reciben factura PDF generada automáticamente fin de mes
- (Opcional) Pueden tener acceso a dashboard readonly para ver servicios en tiempo real

---

### 4.2 Empresa de Logística (CLIENTE DE SETUBALAI)

**Perfil:**
- PYME de 10-50 empleados
- Flota propia: 20-100 unidades
- Cobertura: regional (CABA/GBA) o provincial
- Facturación anual: $500M - $5.000M ARS
- Contratos con: 5-20 aseguradoras

**Pain Points que Hermes DEBE resolver:**

| Pain Point | Solución con Hermes |
|------------|---------------------|
| **Operadores 24/7 costoso** | WhatsApp automatizado, sin operadores |
| **Verificación manual de pólizas** | Base de datos local con pólizas activas |
| **Despacho manual de unidades** | Asignación automática por cercanía/disponibilidad |
| **Facturación mensual laboriosa** | Generación automática de facturas consolidadas |
| **Falta de tracking en tiempo real** | Link público con mapa en vivo |
| **Registro manual de servicios** | Cada servicio se registra automáticamente en BD |
| **Comunicación con choferes caótica** | WhatsApp estructurado (comandos, notificaciones) |

**Dashboard que necesitan:**
- Vista de servicios activos (mapa en tiempo real)
- Estado de cada unidad (disponible, en servicio, fuera de servicio)
- Servicios del día/semana/mes (tabla filtrable)
- Facturación pendiente por aseguradora
- Métricas: tiempo promedio, servicios por tipo, calificaciones

---

### 4.3 Choferes/Operarios

**Perfil:**
- Técnicos con poca capacitación en tecnología
- Trabajan todo el día en calle/ruta
- Necesitan sistema SIMPLE (WhatsApp, no apps complejas)

**Qué necesitan hacer:**
1. ✅ Recibir notificación de servicio asignado
2. ✅ Ver ubicación del asegurado (link Google Maps)
3. ✅ Avisar cuando salen hacia el servicio
4. ✅ Avisar cuando llegan
5. ✅ Reportar novedades (cliente ausente, necesita repuestos)
6. ✅ Avisar cuando terminan el servicio
7. ✅ (Opcional) Adjuntar foto del vehículo/comprobante

**Interacción con Hermes:**
- TODO via WhatsApp (mensajes de texto simples)
- Comandos naturales: "Salgo", "Llegué", "Terminé", "Cliente no está"
- Hermes entiende contexto (sabe qué servicio tienen asignado)

---

### 4.4 Asegurados (Usuarios Finales)

**Perfil:**
- Propietarios de vehículos con seguro
- Situación de emergencia (estrés, apuro)
- Prefieren WhatsApp sobre llamadas telefónicas
- Valoran información en tiempo real

**Qué necesitan:**
1. ✅ Solicitar asistencia rápidamente (sin esperar operador)
2. ✅ Saber si tienen cobertura (antes de que llegue la grúa)
3. ✅ Saber cuánto falta para que llegue la grúa
4. ✅ Ver ubicación de la grúa en tiempo real
5. ✅ Contactarse con el chofer si es necesario

**Interacción con Hermes:**
- Escriben por WhatsApp a número de la empresa de logística
- Lenguaje natural: "Me quedé sin batería", "Tengo un pinchazo"
- Reciben link de tracking público (sin login)
- Pueden calificar el servicio después (opcional)

---

### 4.5 Admin de la Empresa de Logística

**Perfil:**
- Dueño, gerente de operaciones o supervisor
- Necesita visibilidad completa
- Toma decisiones: contratar choferes, comprar unidades, cerrar contratos

**Dashboard que necesita:**
- **Operaciones en Tiempo Real:**
  - Mapa con todas las unidades activas
  - Servicios pendientes, en curso, completados (hoy)
  - Alertas: servicio demorado, chofer sin actualizar estado

- **Gestión de Flota:**
  - Lista de unidades (patente, tipo, chofer asignado)
  - Estado: disponible, en servicio, taller, baja
  - Alta/baja/edición de unidades

- **Gestión de Contratos:**
  - Aseguradoras activas (nombre, CUIT, contacto)
  - Tarifas por tipo de servicio
  - Pólizas cargadas (total, activas, vencidas)

- **Facturación:**
  - Servicios del mes por aseguradora
  - Total a facturar por aseguradora
  - Generar PDF de factura
  - Histórico de facturas

- **Métricas y Reportes:**
  - Tiempo promedio de respuesta
  - Servicios por tipo (grúa, batería, gomería, etc.)
  - Calificaciones promedio
  - Servicios por aseguradora (ranking)
  - Heatmap de demanda (zonas con más servicios)

---

## 5. INTEGRACIÓN CON SETUBALAI BUSINESS AGENT

⚠️ **TODO LO DE ESTA SECCIÓN ES PROPUESTA - NADA ESTÁ IMPLEMENTADO**

### 5.1 Schema de Base de Datos Propuesto (NO IMPLEMENTADO)

```sql
-- ============================================================
-- MÓDULO: LOGÍSTICA DE SEGUROS
-- ============================================================

-- Tabla maestra: Compañías Aseguradoras
CREATE TABLE setubalai.aseguradoras (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id),
    nombre_comercial VARCHAR(200) NOT NULL,
    cuit VARCHAR(13) UNIQUE NOT NULL,
    tipo VARCHAR(50), -- 'auto', 'vida', 'hogar', 'art', etc.
    email_contacto VARCHAR(200),
    telefono VARCHAR(50),
    direccion TEXT,
    api_webhook_url VARCHAR(500), -- Para integraciones automáticas
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pólizas de Seguros
CREATE TABLE setubalai.polizas (
    id SERIAL PRIMARY KEY,
    aseguradora_id INTEGER NOT NULL REFERENCES setubalai.aseguradoras(id),
    numero_poliza VARCHAR(100) NOT NULL,
    asegurado_nombre VARCHAR(200) NOT NULL,
    asegurado_dni VARCHAR(20),
    asegurado_telefono VARCHAR(50),
    asegurado_email VARCHAR(200),
    
    -- Datos del vehículo
    vehiculo_patente VARCHAR(20),
    vehiculo_marca VARCHAR(100),
    vehiculo_modelo VARCHAR(100),
    vehiculo_anio INTEGER,
    vehiculo_categoria VARCHAR(50), -- 'liviano', 'semipesado', 'pesado', 'moto'
    
    -- Cobertura
    tiene_cobertura_asistencia BOOLEAN DEFAULT false,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'activa', -- 'activa', 'suspendida', 'cancelada', 'vencida'
    
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prestadores de Servicios (grueros, mecánicos, gomeros)
CREATE TABLE setubalai.prestadores_servicio (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES setubalai.empresas(id), -- Si el prestador ES cliente de SetubalAI
    nombre_comercial VARCHAR(200) NOT NULL,
    cuit VARCHAR(13),
    tipo_servicio VARCHAR(50)[], -- ['grua', 'gomeria', 'mecanica', 'cerrajeria', 'combustible', 'extraccion']
    
    -- Ubicación y Cobertura
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    radio_cobertura_km INTEGER DEFAULT 50, -- Radio máximo de operación
    zonas_cobertura TEXT[], -- ['CABA', 'GBA Norte', 'GBA Sur', 'La Plata', etc.]
    
    -- Equipamiento
    tiene_grua_liviana BOOLEAN DEFAULT false,
    tiene_grua_semipesada BOOLEAN DEFAULT false,
    tiene_grua_pesada BOOLEAN DEFAULT false,
    tiene_gomeria_movil BOOLEAN DEFAULT false,
    tiene_mecanica_movil BOOLEAN DEFAULT false,
    tiene_4x4_extraccion BOOLEAN DEFAULT false,
    
    -- Contacto
    telefono VARCHAR(50),
    email VARCHAR(200),
    whatsapp VARCHAR(50),
    
    -- Métricas
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00, -- De 0.00 a 5.00
    total_servicios_realizados INTEGER DEFAULT 0,
    tiempo_promedio_respuesta_min INTEGER, -- Minutos promedio de arribo
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de Asistencia
CREATE TABLE setubalai.solicitudes_asistencia (
    id SERIAL PRIMARY KEY,
    poliza_id INTEGER NOT NULL REFERENCES setubalai.polizas(id),
    aseguradora_id INTEGER NOT NULL REFERENCES setubalai.aseguradoras(id),
    
    -- Tipo de Asistencia
    tipo_servicio VARCHAR(50) NOT NULL, -- 'grua', 'gomeria', 'bateria', 'combustible', 'mecanica', 'cerrajeria', 'extraccion'
    descripcion_problema TEXT NOT NULL,
    
    -- Ubicación del Incidente
    ubicacion_calle VARCHAR(200),
    ubicacion_altura VARCHAR(20),
    ubicacion_localidad VARCHAR(100),
    ubicacion_provincia VARCHAR(100),
    ubicacion_latitud DECIMAL(10, 8),
    ubicacion_longitud DECIMAL(11, 8),
    ubicacion_referencia TEXT, -- "Frente a la estación de servicio YPF"
    
    -- Destino (opcional, para grúas)
    destino_calle VARCHAR(200),
    destino_altura VARCHAR(20),
    destino_localidad VARCHAR(100),
    distancia_km INTEGER, -- Distancia calculada origen-destino
    
    -- Estado del Servicio
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'buscando_prestador', 'asignado', 'en_camino', 'en_servicio', 'completado', 'cancelado'
    prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'
    
    -- Asignación
    prestador_asignado_id INTEGER REFERENCES setubalai.prestadores_servicio(id),
    precio_acordado DECIMAL(10,2),
    tiempo_estimado_arribo_min INTEGER,
    fecha_asignacion TIMESTAMPTZ,
    fecha_arribo_real TIMESTAMPTZ,
    fecha_finalizacion TIMESTAMPTZ,
    
    -- Calificación
    calificacion_asegurado INTEGER, -- 1 a 5 estrellas
    comentario_asegurado TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ofertas de Prestadores (modelo marketplace)
CREATE TABLE setubalai.ofertas_prestadores (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES setubalai.solicitudes_asistencia(id),
    prestador_id INTEGER NOT NULL REFERENCES setubalai.prestadores_servicio(id),
    
    precio_ofertado DECIMAL(10,2) NOT NULL,
    tiempo_estimado_arribo_min INTEGER NOT NULL,
    comentario TEXT,
    
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aceptada', 'rechazada', 'expirada'
    fecha_oferta TIMESTAMPTZ DEFAULT NOW(),
    fecha_respuesta TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seguimiento de Estados (log de cambios)
CREATE TABLE setubalai.seguimiento_asistencia (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES setubalai.solicitudes_asistencia(id),
    
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    latitud DECIMAL(10, 8), -- Ubicación del prestador en este momento
    longitud DECIMAL(11, 8),
    comentario TEXT,
    
    usuario_id INTEGER REFERENCES setubalai.usuarios(id), -- Quién hizo el cambio
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Facturación a Aseguradoras
CREATE TABLE setubalai.facturacion_aseguradoras (
    id SERIAL PRIMARY KEY,
    aseguradora_id INTEGER NOT NULL REFERENCES setubalai.aseguradoras(id),
    
    periodo_mes INTEGER NOT NULL, -- 1-12
    periodo_anio INTEGER NOT NULL,
    
    total_servicios INTEGER DEFAULT 0,
    monto_total DECIMAL(12,2) DEFAULT 0.00,
    comision_plataforma DECIMAL(12,2) DEFAULT 0.00, -- % que cobra la plataforma
    monto_a_cobrar DECIMAL(12,2) DEFAULT 0.00,
    
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'facturado', 'cobrado'
    fecha_facturado DATE,
    fecha_cobrado DATE,
    
    archivo_factura_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos a Prestadores
CREATE TABLE setubalai.pagos_prestadores (
    id SERIAL PRIMARY KEY,
    prestador_id INTEGER NOT NULL REFERENCES setubalai.prestadores_servicio(id),
    
    periodo_mes INTEGER NOT NULL,
    periodo_anio INTEGER NOT NULL,
    
    total_servicios INTEGER DEFAULT 0,
    monto_total DECIMAL(12,2) DEFAULT 0.00,
    descuento_comision DECIMAL(12,2) DEFAULT 0.00, -- Si aplica
    monto_a_pagar DECIMAL(12,2) DEFAULT 0.00,
    
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'pagado'
    fecha_pago DATE,
    
    metodo_pago VARCHAR(50), -- 'transferencia', 'mercadopago', 'efectivo'
    comprobante_pago_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_polizas_asegurado_dni ON setubalai.polizas(asegurado_dni);
CREATE INDEX idx_polizas_vehiculo_patente ON setubalai.polizas(vehiculo_patente);
CREATE INDEX idx_polizas_numero ON setubalai.polizas(numero_poliza);
CREATE INDEX idx_solicitudes_estado ON setubalai.solicitudes_asistencia(estado);
CREATE INDEX idx_solicitudes_fecha ON setubalai.solicitudes_asistencia(created_at);
CREATE INDEX idx_prestadores_tipo ON setubalai.prestadores_servicio(tipo_servicio);
CREATE INDEX idx_prestadores_ubicacion ON setubalai.prestadores_servicio(latitud, longitud);
```

---

### 5.2 Endpoints FastAPI Propuestos (NO IMPLEMENTADO)

```python
# ============================================================
# ASEGURADORAS
# ============================================================
POST   /api/logistica-seguros/aseguradoras/              # Registrar aseguradora
GET    /api/logistica-seguros/aseguradoras/              # Listar aseguradoras
GET    /api/logistica-seguros/aseguradoras/{id}          # Detalle de aseguradora
PUT    /api/logistica-seguros/aseguradoras/{id}          # Actualizar aseguradora
DELETE /api/logistica-seguros/aseguradoras/{id}          # Eliminar aseguradora

# ============================================================
# PÓLIZAS
# ============================================================
POST   /api/logistica-seguros/polizas/                   # Crear póliza
GET    /api/logistica-seguros/polizas/                   # Listar pólizas
GET    /api/logistica-seguros/polizas/{id}               # Detalle de póliza
GET    /api/logistica-seguros/polizas/buscar             # Buscar por DNI, patente, número
PUT    /api/logistica-seguros/polizas/{id}               # Actualizar póliza
DELETE /api/logistica-seguros/polizas/{id}               # Eliminar póliza

# ============================================================
# PRESTADORES
# ============================================================
POST   /api/logistica-seguros/prestadores/               # Registrar prestador
GET    /api/logistica-seguros/prestadores/               # Listar prestadores
GET    /api/logistica-seguros/prestadores/{id}           # Detalle de prestador
GET    /api/logistica-seguros/prestadores/buscar-cercanos  # Buscar por lat/lng + radio
PUT    /api/logistica-seguros/prestadores/{id}           # Actualizar prestador
PUT    /api/logistica-seguros/prestadores/{id}/equipamiento  # Actualizar equipamiento
DELETE /api/logistica-seguros/prestadores/{id}           # Eliminar prestador

# ============================================================
# SOLICITUDES DE ASISTENCIA
# ============================================================
POST   /api/logistica-seguros/solicitudes/               # Crear solicitud (desde asegurado o aseguradora)
GET    /api/logistica-seguros/solicitudes/               # Listar solicitudes (filtros: estado, fecha, aseguradora)
GET    /api/logistica-seguros/solicitudes/{id}           # Detalle de solicitud
PUT    /api/logistica-seguros/solicitudes/{id}/estado    # Actualizar estado (buscando, asignado, en_camino, etc.)
PUT    /api/logistica-seguros/solicitudes/{id}/asignar   # Asignar prestador
POST   /api/logistica-seguros/solicitudes/{id}/calificar # Asegurado califica el servicio
DELETE /api/logistica-seguros/solicitudes/{id}           # Cancelar solicitud

# ============================================================
# OFERTAS (Modelo Marketplace)
# ============================================================
POST   /api/logistica-seguros/solicitudes/{id}/ofertas   # Prestador oferta precio y tiempo
GET    /api/logistica-seguros/solicitudes/{id}/ofertas   # Listar ofertas de prestadores para una solicitud
PUT    /api/logistica-seguros/ofertas/{id}/aceptar       # Aseguradora acepta una oferta
PUT    /api/logistica-seguros/ofertas/{id}/rechazar      # Aseguradora rechaza una oferta

# ============================================================
# SEGUIMIENTO EN TIEMPO REAL
# ============================================================
GET    /api/logistica-seguros/solicitudes/{id}/seguimiento  # Historial de cambios de estado
POST   /api/logistica-seguros/solicitudes/{id}/seguimiento  # Prestador actualiza ubicación y estado
GET    /api/logistica-seguros/solicitudes/{id}/tracking     # Endpoint público para asegurado (link)

# ============================================================
# FACTURACIÓN Y PAGOS
# ============================================================
GET    /api/logistica-seguros/facturacion/aseguradoras/{id}  # Resumen de facturación por aseguradora
POST   /api/logistica-seguros/facturacion/generar            # Generar facturación mensual
GET    /api/logistica-seguros/pagos/prestadores/{id}         # Resumen de pagos por prestador
POST   /api/logistica-seguros/pagos/procesar                 # Procesar pagos a prestadores

# ============================================================
# REPORTES Y MÉTRICAS
# ============================================================
GET    /api/logistica-seguros/reportes/dashboard             # Dashboard general (solicitudes, tiempos, calificaciones)
GET    /api/logistica-seguros/reportes/aseguradora/{id}      # Métricas por aseguradora
GET    /api/logistica-seguros/reportes/prestador/{id}        # Métricas por prestador
GET    /api/logistica-seguros/reportes/tiempos-respuesta     # Análisis de tiempos de respuesta
GET    /api/logistica-seguros/reportes/cobertura-geografica  # Mapa de cobertura por zonas
```

---

### 5.3 Skill de Hermes: `logistica-seguros` (NO IMPLEMENTADO)

```yaml
---
name: logistica-seguros
description: |
  Gestión completa de plataforma de logística de seguros vehiculares.
  Conecta aseguradoras, prestadores de servicios (grueros, mecánicos) y asegurados.
  Modelo marketplace para asistencia vehicular post-Resolución SSN 217/2024.
  
triggers:
  - "asistencia vehicular"
  - "grúa"
  - "auxilio mecánico"
  - "aseguradora"
  - "prestador de servicio"
  - "gruero"
  - "solicitud de asistencia"
  
tools_required:
  - terminal
---

# Logística de Seguros: Gestión de Asistencia Vehicular

## Contexto Regulatorio

**Resolución SSN 217/2024:** Las aseguradoras NO pueden ofrecer grúa/auxilio mecánico directamente.  
→ Necesitan **tercerizar** mediante plataformas como Claims Services 24siete o similar.

---

## Comandos Disponibles

### 1. Registrar Aseguradora
```bash
curl -X POST http://localhost:3010/api/logistica-seguros/aseguradoras/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_comercial": "La Caja Seguros",
    "cuit": "30-12345678-9",
    "tipo": "auto",
    "email_contacto": "operaciones@lacaja.com.ar",
    "telefono": "+54 11 4000-0000"
  }'
```

### 2. Registrar Prestador de Servicio
```bash
curl -X POST http://localhost:3010/api/logistica-seguros/prestadores/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_comercial": "Grúas Rápidas SRL",
    "cuit": "30-98765432-1",
    "tipo_servicio": ["grua", "gomeria", "mecanica"],
    "direccion": "Av. San Martín 1234, CABA",
    "latitud": -34.603722,
    "longitud": -58.381592,
    "radio_cobertura_km": 50,
    "zonas_cobertura": ["CABA", "GBA Norte", "GBA Sur"],
    "tiene_grua_liviana": true,
    "tiene_grua_semipesada": true,
    "telefono": "+54 9 11 5555-1234",
    "whatsapp": "+54 9 11 5555-1234"
  }'
```

### 3. Crear Solicitud de Asistencia
```bash
curl -X POST http://localhost:3010/api/logistica-seguros/solicitudes/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poliza_id": 1,
    "aseguradora_id": 1,
    "tipo_servicio": "grua",
    "descripcion_problema": "Vehículo no arranca, posible problema de batería",
    "ubicacion_calle": "Av. Corrientes",
    "ubicacion_altura": "3500",
    "ubicacion_localidad": "CABA",
    "ubicacion_provincia": "Buenos Aires",
    "ubicacion_latitud": -34.604081,
    "ubicacion_longitud": -58.411076,
    "destino_calle": "Taller Mecánico Juan, Av. Rivadavia 5000",
    "prioridad": "normal"
  }'
```

### 4. Buscar Prestadores Cercanos
```bash
curl "http://localhost:3010/api/logistica-seguros/prestadores/buscar-cercanos?latitud=-34.604&longitud=-58.411&radio_km=10&tipo=grua" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Prestador Oferta Servicio
```bash
curl -X POST http://localhost:3010/api/logistica-seguros/solicitudes/1/ofertas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prestador_id": 5,
    "precio_ofertado": 15000.00,
    "tiempo_estimado_arribo_min": 45,
    "comentario": "Grúa liviana disponible, arribo estimado 45 min"
  }'
```

### 6. Aseguradora Acepta Oferta
```bash
curl -X PUT http://localhost:3010/api/logistica-seguros/ofertas/1/aceptar \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Actualizar Estado del Servicio
```bash
# Prestador actualiza estado a "en_camino"
curl -X PUT http://localhost:3010/api/logistica-seguros/solicitudes/1/estado \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "estado_nuevo": "en_camino",
    "latitud": -34.600,
    "longitud": -58.400,
    "comentario": "Saliendo de base, llegando en 30 min"
  }'
```

### 8. Tracking para Asegurado (Link Público)
```bash
# Link público sin autenticación para que el asegurado vea el estado
curl "http://localhost:3010/api/logistica-seguros/solicitudes/1/tracking"
```

### 9. Asegurado Califica el Servicio
```bash
curl -X POST http://localhost:3010/api/logistica-seguros/solicitudes/1/calificar \
  -H "Content-Type: application/json" \
  -d '{
    "calificacion": 5,
    "comentario": "Excelente servicio, llegaron rápido y resolvieron el problema"
  }'
```

---

## Flujos de Trabajo

### Flujo 1: Solicitud con Asignación Directa (Sin Marketplace)
```
1. Asegurado solicita asistencia (POST /solicitudes/)
2. Sistema busca prestadores cercanos (GET /prestadores/buscar-cercanos)
3. Aseguradora asigna prestador directamente (PUT /solicitudes/{id}/asignar)
4. Prestador actualiza estados (en_camino → en_servicio → completado)
5. Asegurado califica (POST /solicitudes/{id}/calificar)
```

### Flujo 2: Solicitud con Marketplace de Ofertas
```
1. Asegurado solicita asistencia (POST /solicitudes/)
2. Sistema notifica a prestadores cercanos
3. Prestadores ofertan (POST /solicitudes/{id}/ofertas)
4. Aseguradora compara ofertas y acepta la mejor (PUT /ofertas/{id}/aceptar)
5. Prestador realiza servicio y actualiza estados
6. Asegurado califica
```

---

## Casos de Uso del Agente

### Caso 1: Asegurado Solicita Grúa via WhatsApp
```
Asegurado: "Me quedé sin batería en Av. Corrientes 3500, necesito grúa"

Agente:
1. Identifica asegurado por número de teléfono
2. Consulta póliza activa en BD
3. Crea solicitud de asistencia con ubicación
4. Busca prestadores cercanos
5. Notifica a prestadores para que oferten
6. Informa al asegurado: "✅ Solicitud creada. Buscando prestadores cercanos..."
7. Cuando hay ofertas: "Tengo 3 ofertas: 
   - Grúas Rápidas: $15.000, arribo en 45 min
   - Assist North: $18.000, arribo en 30 min
   - Gruero24: $14.500, arribo en 60 min"
8. Aseguradora (o asegurado si tiene permisos) elige oferta
9. Agente envía link de tracking: "Tu grúa está en camino: [link]"
```

### Caso 2: Prestador Actualiza Estado via WhatsApp
```
Prestador: "Llegué al lugar, el cliente no estaba"

Agente:
1. Identifica prestador por número
2. Busca solicitud activa asignada a él
3. Actualiza estado a "en_lugar_cliente_ausente"
4. Notifica al asegurado: "⚠️ El prestador llegó pero no te encontró. ¿Estás en Av. Corrientes 3500?"
5. Asegurado responde ubicación correcta
6. Agente actualiza ubicación y notifica al prestador
```

### Caso 3: Facturación Mensual Automática
```
Cron diario (1ro de cada mes, 8am):
1. Consulta todas las solicitudes completadas del mes anterior
2. Agrupa por aseguradora
3. Calcula totales (cantidad servicios, monto total, comisión)
4. Genera factura PDF
5. Envía por email a cada aseguradora
6. Envía resumen por Telegram al admin: "Facturación Marzo 2026:
   - La Caja: 150 servicios, $2.250.000
   - Rivadavia: 200 servicios, $3.100.000
   - Total: $5.350.000"
```

---

## Métricas y Reportes

### Dashboard General
- Total solicitudes (hoy, semana, mes)
- Tiempo promedio de respuesta
- Calificación promedio de servicios
- Prestadores activos
- Cobertura geográfica (mapa de calor)

### Métricas por Aseguradora
- Solicitudes procesadas
- Monto total facturado
- Tiempo promedio de resolución
- Satisfacción de asegurados

### Métricas por Prestador
- Servicios realizados
- Calificación promedio
- Tiempo promedio de arribo
- Zonas de mayor demanda

---

## Integraciones Externas

### Google Maps API
- Geocodificación de direcciones
- Cálculo de distancias
- Rutas óptimas
- Tracking en tiempo real

### WhatsApp Business API
- Notificaciones automáticas
- Link de tracking
- Solicitud de asistencia via chat
- Actualizaciones de estado

### Mercado Pago
- Pagos a prestadores
- Comisiones automáticas
- Facturación

---

## Pitfalls y Consideraciones

### Problema: Múltiples Prestadores Ofertan al Mismo Tiempo
**Solución:** Lock optimista en BD. Si se acepta oferta A, todas las demás pasan a "rechazada" automáticamente.

### Problema: Prestador Acepta Pero No Llega
**Solución:** 
- Timer de 90 minutos (configurable)
- Si no hay update de estado, notificar a aseguradora
- Aseguradora puede reasignar a otro prestador
- Calificación negativa automática

### Problema: Asegurado Cancela Después de Asignar Prestador
**Solución:**
- Cobro de penalidad (configurable por aseguradora)
- Compensación al prestador por viaje en vano

### Problema: Ubicación GPS Incorrecta
**Solución:**
- Validación de coordenadas (Argentina entre lat -55/-22, lng -73/-53)
- Solicitar dirección manual como fallback
- Prestador puede reportar "cliente no encontrado"

---

**Última actualización:** 2026-05-26  
**Mantenido por:** SetubalAI Business Agent Development
```

---

## 6. MERCADO Y COMPETIDORES

### 6.1 Empresas de Logística de Seguros en Argentina

**Grandes (>100 unidades):**
- **Assist North** (CABA/GBA) - 40+ unidades, flota propia
- **RUS Assistance** (Nacional) - Red de prestadores
- **Centinela** (Nacional) - Seguimiento + asistencia
- **STOP CAR** (Nacional) - Rastreo + recupero + asistencia

**Medianas (20-50 unidades):**
- Grueros regionales con contratos múltiples aseguradoras
- Empresas provinciales (Córdoba, Rosario, Mendoza)

**Chicas (<20 unidades):**
- Grueros independientes con 1-2 contratos
- Operación familiar/PYME

---

### 6.2 Tamaño del Mercado

**Argentina:**
- ~12 millones de vehículos asegurados
- ~30% tienen cobertura de asistencia vehicular
- Mercado estimado: $50.000M - $100.000M ARS/año

**Oportunidad para SetubalAI:**
- Empresas medianas/chicas (100-500 empresas potenciales)
- Pain points claros (operadores 24/7, facturación manual)
- Tecnología accesible (WhatsApp, sin apps complejas)

---

## 7. DIFERENCIADORES DE SETUBALAI vs COMPETENCIA

### 7.1 Competencia Actual

**Soluciones existentes en el mercado:**

#### A) Software de Gestión de Flotas Genérico
**Ejemplos:** Fleet Complete, Geotab, Teletrac Navman
- ✅ Tracking GPS de vehículos
- ✅ Reportes de rutas
- ❌ NO tienen WhatsApp integrado
- ❌ NO entienden lenguaje natural
- ❌ NO gestionan pólizas de aseguradoras
- ❌ NO generan facturación automática

#### B) Sistemas de Despacho de Grúas
**Ejemplos:** Towbook, ClearPathGPS
- ✅ Asignación de servicios
- ✅ Tracking básico
- ❌ Requieren software instalado en PC
- ❌ Curva de aprendizaje alta
- ❌ NO tienen agente IA conversacional
- ❌ Choferes necesitan app móvil específica

#### C) Operación Manual (Excel + WhatsApp caótico)
- ✅ Barato (sin licencias)
- ❌ Requiere operadores 24/7
- ❌ Errores humanos en facturación
- ❌ No hay tracking en tiempo real
- ❌ Escalabilidad limitada

---

### 7.2 Ventajas de SetubalAI con Hermes Agent

| Característica | Competencia | SetubalAI + Hermes |
|----------------|-------------|---------------------|
| **Atención al asegurado** | Operador humano 24/7 | ✅ Agente IA via WhatsApp |
| **Despacho de unidades** | Manual (operador decide) | ✅ Automático (cercanía + disponibilidad) |
| **Tracking en tiempo real** | No disponible o app especial | ✅ Link público con Google Maps |
| **Comunicación con choferes** | Radio/teléfono/WhatsApp caótico | ✅ WhatsApp estructurado (comandos) |
| **Verificación de pólizas** | Llamar a aseguradora (5-10 min) | ✅ Instantáneo (BD local) |
| **Facturación** | Manual (Excel + PDF) | ✅ Automática (generación mensual) |
| **Curva de aprendizaje** | Alta (capacitación necesaria) | ✅ Baja (WhatsApp que todos conocen) |
| **Costo de implementación** | Alto ($10k-$50k USD) | ✅ Medio ($5k-$10k USD) |
| **Costo mensual** | $500-$2000 USD/mes | ✅ $300-$800 USD/mes |
| **Soporte en español** | Limitado | ✅ Total (empresa argentina) |

---

### 7.3 Propuesta de Valor para el Cliente

**ROI en 3-6 meses:**

**Antes (sin Hermes):**
- 3 operadores call center 24/7: $3M/mes
- Errores en facturación: -5% ingresos (~$500k/mes)
- Pérdida de servicios por demora: -10% (~$1M/mes)
- **TOTAL COSTO:** $4.5M/mes

**Después (con Hermes):**
- 0 operadores (solo admin/supervisor): $0
- Facturación automatizada (0% error): +$500k/mes
- Tiempos de respuesta <5min: +20% servicios (~$2M/mes)
- Licencia SetubalAI: -$600k/mes
- **TOTAL BENEFICIO:** $1.9M/mes

**ROI = $1.9M/mes × 12 = $22.8M/año**

---

### 7.4 Casos de Uso Únicos de Hermes

**1. Multilenguaje Natural**
```
Asegurado: "Me pinché una goma"
Asegurado: "Tengo un flat"
Asegurado: "Se me reventó la cubierta"
→ Hermes entiende que necesita gomería
```

**2. Contexto Conversacional**
```
Asegurado: "Estoy en Corrientes y Callao"
Hermes: "¿Necesitás grúa?"
Asegurado: "No, solo cambiar la batería"
→ Hermes asigna auxilio mecánico (no grúa)
```

**3. Escalamiento a Humano**
```
Asegurado: "Necesito hablar con un supervisor"
→ Hermes notifica al admin por Telegram
→ Admin puede tomar control de la conversación
```

**4. Memoria de Conversación**
```
Día 1:
Asegurado: "Me mandaron grúa pero no tengo cobertura"
Hermes: "Disculpas, verifico... efectivamente tu póliza venció. Te envío datos de renovación."

Día 10:
Asegurado: "Hola de nuevo"
Hermes: "Hola Juan, ¿renovaste tu póliza con La Caja? ¿En qué puedo ayudarte hoy?"
```

---

## 8. PRÓXIMOS PASOS (NADA IMPLEMENTADO AÚN)

**ESTADO ACTUAL: 🔴 FASE DE RELEVAMIENTO Y ANÁLISIS**

### Roadmap Propuesto:

1. ✅ **Documentación técnica completa** (este archivo) - RELEVAMIENTO HECHO
2. ⏳ **Validar schema de BD** con Pablo
3. ⏳ **Diseñar mockups de UI** (dashboard aseguradora, panel prestador, tracking asegurado)
4. ⏳ **Implementar endpoints FastAPI** del módulo
5. ⏳ **Crear skill de Hermes** para operación via WhatsApp
6. ⏳ **Integración Google Maps API**
7. ⏳ **Sistema de notificaciones** (WhatsApp, email, SMS)
8. ⏳ **Facturación automática** y generación de PDFs
9. ⏳ **Demo con datos reales** para mostrar a aseguradoras

---

## 9. REFERENCIAS Y FUENTES

- Assist North: https://assistnorth.com/ (Empresa de logística de seguros en CABA/GBA con flota propia)
- Claims Services 24siete: https://claimservices.io/plataforma-24siete.php (Plataforma marketplace, referencia de arquitectura)
- Grupo Facebook "Gruas remolques auxilios Argentina" (comunidad de prestadores)
- Artículos de prensa sobre cambio regulatorio en Argentina (2024)

---

**⚠️ RECORDATORIO FINAL:**

Este documento es **100% RELEVAMIENTO Y ANÁLISIS.**  
**NADA está implementado.**  
**Cliente = Empresa de Logística (Assist North, etc.), NO aseguradora.**  
**Hermes se instala EN la empresa de logística para automatizar sus operaciones.**

---

**Última actualización:** 2026-05-26  
**Mantenido por:** SetubalAI Business Agent Development
