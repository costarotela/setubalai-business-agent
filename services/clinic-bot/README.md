# 📲 services/clinic-bot/ — BOT TELEGRAM

**Servicio:** `setubalai-clinic-bot.service` (systemd)
**Lenguaje:** Python 3.12
**Framework:** python-telegram-bot v21+

## Qué es
Bot de Telegram para pacientes. Identifica por chat_id, agenda turnos, cancela, reprograma.
Usa MCP tools del backend para interactuar con la base de datos.

## Flujo del Bot
1. Paciente escribe al bot
2. Bot identifica por chat_id → busca paciente en DB
3. Si no existe → pide datos → crea paciente
4. Menú: Agendar turno, Cancelar, Reprogramar, Ver mis turnos
5. Para agendar: especialidad → médico → slot → confirmar
6. Usa MCP tools: `med_buscar_paciente`, `med_especialidades_disponibles`, `med_buscar_slots_disponibles`, `med_crear_turno`, `med_cancelar_turno`, `med_modificar_turno`

## Cómo reiniciar
```bash
systemctl --user restart setubalai-clinic-bot.service
```

## Cómo ver logs
```bash
journalctl --user -u setubalai-clinic-bot.service -f
```
