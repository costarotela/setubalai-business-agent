---
name: setubalai-cron-cobros
description: "Cron job: verificar facturas vencidas y enviar recordatorios por Telegram"
version: 1.0.0
---

# Cron: Recordatorios de Cobros

## Lógica

1. Consultar /cobros/vencidas?empresa_id=1
2. Si hay facturas vencidas, listarlas con nombre del cliente, numero y monto
3. Consultar /cobros/pendientes?empresa_id=1 para mostrar el total pendiente
4. Responder directamente en Telegram con el resumen

## Comando

```bash
curl -s http://localhost:3010/cobros/vencidas?empresa_id=1
curl -s http://localhost:3010/cobros/pendientes?empresa_id=1
curl -s http://localhost:3010/reportes/dashboard?empresa_id=1
```
