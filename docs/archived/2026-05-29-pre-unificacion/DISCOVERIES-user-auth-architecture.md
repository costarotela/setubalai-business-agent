# CRITICAL DISCOVERIES — User/Auth Architecture

**Date:** 2026-05-25  
**Author:** Oscar  
**Status:** IMPLEMENTED (Fase 1: testing)

---

## BUG CRÍTICO DESCUBIERTO

Crear una empresa desde Panel Maestro (`POST /empresas/`) **NO creaba ningún usuario**.

Resultado: 5 empresas en la DB con **0 usuarios** → nadie podía loguearse a ninguna.

Empresas afectadas: 4, 5, 6, 7, 8 (user_count = 0)

## ARQUITECTURA DE ROLES CONFIRMADA

```
SUPERADMIN (rol="superadmin") → Panel Maestro (admin.setubalai.org)
  - Pablo (pcostarotela@gmail.com, id=1)
  - Crea empresas + usuarios admin automáticos
  - Activa/desactiva empresas
  - Ve SOLO stats globales (nunca data de clientes)
  - NO puede loguearse como cliente

ADMIN EMPRESA (rol="admin") → App producto (business.setubalai.org)
  - UNO por empresa (el dueño)
  - Se loguea con email + password
  - Ve SOLO su empresa (tenancy isolation)
  - Personaliza su negocio, gestiona su catálogo
  - Puede crear empleados (rol="operador")
  - ÚNICO que puede borrar su empresa (en futuro)

OPERADOR (rol="operador") → App producto
  - Empleado de la empresa
  - Ve SOLO su empresa
  - Acceso limitado (dashboard, facturas, cobros)
  - NO puede eliminar ni crear

CONTADOR (rol="contador") → App producto
  - Solo lectura de reportes y cobros
  - Fuera del scope Fase 1
```

## FLUJO DE CREACIÓN (IMPLEMENTADo)

1. Superadmin crea empresa en Panel Maestro
2. Backend crea la empresa + usuario admin automáticamente
3. Password temporal generado (12 chars, secrets.token_urlsafe)
4. Credenciales retornadas al superadmin (visible en Panel Maestro)
5. Superadmin envía credenciales al cliente (manual por ahora)
6. Cliente se loguea con esas credenciales

## AUTH VALIDATIONS

- Login valida: Usuario.activo == True
- Login valida: Empresa.estado == "activa" (agregado)
- Token JWT incluye: sub, empresa_id, rol, nombre
- Frontend: logout automático si 401

## ENDPOINTS AUTH EXISTENTES

- POST /auth/login → login (OAuth2, email+password)
- GET /auth/me → verificar sesión
- POST /auth/cambiar-password → change password
- POST /auth/users → crear usuario (superadmin o admin de su empresa)
- GET /auth/users → listar usuarios (superadmin=all, admin=su empresa)

## MODELO DB

```sql
usuarios:
  id, empresa_id (FK), nombre, email (unq), password_hash, rol, activo, created_at
  - roles: superadmin, admin, operador, contador
  - activo=False → no puede loguearse

empresa:
  id, nombre, email, estado (activa/inactiva), plan, configuracion (JSONB)
  - estado != activa → nadie de esa empresa puede loguearse
```

## TESTING

Emails de prueba: `admin.test1@setubalai.test` (dominio .test, no real)
Contraseñas temporales generadas por secrets.token_urlsafe(12)
No se necesita mail server en fase de testing
