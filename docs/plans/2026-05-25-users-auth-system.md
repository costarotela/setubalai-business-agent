# Plan: Sistema de Usuarios por Empresa

**Fecha:** 2026-05-25  
**Prioridad:** CRÍTICA — sin esto no se puede probar el sistema completo

---

## Problema Actual

- `POST /empresas/` crea la empresa pero NO crea ningún usuario
- No hay forma de que un cliente nuevo se loguee
- No hay endpoint de registro
- No hay gestión de usuarios por parte del admin de la empresa
- Para testing: no podemos probar auth completo sin usuarios reales

---

## Arquitectura de Usuarios

```
SUPERADMIN (vos) ─── Panel Maestro (web-admin)
  │
  ├── Crea empresa → automáticamente crea usuario admin para esa empresa
  ├── Activa/desactiva empresa (no borra data, solo bloquea acceso)
  ├── Ve SOLO stats macro (no accede a data de clientes)
  └── NO puede loguearse como el admin de otra empresa
  │
  ↓
ADMIN DE EMPRESA ─── App producto (web)
  │
  ├── Se loguea con su email + password
  ├── Ve SOLO su empresa (multi-tenant isolation)
  ├── Personaliza su negocio (nombre, rubro, catálogo)
  ├── Puede crear más usuarios de su empresa (empleados)
  └── Puede revocar accesos
```

---

## FASE 1: Testing Funcional (AHORA)

### 1.1 Backend: Crear usuario admin al crear empresa
- Modificar `POST /empresas/` en `empresas.py`
- Después de crear la empresa, crear automáticamente un `Usuario` con:
  - `nombre` = "Admin {nombre_empresa}"
  - `email` = `body.email` (el que se ingresa al crear empresa)
  - `password_hash` = generar password temporal aleatorio (12 chars)
  - `rol` = "admin"
  - `empresa_id` = id de la empresa recién creada
  - `activo` = True
- Retornar el password temporal en la respuesta (solo para superadmin, lo ves en Panel Maestro)

### 1.2 Backend: Endpoint para gestionar usuarios de una empresa
- `GET /empresas/{empresa_id}/usuarios` (superadmin)
- `PUT /empresas/{empresa_id}/usuarios/{usuario_id}/activar` (superadmin)
- `PUT /empresas/{empresa_id}/usuarios/{usuario_id}/desactivar` (superadmin)
- `POST /empresas/{empresa_id}/usuarios/reset-password` (superadmin, genera nueva y la retorna)

### 1.3 Backend: Auth isolation
- Verificar que `get_current_user` filtra correctamente por `empresa_id`
- Agregar validación: si `Usuario.activo == False` → 403
- Agregar validación: si `Empresa.estado == "inactiva"` → 403 para todo endpoint

### 1.4 Frontend: Panel Maestro — mostrar credenciales al crear
- Al crear empresa exitosamente, mostrar modal con:
  - Email del admin creado
  - Password temporal
  - URL de acceso: https://business.setubalai.org/login
  - Botón "Copiar credenciales"

### 1.5 Frontend: Panel Maestro — gestión de usuarios
- Tab "Usuarios" dentro de cada empresa expandida
- Ver lista de usuarios de esa empresa
- Botones: activar/desactivar, reset password

### 1.6 Frontend: App producto — gestión de usuarios (admin de empresa)
- En `configuracion/page.tsx`, nueva tab "Usuarios"
- El admin de la empresa puede:
  - Ver usuarios de su empresa
  - Crear nuevos usuarios (empleados) con rol "operador"
  - Revocar accesos

### 1.7 Testing: emails de prueba
- Para testing usar emails sin dominio real: `admin.empresa1@setubalai.test`
- No requiere mail server, las credenciales se ven en Panel Maestro

---

## FASE 2: Producción Robusta (DESPUÉS)

### 2.1 Envío de credenciales por email/Telegram
- Integrar con Gmail API (ya tenemos skill `google-workspace`)
- Al crear empresa, enviar email al cliente con:
  - Credenciales de acceso
  - Link a app
  - Instrucciones para cambiar password

### 2.2 Endpoint de registro público (opcional)
- `/auth/register` con email + nombre + password
- Confirmación por email
- Auto-crear empresa con datos básicos
- Flujo tipo SaaS: self-service

### 2.3 Invitación de usuarios por email
- Admin de empresa invita empleados por email
- Token de invitación con expiración
- El invitado crea su cuenta con ese token

### 2.4 Cambio de password obligatorio al primer login
- Flag `password_temporal` en modelo Usuario
- Al primer login con password temporal, obligar a cambiarla

### 2.5 Rate limiting en login
- Proteger contra force brute
- Lockout después de N intentos fallidos

### 2.6 2FA (futuro)
- TOTP o OTP via Telegram

---

## MODELO DB (no cambia estructura, ya tenemos lo necesario)

```python
class Usuario(Base):
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"))  # YA EXISTE
    nombre = Column(String(200), nullable=False)              # YA EXISTE
    email = Column(String(200), unique=True, nullable=False) # YA EXISTE
    password_hash = Column(String(200))                       # YA EXISTE
    rol = Column(String(20), default="operador")             # YA EXISTE
    activo = Column(Boolean, default=True)                    # YA EXISTE
    # AGREGAR (opcional, fase 2):
    # password_temporal = Column(Boolean, default=False)
    # telegram_id = Column(String(50))  # YA EXISTE
```

---

## ARCHIVOS A MODIFICAR

### Backend:
1. `services/api/routers/empresas.py` — agregar creación de usuario al crear empresa
2. `services/api/routers/usuarios.py` — NUEVO, CRUD de usuarios por empresa
3. `services/api/auth.py` — validar Usuario.activo y Empresa.estado en auth
4. `services/api/main.py` — registrar router usuarios

### Frontend web-admin:
5. `web-admin/src/app/panel-maestro/page.tsx` — mostrar credenciales, gestión de usuarios

### Frontend web:
6. `web/src/app/configuracion/page.tsx` — tab "Usuarios" para admin de empresa

---

## ORDEN DE EJECUCIÓN

1. Auth isolation (validar activo/estado en auth.py)  
2. Crear router usuarios (CRUD por empresa)  
3. Modificar POST /empresas para crear usuario admin  
4. Frontend panel-maestro: credenciales post-creación  
5. Frontend web: tab usuarios para admin de empresa  
6. Test completo: crear empresa → ver credenciales → loguearse → ver app  

---

## RIESGOS
- **email unique**: si reutilizamos emails de test, dará conflicto. Solución: sufijo único
- **password seguro**: usar `secrets.token_urlsafe(12)` para passwords temporales
- **No exponer password en logs**: solo en response directa al superadmin
