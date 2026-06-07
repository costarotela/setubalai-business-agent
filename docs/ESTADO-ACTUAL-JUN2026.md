# SETUBALAI — ESTADO COMPLETO DEL SISTEMA (Junio 2026)

**Última actualización:** 2026-06-07
**Rama:** `feature/ciclo-completo-medico` (listo para merge)
**DB:** PostgreSQL :5432 `setubalai`, 33 tablas | empresa_id=16 (Centro Médico Santa Clara)
**Backend:** FastAPI :3010 (systemd) | **Frontend:** Next.js :3013 (dev.setubalai.org)
**VPS:** 100.72.101.29 | **PC:** 100.81.134.102:2222

---

## 🏗️ ARQUITECTURA DE ROLES (SÍNTESIS)

### Estructura sin tabla de roles (mejor enfoque actual)

```
usuarios.rol → "superadmin" | "admin" | "operador"
usuarios.medico_id → NULL = no médico | FK(medicos.id) = es médico
medico_especialidades → tabla M:N médico ↔ especialidades_medicas
```

**Decisión:** NO crear tabla de Roles separada. El diseño actual (rol string + medico_id FK + M:N especialidades) funciona completo. Tabla extra = overengineering.

### Matriz de permisos

| Nivel | Rol DB | medico_id | Ve datos clínicos | Ve gestión | Puede editar médicos | Puede nomencladores |
|-------|--------|-----------|-------------------|------------|---------------------|---------------------|
| SUPERADMIN | superadmin | NULL | ✅ TODO | ✅ TODO | ✅ | ✅ |
| ADMIN CLÍNICA | admin | NULL | ❌ 403 | ✅ turnos, agenda, pacientes lista | ✅ | ✅ |
| MÉDICO | operador | FK | ✅ SOLO propios | ✅ turnos propios | ❌ 403 | ❌ 403 |
| OPERADOR | operador | NULL | ❌ 403 | ✅ turnos, agenda | ❌ 403 | ❌ 403 |

### Función central: `get_medico_restriction()`
- **Archivo:** `services/api/routers/salud.py` línea 36
- **Retorna:** `(medico_id_auth, es_admin, rol)`
- **Uso:** 32+ endpoints con restricción
- **Checks 403:** 39 en total en salud.py

---

## ✅ CICLO MÉDICO COMPLETO (IMPLEMENTADO)

| # | Endpoint | Función | Validado |
|---|----------|---------|----------|
| 1 | `POST /atenciones/` | Crear atención + calcular IMC | ✅ 201 |
| 2 | `POST /estudios_adjuntos/` | Adjuntar estudio médico | ✅ 201 |
| 3 | `POST /recetas/` | Crear receta + generar PDF | ✅ 201 + PDF |
| 4 | `PUT /atenciones/{id}/` | Evolución / cierre atención | ✅ 200 |
| 5 | `POST /seguimiento/` | Programar próximo turno | ✅ 201 |
| 6 | `POST /derivacion/` | Derivar a otra especialidad | ✅ 201 |

**Modelos Pydantic creados:** AtencionCreate, AtencionUpdate, RecetaCreate, EstudioCreate, SeguimientoCreate, DerivacionCreate, MedicamentoItem

**PDF:** `fpdf2`, path `/data/recetas/receta_{id}.pdf` con QR verificable

---

## 📊 BASE DE DATOS (33 tablas)

### Multi-tenant
- `empresas` — clientes SaaS (empresa_id=1 → superadmin, empresa_id=16 → Centro Médico Santa Clara)
- `usuarios` — auth + rol + medico_id + empresa_id
- **Casi todas las tablas tienen:** `empresa_id → empresas.id`

### Gestión clínica
- `pacientes` (36 registros) — DNI, obra_social, telegram_chat_id
- `medicos` (15) — matrículas, horarios JSONB, especialidades M:N
- `especialidades_medicas` (5) — Cardio, Trauma, Pediatría, Derma, Clínica Médica
- `medico_especialidades` — M:N link

### Turnos y agenda
- `visitas` (192+) — fecha_hora, estado, reprogramaciones
- `grillas_medicas` (12) — configuración de horarios
- `bloqueos_grilla` (1) — ausencias/vacaciones
- `configuracion_agenda` — duración turnos por especialidad

### Datos clínicos
- `atenciones_medicas` (67+) — diagnóstico, 9 signos vitales, evolución, IMC
- `historia_clinica` (62) — alergias[], antecedentes, medicación habitual[]
- `recetas` (25+) — medicamentos JSONB, indicaciones, archivo_pdf_url
- `estudios_adjuntos` (21+) — archivos PDF/imagen
- `seguimiento` — turnos programados post-atención
- `derivacion` — referido entre especialidades

