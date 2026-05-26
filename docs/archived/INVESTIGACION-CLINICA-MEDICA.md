# 🏥 INVESTIGACIÓN PROFUNDA: CLÍNICA MÉDICA MULTIESPECIALIDAD

**Proyecto:** SetubalAI — Módulo Clínicas Médicas  
**Fecha:** 26 Mayo 2026  
**Objetivo:** Diseñar esquema de BD que soporte operación completa de clínicas con múltiples especialidades, profesionales, y horarios personalizados

---

## 📋 ÍNDICE

1. [Caso Real: CentroMedicIntegral](#caso-real)
2. [User Stories Narrativos](#user-stories)
3. [Preguntas Críticas sin Responder](#preguntas-criticas)
4. [Entidades y Relaciones](#entidades)
5. [Esquema de BD Propuesto](#esquema-bd)
6. [Casos Edge que Rompen el Sistema](#casos-edge)
7. [Flujo Operativo Completo](#flujo-operativo)

---

## 🏥 CASO REAL: CENTROMEDICINTEGRAL

### **Perfil de la Empresa:**
- **Nombre:** CentroMedicIntegral
- **Rubro:** Centro Médico Integral Multiespecialidad
- **Ubicación:** Una sede principal (San Martín 3456, Santa Fe)
- **Consultorios:** 8 consultorios físicos
- **Especialidades:** 14 activas
- **Profesionales:** 18 médicos (algunos cubren múltiples especialidades)
- **Atención:** Lunes a viernes 7am-21pm, sábados 8am-14pm
- **Clientes:** Pacientes particulares + 3 empresas B2B + 2 obras sociales

### **Especialidades Actuales:**
1. Cardiología
2. Traumatología
3. Pediatría
4. Dermatología
5. Ginecología
6. Oftalmología
7. Otorrinolaringología
8. Gastroenterología
9. Neurología
10. Urología
11. Psicología
12. Nutrición
13. Clínica Médica (generalista)
14. Cirugía General

---

## 📖 USER STORIES NARRATIVOS

### **HISTORIA 1: PACIENTE NUEVO — PRIMERA CONSULTA**

**Protagonista:** María López (32 años, obra social OSDE)

```
DÍA 1 — SOLICITUD DE TURNO (10:30am)

María llama por teléfono:
📞 "Hola, necesito un turno con un traumatólogo"

Secretaria (recepcionista):
👩‍💼 "¿Es la primera vez que consulta con nosotros?"
📞 "Sí"
👩‍💼 "Perfecto. ¿Tiene obra social?"
📞 "Sí, OSDE"
👩‍💼 "¿Qué número de plan?"
📞 "Plan 310"

Secretaria busca en el sistema:
- Traumatólogos disponibles:
  * Dr. Diego Pérez — Lunes/Miércoles 14-20hs
  * Dra. Laura Fernández — Martes/Jueves/Viernes 9-13hs

👩‍💼 "Tenemos dos opciones:
     - Dr. Pérez el miércoles a las 16hs
     - Dra. Fernández el jueves a las 11hs"
📞 "Prefiero el miércoles con el Dr. Pérez"

👩‍💼 "Perfecto. Necesito sus datos:
     - Nombre completo
     - DNI
     - Fecha de nacimiento
     - Teléfono
     - Email
     - Obra social + plan + número de afiliado"

Sistema registra:
✅ Cliente nuevo (ID #234)
✅ Turno #1891 — Miércoles 28/05 16:00 — Dr. Pérez — Consultorio 3
✅ Estado: Confirmado

Sistema envía WhatsApp automático:
📱 "Hola María, tu turno está confirmado:
   📅 Miércoles 28/05/26
   🕒 16:00hs
   👨‍⚕️ Dr. Diego Pérez — Traumatología
   📍 Consultorio 3
   
   📄 Documentación a traer:
   • DNI
   • Credencial OSDE
   • Orden médica (si la tenés)
   • Estudios previos relacionados
   
   ⏰ Por favor, llegá 10 minutos antes"

---

DÍA DEL TURNO — MIÉRCOLES 28/05 (15:50)

María llega a la clínica.

Recepcionista verifica:
✅ Turno confirmado
✅ DNI coincide
✅ Credencial OSDE activa (sistema consulta padrón online)

Recepcionista imprime:
- Ficha de atención #1891
- Formulario de historia clínica (primera vez)

María completa:
- Antecedentes personales (alergias, cirugías previas, medicación actual)
- Antecedentes familiares (diabetes, hipertensión, cáncer)
- Motivo de consulta: "Dolor en rodilla derecha hace 2 semanas"

16:00 — Dr. Pérez la llama desde sala de espera

Consultorio 3:
Dr. Pérez abre el sistema → ve:
- Paciente nueva (sin historial previo)
- Formulario de antecedentes completado por María
- Obra social: OSDE 310 (cobertura 100% consultas traumatología)

Dr. Pérez realiza consulta:
- Anamnesis: dolor al bajar escaleras, no hubo traumatismo previo
- Examen físico: dolor a la palpación, sin inflamación visible
- Diagnóstico presuntivo: Tendinitis rotuliana

Dr. Pérez carga en el sistema:
📝 HISTORIA CLÍNICA (Consulta #1 - 28/05/26):
   • Motivo: Dolor rodilla derecha
   • Examen físico: Dolor palpación tendón rotuliano, ROM completo, sin derrame
   • Diagnóstico: Tendinitis rotuliana (M76.5)
   • Tratamiento:
     - Ibuprofeno 600mg c/8hs x 7 días
     - Reposo relativo (evitar escaleras)
     - Hielo local 15min 3x/día
   • Estudios solicitados:
     - Radiografía de rodilla derecha (frente y perfil)
   • Indicaciones:
     - Volver en 15 días con radiografía
     - Si empeora antes, consultar antes

Sistema genera automáticamente:
✅ Receta digital PDF (firmada electrónicamente por Dr. Pérez)
✅ Pedido de estudio (Radiografía rodilla derecha)
✅ Próximo turno sugerido (12/06/26)

María recibe en su email:
📧 Receta médica PDF
📧 Pedido de radiografía PDF
📧 Link para agendar próximo turno

16:20 — María se va

Facturación automática:
- OSDE 310 cubre 100% → No cobra a paciente
- Sistema genera:
  * Item factura: Consulta Traumatología — Mód. OSDE 310 — $15,000
  * Estado: Pendiente auditoría OSDE
  * Se factura a OSDE a fin de mes (consolidado)
```

---

### **HISTORIA 2: PACIENTE RECURRENTE — SEGUIMIENTO**

**Protagonista:** Jorge Fernández (58 años, cardiópata crónico, OSDE)

```
Jorge tiene historial en la clínica:
- 12 consultas previas (8 con Dra. Ana Martínez - Cardiología, 4 con Dr. Rodríguez - Clínica Médica)
- Diagnósticos:
  * Hipertensión arterial (2020)
  * Insuficiencia cardíaca FC II (2023)
- Medicación habitual:
  * Enalapril 10mg 1x/día
  * Carvedilol 12.5mg 2x/día
  * Furosemida 40mg 1x/día
- Última consulta: 15/04/26 (hace 6 semanas)

HOY — 28/05/26 — TURNO DE CONTROL CARDIOLÓGICO

10:00am — Jorge llega

Recepcionista:
👩‍💼 "Buen día Jorge, ¿turno con la Dra. Martínez?"
Jorge: "Sí, a las 10"
👩‍💼 "Perfecto, pasá. Consultorio 5"

Sistema muestra a la Dra. Martínez:
📊 HISTORIAL COMPLETO:
   • Paciente: Jorge Fernández (DNI 18.234.567)
   • Edad: 58 años
   • Diagnósticos activos:
     - HTA (2020)
     - IC FC II (2023)
   • Última consulta (15/04/26):
     - TA: 145/90
     - FC: 78 lpm
     - Sin edemas
     - Disnea CF II estable
   • Medicación actual:
     - Enalapril 10mg
     - Carvedilol 12.5mg
     - Furosemida 40mg
   • Estudios pendientes:
     - Ecocardiograma (pedido hace 6 semanas, NO REALIZADO AÚN)
     - Laboratorio (pedido hace 6 semanas, NO REALIZADO AÚN)

Dra. Martínez:
👩‍⚕️ "Hola Jorge, ¿cómo estás?"
Jorge: "Bien doctora, pero me cansé un poco más esta semana"
👩‍⚕️ "¿Hiciste los estudios que te pedí?"
Jorge: "No doctora, no pude sacar turno para el eco"

Dra. Martínez revisa:
- TA: 150/95 (un poco elevada)
- FC: 82 lpm
- Edemas leves en tobillos

Dra. Martínez carga en sistema:
📝 CONSULTA DE HOY (28/05/26):
   • TA: 150/95 (elevada vs. última vez)
   • FC: 82 lpm
   • Edemas +/++++ en MMII
   • Disnea CF II → CF III (empeoró)
   • Estudios NO realizados
   
   PLAN:
   • Ajustar dosis: Furosemida 40mg → 60mg
   • URGENTE: Ecocardiograma (esta semana)
   • Laboratorio completo (creatinina, urea, ionograma)
   • Volver en 7 días con estudios

Sistema:
✅ Marca estudios previos como "vencidos"
✅ Genera NUEVOS pedidos (prioridad ALTA)
✅ Actualiza medicación en historial
✅ Genera receta nueva con dosis ajustada

Recepcionista le dice a Jorge al salir:
👩‍💼 "Jorge, la doctora pidió que hagas el eco con urgencia.
     ¿Querés que te agendemos acá mismo? Tenemos ecocardiogramas
     los martes y jueves con el Dr. Ramírez a las 8am"
Jorge: "Sí, por favor"
👩‍💼 "Te agendo el jueves 30/05 a las 8am"

Sistema crea:
✅ Turno #1923 — Jueves 30/05 8:00am — Ecocardiograma — Dr. Ramírez — Sala Eco
✅ Vinculado a pedido de estudio de Dra. Martínez
✅ Próximo turno con Dra. Martínez: 05/06/26 (para ver resultados)
```

---

### **HISTORIA 3: CONSULTA B2B — CHECK-UP EMPRESARIAL**

**Protagonista:** Industrias del Litoral SA (empresa cliente)

```
CONTEXTO:
- Industrias del Litoral tiene contrato anual con CentroMedicIntegral
- 120 empleados deben hacer check-up pre-ocupacional anual
- Check-up incluye:
  * Consulta clínica médica
  * Laboratorio completo (hemograma, glucemia, perfil lipídico)
  * Electrocardiograma
  * Radiografía de tórax
  * Audiometría

CASO: Empleado Carlos Ruiz (42 años)

Secretaria de RRHH de Industrias del Litoral llama:
📞 "Hola, necesito agendar check-up para Carlos Ruiz"

Secretaria clínica:
👩‍💼 "¿Es para el contrato de Industrias del Litoral?"
📞 "Sí, contrato 2026-IND-001"
👩‍💼 "Perfecto. ¿Qué puesto ocupa Carlos?"
📞 "Operario de planta"

Sistema busca:
- Contrato IND-001 → Check-up tipo "Operario industrial"
- Incluye: Clínica + Lab + ECG + Rx tórax + Audiometría
- Requiere: 5 turnos diferentes (1 por estudio)

👩‍💼 "Para hacer todo el check-up necesitamos que venga 2 días:
     DÍA 1: Extracción de sangre (7:30am en ayunas) + Clínica médica (8:30am)
     DÍA 2: ECG (9am) + Rx Tórax (9:30am) + Audiometría (10am)"

📞 "Perfecto, ¿tienen disponible para la semana que viene?"

👩‍💼 "Sí, puedo agendarle:
     Lunes 03/06: Lab 7:30am + Dr. González 8:30am
     Martes 04/06: ECG + Rx + Audio (todo seguido desde las 9am)"

Sistema crea:
✅ Cliente: Carlos Ruiz (empleado de Industrias del Litoral)
✅ 5 turnos vinculados al contrato B2B
✅ Facturación: NO a Carlos → a Industrias del Litoral SA (paquete)

Carlos viene el lunes 03/06:

7:30am — Extracción de sangre
8:30am — Consulta con Dr. González (clínica médica)

Dr. González:
- Revisa antecedentes
- Examen físico completo
- TA: 130/85
- FC: 72 lpm
- Sin hallazgos patológicos

Carga en sistema:
📝 CHECK-UP PRE-OCUPACIONAL (03/06/26):
   • TA: 130/85
   • FC: 72 lpm
   • IMC: 27.3 (sobrepeso leve)
   • Auscultación cardiopulmonar: Normal
   • Abdomen: Blando, depresible, sin masas
   • MMII: Sin edemas
   
   CONCLUSIÓN PARCIAL (pendiente estudios complementarios):
   • Apto provisorio
   • Sobrepeso leve → indicar dieta
   • Esperar resultados Lab/ECG/Rx/Audio

Martes 04/06 — Carlos hace:
- ECG (9am) → Normal
- Rx Tórax (9:30am) → Sin alteraciones
- Audiometría (10am) → Audición normal

Sistema notifica a Dr. González:
🔔 Todos los estudios de Carlos Ruiz completados

Dr. González revisa resultados:
- Lab: Glucemia 105 (límite alto), colesterol 220 (elevado)
- ECG: Normal
- Rx: Normal
- Audio: Normal

Dr. González emite INFORME FINAL:
📄 CERTIFICADO PRE-OCUPACIONAL:

   Paciente: Carlos Ruiz (DNI 25.678.901)
   Empresa: Industrias del Litoral SA
   Puesto: Operario de planta
   
   Fecha exámen: 03-04/06/2026
   
   RESULTADOS:
   • Examen físico: Normal
   • Laboratorio: Glucemia límite, colesterol elevado
   • ECG: Normal
   • Rx Tórax: Normal
   • Audiometría: Normal
   
   CONCLUSIÓN:
   ✅ APTO CON OBSERVACIONES
   
   OBSERVACIONES:
   • Dislipemia leve (colesterol 220 mg/dl)
   • Prediabetes (glucemia 105 mg/dl)
   • Sobrepeso (IMC 27.3)
   
   RECOMENDACIONES:
   • Control con nutricionista
   • Dieta hipocalórica e hipolipemiante
   • Actividad física regular
   • Control glucemia en 6 meses
   
   Dr. Javier González
   MN 41.234 - Clínica Médica

Sistema:
✅ PDF del certificado enviado a RRHH de Industrias del Litoral
✅ Facturación: $45,000 al contrato B2B (pack completo)
✅ Carlos NO paga nada
```

---

## ❓ PREGUNTAS CRÍTICAS SIN RESPONDER

### **CATEGORÍA 1: HORARIOS Y DISPONIBILIDAD**

#### **P1.1: ¿Los horarios son fijos semanales o variables?**

**Opciones:**
- **A)** Fijos semanales (ej: Dr. Pérez siempre atiende lunes/miércoles 14-20hs)
- **B)** Variables semanales (ej: Dr. Pérez esta semana lunes, la próxima martes)
- **C)** Configurables por período (ej: Dr. Pérez de mayo-julio lunes, de agosto-octubre martes)

**Implicancias en BD:**
- Opción A → tabla `disponibilidad_profesionales` con `dia_semana` (1-7)
- Opción B → tabla `horarios_semanales` con `fecha_inicio` + `fecha_fin`
- Opción C → tabla `configuracion_horarios` con rangos de fechas

**Mi recomendación:** Opción A con override puntual (si un lunes específico no atiende)

---

#### **P1.2: ¿Un profesional puede atender en múltiples consultorios en el mismo día?**

**Ejemplos:**
- Dr. Pérez: Lunes 9-13hs en Consultorio 2, Lunes 14-18hs en Consultorio 5
- Dra. González: Martes 8-12hs en Consultorio 3 (centro), Martes 15-19hs en Consultorio Anexo (otra sede)

**Implicancias:**
- SI → `disponibilidad_profesionales` necesita columna `consultorio_id`
- NO → se asigna consultorio dinámicamente al crear turno

**Mi recomendación:** SÍ, vincular disponibilidad a consultorio específico

---

#### **P1.3: ¿Hay especialidades que requieren equipamiento especial en el consultorio?**

**Ejemplos:**
- Cardiología → Consultorio con camilla + electrocardiógrafo + esfigmomanómetro
- Oftalmología → Consultorio con lámpara de hendidura + optotipo
- Ginecología → Consultorio con camilla ginecológica + colposcopio

**Implicancias:**
- SI → tabla `consultorios` necesita columna `equipamiento` (JSONB)
- Al agendar turno de Cardiología, solo ofrecer consultorios con equipamiento cardio

**Mi recomendación:** SÍ, consultorios especializados

---

#### **P1.4: ¿Cómo se maneja la duración variable de consultas?**

**Ejemplos:**
- Pediatría primera vez: 30 min
- Pediatría control: 15 min
- Cirugía pre-operatoria: 45 min
- Nutrición primera vez: 60 min

**Opciones:**
- **A)** Duración fija por especialidad
- **B)** Duración configurable por profesional
- **C)** Duración configurable por tipo de consulta

**Implicancias:**
- Opción A → `especialidades.duracion_consulta` (simple pero rígido)
- Opción B → `disponibilidad_profesionales.duracion_turno` (flexible por médico)
- Opción C → tabla `tipos_consulta` (primera_vez, control, urgencia) con duración

**Mi recomendación:** Opción C (más flexible)

---

### **CATEGORÍA 2: HISTORIA CLÍNICA**

#### **P2.1: ¿La historia clínica es global o por especialidad?**

**Opciones:**
- **A)** Global: Un solo historial, todos los médicos ven todo
- **B)** Por especialidad: Cardiología no ve lo que escribió Traumatología
- **C)** Híbrida: Datos generales compartidos + notas específicas por especialidad

