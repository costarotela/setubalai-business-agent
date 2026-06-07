# SETUBALAI PROJECT CONTEXT — ESTADO REAL (Jun 2026)

**Actualizado:** 2026-06-07 (Roles + Ciclo completo medico + Seguridad por rol)
**DB:** PostgreSQL 17, schema `setubalai`, 31+ tablas, empresa_id=16 (Centro Medico Santa Clara)
**Backend:** FastAPI systemd :3010 | **Frontend:** Next.js dev :3013 (dev.setubalai.org)
**VPS:** 100.72.101.29 | **PC:** 100.81.134.102:2222
**Rama actual:** feature/ciclo-completo-medico

---

## ARQUITECTURA ROLES (4 NIVELES)

### Modelo
```
usuarios.rol = "superadmin" | "admin" | "operador"
usuarios.medico_id = NULL -> NO medico | FK->medicos.id -> SI medico
medico_especialidades (M:N) -> medico <-> especialidades_medicas
```

### Tabla NO ES NECESARIA - el campo `rol` en `usuarios` + `medico_id` es suficiente.

| Nivel | Rol | medico_id | Que ve | Que puede hacer | Permisos |
|-------|-----|-----------|--------|------------------|----------|
| **SUPERADMIN** | superadmin | NULL | TODO, TODAS las clinicas | Configurar plataforma completa | 39 restricciones lo bypassean (es_admin=True) |
| **ADMIN CLINICA** | admin | NULL | Pacientes (lista), turnos, agenda, medicos, especialidades, nomencladores | Crear/editar medicos, especialidades, nomencladores, configuracion | 403 en: historial, recetas, estudios, atenciones, seguimiento, derivacion |
| **MEDICO** | operador | FK->medicos.id | SOLO sus pacientes, SUS atenciones, SUS recetas, SUS turnos | Ciclo completo (atenciones, recetas, estudios, seguimiento, derivacion), ver/crear turnos | 403 en: pacientes ajenos, crear/editar/eliminar medicos, crear nomencladores, crear empresas |
| **OPERADOR/RECEPCIONISTA** | operador | NULL | Turnos, agenda, calendario, pacientes (lista) | Gestionar turnos, agendar, ver disponibilidad | 403 en: TODO dato clinico (historial, recetas, estudios, atenciones, seguimiento, derivacion) |

### Decision: Tabla de Roles separada?
**NO.** El diseno actual (rol string + medico_id FK + tabla M:N especialidades) funciona completo. Tabla de roles extra = overengineering. Se puede agregar mas tarde si se necesitan roles customizables por clinica.

### Funcion de restriccion: `get_medico_restriction()`
- Ubicacion: `services/api/routers/salud.py` linea 36
- Devuelve: `(medico_id_auth, es_admin, rol)`
- Se usa en **32+ endpoints** de `salud.py`
- 39 checks de 403 en total en salud.py

---

## MODULO SALUD - COMPLETO

### Endpoints implementados (ciclo medico):

| Metodo | Endpoint | Funcion | Rol minimo |
|--------|----------|---------|------------|
| POST | /atenciones/ | Crear atencion medica | medico |
| GET | /atenciones/ | Listar atenciones (filtrado) | medico |
| GET | /atenciones/{id} | Detalle atencion | medico |
| PUT | /atenciones/{id}/ | Evolucion de atencion | medico |
| DELETE| /atenciones/{id}/ | Eliminar atencion | medico |
| POST | /recetas/ | Crear receta + generar PDF | medico |
| GET | /recetas/ | Listar recetas (filtrado) | medico |
| GET | /recetas/{id} | Detalle receta | medico |
| GET | /recetas/{id}/pdf | Descargar PDF generado | medico |
| POST | /estudios_adjuntos/ | Adjuntar estudio | medico |
| GET | /estudios_adjuntos/ | Listar estudios (filtrado) | medico |
| POST | /seguimiento/ | Programar seguimiento/turno | medico |
| GET | /seguimiento/ | Listar seguimiento | medico |
| POST | /derivacion/ | Derivar a otra especialidad | medico |
| GET | /derivacion/ | Listar derivaciones | medico |

### Modelos Pydantic creados (en salud.py):
- AtencionCreate, AtencionUpdate
- RecetaCreate, RecetaResponse
- EstudioAdjuntoCreate, EstudioAdjuntoResponse
- SeguimientoCreate, SeguimientoResponse
- DerivacionCreate, DerivacionResponse

### Generacion PDF:
- Libreria: `fpdf2`
- Path: `/data/recetas/receta_{id}.pdf`
- Incluye: paciente, medico, medicamentos, fecha, QR verificable

### Datos clinicos persistentes:
- `historia_clinica` - notas de evolucion (JSONB)
- `atenciones_medicas` - diagnostico, motivos, signos vitales, IMC
- `recetas` - medicamentos, posologia
- `estudios_adjuntos` - archivos adjuntos
- `seguimiento` - proximos turnos
- `derivacion` - referido entre especialidades

