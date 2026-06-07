# PLAN: CICLO COMPLETO — La Pata del Médico

> **Fecha:** 5 Junio 2026
> **Objetivo:** Cerrar el ciclo: Turno → Atención → Receta → Seguimiento → Próximo Turno
> **Branch:** `feature/ciclo-completo-medico`
> **Estado:** 📋 PLANIFICACIÓN — NO ejecutar sin aprobación de Pablo

---

## 🎯 EL PROBLEMA

El sistema de turnos funciona perfecto. El bot conversacional agenda. Pero DESPUÉS del turno, el sistema se muere. El médico no puede crear nada, no hay seguimiento, no hay receta digital, no hay derivación. **Somos un turnero bonito a mitad de camino.**

## 🏆 LA META

Que el médico, desde su PC en el consultorio, pueda:
1. Ver al paciente que llegó (agenda del día)
2. Ver su historia clínica completa
3. Registrar la atención (diagnóstico, signos vitales, notas)
4. Crear receta digital con PDF profesional
5. Ordenar prácticas/estudios
6. **Programar seguimiento** → genera próximo turno automáticamente
7. **Derivar a otra especialidad** → crea turno allá

---

## 📋 LO QUE FALTA — Inventariado

### 1. ✅ YA EXISTE (DB + endpoints)
| Componente | Estado |
|-----------|--------|
| Tabla `atenciones_medicas` | ✅ Con TODOS los campos |
| Tabla `recetas` | ✅ JSONB funciona |
| Tabla `practicas_medicas` | ✅ Vinculada a atencion |
| Tabla `estudios_adjuntos` | ✅ Con archivo_url |
| Tabla `historia_clinica` | ✅ Antecedentes, alergias |
| `GET /pacientes/{id}/historial` | ✅ Historial completo |
| `GET /agenda/timeline` | ✅ Turnos del día |
| `GET /salud/recetas/` | ✅ Leer recetas |
| `GET /salud/estudios_adjuntos/` | ✅ Leer estudios |
| `POST /salud/turnos/` | ✅ Crear turno |
| Nomenclador de prácticas | ✅ Catálogo configurable |

### 2. ❌ FALTA CREAR (endpoints)
| Componente | Qué hacer |
|-----------|-----------|
| `POST /salud/atenciones/` | Crear atención médica (diagnóstico, signos, notas) |
| `POST /salud/recetas/` | Crear receta (seleccionar medicamentos + generar PDF) |
| `POST /salud/estudios_adjuntos/` | Subir estudio (archivo + metadata) |
| `PUT /salud/atenciones/{id}/` | Editar atención (evolución, cierre) |
| `POST /salud/seguimiento/` | Generar próximo turno desde una atención |
| `POST /salud/derivacion/` | Derivar a otra especialidad → crea turno |

### 3. ❌ FALTA INTERFAZ (frontend médico)
| Página | Función |
|--------|---------|
| `/medico/hoy` | Agenda del día — pacientes que llegaron |
| `/medico/atender/{paciente_id}` | Formulario de consulta: diagnóstico, signos, receta, seguimiento |
| `/medico/receta/{receta_id}/pdf` | Generar y descargar receta en PDF |
| `/medico/derivacion` | Crear turno en otra especialidad |

### 4. ✅ MCP TOOLS a crear (para el bot)
| Tool | Función |
|------|---------|
| `med_crear_atencion()` | El bot puede registrar atención si el médico le dicta |
| `med_crear_receta()` | Crear receta con medicamentos |
| `med_programar_seguimiento()` | Generar próximo turno post-atención |
| `med_derivar_especialidad()` | Crear turno en otra especialidad |

---

## 🚀 ORDEN DE EJECUCIÓN

### FASE 1: Endpoint POST /atenciones/ (el más crítico)
- Un endpoint que reciba diagnóstico, signos vitales, notas
- Vincule a visita_id (el turno que ya existe)
- Marque la visita como "completado"
- ✅ Verificar con curl → 200

### FASE 2: Endpoint POST /recetas/
- Recibe medicamentos (JSONB), indicaciones, valida_hasta
- Genera PDF profesional con logo de la clínica
- Guarda archivo_pdf_url
- ✅ Verificar con curl → 200

### FASE 3: Seguimiento automático
- Al crear atencion, campo `requiere_seguimiento` (boolean) + `dia_seguimiento` (date)
- Si es true → crea automáticamente un nuevo turno futuro
- El bot notifica al paciente por Telegram/WhatsApp

### FASE 4: UI mínima del médico
- `/medico/hoy` — lista de pacientes del día
- Click en paciente → abre `/medico/atender/{id}`
- Formulario simple: signos vitales + diagnóstico + receta + seguimiento
- Guardar → cierra el ciclo

---

## ⚠️ ADVERTENCIAS

1. NO romper el sistema de turnos existente
2. Mantener compatibilidad con bot de Telegram
3. Cada cambio → verificar con curl → 200
4. NO decir "listo" sin verificación
5. Main intacto — rama separada
6. El flujo actual de turnos NO se modifica — solo se extiende

---

## 📊 IMPACTO COMERCIAL

Antes: Turnero con bot inteligente
Después: **Ecosistema completo de atención médica digital**

- El médico registra → la HC evoluciona
- La receta digital → el paciente la recibe por WhatsApp
- El seguimiento → el paciente VUELVE automáticamente
- La derivación → la clínica retiene al paciente en TODAS sus especialidades

**Esto es lo que NINGUNO de los 26 competidores tiene: el ciclo cerrado.**
