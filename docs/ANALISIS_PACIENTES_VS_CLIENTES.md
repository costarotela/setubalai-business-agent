# ANÁLISIS: Separación Pacientes vs Clientes

## PROBLEMA ACTUAL

La tabla `clientes` mezcla dos conceptos incompatibles:
1. **Clientes CRM**: Empresas/contactos comerciales (B2B, ventas, facturación)
2. **Pacientes médicos**: Personas físicas con historia clínica privada

Esto viola:
- Separación de concerns
- Seguridad de datos sensibles (Ley 25.326)
- Single Responsibility Principle
- Escalabilidad multi-vertical

## IMPACTO DE REFACTORIZACIÓN

### BACKEND (PostgreSQL)

**12 tablas afectadas por la separación:**

**GRUPO MÉDICO** (6 tablas → nueva tabla `pacientes`):
- visitas.paciente_id → pacientes.id
- atenciones_medicas.paciente_id → pacientes.id
- historia_clinica.paciente_id → pacientes.id
- practicas_medicas.paciente_id → pacientes.id
- recetas.paciente_id → pacientes.id
- estudios_adjuntos.paciente_id → pacientes.id

**GRUPO CRM** (4 tablas → quedan en `clientes`):
- facturas.cliente_id → clientes.id ✓
- interacciones.cliente_id → clientes.id ✓
- contactos.cliente_id → clientes.id ✓
- tickets.cliente_id → clientes.id ✓

**GRUPO PRODUCTOS** (2 tablas → no afectadas):
- items_factura.producto_id → productos.id ✓
- items_orden_compra.producto_id → productos.id ✓

### FRONTEND (Next.js)

**Rutas afectadas:**
```
/admin/clientes/*      → CRM (sin cambios)
/admin/pacientes/*     → NUEVO módulo médico
/admin/productos/*     → Sin cambios
/admin/servicios/*     → NUEVO módulo servicios
```

**Componentes a crear:**
- `PacientesTable.tsx` (lista pacientes)
- `PacienteForm.tsx` (alta/edición)
- `HistoriaClinicaViewer.tsx` (ver HC)
- `TurnosCalendar.tsx` (agenda médica)

**API afectada:**
```
/api/clientes/*     → CRM (sin cambios)
/api/pacientes/*    → NUEVO (CRUD pacientes)
/api/medico/*       → Adaptaciones FK
```

### BACKEND API (FastAPI)

**Módulos a refactorizar:**
- `routes/medico.py` → cambiar queries de `clientes` a `pacientes`
- `routes/visitas.py` → ídem
- `routes/historia_clinica.py` → ídem

**Nuevos endpoints:**
```python
# Mantener
GET  /api/clientes          # CRM
POST /api/clientes          # CRM
GET  /api/productos         # Catálogo

# NUEVOS
GET  /api/pacientes         # Lista pacientes empresa médica
POST /api/pacientes         # Alta paciente
GET  /api/pacientes/{id}    # Detalle + HC
PUT  /api/pacientes/{id}    # Editar

# ADAPTAR (cambiar JOIN de clientes a pacientes)
GET  /api/visitas
POST /api/visitas
GET  /api/historia-clinica/{paciente_id}
```

## PLAN DE MIGRACIÓN (Sin romper nada)

### FASE 1: Crear tabla pacientes (sin migrar data)
```sql
CREATE TABLE setubalai.pacientes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES setubalai.empresa(id),
    nombre VARCHAR(200) NOT NULL,
    apellido VARCHAR(200) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo VARCHAR(10),
    telefono VARCHAR(50),
    email VARCHAR(200),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    obra_social VARCHAR(200),
    numero_afiliado VARCHAR(100),
    plan VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT pacientes_unique_dni_empresa UNIQUE (empresa_id, dni)
);
```

**RIESGO:** 🟢 Ninguno (solo agrega tabla, no toca nada existente)

---

### FASE 2: Migrar data de clientes médicos a pacientes
```sql
-- Copiar registros de empresas rubro='Salud'
INSERT INTO setubalai.pacientes (
    empresa_id, nombre, apellido, dni, fecha_nacimiento, sexo,
    telefono, email, direccion, ciudad, provincia, activo
)
SELECT 
    empresa_id, nombre, apellido, dni, fecha_nacimiento, sexo,
    telefono, email, direccion, ciudad, provincia, activo
FROM setubalai.clientes c
WHERE empresa_id IN (SELECT id FROM setubalai.empresa WHERE rubro = 'Salud')
  AND dni IS NOT NULL;
```

**RIESGO:** 🟡 Bajo (solo copia, no borra)

---

### FASE 3: Actualizar FKs de tablas médicas (CRÍTICO)

**Orden de ejecución:**
```sql
-- 1. Crear columna temporal con nuevo ID
ALTER TABLE setubalai.visitas ADD COLUMN paciente_id_new INTEGER;
ALTER TABLE setubalai.atenciones_medicas ADD COLUMN paciente_id_new INTEGER;
ALTER TABLE setubalai.historia_clinica ADD COLUMN paciente_id_new INTEGER;
ALTER TABLE setubalai.practicas_medicas ADD COLUMN paciente_id_new INTEGER;
ALTER TABLE setubalai.recetas ADD COLUMN paciente_id_new INTEGER;
ALTER TABLE setubalai.estudios_adjuntos ADD COLUMN paciente_id_new INTEGER;

-- 2. Mapear IDs viejos a nuevos
UPDATE setubalai.visitas v
SET paciente_id_new = p.id
FROM setubalai.pacientes p
INNER JOIN setubalai.clientes c ON c.dni = p.dni AND c.empresa_id = p.empresa_id
WHERE v.paciente_id = c.id;

-- (repetir para las 6 tablas)

-- 3. Verificar que TODOS los registros se mapearon
SELECT COUNT(*) FROM setubalai.visitas WHERE paciente_id_new IS NULL;
-- Si esto devuelve > 0, HAY DATOS HUÉRFANOS → DETENER

-- 4. Solo si verificación = 0, hacer swap de columnas
ALTER TABLE setubalai.visitas DROP CONSTRAINT visitas_paciente_id_fkey;
ALTER TABLE setubalai.visitas DROP COLUMN paciente_id;
ALTER TABLE setubalai.visitas RENAME COLUMN paciente_id_new TO paciente_id;
ALTER TABLE setubalai.visitas ADD CONSTRAINT visitas_paciente_id_fkey 
    FOREIGN KEY (paciente_id) REFERENCES setubalai.pacientes(id) ON DELETE CASCADE;

-- (repetir para las 6 tablas)
```