**Implicancias:**
- Opción A → tabla `historias_clinicas` simple
- Opción B → tabla `historias_clinicas` con `especialidad_id` (filtrado)
- Opción C → tabla `datos_generales_paciente` + tabla `consultas` con notas

**Mi recomendación:** Opción C (datos generales compartidos + consultas privadas)

---

#### **P2.2: ¿Qué médicos pueden ver la historia clínica de un paciente?**

**Opciones:**
- **A)** Solo el médico tratante
- **B)** Todos los médicos de la clínica
- **C)** Solo médicos que el paciente autorizó

**Implicancias legales:**
- Opción A → máxima privacidad pero dificulta derivaciones
- Opción B → más práctico pero puede violar privacidad
- Opción C → cumple con consentimiento informado pero complica operación

**Mi recomendación:** Opción B con auditoría (log de quién accedió)

---

#### **P2.3: ¿Los antecedentes se actualizan automáticamente o manualmente?**

**Ejemplos:**
- Paciente tiene "Hipertensión" en antecedentes
- Hoy el cardiólogo diagnostica "Diabetes tipo 2"
- ¿Se agrega automáticamente a antecedentes? ¿O queda solo en la nota de consulta?

**Implicancias:**
- Automático → tabla `diagnosticos_activos` se actualiza con cada consulta
- Manual → médico debe agregar manualmente a "Antecedentes"

