# Análisis Técnico: Clínica Diagnóstico por Imágenes

⚠️ **ESTADO: RELEVAMIENTO INICIAL - NADA IMPLEMENTADO** ⚠️

Este documento es parte del **análisis y relevamiento** para el futuro módulo de servicios médicos del agente SetubalAI.  
**NO hay código implementado, NO hay tablas creadas, NO hay endpoints funcionando.**  
Todo lo descrito aquí es **propuesta de diseño** pendiente de aprobación e implementación.

---

**Fecha:** 2026-05-26  
**Sistema Analizado:** VM Virtual Film HTML5 (sistema externo de la clínica)
**URL Base:** https://vmpacs.dxi.com.ar
**Propósito:** Documentar la tecnología de la clínica para futuras integraciones

---

## 1. SISTEMA IDENTIFICADO

### Sistema PACS (Picture Archiving and Communication System)
- **Proveedor:** VM Virtual Film
- **Versión:** HTML5 (v3.6.3.1)
- **Protocolo:** DICOM (Digital Imaging and Communications in Medicine)
- **Arquitectura:** Sistema web basado en Cornerstone.js

---

## 2. TECNOLOGÍA DETECTADA

### Frontend Stack
```
Cornerstone.js       → Librería principal para visualización DICOM
Bootstrap 4          → UI Framework
jQuery UI 1.14.1     → Interacciones drag/drop
Font Awesome         → Iconografía
PNotify              → Sistema de notificaciones
Dropzone             → Upload de archivos DICOM
WheelNav             → Menú radial de herramientas
```

### Módulos del Sistema
```
/viewer/             → Visualizador principal de imágenes médicas
/grabador/           → Módulo de grabación de audio (informes radiológicos)
/assets/             → Recursos estáticos (CSS, JS, fonts)
```

### Capacidades Detectadas
1. **Visualización de imágenes DICOM**
   - Rayos X
   - TAC (Tomografía Computarizada)
   - Resonancia Magnética
   - Ecografías
   - Mamografías (modo especial detectado)

2. **Herramientas de medición**
   - Zoom y pan
   - Mediciones de distancia
   - Anotaciones
   - Ventana/nivel (Windowing)
   - MPR Lite (Multi-Planar Reconstruction)

3. **Grabación de informes**
   - Audio de alta calidad
   - Sample rate: 16000 Hz
   - Compresión GZIP opcional

4. **Comparación de estudios**
   - Estudios previos del mismo paciente
   - Visualización lado a lado

5. **Upload de archivos**
   - Soporte para subir nuevos estudios DICOM
   - Drag & drop

---

## 3. ESTRUCTURA DE DATOS EXTRAÍDA

### De URL de Acceso Directo
```
URL: https://vmpacs.dxi.com.ar:443/viewer/index.php/pacientes?urlParam=373e35484945...

Parámetros decodificados en JavaScript:
- studyuid: "2.16.840.1.114584.2540134658.49257.17401.44203.148436782714759"
- pacienteId: "21943035"
- monitor: ""
- filtro: ""
- editor: ""
- previous: ""
```

### Identificadores DICOM
```javascript
// Study Instance UID (identificador único del estudio)
const _study = '2.16.840.1.114584.2540134658.49257.17401.44203.148436782714759';

// ID del paciente
const _pacienteId = '21943035';

// Serie específica (vacío = todas las series del estudio)
const _serie = '';
```

---

## 4. FORMATO DICOM: ESTÁNDAR MÉDICO

### ¿Qué es DICOM?
- Estándar internacional para imágenes médicas
- Define tanto el formato de archivo como el protocolo de comunicación
- Usado por prácticamente TODOS los equipos de diagnóstico por imágenes modernos

### Estructura de un Study UID
```
2.16.840.1.114584.2540134658.49257.17401.44203.148436782714759
│    │      │        │         │     │      │      │
│    │      │        │         │     │      │      └─ Timestamp único
│    │      │        │         │     │      └─ Número de acceso
│    │      │        │         │     └─ ID del estudio
│    │      │        │         └─ Modalidad
│    │      │        └─ ID de la institución
│    │      └─ ID del vendor (fabricante)
│    └─ ISO country code (840 = USA registrado)
└─ ISO root
```

---

## 5. SEGURIDAD Y ACCESO

### Método de Autenticación Detectado
- **URL con parámetro encriptado:** `urlParam=373e35484945...`
- **No requiere login interactivo** al acceder via link directo
- **Sesión embebida** en el parámetro URL
- Timer de sesión: configurable (detectado `timerSess = '0'`)

### Implicaciones de Privacidad
⚠️ **HIPAA/Ley de Protección de Datos Personales (Argentina - Ley 25.326)**
- Los links permiten acceso directo sin autenticación adicional
- Debe tratarse como información de salud protegida (PHI)
- Requiere cifrado en tránsito (HTTPS ✓ detectado)
- Requiere control de acceso y auditoría

