# Progreso MVP Centro Médico Integral

**Fecha inicio:** 2026-05-26  
**Fecha objetivo:** 2026-07-07 (6 semanas)

---

## SEMANA 1: BASE DE DATOS (26/05 - 02/06)

### Tareas
- [x] Crear script migración 002_centro_medico_integral.sql
- [ ] Crear script datos demo 003_seed_data_centro_medico.sql
- [x] Ejecutar migraciones
- [x] ✅ CHECK 1: Verificar tablas creadas (8 tablas ✓)
- [ ] ✅ CHECK 2: Verificar datos cargados
- [ ] ✅ CHECK 3: Verificar integridad referencial

### Estado
🟡 EN CURSO (50% - 3/6 tareas completadas)

### Bloqueadores
Ninguno

### Log
- 2026-05-26 23:55: Migración 002 ejecutada ✅
- Tablas creadas: medicos, historia_clinica, visitas, atenciones_medicas, nomenclador_practicas, practicas_medicas, estudios_adjuntos, recetas
- Próximo: Script de datos demo

---

## SEMANA 2: BACKEND API (03/06 - 09/06)

### Tareas
- [ ] Crear modelos SQLAlchemy (Visita, AtencionMedica, PracticaMedica)
- [ ] Crear schemas Pydantic
- [ ] Crear routers FastAPI (/visitas, /atenciones, /practicas)
- [ ] Tests unitarios
- [ ] ✅ CHECK 4: Endpoints responden
- [ ] ✅ CHECK 5: Tests pasan

### Estado
⚪ BLOQUEADO (depende de Semana 1)

### Bloqueadores
- Semana 1 debe estar completa

---

## SEMANA 3: FRONTEND (10/06 - 16/06)

### Tareas
- [ ] Layout con sidebar
- [ ] Página de visitas (agenda)
- [ ] Página de atenciones médicas
- [ ] Página de prácticas/facturación
- [ ] ✅ CHECK 6: Build exitoso
- [ ] ✅ CHECK 7: Páginas cargan

### Estado
⚪ BLOQUEADO (depende de Semana 2)

### Bloqueadores
- Semana 2 debe estar completa

---

## SEMANAS 4-5: STORAGE + WHATSAPP (17/06 - 30/06)

### Tareas
- [ ] Upload de estudios médicos
- [ ] Historia clínica con adjuntos
- [ ] Integración WhatsApp Business API
- [ ] Skill Hermes clinica-turnos-v2
- [ ] ✅ CHECK 8: Upload funciona
- [ ] ✅ CHECK 9: Turnos via WhatsApp

### Estado
⚪ BLOQUEADO (depende de Semana 3)

### Bloqueadores
- Semana 3 debe estar completa

---

## SEMANA 6: DEMO LISTA (01/07 - 07/07)

### Tareas
- [ ] Recetas PDF
- [ ] Checklist pre-demo (19 verificaciones)
- [ ] ✅ CHECK 10: Demo funcionando 100%

### Estado
⚪ BLOQUEADO (depende de Semanas 4-5)

### Bloqueadores
- Semanas 4-5 deben estar completas

---

## RESUMEN

| Semana | Estado | Tareas | Checks | Bloqueadores |
|--------|--------|--------|--------|--------------|
| 1 (BD) | 🔴 NO INICIADO | 0/3 | 0/3 | Ninguno |
| 2 (Backend) | ⚪ BLOQUEADO | 0/6 | 0/2 | Semana 1 |
| 3 (Frontend) | ⚪ BLOQUEADO | 0/6 | 0/2 | Semana 2 |
| 4-5 (Storage/WhatsApp) | ⚪ BLOQUEADO | 0/6 | 0/2 | Semana 3 |
| 6 (Demo) | ⚪ BLOQUEADO | 0/3 | 0/1 | Semanas 4-5 |

**Progreso total:** 0% (0/30 tareas)

---

## PRÓXIMO PASO INMEDIATO

🎯 **CREAR SCRIPTS DE MIGRACIÓN Y DATOS**

1. Crear `/home/admin/setubalai-agente/migrations/002_centro_medico_integral.sql`
2. Crear `/home/admin/setubalai-agente/migrations/003_seed_data_centro_medico.sql`
3. Ejecutar ambos scripts
4. Verificar que funcionó (3 checks)

**Tiempo estimado:** 2-3 horas

---

**Última actualización:** 2026-05-26 23:45