---

## ENDPOINTS COMPLETOS (salud.py - ~1800 lineas)

### Publico / Sin restriccion:
- GET /especialidades/, /pacientes/, /medicos/, /obras_sociales/, /nomenclador/
- GET /turnos/, /turnos/{id}, /agenda/, /agenda/timeline

### Gestion (admin + medico autorizado):
- POST /medicos/, PUT /medicos/{id}/, DELETE /medicos/{id}/ -> solo admin
- POST /nomenclador/, PUT /nomenclador/{id}/, DELETE /nomenclador/{id}/ -> solo admin
- Todas estas: 403 para medico y operador

### Clinico (solo medico):
- TODO ciclo completo (atenciones, recetas, estudios, etc.) -> 403 para admin y operador
- Historial clinico -> 403 para admin y operador

---

## CAPAS DEL SISTEMA

### Backend (services/api/):
- `main.py` - FastAPI app, routers registrados
- `models.py` - 31+ modelos SQLAlchemy (Usuarios, Empresas, Pacientes, Medicos, Visitas, Atenciones, Recetas, etc.)
- `salud.py` - Router completo (~1800 lineas, 35+ endpoints, 39 restricciones 403)
- `auth.py` - JWT, get_current_user, get_current_superadmin
- `tenancy.py` - resolve_empresa_id (JWT -> Header -> Query -> Default)
- `/routers/` - 12 routers: auth, salud, turnos, empresas, clientes, especialidades, cobros, productos, reportes, etc.

### Base de datos:
- PostgreSQL en systemd (no Docker)
- 31+ tablas: empresas, usuarios, pacientes, medicos, medico_especialidades, especialidades_medicas, visitas, atenciones_medicas, recetas, estudios_adjuntos, seguimiento, derivacion, historia_clinica, nomenclador_practicas, obras_sociales, etc.
- Conexion: 100.72.101.29:5432/business

### Frontend (web/):
- Next.js :3013 (dev)
- Pages: login, dashboard, pacientes, turnos, medicos, configuracion, especialidades, agenda, obras sociales
- **Pendiente: UI medica para ciclo completo** (atenciones, recetas, estudios, seguimiento, derivacion)

### Frontend Admin (web-admin/):
- Next.js :3012 (panel de administracion)
- Para superadmin y admin de clinica

### Bot Telegram (services/clinic-bot/):
- Bot de turnos para pacientes
- Integracion WhatsApp pendiente

---

## AUTH - USUARIOS CLINICA (empresa_id=16)

| Email | Rol | medico_id | Estado |
|-------|-----|-----------|--------|
| admin@centromedicosantaclara.com.ar | admin | NULL | Activo - dueno de clinica |
| medico.maria.garcia@... | operador | FK (medico #1) | Activo - Dra. Garcia |
| medico.carlos.rodriguez@... | operador | FK (medico #2) | Activo - Dr. Rodriguez |
| medico.juan.martinez@... | operador | FK | Activo |
| medico.ana.lopez@... | operador | FK | Activo |
| medico.roberto.fernandez@... | operador | FK | Activo |

**IMPORTANTE:** Los medicos tienen rol = "operador" en la tabla `usuarios`, pero la funcion `get_medico_restriction()` detecta que tienen `medico_id` != NULL y los trata como medicos. Esto funciona pero es conceptualmente mejorable - idealmente su rol seria "medico" para claridad.

**Superadmin:** pcostarotela@gmail.com / Pablo2024! -> empresa_id=1 (plataforma)

Password temporal para todos los usuarios de clinica: Pablo2024!

**FIX:** `seed_datos_prueba.py` repara passwords a Pablo2024!

---

## DEV FLOW (LEY INQUEBRANTABLE)

1. `cd ~/setubalai-agente && git status`
2. `git checkout -b feature/nueva-funcionalidad`
3. 1 cambio -> validar (curl -> 200/201) -> siguiente
4. NUNCA codear sin analizar
5. NUNCA "listo" sin curl->200
6. Main siempre intacto hasta PR merge

---

## PASSWORD BUG (conocido)

`POST /empresas/` genera password aleatoria. Si no se guarda, se pierde.
FIX: `seed_datos_prueba.py` repara passwords a Pablo2024!

---

## PENDIENTES

- [ ] UI medica para ciclo completo (consumir endpoints)
- [ ] Cambiar rol de usuarios medicos de "operador" a "medico" (mejora conceptual)
- [ ] Frontend admin: panel para crear medicos con especialidades
- [ ] WhatsApp integration (Cloud API Meta)
- [ ] Merge rama feature/ciclo-completo-medico -> main
- [ ] Pruebas de roles con usuarios reales
