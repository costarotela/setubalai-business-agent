# Router CRUD: Especialidades Médicas

## Descripción
Router FastAPI completo para gestionar especialidades médicas. Incluye operaciones CRUD con validaciones multi-tenant.

## Archivo
`/home/admin/setubalai-agente/services/api/routers/especialidades.py`

## Endpoints

### 1. GET /especialidades/
Lista todas las especialidades de la empresa.

**Query params:**
- `empresa_id` (int, required): ID de la empresa
- `activa` (bool, optional): Filtrar por estado activo/inactivo
- `buscar` (str, optional): Búsqueda en nombre, código o descripción
- `limit` (int, default=100, max=500): Límite de resultados
- `offset` (int, default=0): Paginación

**Ejemplo:**
```bash
curl -X GET "http://localhost:3010/especialidades/?empresa_id=16&activa=true&limit=10"
```

**Respuesta:**
```json
{
  "total": 4,
  "especialidades": [
    {
      "id": 1,
      "empresa_id": 16,
      "nombre": "Cardiología",
      "codigo": "CARDIO",
      "descripcion": "...",
      "duracion_turno_default": 30,
      "color_hex": "#EF4444",
      "requiere_equipos": false,
      "activa": true,
      "created_at": "2026-05-29T23:56:46+00:00",
      "updated_at": "2026-05-29T23:56:46+00:00"
    }
  ]
}
```

### 2. GET /especialidades/{id}
Obtiene una especialidad por ID.

**Ejemplo:**
```bash
curl -X GET "http://localhost:3010/especialidades/1?empresa_id=16"
```

### 3. POST /especialidades/
Crea una nueva especialidad.

**Body (JSON):**
```json
{
  "nombre": "Dermatología",
  "codigo": "derma",
  "descripcion": "Especialidad médica que trata las enfermedades de la piel",
  "duracion_turno_default": 25,
  "color_hex": "#F59E0B",
  "requiere_equipos": true,
  "activa": true
}
```

**Validaciones:**
- `nombre`: Requerido, único por empresa (case-insensitive)
- `codigo`: Automáticamente convertido a UPPERCASE
- `duracion_turno_default`: 5-300 minutos

**Ejemplo:**
```bash
curl -X POST "http://localhost:3010/especialidades/?empresa_id=16" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Dermatología",
    "codigo": "derma",
    "duracion_turno_default": 25
  }'
```

### 4. PUT /especialidades/{id}
Actualiza una especialidad existente.

**Body (JSON):** Todos los campos opcionales
```json
{
  "descripcion": "Nueva descripción",
  "duracion_turno_default": 30
}
```

**Ejemplo:**
```bash
curl -X PUT "http://localhost:3010/especialidades/4?empresa_id=16" \
  -H "Content-Type: application/json" \
  -d '{
    "duracion_turno_default": 30
  }'
```

### 5. DELETE /especialidades/{id}
Elimina una especialidad (físicamente).

**Ejemplo:**
```bash
curl -X DELETE "http://localhost:3010/especialidades/5?empresa_id=16"
```

**Respuesta:**
```json
{
  "ok": true,
  "message": "Especialidad 'Neurología' eliminada correctamente"
}
```

## Modelo SQLAlchemy

```python
class EspecialidadMedica(Base):
    __tablename__ = "especialidades_medicas"
    id = Column(Integer, primary_key=True)
    empresa_id = Column(Integer, ForeignKey("empresa.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    codigo = Column(String(50))
    descripcion = Column(Text)
    duracion_turno_default = Column(Integer)
    color_hex = Column(String(10))
    requiere_equipos = Column(Boolean, default=False)
    activa = Column(Boolean, default=True)
    created_at = Column(TIMESTAMPTZ, server_default=func.now())
    updated_at = Column(TIMESTAMPTZ, server_default=func.now())
```

## Validaciones

### 1. Código uppercase
El campo `codigo` siempre se convierte a mayúsculas usando `@field_validator`:
```python
@field_validator("codigo")
@classmethod
def codigo_uppercase(cls, v: Optional[str]) -> Optional[str]:
    return v.upper() if v else None
```

### 2. Nombre único por empresa
Al crear o actualizar, valida que no exista otra especialidad con el mismo nombre (case-insensitive):
```python
def _validate_nombre_unico(db, empresa_id, nombre, especialidad_id=None):
    query = db.query(EspecialidadMedica).filter(
        EspecialidadMedica.empresa_id == empresa_id,
        func.lower(EspecialidadMedica.nombre) == nombre.lower()
    )
    if especialidad_id:
        query = query.filter(EspecialidadMedica.id != especialidad_id)
    if query.first():
        raise HTTPException(400, "Ya existe una especialidad con ese nombre")
```

## Multi-tenancy
Todos los endpoints usan `empresa_id = Depends(resolve_empresa_id)` para:
1. Extraer `empresa_id` del JWT token (máxima seguridad)
2. Header `X-Empresa-ID` (skills de Hermes)
3. Query param `empresa_id` (legacy/testing)

Todas las queries filtran por `empresa_id` para aislamiento de datos.

## Registro en main.py
```python
from routers import especialidades
app.include_router(especialidades.router)
```

## Tests ejecutados

✅ GET /especialidades/ (listar)
✅ GET /especialidades/{id} (obtener por ID)
✅ POST /especialidades/ (crear)
✅ GET con filtros (activa=true, buscar=cardio)
✅ PUT /especialidades/{id} (actualizar)
✅ Validación código uppercase (derma → DERMA)
✅ Validación nombre único (rechaza duplicado)
✅ DELETE /especialidades/{id} (eliminar)
✅ Verificación eliminación (404)

## Datos de prueba
Base de datos: `setubalai.especialidades_medicas`
Empresa de prueba: `empresa_id=16` (Centro Médico Santa Clara)

Registros iniciales:
1. Cardiología (CARDIO) - 30 min - #EF4444
2. Traumatología (TRAUMA) - 45 min - #3B82F6
3. Pediatría (PEDIATRIA) - 20 min - #10B981

## Estructura de respuesta
Todas las respuestas JSON usan schemas Pydantic:
- `EspecialidadCreate`: Para POST
- `EspecialidadUpdate`: Para PUT (campos opcionales)
- `EspecialidadResponse`: Para respuestas GET

## Notas
- Los timestamps se manejan con `func.now()` de SQLAlchemy
- El campo `updated_at` se actualiza automáticamente en PUT
- DELETE es físico (no lógico); considerar usar `activa=False` si hay registros relacionados
- Incluye docstrings completos en todos los endpoints y funciones