**Mi recomendación:** Manual (médico decide si es crónico/relevante)

---

### **CATEGORÍA 3: ESTUDIOS Y RECETAS**

#### **P3.1: ¿Los pedidos de estudios se vinculan a turnos automáticamente?**

**Ejemplos:**
- Dr. Pérez pide "Radiografía de rodilla"
- ¿El sistema ofrece agendar turno para radiografía EN LA CLÍNICA si tienen servicio?
- ¿O solo genera PDF para que paciente haga en otro lado?

**Implicancias:**
- SI → integración con DiagCentro (si la clínica tiene servicio de imágenes)
- NO → solo PDF externo

**Mi recomendación:** Ambas opciones (checkbox "Agendar en esta clínica" vs. "PDF externo")

---

#### **P3.2: ¿Las recetas tienen vencimiento?**

**Ejemplos:**
- Receta de Ibuprofeno: válida 30 días (ley argentina)
- Receta de psicofármacos: válida 30 días, triplicado (ley)

**Implicancias:**
- SI → columna `valida_hasta` en tabla `recetas`
- Sistema puede notificar a paciente "Tu receta vence en 5 días"

**Mi recomendación:** SÍ, con validez según tipo de medicamento

---

#### **P3.3: ¿Se puede renovar receta sin consulta presencial?**

**Ejemplos:**
- Paciente crónico (diabético) necesita insulina todos los meses
- ¿Puede pedir renovación por WhatsApp?
- ¿Médico puede emitir receta sin ver al paciente?

**Implicancias legales:**
- Depende de legislación local
- Si SÍ → flujo de "Solicitud de renovación" → Médico aprueba/rechaza

**Mi recomendación:** SÍ para medicación crónica habitual (con flag en sistema)

---

### **CATEGORÍA 4: FACTURACIÓN**

#### **P4.1: ¿Cómo se calcula el valor de consulta con obra social?**

**Opciones:**
- **A)** Módulo fijo por especialidad (ej: Traumatología = 1 módulo OSDE)
- **B)** Nomenclador externo (ej: API de OSDE devuelve valor)
- **C)** Valor negociado por clínica (tabla propia)

**Implicancias:**
- Opción A → tabla `especialidades.modulos_obra_social`
- Opción B → integración API externa
- Opción C → tabla `tarifas_obras_sociales` (empresa_id, obra_social_id, especialidad_id, precio)

**Mi recomendación:** Opción C (más control)

---

#### **P4.2: ¿Qué pasa si obra social rechaza la auditoría?**

**Ejemplos:**
- Clínica factura $15,000 por consulta traumatológica
- OSDE audita y dice: "No corresponde, paciente ya consultó este mes"
- Estado de factura: "Rechazada"

**Flujo:**
1. ¿Se le cobra al paciente? (a posteriori)
2. ¿Hay apelación?
3. ¿Se puede refacturar?

**Implicancias:**
- Necesita tabla `auditoria_obras_sociales` con estados y notas

**Mi recomendación:** SÍ, flujo de auditoría con estados (pendiente → aprobada → rechazada → apelación)

---

## 🗂️ ENTIDADES Y RELACIONES

### **DIAGRAMA DE ENTIDADES (VISTA MACRO):**

