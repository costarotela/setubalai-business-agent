# 🔑 CREDENCIALES SETUBALAI BUSINESS

**Fecha:** 29 Mayo 2026  
**Sistema:** https://business.setubalai.org

---

## 🏥 CENTRO MÉDICO SANTA CLARA (Empresa ID: 16)

### Admin Principal
```
Email:    admin@centromedicosantaclara.com.ar
Password: Admin123!
Rol:      admin
```

**Este usuario puede:**
- Acceder a `/configuracion/agenda/`
- Ver y modificar grillas horarias
- Gestionar bloqueos (vacaciones)
- Configurar duraciones por especialidad
- Ver turnos y pacientes
- Gestionar médicos

---

## 👨‍⚕️ MÉDICOS (Operadores)

### Dr. María García (Clínica Médica)
```
Email: medico.mara.garca@centromedico.com.ar
Rol: operador
```

### Dr. Carlos Rodríguez (Cardiología)
```
Email: medico.carlos.rodrguez@centromedico.com.ar
Rol: operador
```

### Dr. Juan Martínez (Traumatología)
```
Email: medico.juan.martnez@centromedico.com.ar
Rol: operador
```

---

## 🔐 SUPERADMIN (Solo desarrollo/soporte)

```
Email:    pcostarotela@gmail.com
Password: Pablo2024!
Rol:      superadmin
```

**Este usuario puede ver TODAS las empresas.**

---

## 📊 DATOS PRECARGADOS

### Grillas Horarias (8 registros)
- Dr. García: Lun/Mar 9-13h, 15-19h
- Dr. Rodríguez: Lun/Mié 14-20h
- Dr. Martínez: Mar/Jue 10-14h

### Duraciones por Especialidad (3 registros)
- Clínica Médica: 20 minutos
- Cardiología: 30 minutos
- Traumatología: 45 minutos

### Bloqueos (1 registro test)
- Dr. Rodríguez: Vacaciones 15-20 junio 2026

---

## 🌐 RUTAS IMPORTANTES

### Configuración
- `/configuracion/agenda/` → Menú principal
- `/configuracion/agenda/profesionales/` → Listado médicos
- `/configuracion/agenda/grillas/` → Horarios por médico
- `/configuracion/agenda/bloqueos/` → Vacaciones/excepciones
- `/configuracion/agenda/duraciones/` → Tiempo por especialidad

### Operación
- `/turnos/` → Listado de turnos
- `/turnos/calendario/` → Vista calendario (próximamente reactivo)
- `/pacientes/` → Listado de pacientes
- `/medicos/` → Gestión de profesionales

---

## ⚠️ IMPORTANTE

1. **Multi-tenant estricto:** Cada admin SOLO ve datos de su empresa
2. **Password reset:** Si olvidás la contraseña, contactar soporte
3. **Datos de prueba:** Los médicos y horarios son de demo, editables desde `/configuracion/agenda/`

---

**Última actualización:** 2026-05-29 14:15 UTC
