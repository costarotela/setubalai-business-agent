# USER — SetubalAI Business Agent
**Última actualización:** 2026-05-21

---

## CLIENTE ACTUAL (Fase 1)

**Empresa:** SetubalAI
**Dueño:** Pablo Costarotela (@pcostarotela)
**Rubro:** Agencia de AI — servicios y productos digitales
**Canal principal:** Telegram (@SetubalCEObot)
**VPS:** 135.181.86.129 (Hetzner)
**Dashboard:** https://hermes.setubalai.org

### Servicios que vende SetubalAI:
- Agentes AI custom para empresas
- Consultoría en implementación de AI
- Templates y herramientas AI

### Productos que vende SetubalAI:
- Templates (CRM, reportes, automatizaciones)
- Cursos y formación en AI

---

## PERFIL DEL CLIENTE OBJETIVO (quien compra el producto)

**Quién es:**
- Dueño o gerente de PYME (5-50 empleados)
- Argentina / Latinoamérica principalmente
- No tiene conocimientos técnicos
- Usa WhatsApp/Telegram todo el día
- Quiere control sin complicaciones

**Sus problemas actuales:**
- Clientes en planillas de Excel desactualizadas
- No sabe quién le debe plata sin revisar manualmente
- Pierde clientes por falta de seguimiento
- No tiene visibilidad del negocio en tiempo real
- Paga múltiples apps (CRM + facturación + stock) y no las usa bien

**Lo que quiere:**
- Un lugar donde esté TODO
- Poder preguntar "cómo va el negocio" y obtener respuesta inmediata
- Que el sistema lo avise, no tener que ir a buscar
- Simple como Telegram, potente como un ERP

---

## CONFIGURACION DEL AGENTE (SetubalAI)

### Base de datos:
- Motor: PostgreSQL 17 (Docker, ya corriendo)
- Schema: `setubalai` (schema dedicado)
- Conexión: `postgresql://localhost:5432/business`

### Agente:
- Perfil Hermes: `local`
- Bot Telegram: @SetubalCEObot
- Memoria: Noxem (a instalar)
- Modelo: qwen/qwen3.6-plus (OpenRouter)
- Fallback: qwen3:1.7b (Ollama local)

### Web App:
- URL: https://setubalai.setubalai.org (a configurar)
- Puerto: 3001
- Admin: pcostarotela@gmail.com

---

## CATALOGO SETUBALAI (datos iniciales)

### Servicios:
| Nombre | Precio | Tipo |
|--------|--------|------|
| Agente AI Starter | $99 USD/mes | Suscripción |
| Agente AI Business | $249 USD/mes | Suscripción |
| Agente AI Enterprise | $499 USD/mes | Suscripción |
| Setup e instalación | $200-500 USD | Único |
| Consultoría AI (hora) | $80 USD/h | Por hora |

### Productos:
| Nombre | Precio | Stock |
|--------|--------|-------|
| Template CRM | $50 USD | Digital (∞) |
| Template Reportes | $30 USD | Digital (∞) |
| Pack Templates | $99 USD | Digital (∞) |

---

## PREFERENCIAS DEL SISTEMA

- **Idioma:** Español (Argentina)
- **Moneda principal:** USD (con equivalente ARS)
- **Zona horaria:** America/Argentina/Buenos_Aires (UTC-3)
- **Formato fecha:** DD/MM/YYYY
- **Notificaciones:** Telegram primero, email como respaldo
- **Recordatorios de cobro:** 3 días antes + día de vencimiento + 3 días después

---

## NOTAS DEL NEGOCIO

- Pablo prefiere respuestas directas y cortas
- No tiene conocimientos técnicos — todo debe ser transparente
- Opera principalmente desde el celular (Telegram)
- El producto debe funcionar perfecto antes de venderlo
- Prioridad: que funcione bien, luego que escale
- Canal de trabajo: Telegram y CLI SSH al VPS

---

*Este archivo se actualiza con cada cliente nuevo que se agrega al sistema*