```
┌─────────────────────────────────────────────────────────────┐
│                        EMPRESA                              │
│  (CentroMedicIntegral)                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┬─────────────┐
                │             │             │             │
                ▼             ▼             ▼             ▼
          ┌─────────┐   ┌──────────┐  ┌─────────┐  ┌─────────┐
          │  SEDES  │   │ESPECIALI-│  │CONSUL-  │  │PROFESIO-│
          │         │   │  DADES   │  │ TORIOS  │  │  NALES  │
          └─────────┘   └──────────┘  └─────────┘  └─────────┘
                │             │             │             │
                └─────────────┼─────────────┴─────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ DISPONIBILIDAD    │
                    │  PROFESIONALES    │
                    │ (horarios config) │
                    └───────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │              TURNOS                   │
          │  (consulta agendada)                  │
          └───────────────────────────────────────┘
                    │               │
            ┌───────┘               └───────┐
            ▼                               ▼
    ┌──────────────┐               ┌──────────────┐
    │  CONSULTAS   │               │   CLIENTES   │◄──────┐
    │ (consulta    │               │  (pacientes) │       │
    │  realizada)  │               │              │       │
    └──────────────┘               └──────────────┘       │
            │                               │              │
    ┌───────┼───────┬───────────────┐       │              │
    │       │       │               │       │              │
    ▼       ▼       ▼               ▼       ▼              │
┌───────┐┌────┐┌────────┐┌────────┐ ┌──────────────────┐  │
│RECETAS││DIAG││ESTUDIOS││FACTURA │ │ HISTORIA CLÍNICA │  │
│       ││NOS-││PEDIDOS ││        │ │   PACIENTE       │──┘
│       ││TICOS│        ││        │ │  (PERFIL MÉDICO) │
└───────┘└────┘└────────┘└────────┘ └──────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │ ANTECEDENTES    │
                                     │  (detalle)      │
                                     └─────────────────┘
```

### **RELACIONES CLAVE:**

#### **1. PACIENTE → PERFIL MÉDICO (1:1)**
```
CLIENTES
  └── HISTORIA_CLINICA_PACIENTE (1:1)
       • Datos demográficos (edad, sexo, grupo sanguíneo)
       • Contacto de emergencia
       • Obra social principal
       • Resumen de antecedentes (TEXT)
       • Alergias conocidas (TEXT)
       • Medicación habitual (TEXT)
       • Hábitos (fuma, alcohol, actividad física)
       • Screening (última mamografía, PAP, PSA)
       • Vacunas (JSONB)
```

#### **2. PERFIL MÉDICO → ANTECEDENTES (1:N)**
```
HISTORIA_CLINICA_PACIENTE
  └── ANTECEDENTES_PACIENTE (1:N - detalle estructurado)
       • Enfermedad: Hipertensión (código I10, desde 2020, activo)
       • Cirugía: Apendicectomía (2015, inactivo)
       • Alergia: Penicilina (activo) ← CRÍTICO para alertas
       • Medicación: Enalapril 10mg (activo)
       • Antecedente familiar: Padre diabético tipo 2
```

#### **3. PACIENTE → CONSULTAS (1:N - historial cronológico)**
```
CLIENTES
  └── CONSULTAS (1:N - una por cada visita)
       • Fecha: 28/05/26
       • Profesional: Dr. Pérez
       • Especialidad: Traumatología
       • Diagnóstico: Tendinitis rotuliana
       • Tratamiento: Ibuprofeno 600mg
       └── RECETAS (1:N)
       └── ESTUDIOS_PEDIDOS (1:N)
       └── FACTURAS (1:1)
```

---

## 🗄️ ESQUEMA DE BD PROPUESTO

### **TABLA 1: `especialidades`**

```sql
CREATE TABLE setubalai.especialidades (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  nombre VARCHAR(100) NOT NULL,           -- "Cardiología", "Traumatología"
  codigo VARCHAR(20),                     -- Código interno (opcional)
  descripcion TEXT,
  
  duracion_default_minutos INT DEFAULT 20,
  activa BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(empresa_id, nombre)
);

CREATE INDEX idx_especialidades_empresa ON setubalai.especialidades(empresa_id);

COMMENT ON TABLE setubalai.especialidades IS 
  'Especialidades médicas disponibles en la clínica';
```

**Justificación:**
- Separar especialidades de profesionales (un profesional puede tener múltiples especialidades)
- `duracion_default_minutos` permite configurar tiempos promedio por especialidad

---

### **TABLA 2: `profesionales` (EXTENDIDA)**

```sql
-- Ya existe de Fase 1, pero agregamos relación muchos-a-muchos con especialidades

CREATE TABLE setubalai.profesionales_especialidades (
  id SERIAL PRIMARY KEY,
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id) ON DELETE CASCADE,
  especialidad_id INT NOT NULL REFERENCES setubalai.especialidades(id) ON DELETE CASCADE,
  
  es_principal BOOLEAN DEFAULT false,     -- ¿Es la especialidad principal del profesional?
  duracion_consulta_minutos INT,          -- Override de duración para este profesional
  
  UNIQUE(profesional_id, especialidad_id)
);

COMMENT ON TABLE setubalai.profesionales_especialidades IS 
  'Relación N:M entre profesionales y especialidades. Un médico puede tener varias especialidades.';

-- Ejemplo:
-- Dr. González: Clínica Médica (principal) + Geriatría (secundaria)
```

---

### **TABLA 3: `consultorios`**

```sql
CREATE TABLE setubalai.consultorios (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  sede_id INT NOT NULL REFERENCES setubalai.sedes(id) ON DELETE CASCADE,
  
  numero VARCHAR(20) NOT NULL,            -- "Consultorio 3", "Sala B"
  piso VARCHAR(10),                       -- "Planta Baja", "Piso 2"
  
  equipamiento JSONB DEFAULT '{}',        -- {"camilla": true, "ecografo": false}
  especialidades_compatibles INT[],       -- Array de IDs de especialidades que pueden usar este consultorio
  
  capacidad_personas INT DEFAULT 2,       -- Médico + paciente (o acompañante)
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultorios_sede ON setubalai.consultorios(sede_id);

COMMENT ON COLUMN setubalai.consultorios.equipamiento IS 
  'JSON con equipamiento disponible: {"ecografo": true, "camilla_ginecologica": false}';
COMMENT ON COLUMN setubalai.consultorios.especialidades_compatibles IS 
  'Array de IDs de especialidades. NULL = todas las especialidades pueden usar este consultorio';
```

**Justificación:**
- `especialidades_compatibles` evita que se agenden turnos de Ginecología en un consultorio sin equipamiento adecuado

---

### **TABLA 4: `disponibilidad_profesionales`**

```sql
CREATE TABLE setubalai.disponibilidad_profesionales (
  id SERIAL PRIMARY KEY,
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id) ON DELETE CASCADE,
  especialidad_id INT NOT NULL REFERENCES setubalai.especialidades(id),
  consultorio_id INT NOT NULL REFERENCES setubalai.consultorios(id),
  
  dia_semana INT NOT NULL,                -- 1=lunes, 7=domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  
  duracion_turno_minutos INT NOT NULL,    -- Duración de cada turno (15, 20, 30 min)
  
  activo BOOLEAN DEFAULT true,
  fecha_inicio DATE DEFAULT CURRENT_DATE, -- Desde cuándo aplica este horario
  fecha_fin DATE,                         -- NULL = sin límite
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_hora_valida CHECK (hora_fin > hora_inicio),
  CONSTRAINT check_dia_semana CHECK (dia_semana BETWEEN 1 AND 7)
);

CREATE INDEX idx_disponibilidad_profesional ON setubalai.disponibilidad_profesionales(profesional_id, dia_semana);
CREATE INDEX idx_disponibilidad_especialidad ON setubalai.disponibilidad_profesionales(especialidad_id);

COMMENT ON TABLE setubalai.disponibilidad_profesionales IS 
  'Horarios semanales fijos por profesional + especialidad + consultorio';

COMMENT ON COLUMN setubalai.disponibilidad_profesionales.duracion_turno_minutos IS 
  'Duración de cada slot de turno. Ej: Dr. Pérez atiende turnos de 20min';

-- Ejemplo:
-- Dr. Pérez (Traumatología) → Lunes 14-20hs → Consultorio 3 → Turnos de 20min
-- Dra. González (Pediatría) → Martes 9-13hs → Consultorio 5 → Turnos de 15min
```