---

## 6. INTEGRACIÓN CON SETUBALAI BUSINESS AGENT

⚠️ **TODO LO DE ESTA SECCIÓN ES PROPUESTA - NADA ESTÁ IMPLEMENTADO**

### 6.1 Schema de Base de Datos Propuesto (NO IMPLEMENTADO)

```sql
-- Nueva tabla: clinicas_pacs
CREATE TABLE setubalai.clinicas_pacs (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresas(id),
    nombre_clinica VARCHAR(200) NOT NULL,
    pacs_vendor VARCHAR(100) DEFAULT 'VM Virtual Film',
    pacs_version VARCHAR(50),
    base_url VARCHAR(500) NOT NULL,
    usa_dicom BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nueva tabla: pacientes_estudios
CREATE TABLE setubalai.pacientes_estudios (
    id SERIAL PRIMARY KEY,
    clinica_pacs_id INTEGER NOT NULL REFERENCES setubalai.clinicas_pacs(id),
    paciente_id_externo VARCHAR(100) NOT NULL, -- ID del paciente en el sistema PACS
    study_instance_uid VARCHAR(200) NOT NULL UNIQUE, -- DICOM Study UID
    fecha_estudio DATE,
    modalidad VARCHAR(50), -- RX, CT, MRI, US, etc.
    descripcion TEXT,
    url_acceso TEXT, -- URL completa con parámetro encriptado
    informado BOOLEAN DEFAULT false,
    informe_texto TEXT,
    informe_audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_pacientes_estudios_paciente ON setubalai.pacientes_estudios(paciente_id_externo);
CREATE INDEX idx_pacientes_estudios_study_uid ON setubalai.pacientes_estudios(study_instance_uid);
CREATE INDEX idx_pacientes_estudios_fecha ON setubalai.pacientes_estudios(fecha_estudio);
```

### 6.2 Endpoints FastAPI Propuestos (NO IMPLEMENTADO)

```python
# /api/clinicas-pacs/
POST   /clinicas-pacs/                    # Registrar nueva clínica con PACS
GET    /clinicas-pacs/                    # Listar clínicas configuradas
GET    /clinicas-pacs/{id}                # Detalle de clínica específica
PUT    /clinicas-pacs/{id}                # Actualizar configuración
DELETE /clinicas-pacs/{id}                # Eliminar clínica

# /api/estudios/
POST   /estudios/                         # Registrar nuevo estudio (desde URL)
GET    /estudios/                         # Listar estudios (filtros: paciente, fecha, modalidad)
GET    /estudios/{id}                     # Detalle de estudio específico
PUT    /estudios/{id}/informe             # Actualizar informe del estudio
GET    /estudios/paciente/{paciente_id}  # Todos los estudios de un paciente
```

### 6.3 Skill de Hermes: `clinica-diagnostico-pacs` (NO IMPLEMENTADO)

```yaml
---
name: clinica-diagnostico-pacs
description: |
  Gestionar estudios de diagnóstico por imágenes desde sistemas PACS.
  Registrar URLs de acceso, consultar estudios por paciente, actualizar informes.
  
triggers:
  - "registrar estudio"
  - "URL de estudio"
  - "buscar estudios de paciente"
  - "DICOM"
  - "radiología"
  
tools_required:
  - terminal
---

# Gestión de Estudios PACS - Diagnóstico por Imágenes

## Comandos Disponibles

### 1. Registrar Nueva Clínica PACS
```bash
curl -X POST http://localhost:3010/api/clinicas-pacs/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_clinica": "DXI Diagnóstico por Imágenes",
    "pacs_vendor": "VM Virtual Film",
    "pacs_version": "3.6.3.1",
    "base_url": "https://vmpacs.dxi.com.ar",
    "usa_dicom": true
  }'
```

### 2. Registrar Estudio desde URL
```bash
# Parsear URL y extraer datos
URL="https://vmpacs.dxi.com.ar:443/viewer/index.php/pacientes?urlParam=..."

curl -X POST http://localhost:3010/api/estudios/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clinica_pacs_id": 1,
    "url_acceso": "'$URL'",
    "paciente_id_externo": "21943035",
    "study_instance_uid": "2.16.840.1.114584.2540134658.49257.17401.44203.148436782714759",
    "fecha_estudio": "2026-05-26",
    "modalidad": "RX",
    "descripcion": "Radiografía de tórax"
  }'
```

### 3. Buscar Estudios de un Paciente
```bash
curl http://localhost:3010/api/estudios/paciente/21943035 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Actualizar Informe
```bash
curl -X PUT http://localhost:3010/api/estudios/1/informe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "informado": true,
    "informe_texto": "Radiografía de tórax sin alteraciones significativas..."
  }'
```
```

---

## 7. CASOS DE USO PARA EL AGENTE

### Caso 1: Recepción de URL de Estudio
```
Usuario dice: "Me llegó este link de la clínica: https://vmpacs.dxi.com.ar/viewer/..."