**RIESGO:** 🔴 ALTO
- Si hay datos huérfanos (pacientes sin mapeo), queries fallarán
- Si frontend sigue usando `/api/clientes/{id}` para pacientes, 404
- Necesita migración de frontend EN SIMULTÁNEO

---

### FASE 4: Limpiar clientes de registros médicos
```sql
-- Borrar clientes que ya están como pacientes
DELETE FROM setubalai.clientes
WHERE empresa_id IN (SELECT id FROM setubalai.empresa WHERE rubro = 'Salud')
  AND dni IS NOT NULL
  AND EXISTS (
      SELECT 1 FROM setubalai.pacientes p 
      WHERE p.dni = clientes.dni AND p.empresa_id = clientes.empresa_id
  );
```

**RIESGO:** 🟡 Medio (si hay FKs de otras tablas apuntando, fallará)

---

### FASE 5: Adaptar Backend API
```python
# routes/pacientes.py (NUEVO)
@router.get("/pacientes")
async def listar_pacientes(empresa_id: int):
    query = "SELECT * FROM setubalai.pacientes WHERE empresa_id = $1"
    return await db.fetch_all(query, empresa_id)

# routes/visitas.py (ADAPTAR)
@router.get("/visitas/{id}")
async def get_visita(id: int):
    query = """
    SELECT v.*, p.nombre, p.apellido, p.dni, m.nombre as medico_nombre
    FROM setubalai.visitas v
    JOIN setubalai.pacientes p ON v.paciente_id = p.id  -- CAMBIO AQUÍ
    JOIN setubalai.medicos m ON v.medico_id = m.id
    WHERE v.id = $1
    """
    return await db.fetch_one(query, id)
```

**RIESGO:** 🔴 ALTO (si frontend llama endpoints viejos, 500 error)

---

### FASE 6: Adaptar Frontend
```typescript
// pages/admin/pacientes/index.tsx (NUEVO)
const PacientesPage = () => {
  const { data: pacientes } = useSWR('/api/pacientes')
  return <PacientesTable data={pacientes} />
}

// components/VisitasForm.tsx (ADAPTAR)
const VisitasForm = () => {
  // ANTES: const { data: pacientes } = useSWR('/api/clientes')
  // AHORA:
  const { data: pacientes } = useSWR('/api/pacientes')
  
  return (
    <Select>
      {pacientes?.map(p => (
        <option value={p.id}>{p.apellido}, {p.nombre} - DNI: {p.dni}</option>
      ))}
    </Select>
  )
}
```

**RIESGO:** 🟡 Medio (cache de SWR puede mostrar data vieja)

---

## ESTIMACIÓN DE ESFUERZO

**Sin romper nada existente:**

| Fase | Tarea | Tiempo | Riesgo |
|------|-------|--------|--------|
| 1 | Crear tabla `pacientes` | 30 min | 🟢 Ninguno |
| 2 | Migrar data a `pacientes` | 1 hora | 🟡 Bajo |
| 3 | Actualizar 6 FKs médicas | 3 horas | 🔴 Alto |
| 4 | Limpiar `clientes` médicos | 30 min | 🟡 Medio |
| 5 | Adaptar 4 rutas FastAPI | 2 horas | 🔴 Alto |
| 6 | Crear UI pacientes frontend | 4 horas | 🟡 Medio |
| 7 | Testing + rollback plan | 2 horas | - |

**TOTAL:** ~13 horas de trabajo

**COSTO (a tu tarifa Sonnet 4):** Si cada hora usa ~$5 de tokens = **$65 USD**

---

## ALTERNATIVA: Empezar desde cero vertical médico

**Opción más limpia:**
1. Dejar `clientes` como está (CRM genérico)
2. Crear `pacientes` desde cero
3. Nueva empresa de prueba usa solo `pacientes`
4. Frontend detecta `empresa.rubro='Salud'` y redirige a `/pacientes`
5. **NO migrar data vieja** (empresas existentes siguen usando `clientes`)

**VENTAJAS:**
- 🟢 No rompe nada existente
- 🟢 Fácil de testear en paralelo
- 🟢 Se puede revertir sin pérdida

**DESVENTAJAS:**
- 🟡 Empresas viejas quedan con arquitectura legacy
- 🟡 Dos caminos de código en backend (if rubro=='Salud')

**TIEMPO:** 6 horas  
**COSTO:** ~$30 USD

---

## RECOMENDACIÓN FINAL

**Opción PROFESIONAL:** Alternativa limpia (pacientes nuevos, clientes legacy)

**Razones:**
1. No arriesga data existente
2. Permite testear arquitectura nueva
3. Se puede migrar empresas viejas DESPUÉS si funciona
4. Costo controlado ($30 vs $65)
5. Tiempo de desarrollo menor (6h vs 13h)

**¿Procedemos con esta arquitectura?**