**Justificación:**
- Relaciona profesional + especialidad + consultorio + horario
- Un profesional puede tener múltiples bloques (mañana en Consultorio 2, tarde en Consultorio 5)
- `fecha_inicio` y `fecha_fin` permiten configurar horarios temporales (ej: "Dr. Pérez de vacaciones del 01/06 al 15/06")

---

### **TABLA 5: `excepciones_disponibilidad`**

```sql
CREATE TABLE setubalai.excepciones_disponibilidad (
  id SERIAL PRIMARY KEY,
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id) ON DELETE CASCADE,
  
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  
  tipo VARCHAR(20) NOT NULL,              -- "ausencia", "feriado", "congreso", "licencia"
  motivo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_tipo_excepcion CHECK (tipo IN ('ausencia', 'feriado', 'congreso', 'licencia', 'vacaciones'))
);

CREATE INDEX idx_excepciones_fecha ON setubalai.excepciones_disponibilidad(profesional_id, fecha);

COMMENT ON TABLE setubalai.excepciones_disponibilidad IS 
  'Excepciones puntuales a la disponibilidad regular (ausencias, feriados, licencias)';

-- Ejemplo:
-- Dr. Pérez NO atiende el 01/06/26 (congreso médico)
-- Sistema NO ofrece turnos con Dr. Pérez ese día
```

---

### **TABLA 6: `turnos` (YA DEFINIDA EN FASE 2, PERO EXTENDIDA)**

```sql
-- Agregar columnas adicionales para clínicas médicas:

ALTER TABLE setubalai.turnos
  ADD COLUMN especialidad_id INT REFERENCES setubalai.especialidades(id),
  ADD COLUMN consultorio_id INT REFERENCES setubalai.consultorios(id),
  ADD COLUMN tipo_consulta VARCHAR(50) DEFAULT 'primera_vez',
  ADD COLUMN obra_social_id INT REFERENCES setubalai.clientes(id),  -- Obra social del paciente
  ADD COLUMN plan_obra_social VARCHAR(50),
  ADD COLUMN numero_afiliado VARCHAR(100),
  ADD COLUMN requiere_autorizacion BOOLEAN DEFAULT false,
  ADD COLUMN autorizacion_numero VARCHAR(100),
  ADD COLUMN recordatorio_24hs_enviado BOOLEAN DEFAULT false,
  ADD COLUMN recordatorio_1h_enviado BOOLEAN DEFAULT false;

COMMENT ON COLUMN setubalai.turnos.tipo_consulta IS 
  'primera_vez | control | urgencia | interconsulta';
COMMENT ON COLUMN setubalai.turnos.requiere_autorizacion IS 
  'TRUE si la obra social requiere autorización previa (ej: algunas especialidades)';
```

---

### **TABLA 7: `consultas` (NUEVA — LA MÁS IMPORTANTE)**

```sql
CREATE TABLE setubalai.consultas (
  id SERIAL PRIMARY KEY,
  turno_id INT NOT NULL REFERENCES setubalai.turnos(id) ON DELETE CASCADE,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  cliente_id INT NOT NULL REFERENCES setubalai.clientes(id),
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id),
  especialidad_id INT NOT NULL REFERENCES setubalai.especialidades(id),
  
  fecha_consulta TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Motivo de consulta
  motivo_consulta TEXT NOT NULL,
  
  -- Examen físico / Anamnesis
  anamnesis TEXT,
  examen_fisico TEXT,
  
  -- Signos vitales
  peso_kg NUMERIC(5,2),
  altura_cm NUMERIC(5,2),
  imc NUMERIC(4,2),                       -- Calculado automáticamente
  temperatura_c NUMERIC(4,2),
  presion_sistolica INT,
  presion_diastolica INT,
  frecuencia_cardiaca INT,
  frecuencia_respiratoria INT,
  saturacion_o2 INT,
  
  -- Diagnósticos (pueden ser múltiples)
  diagnostico_principal TEXT,
  diagnosticos_secundarios JSONB,         -- Array de diagnósticos adicionales
  codigos_cie10 VARCHAR(20)[],            -- Array de códigos CIE-10
  
  -- Plan de tratamiento
  plan_tratamiento TEXT,
  indicaciones TEXT,
  
  -- Metadata
  estado VARCHAR(20) DEFAULT 'completada', -- "completada", "pendiente_firma", "en_revision"
  firmada_digitalmente BOOLEAN DEFAULT false,
  fecha_firma TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consultas_paciente ON setubalai.consultas(cliente_id, fecha_consulta DESC);
CREATE INDEX idx_consultas_profesional ON setubalai.consultas(profesional_id, fecha_consulta DESC);
CREATE INDEX idx_consultas_especialidad ON setubalai.consultas(especialidad_id);

COMMENT ON TABLE setubalai.consultas IS 
  'Registro de la consulta médica realizada. Es el núcleo de la historia clínica.';

COMMENT ON COLUMN setubalai.consultas.codigos_cie10 IS 
  'Array de códigos CIE-10 para diagnósticos (ej: {"I10", "E11.9"})';
```

**Justificación CRÍTICA:**
- Esta tabla ES la historia clínica
- Separada de `turnos` porque un turno puede cancelarse, pero una consulta solo existe si se realizó
- `consultas` tiene toda la información médica
- `turnos` solo tiene información administrativa

---

### **TABLA 8: `recetas`**

```sql
CREATE TABLE setubalai.recetas (
  id SERIAL PRIMARY KEY,
  consulta_id INT NOT NULL REFERENCES setubalai.consultas(id) ON DELETE CASCADE,
  
  cliente_id INT NOT NULL REFERENCES setubalai.clientes(id),
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id),
  
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  valida_hasta DATE NOT NULL,             -- Fecha de vencimiento
  
  medicamentos JSONB NOT NULL,            -- Array de medicamentos
  -- Ejemplo: [
  --   {
  --     "nombre": "Ibuprofeno 600mg",
  --     "dosis": "1 comprimido cada 8 horas",
  --     "duracion": "7 días",
  --     "cantidad": "21 comprimidos"
  --   }
  -- ]
  
  indicaciones_generales TEXT,
  
  tipo_receta VARCHAR(20) DEFAULT 'simple', -- "simple", "duplicado", "triplicado"
  
  archivo_pdf_url TEXT,                   -- PDF firmado digitalmente
  estado VARCHAR(20) DEFAULT 'activa',    -- "activa", "vencida", "utilizada", "anulada"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recetas_paciente ON setubalai.recetas(cliente_id, fecha_emision DESC);
CREATE INDEX idx_recetas_estado ON setubalai.recetas(estado, valida_hasta);

COMMENT ON COLUMN setubalai.recetas.tipo_receta IS 
  'simple (medicación común) | duplicado (psicotrópicos) | triplicado (estupefacientes)';
```

---

### **TABLA 9: `estudios_pedidos`**