Agente:
1. Extrae paciente_id y study_uid de la URL
2. Consulta si ya existe en la DB
3. Si no existe, registra el estudio
4. Responde: "✅ Estudio registrado - Paciente 21943035, TAC de cabeza, 26/05/2026"
```

### Caso 2: Consulta de Estudios Previos
```
Usuario dice: "¿Qué estudios tiene el paciente 21943035?"

Agente:
1. Consulta GET /api/estudios/paciente/21943035
2. Lista todos los estudios con fechas y modalidades
3. Provee links de acceso directo
```

### Caso 3: Seguimiento de Informes Pendientes
```
Cron diario a las 8am:
1. Consulta estudios con informado=false
2. Envía resumen de estudios pendientes de informar
3. "⚠️ Tienes 3 estudios sin informar: TAC 24/05, RX 25/05, ECO 26/05"
```

---

## 8. CONSIDERACIONES TÉCNICAS

### Parser de URL PACS
```python
# utils/pacs_parser.py
import re
from urllib.parse import urlparse, parse_qs

def parse_pacs_url(url: str) -> dict:
    """
    Extrae información de URL de sistema PACS VM Virtual Film.
    
    Args:
        url: URL completa con parámetro urlParam
        
    Returns:
        dict con paciente_id, study_uid si se pueden extraer
    """
    # Para VM Virtual Film, necesitamos decodificar el urlParam
    # Los datos están en JavaScript embebido en el HTML
    
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    
    if 'urlParam' not in params:
        return {"error": "No se encontró urlParam en la URL"}
    
    # Hacer request HTTP para obtener el HTML
    # y extraer las constantes JavaScript
    
    return {
        "base_url": f"{parsed.scheme}://{parsed.netloc}",
        "url_param": params['urlParam'][0],
        "requires_html_parse": True
    }

def extract_dicom_ids_from_html(html: str) -> dict:
    """
    Extrae IDs DICOM del HTML del viewer.
    
    Returns:
        {
            "paciente_id": "21943035",
            "study_uid": "2.16.840.1.114584...",
            "serie": "",
        }
    """
    import re
    
    paciente = re.search(r"const _pacienteId = '([^']+)'", html)
    study = re.search(r"const _study = '([^']+)'", html)
    serie = re.search(r"const _serie = '([^']*)'", html)
    
    return {
        "paciente_id": paciente.group(1) if paciente else None,
        "study_uid": study.group(1) if study else None,
        "serie": serie.group(1) if serie else "",
    }
```

### Modalidades DICOM Comunes
```python
MODALIDADES_DICOM = {
    "CR": "Computed Radiography (Radiografía Digital)",
    "CT": "Computed Tomography (Tomografía Computarizada)",
    "MR": "Magnetic Resonance (Resonancia Magnética)",
    "US": "Ultrasound (Ecografía)",
    "MG": "Mammography (Mamografía)",
    "DX": "Digital Radiography (Radiografía Digital)",
    "XA": "X-Ray Angiography (Angiografía)",
    "NM": "Nuclear Medicine (Medicina Nuclear)",
    "PT": "PET Scan",
}
```

---

## 9. PRÓXIMOS PASOS (NADA IMPLEMENTADO AÚN)

**ESTADO ACTUAL: 🔴 FASE DE RELEVAMIENTO Y ANÁLISIS**

Estamos **ANALIZANDO** los sistemas de la clínica para diseñar el módulo de servicios médicos.  
**NO se ha implementado NADA todavía.**

### Roadmap Propuesto (pendiente de aprobación):

1. ✅ **Documentación técnica completa** (este archivo) - RELEVAMIENTO HECHO
2. ⏳ **Completar relevamiento de seguros** (DiagSeg, Logística de Seguros) - FALTA INFO
3. ⏳ **Diseñar schema completo** de BD para todo el módulo médico
4. ⏳ **Implementar endpoints FastAPI**
5. ⏳ **Crear skills de Hermes** para gestión de estudios
6. ⏳ **Implementar parser de URL** y extractor de IDs
7. ⏳ **Dashboard web** para visualizar estudios pendientes

---

## 10. NOTAS ADICIONALES

### Modelo de Negocio Detectado
- Clínicas de diagnóstico por imágenes
- Proveen acceso a estudios via URLs con parámetros encriptados
- Los links se comparten con pacientes y médicos derivantes
- Sistema multiinstitucional (DXI parece ser red de clínicas)

### Relación con Compañías de Seguros
*(A completar con información de Pablo sobre asegurados, pólizas, DiagSeg, Logística de Seguros)*

---

**Última actualización:** 2026-05-26  
**Mantenido por:** SetubalAI Business Agent Development
