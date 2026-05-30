# ANALISIS DE ERROR ARQUITECTURAL — Panel Maestro dentro del Producto
**Fecha:** 2026-05-22
**Detectado por:** Pablo (@pcostarotela)
**Documentado por:** Hermes Agent
**Estado:** PENDIENTE CORRECCIÓN

---

## EL ERROR

El Panel Maestro de administración de SetubalAI fue construido DENTRO de la misma
aplicación Next.js que es el producto que se vende a los clientes.

Ubicación del error:
- `web/src/app/panel-maestro/page.tsx` → está dentro del repo del producto
- `web/src/app/shell.tsx` → el sidebar del producto tiene "Panel Maestro" como ítem de menú
- `docker-compose.yml` → empaqueta web + api juntos, el panel maestro va con el producto

---

## POR QUE ES UN ERROR DE LOGICA DE NEGOCIO

### 1. Confusión de identidades
Hay DOS entidades completamente distintas:

  SETUBALAI (la agencia, Pablo)
    → Vende el producto
    → Administra todas las empresas clientes
    → Necesita ver métricas globales, crear/eliminar empresas
    → Su herramienta es el PANEL MAESTRO

  EMPRESA CLIENTE (ej. Ferreteria Lopez)
    → Compra el producto
    → Ve SOLO sus propios datos
    → Necesita CRM, Cobros, Productos, Reportes
    → Su herramienta es el PRODUCTO/APP

Estas dos entidades tienen objetivos opuestos: una administra, la otra usa.
Mezclarlas en una misma app es como poner el panel de control de AWS
dentro de la consola que usan los clientes de AWS.

### 2. Problema de seguridad real
- El código fuente está en GitHub público
- Un cliente técnico puede ver que existe /panel-maestro y cómo está protegido
- El endpoint GET /empresas/ lista TODAS las empresas sin autenticación en el router
  (ver services/api/routers/empresas.py línea 75-78 — no hay Depends(get_current_user))
- Aunque el frontend filtre por rol, la API está expuesta

### 3. Problema de producto / branding
- El sidebar dice "SetubalAI / Business Agent" hardcodeado
- Cuando una empresa cliente instale el producto, verá el nombre y logo de SetubalAI
- El objetivo es que vean SU propio nombre y logo (personalización por empresa)
- El panel maestro está visualmente mezclado con los módulos del cliente

### 4. Problema de distribución
- El docker-compose empaqueta web + api en un solo stack
- Si un cliente enterprise quisiera instancia propia, recibiría también el panel maestro
- No hay separación entre "lo que se entrega al cliente" y "lo que se queda en SetubalAI"

---

## LO QUE ESTA BIEN Y NO SE TIRA

Todo el backend FastAPI está CORRECTO:
- tenancy.py: resolución de empresa_id por JWT > header > param > default
- models.py: empresa_id en todas las tablas → aislamiento real
- routers/: clientes, cobros, productos, reportes, proveedores → son el núcleo del producto
- routers/empresas.py: los endpoints del panel maestro YA existen
- auth.py: JWT con empresa_id + rol → base correcta

La lógica de datos está bien. El error es solo de PRESENTACION y SEPARACION.

La página panel-maestro/page.tsx está bien construida — solo está en el lugar incorrecto.

---

## LO QUE HAY QUE CAMBIAR

Son DOS aplicaciones sobre UNA API:

```
API (FastAPI :3010)
  └── compartida, sirve a ambas apps
  └── PENDIENTE: proteger /empresas/ con rol superadmin

APP 1 — EL PRODUCTO (Next.js — lo que se vende)
  Directorio actual: /home/admin/setubalai-agente/web/
  Puerto: 3011
  Contiene: Dashboard, Clientes, Cobros, Productos, Reportes, Proveedores
  NO contiene: Panel Maestro, gestión de empresas
  Branding: dinámico según configuracion de la empresa logueada
  Usuarios: empleados/dueños de la empresa cliente

APP 2 — PANEL MAESTRO (Next.js — uso exclusivo SetubalAI)
  Directorio nuevo: /home/admin/setubalai-agente/web-admin/
  Puerto: 3012
  Contiene: Lista empresas, alta/baja, stats globales, salud del sistema
  Branding: fijo SetubalAI
  Usuarios: solo superadmin (Pablo)
  NO se vende, NO se dockeriza con el producto
```