```sql
CREATE TABLE setubalai.estudios_pedidos (
  id SERIAL PRIMARY KEY,
  consulta_id INT NOT NULL REFERENCES setubalai.consultas(id) ON DELETE CASCADE,
  
  cliente_id INT NOT NULL REFERENCES setubalai.clientes(id),
  profesional_id INT NOT NULL REFERENCES setubalai.profesionales(id),
  
  tipo_estudio VARCHAR(100) NOT NULL,     -- "Radiografía de rodilla", "Laboratorio completo"
  descripcion TEXT,
  urgente BOOLEAN DEFAULT false,
  
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  valido_hasta DATE,                      -- Algunos estudios vencen (ej: pedidos de obra social)
  
  -- Vinculación con turno (si se agenda en la misma clínica)
  turno_estudio_id INT REFERENCES setubalai.turnos(id),
  
  estado VARCHAR(20) DEFAULT 'pendiente', -- "pendiente", "realizado", "vencido"
  fecha_realizacion DATE,
  resultado_url TEXT,                     -- URL del resultado (PDF, imágenes)
  
  archivo_pedido_pdf_url TEXT,            -- PDF del pedido médico
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_estudios_paciente ON setubalai.estudios_pedidos(cliente_id, estado);
CREATE INDEX idx_estudios_pendientes ON setubalai.estudios_pedidos(estado, fecha_emision);

COMMENT ON TABLE setubalai.estudios_pedidos IS 
  'Pedidos de estudios complementarios (laboratorio, imágenes, etc.)';
```

---

### **TABLA 10: `historia_clinica_paciente` (PERFIL MÉDICO MAESTRO)**

```sql
CREATE TABLE setubalai.historia_clinica_paciente (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL UNIQUE REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
  empresa_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  
  -- Datos demográficos médicos
  fecha_nacimiento DATE NOT NULL,
  edad_actual INT GENERATED ALWAYS AS (EXTRACT(YEAR FROM AGE(fecha_nacimiento))) STORED,
  sexo VARCHAR(20),                       -- "masculino", "femenino", "otro"
  estado_civil VARCHAR(50),
  ocupacion VARCHAR(100),
  
  -- Datos antropométricos actuales
  peso_kg NUMERIC(5,2),
  altura_cm NUMERIC(5,2),
  imc NUMERIC(4,2) GENERATED ALWAYS AS (
    CASE WHEN altura_cm > 0 THEN peso_kg / ((altura_cm/100) * (altura_cm/100)) ELSE NULL END
  ) STORED,
  grupo_sanguineo VARCHAR(10),            -- "O+", "A-", etc.
  
  -- Contacto de emergencia
  contacto_emergencia_nombre VARCHAR(200),
  contacto_emergencia_relacion VARCHAR(50),
  contacto_emergencia_telefono VARCHAR(50),
  
  -- Cobertura médica principal
  obra_social_principal VARCHAR(100),
  plan_obra_social VARCHAR(50),
  numero_afiliado VARCHAR(100),
  
  -- Antecedentes GENERALES (resumen)
  antecedentes_personales TEXT,           -- Resumen de enfermedades crónicas
  antecedentes_familiares TEXT,           -- Padres/hermanos con diabetes, cáncer, etc.
  cirugias_previas TEXT,                  -- Lista de cirugías
  alergias_conocidas TEXT,                -- Penicilina, otros antibióticos, alimentos
  medicacion_habitual TEXT,               -- Resumen de medicación crónica
  
  -- Hábitos
  fuma BOOLEAN DEFAULT false,
  fuma_cantidad VARCHAR(50),              -- "10 cigarrillos/día"
  consume_alcohol BOOLEAN DEFAULT false,
  alcohol_frecuencia VARCHAR(50),         -- "Ocasional", "Diario"
  actividad_fisica VARCHAR(50),           -- "Sedentario", "Moderado", "Intenso"
  
  -- Screening / Prevención
  ultima_mamografia DATE,
  ultimo_pap DATE,
  ultimo_psa DATE,
  ultima_colonoscopia DATE,
  
  -- Vacunación
  vacunas JSONB DEFAULT '{}',             -- {"covid": "3 dosis", "antigripal": "2024", "tetanos": "2020"}
  
  -- Metadata
  historia_clinica_completa BOOLEAN DEFAULT false,  -- TRUE cuando se completó formulario inicial
  fecha_primera_consulta DATE,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historia_clinica_paciente ON setubalai.historia_clinica_paciente(cliente_id);
CREATE INDEX idx_historia_clinica_empresa ON setubalai.historia_clinica_paciente(empresa_id);

COMMENT ON TABLE setubalai.historia_clinica_paciente IS 
  'Perfil médico maestro del paciente. Consolidación de datos demográficos, antecedentes generales, hábitos, y screening. Es el "header" de toda la historia clínica.';

COMMENT ON COLUMN setubalai.historia_clinica_paciente.edad_actual IS 
  'Calculada automáticamente desde fecha_nacimiento';

COMMENT ON COLUMN setubalai.historia_clinica_paciente.imc IS 
  'Índice de Masa Corporal calculado automáticamente: peso / (altura^2)';

-- Trigger para actualizar última actualización
CREATE OR REPLACE FUNCTION update_historia_clinica_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_historia_clinica
BEFORE UPDATE ON setubalai.historia_clinica_paciente
FOR EACH ROW
EXECUTE FUNCTION update_historia_clinica_timestamp();
```

**Justificación CRÍTICA:**
Esta tabla es el **"perfil médico" o "carátula" del paciente**. Todo médico que atiende al paciente debe ver primero esta pantalla antes de iniciar la consulta:
- Datos básicos: edad, sexo, grupo sanguíneo
- Contacto de emergencia (crucial)
- Resumen de antecedentes (para no leer 50 consultas anteriores)
- Alergias (CRÍTICO para no recetar medicamentos que causen reacción)
- Medicación habitual (para evitar interacciones)
- Hábitos (tabaco, alcohol, sedentarismo)

---

### **TABLA 11: `antecedentes_paciente` (DETALLE)**

```sql
CREATE TABLE setubalai.antecedentes_paciente (
  id SERIAL PRIMARY KEY,
  cliente_id INT NOT NULL REFERENCES setubalai.clientes(id) ON DELETE CASCADE,
  
  tipo VARCHAR(50) NOT NULL,              -- "enfermedad", "cirugia", "alergia", "medicacion_habitual", "antecedente_familiar"
  
  descripcion TEXT NOT NULL,
  codigo_cie10 VARCHAR(20),               -- Código CIE-10 si aplica
  fecha_desde DATE,                       -- Cuándo empezó (ej: HTA desde 2020)
  fecha_hasta DATE,                       -- NULL si es actual
  
  activo BOOLEAN DEFAULT true,            -- FALSE si se resolvió (ej: alergia que ya no tiene)
  
  agregado_por_profesional_id INT REFERENCES setubalai.profesionales(id),
  agregado_en_consulta_id INT REFERENCES setubalai.consultas(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_antecedentes_paciente ON setubalai.antecedentes_paciente(cliente_id, activo);

COMMENT ON TABLE setubalai.antecedentes_paciente IS 
  'Detalle de antecedentes médicos del paciente. Complementa historia_clinica_paciente con registros estructurados.';

-- Ejemplo:
-- Cliente: Jorge Fernández
-- Tipo: enfermedad → "Hipertensión arterial" (código I10, desde 2020, activo)
-- Tipo: cirugia → "Apendicectomía" (2015, inactivo)
-- Tipo: alergia → "Penicilina" (activo) ← ESTE ES CRÍTICO
-- Tipo: medicacion_habitual → "Enalapril 10mg" (activo)
-- Tipo: antecedente_familiar → "Padre diabético tipo 2"
```