### Comercial
- `practicas_medicas` (65) — facturación, coseguro
- `nomenclador_practicas` (18) — catálogo de prácticas
- `obras_sociales` (8) — OSDE, PAMI, IOMA, etc.
- `empresas`, `productos`, `clientes`, `cobros`

### Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `services/api/models.py` | 33 modelos SQLAlchemy |
| `services/api/routers/salud.py` | ~1800 líneas, 35+ endpoints, 39 restricciones |
| `services/api/routers/auth.py` | Login, CRUD usuarios, gestión de auth |
| `services/api/routers/turnos.py` | Endpoints de turnos/visitas |
| `services/api/auth.py` | JWT decode, get_current_user, get_current_superadmin |
| `services/api/tenancy.py` | resolve_empresa_id (JWT → Header → Query → Default) |
| `services/api/main.py` | FastAPI app, routers registrados |

---

## 🔐 AUTH — USUARIOS (empresa_id=16)

| Email | Rol | medico_id | Estado |
|-------|-----|-----------|--------|
| admin@centromedicosantaclara.com.ar | admin | NULL | Activo |
| medico.maria.garcia@... | operador | FK (médico #1) | Activo |
| medico.carlos.rodriguez@... | operador | FK (médico #2) | Activo |
| medico.juan.martinez@... | operador | FK | Activo |
| medico.ana.lopez@... | operador | FK | Activo |
| medico.roberto.fernandez@... | operador | FK | Activo |

**⚠️ Nota conceptual:** Los médicos tienen `rol="operador"` pero `medico_id != NULL`. `get_medico_restriction()` los detecta correctamente como médicos. Idealmente cambiar a `rol="medico"` para claridad.

**Superadmin:** pcostarotela@gmail.com / Pablo2024! → empresa_id=1

**Password bug conocido:** `POST /empresas/` genera password aleatoria. Si no se guarda, se pierde. Fix: `seed_datos_prueba.py` repara passwords a `Pablo2024!`.

---

## 🖥️ FRONTEND (Next.js)

### Páginas completas (:3013 dev.setubalai.org)
- ✅ Login con JWT
- ✅ Dashboard
- ✅ Pacientes (listado + detalle)
- ✅ Turnos (crear, editar, cancelar)
- ✅ Médicos (listado)
- ✅ Configuración (agenda, especialidades, obras sociales)

### PENDIENTE
- ❌ **UI médica para ciclo completo** (atenciones, recetas, estudios, seguimiento, derivación)
- ❌ Vista de historia clínica por paciente
- ❌ Generación de recetas desde UI

### Frontend Admin (:3012)
- Panel de superadmin y admin de clínica

---

## 🤖 BOT TELEGRAM
- `services/clinic-bot/main.py`
- /start → menú inline: sacar turno, ver turnos, reprogramar, cancelar
- Reconocimiento automático por telegram_chat_id

---

## ⚙️ INFRAESTRUCTURA

```
VPS: 100.72.101.29 (Hetzner)
├── PostgreSQL (systemd, puerto 5432)
├── FastAPI backend (systemd, puerto 3010)
├── Frontend dev (systemd, puerto 3013 → dev.setubalai.org)
├── Frontend admin (systemd, puerto 3012)
├── DB Explorer (:9991)
└── Clinic Bot (Telegram)
```

### Servicios systemd relevantes
```
systemctl --user status setubalai-api      # :3010 FastAPI
systemctl --user status setubalai-web      # :3013 Next.js dev
systemctl --user status setubalai-admin    # :3012 Next.js admin
systemctl --user status setubalai-db-explorer  # :9991
systemctl --user status setubalai-clinic-bot   # Telegram bot
```

---

## 📋 PENDIENTES PRIORITARIOS

1. **UI médica para ciclo completo** — consumir los 6 endpoints POST/PUT implementados
2. **Cambiar rol de usuarios médicos** de "operador" a "medico" (mejora conceptual)
3. **Merge rama feature/ciclo-completo-medico → main** (tras validar todo)
4. **WhatsApp integration** (Cloud API Meta — única opción en VPS sin pagar)
5. **Frontend admin:** panel para crear médicos con especialidades
6. **Pruebas de roles** con usuarios reales (curl + browser)

---

## 🔑 LEYES DE DESARROLLO

1. Rama separada siempre, main intacto
2. 1 cambio → validar curl → 200 → siguiente
3. DB existente NO se toca (solo agregar, no modificar)
4. NUNCA "listo" sin curl → 200
5. Context Provider (Opción B) obligatoria para datos globales
6. NUNCA reiniciar servicios hasta validar todos los endpoints