**Justificación:**
- `historia_clinica_paciente` tiene el RESUMEN en TEXT (para lectura rápida)
- `antecedentes_paciente` tiene el DETALLE estructurado (para queries y alertas)
- Ejemplo: Si un médico receta Penicilina y el paciente tiene alergia registrada, sistema alerta automáticamente

---

### **TABLA 11: `contratos_empresas` (para B2B)**

```sql
CREATE TABLE setubalai.contratos_empresas (
  id SERIAL PRIMARY KEY,
  empresa_clinica_id INT NOT NULL REFERENCES setubalai.empresa(id) ON DELETE CASCADE,
  empresa_cliente_id INT NOT NULL REFERENCES setubalai.clientes(id),
  
  numero_contrato VARCHAR(100) UNIQUE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  
  tipo_servicio VARCHAR(50),              -- "check_up_preocupacional", "medicina_laboral", "atencion_emergencias"
  
  paquetes_incluidos JSONB,               -- Qué incluye cada paquete
  -- Ejemplo: {
  --   "operario": ["consulta_clinica", "lab_completo", "ecg", "rx_torax", "audiometria"],
  --   "administrativo": ["consulta_clinica", "lab_basico", "ecg"]
  -- }
  
  precio_paquete NUMERIC(15,2),
  moneda VARCHAR(10) DEFAULT 'USD',
  
  cantidad_empleados INT,
  
  activo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contratos_cliente ON setubalai.contratos_empresas(empresa_cliente_id);

COMMENT ON TABLE setubalai.contratos_empresas IS 
  'Contratos con empresas para servicios B2B (check-ups laborales, medicina del trabajo)';
```

---

## 🚨 CASOS EDGE QUE ROMPEN EL SISTEMA

### **CASO EDGE 1: PROFESIONAL SE AUSENTA A ÚLTIMO MOMENTO**

**Escenario:**
```
Hoy es lunes 03/06, 8:00am
Dr. Pérez tiene 12 turnos agendados para hoy (de 14hs a 20hs)
A las 8:30am llama diciendo que está enfermo y no puede atender
```

**Problema:**
- 12 pacientes tienen turnos confirmados
- ¿Cómo se notifica a TODOS?
- ¿Se reagendan automáticamente?
- ¿Se ofrecen opciones con otros traumatólogos?

**Solución Propuesta:**
```sql
-- 1. Crear excepción de disponibilidad
INSERT INTO setubalai.excepciones_disponibilidad (profesional_id, fecha, tipo, motivo)
VALUES (5, '2026-06-03', 'ausencia', 'Enfermedad');

-- 2. Sistema detecta turnos afectados
SELECT * FROM setubalai.turnos
WHERE profesional_id = 5
  AND fecha_hora::DATE = '2026-06-03'
  AND estado = 'confirmado';

-- 3. Cambiar estado a "cancelado_reprogramar"
UPDATE setubalai.turnos SET estado = 'cancelado_reprogramar' WHERE ...;

-- 4. Enviar notificaciones masivas (WhatsApp/SMS/Email)
-- 5. Ofrecer opciones:
--    a) Reagendar con Dr. Pérez (próxima disponibilidad: miércoles 05/06)
--    b) Agendar con Dra. Fernández (hoy mismo 17hs)
```

---

### **CASO EDGE 2: PACIENTE LLEGA TARDE**

**Escenario:**
```
Turno: 10:00am — Dr. González — Pediatría
Paciente llega: 10:25am (25 min tarde)
Próximo turno: 10:20am (ya está esperando)
```

**Problema:**
- ¿Se atiende igual?
- ¿Se le cobra igual?
- ¿Afecta los turnos siguientes?

**Solución Propuesta:**
```
POLÍTICA DE LA CLÍNICA (configurable):
- Tolerancia: 10 minutos
- Si llega después de 10 min → se atiende al FINAL
- Sistema:
  1. Marca turno como "llegada_tarde"
  2. Recepcionista avisa: "El doctor te va a atender después del último turno"
  3. Turno se mueve a las 13:00 (último disponible)
```

---

### **CASO EDGE 3: PACIENTE CON MÚLTIPLES OBRAS SOCIALES**

**Escenario:**
```
Paciente: María López
Obra social principal: OSDE 310
Obra social secundaria: Swiss Medical

Consulta con Traumatólogo:
¿A cuál obra social se factura?
```

**Solución:**
```
Recepcionista pregunta al agendar turno:
"¿Con qué obra social querés usar el turno?"

Sistema guarda en turno:
- obra_social_id = OSDE
- plan_obra_social = "310"
- numero_afiliado = "123456789"

Facturación → OSDE
```

---

### **CASO EDGE 4: HISTORIA CLÍNICA CONFIDENCIAL**

**Escenario:**
```
Paciente consulta a Psicología (depresión)
Paciente consulta a Traumatología (esguince)

¿El traumatólogo puede ver las notas del psicólogo?
```

**Solución:**
```
OPCIÓN A (más segura pero más compleja):
- Tabla consultas tiene flag "confidencial"
- Solo el profesional que creó la consulta puede verla
- Otros médicos ven "[Consulta confidencial - Psicología 05/06/26]" (sin detalles)

OPCIÓN B (más práctica):
- Toda la historia clínica es visible para todos los profesionales
- Se registra AUDITORÍA de quién accedió
- Si hay mal uso → sanción legal al profesional

Mi recomendación: OPCIÓN B con auditoría
```

---

### **CASO EDGE 5: RECETA VENCIDA**

**Escenario:**
```
Dr. Pérez emite receta de Ibuprofeno el 01/06/26
Receta válida hasta 30/06/26 (30 días)

Paciente va a farmacia el 05/07/26 (receta vencida)
Farmacia rechaza

Paciente llama: "Necesito que me renueven la receta"
```

**Flujo:**
```
1. Secretaria verifica:
   - Paciente: Jorge Fernández
   - Última consulta: 01/06/26 (Dr. Pérez)
   - Medicación: Ibuprofeno (tratamiento AGUDO, no crónico)

2. Secretaria:
   "Para renovar la receta necesitás volver a consultar con el doctor"

3. Si fuera medicación CRÓNICA (ej: Enalapril para HTA):
   Secretaria:
   "Le pido autorización al doctor para renovar sin consulta"
   
   Sistema:
   - Crea "Solicitud renovación receta" (estado: pendiente)
   - Dr. Pérez revisa desde su app:
     * Ve historial del paciente
     * Aprueba renovación
   - Sistema genera nueva receta (válida 30 días)
```

---

## 🔄 FLUJO OPERATIVO COMPLETO (DIAGRAMA)

### **FLUJO 1: AGENDAR TURNO**

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. SOLICITUD DE TURNO                                            │
├──────────────────────────────────────────────────────────────────┤
│ Input: Paciente llama/entra a web                                │
│ Datos requeridos:                                                │
│ • Especialidad deseada                                           │
│ • Obra social (opcional)                                         │
│ • Preferencia de profesional (opcional)                          │
│ • Preferencia de horario (opcional)                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. SISTEMA BUSCA DISPONIBILIDAD                                  │
├──────────────────────────────────────────────────────────────────┤
│ Query:                                                           │
│ SELECT p.nombre, d.dia_semana, d.hora_inicio, d.consultorio_id  │
│ FROM disponibilidad_profesionales d                              │
│ JOIN profesionales_especialidades pe ON d.profesional_id = ...  │
│ WHERE d.especialidad_id = :especialidad_id                       │
│   AND d.activo = true                                            │
│   AND NOT EXISTS (                                               │
│     SELECT 1 FROM turnos t                                       │
│     WHERE t.profesional_id = d.profesional_id                    │
│       AND t.fecha_hora OVERLAPS (slot_inicio, slot_fin)          │
│   )                                                              │
│   AND NOT EXISTS (                                               │
│     SELECT 1 FROM excepciones_disponibilidad                     │
│     WHERE profesional_id = d.profesional_id                      │
│       AND fecha = :fecha_turno                                   │
│   )                                                              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. PRESENTAR OPCIONES AL PACIENTE                                │
├──────────────────────────────────────────────────────────────────┤
│ "Tenemos disponibilidad:                                         │
│  • Dr. Pérez — Miércoles 28/05 16:00hs — Consultorio 3           │
│  • Dra. Fernández — Jueves 29/05 11:00hs — Consultorio 5         │
│  • Dr. Gómez — Viernes 30/05 09:30hs — Consultorio 2"            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. PACIENTE ELIGE OPCIÓN                                         │
├──────────────────────────────────────────────────────────────────┤
│ Selección: Dr. Pérez — Miércoles 28/05 16:00                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. SISTEMA VALIDA DATOS DEL PACIENTE                             │
├──────────────────────────────────────────────────────────────────┤
│ Si es paciente NUEVO:                                            │
│ • Solicitar: Nombre, DNI, Fecha Nac, Email, Tel, Obra social     │
│ • Crear registro en tabla clientes                               │
│                                                                  │
│ Si es paciente EXISTENTE:                                        │
│ • Buscar por DNI/email                                           │
│ • Verificar datos actualizados                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. CREAR TURNO                                                   │
├──────────────────────────────────────────────────────────────────┤
│ INSERT INTO setubalai.turnos (                                   │
│   empresa_id, producto_id, cliente_id, profesional_id,          │
│   especialidad_id, consultorio_id, sede_id,                      │
│   fecha_hora, duracion_minutos,                                  │
│   tipo_consulta, obra_social_id, plan_obra_social,              │
│   numero_afiliado, estado                                        │
│ ) VALUES (...);                                                  │
│                                                                  │
│ Estado: "confirmado"                                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. ENVIAR CONFIRMACIÓN (MULTI-CANAL)                             │
├──────────────────────────────────────────────────────────────────┤
│ WhatsApp:                                                        │
│ "Tu turno está confirmado:                                       │
│  📅 Miércoles 28/05                                              │
│  🕒 16:00hs                                                      │
│  👨‍⚕️ Dr. Diego Pérez - Traumatología                            │
│  📍 Consultorio 3                                                │
│  📄 Traer: DNI + Credencial obra social"                         │
│                                                                  │
│ Email: PDF con detalles                                          │
│ SMS: Recordatorio simple                                         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. PROGRAMAR RECORDATORIOS AUTOMÁTICOS                           │
├──────────────────────────────────────────────────────────────────┤
│ Cron Job 1: 24hs antes → "Recordá tu turno mañana 16hs"         │
│ Cron Job 2: 1 hora antes → "Tu turno es en 1 hora"              │
└──────────────────────────────────────────────────────────────────┘
```

---

### **FLUJO 2: DÍA DEL TURNO — ATENCIÓN**

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. PACIENTE LLEGA A LA CLÍNICA                                   │
├──────────────────────────────────────────────────────────────────┤
│ Recepcionista:                                                   │
│ • Busca turno por DNI / nombre                                   │
│ • Verifica documentación:                                        │
│   - DNI ✅                                                        │
│   - Credencial obra social ✅                                     │
│   - Orden médica (si la tiene)                                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 2. VERIFICAR COBERTURA OBRA SOCIAL (ONLINE)                      │
├──────────────────────────────────────────────────────────────────┤
│ Sistema consulta API obra social (si disponible):                │
│ • OSDE API: afiliado activo? ✅                                   │
│ • Plan cubre Traumatología? ✅                                    │
│ • Requiere autorización? ❌                                       │
│                                                                  │
│ Si API no disponible → verificar manualmente                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 3. PACIENTE ESPERA EN SALA                                       │
├──────────────────────────────────────────────────────────────────┤
│ Sistema muestra en pantalla del profesional:                     │
│ "Próximo paciente: María López (turno 16:00)"                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 4. PROFESIONAL LLAMA AL PACIENTE                                 │
├──────────────────────────────────────────────────────────────────┤
│ Dr. Pérez abre sistema → ve:                                     │
│ • Datos del paciente                                             │
│ • Historial de consultas previas (si existe)                     │
│ • Antecedentes médicos                                           │
│ • Medicación habitual                                            │
│ • Alergias                                                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 5. CONSULTA MÉDICA                                               │
├──────────────────────────────────────────────────────────────────┤
│ Dr. Pérez carga en tiempo real:                                  │
│ • Motivo de consulta                                             │
│ • Anamnesis                                                      │
│ • Examen físico                                                  │
│ • Signos vitales (TA, FC, etc.)                                  │
│ • Diagnóstico                                                    │
│ • Plan de tratamiento                                            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 6. SISTEMA GENERA AUTOMÁTICAMENTE                                │
├──────────────────────────────────────────────────────────────────┤
│ INSERT INTO setubalai.consultas (...);                           │
│                                                                  │
│ Si Dr. Pérez indica medicación:                                  │
│   → Genera receta PDF (INSERT INTO recetas)                      │
│                                                                  │
│ Si Dr. Pérez pide estudios:                                      │
│   → Genera pedido PDF (INSERT INTO estudios_pedidos)             │
│                                                                  │
│ Si Dr. Pérez pide nuevo turno de control:                        │
│   → Sistema sugiere próxima disponibilidad (15 días)             │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 7. FACTURACIÓN AUTOMÁTICA                                        │
├──────────────────────────────────────────────────────────────────┤
│ Si obra social cubre 100%:                                       │
│   → No se cobra al paciente                                      │
│   → Se genera item_factura para facturar a OSDE fin de mes       │
│                                                                  │
│ Si particulares:                                                 │
│   → Paciente paga en recepción                                   │
│   → Se genera factura inmediata                                  │
│                                                                  │
│ Si obra social cubre parcial:                                    │
│   → Paciente paga coseguro                                       │
│   → Obra social paga el resto                                    │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ 8. PACIENTE RECIBE POR EMAIL/WHATSAPP                            │
├──────────────────────────────────────────────────────────────────┤
│ • Receta PDF                                                     │
│ • Pedido de estudios PDF                                         │
│ • Link para agendar próximo turno                                │
│ • Resumen de la consulta                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💡 CONCLUSIONES Y RECOMENDACIONES

### **COMPLEJIDAD IDENTIFICADA:**

1. **Horarios Personalizados:** Necesita tabla `disponibilidad_profesionales` con múltiples dimensiones (profesional + especialidad + consultorio + día + horario)
2. **Historia Clínica Acumulativa:** Tabla `consultas` + `antecedentes_paciente` con relaciones complejas
3. **Recetas y Estudios:** Vincular automáticamente con consultas, gestionar vencimientos
4. **B2B Empresarial:** Contratos con paquetes personalizados, facturación diferenciada
5. **Excepciones:** Ausencias, licencias, feriados deben bloquear turnos automáticamente

### **PRÓXIMOS PASOS:**

1. **Validar este esquema contigo, Pablo**
2. **Definir prioridades:** ¿Empezamos con turnos básicos o con historia clínica completa?
3. **Mockup de interfaz:** ¿Cómo se ve la agenda del profesional? ¿Cómo carga una consulta?
4. **SQL completo:** Generar scripts de migración listos para ejecutar

---

**¿Este análisis refleja la complejidad real de una clínica médica?**
**¿Qué falta considerar?**
**¿Seguimos con DiagCentro (imágenes) o Logística de Seguros?**
