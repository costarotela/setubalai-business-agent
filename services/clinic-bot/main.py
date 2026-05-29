#!/usr/bin/env python3
"""
SetubalAI Clinic Bot — Telegram bot para centros médicos.
Escucha pacientes en Telegram y resuelve turnos con MCP tools.
"""
import os, sys, json, logging
from datetime import datetime, timedelta
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters

# Load config
load_dotenv("/home/admin/.setubalai_clinic_bot.env")
BOT_TOKEN = os.getenv("SETUBALAI_CLINIC_BOT_TOKEN")

# MCP tools import
sys.path.insert(0, "/home/admin/setubalai-agente/services/api")
import mcp_server as mcp

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def _reply(update, text, **kwargs):
    """Envia un mensaje, funciona tanto en mensajes de texto como en callback_query."""
    if update.effective_message:
        return update.effective_message.reply_text(text, **kwargs)
    elif hasattr(update, 'callback_query') and update.callback_query:
        return update.callback_query.message.reply_text(text, **kwargs)
    return None


def _get_text(update):
    return (update.effective_message.text or '').strip()


def _get_chat_id(update):
    return _get_chat_id(update)


# Conversation state per Telegram chat_id
user_state = {}

WELCOME_MSG = (
    "🏥 *Bienvenido al Centro Médico*\n\n"
    "Soy tu asistente virtual. Puedo ayudarte con:\n"
    "📅 Sacar un turno\n"
    "❌ Cancelar un turno\n"
    "🔄 Reprogramar un turno\n\n"
    "¿Qué necesit\u00E1s?"
)

def get_user_name(update: Update) -> str:
    u = update.effective_user
    return f"{u.first_name or ''} {u.last_name or ''}".strip() or f"Usuario {u.id}"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = _get_chat_id(update)
    user_state[chat_id] = {"step": "menu"}
    await _reply(update, WELCOME_MSG, parse_mode='Markdown')


async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, WELCOME_MSG, parse_mode='Markdown')


async def handle_menu(update: Update, text: str):
    await _reply(update, 
        "No estoy seguro de qu\u00E9 necesit\u00E1s. \u00BFQuer\u00E9s:\n\n"
        "📅 _Sacar un turno_\n"
        "❌ _Cancelar un turno_\n"
        "🔄 _Reprogramar un turno_?",
        parse_mode='Markdown'
    )


# ─── ROUTE TEXT MESSAGES ────────────────────────────────────────────────────

async def route_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = _get_chat_id(update)
    text = (_get_text(update) or '').strip()
    state = user_state.get(chat_id, {"step": "menu"})
    step = state.get("step", "menu")

    # If in menu, detect intent
    if step == "menu":
        intent = detect_intent(text)
        if intent == 'agendar':
            await iniciar_agendar(update, context, chat_id)
            return
        elif intent == 'cancelar':
            user_state[chat_id] = {"step": "cancelar_buscar_paciente"}
            await _reply(update, 
                "\u274C *Cancelar turno*\n\n"
                "\u00BFCu\u00E1l es tu *DNI*?",
                parse_mode='Markdown'
            )
            return
        elif intent == 'reprogramar':
            await _reply(update, 
                "\U0001F504 *Reprogramar turno*\n\n"
                "\u00BFCu\u00E1l es tu *DNI*?",
                parse_mode='Markdown'
            )
            user_state[chat_id] = {"step": "reprogramar_buscar"}
            return
        else:
            await handle_greeting(update)
            return

    # Step-based routing
    if step == "agendar_buscar_paciente":
        await procesar_buscar_paciente(update, context, chat_id, text)
    elif step == "agendar_crear_paciente_datos":
        await procesar_crear_paciente(update, context, chat_id, text)
    elif step == "cancelar_buscar_paciente":
        await procesar_cancelar_paciente(update, chat_id, text)
    else:
        await handle_menu(update, text)


# ─── AGENDAR TURNO ──────────────────────────────────────────────────────────

async def iniciar_agendar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = _get_chat_id(update)
    user_state[chat_id] = {"step": "agendar_buscar_paciente"}
    await _reply(update, 
        "📋 *Sacar turno*\n\n"
        "Primero necesito identificarte.\n"
        "\u00BFCu\u00E1l es tu *DNI*?",
        parse_mode='Markdown'
    )


async def procesar_buscar_paciente(update: Update, context: ContextTypes.DEFAULT_TYPE, chat_id: int, dni: str):
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get('total', 0) > 0:
        p = r['pacientes'][0]
        user_state[chat_id].update({
            "step": "agendar_mostrar_especialidades",
            "paciente_id": p['id'],
            "paciente_nombre": f"{p['nombre']} {p['apellido']}",
            "obra_social": p.get('obra_social', '') or ''
        })
        await _reply(update, 
            f"✅ Te encontr\u00E9: *{p['nombre']} {p['apellido']}*\n"
            f"Obra social: {p.get('obra_social', 'Particular') or 'Particular'}\n\n"
            f"\u00BFPara qu\u00E9 *especialidad* quer\u00E9s turno?",
            parse_mode='Markdown'
        )
        await mostrar_especialidades(update, chat_id)
    else:
        user_state[chat_id].update({"step": "agendar_crear_paciente_datos", "dni_temp": dni})
        await _reply(update, 
            "No te encontr\u00E9 en el sistema.\n"
            "Enviame en un solo mensaje, separados por coma:\n"
            "*Nombre*, *Apellido*, *Tel\u00E9fono*, *Obra Social*\n\n"
            "Ejemplo: Juan, P\u00E9rez, 11-5555-1234, OSDE",
            parse_mode='Markdown'
        )


async def mostrar_especialidades(update, chat_id):
    """Envía las especialidades como botones inline."""
    spec_r = mcp.med_especialidades_disponibles()
    specs = spec_r.get('especialidades', [])
    if not specs:
        await _reply(update, "No hay especialidades disponibles.")
        return
    keyboard = [[InlineKeyboardButton(s, callback_data=f"spec_{s}")] for s in specs]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update, "Eleg\u00ED una especialidad:", reply_markup=reply_markup)


async def procesar_crear_paciente(update: Update, context: ContextTypes.DEFAULT_TYPE, chat_id: int, text: str):
    parts = [p.strip() for p in text.split(',')]
    if len(parts) < 4:
        await _reply(update, "Necesito 4 datos separados por coma:\nNombre, Apellido, Tel\u00E9fono, Obra Social")
        return

    nombre, apellido, telefono, obra_social = parts[0], parts[1], parts[2], parts[3]
    state = user_state.get(chat_id, {})

    r = mcp.med_crear_paciente(
        nombre=nombre, apellido=apellido, dni=state.get('dni_temp', ''),
        telefono=telefono, obra_social=obra_social
    )

    if r.get('ok'):
        user_state[chat_id].update({
            "step": "agendar_mostrar_especialidades",
            "paciente_id": r['id'],
            "paciente_nombre": f"{nombre} {apellido}",
            "obra_social": obra_social
        })
        await _reply(update, 
            f"✅ *Registrado*: {nombre} {apellido}\n"
            f"\u00BFPara qu\u00E9 especialidad quer\u00E9s turno?",
            parse_mode='Markdown'
        )
        await mostrar_especialidades(update, chat_id)
    else:
        await _reply(update, f"\u274C Error: {r.get('error')}")


async def procesar_elegir_especialidad(update: Update, chat_id: int, especialidad: str):
    state = user_state.get(chat_id, {})
    if not state.get('paciente_id'):
        await _reply(update, "Primero necesito identificarte. /start")
        return

    state["step"] = "agendar_mostrar_medicos"
    state["especialidad"] = especialidad
    user_state[chat_id] = state

    r = mcp.med_listar_medicos(especialidad=especialidad)
    if r.get('total', 0) == 0:
        await _reply(update, f"No hay m\u00E9dicos disponibles para {especialidad}.")
        user_state[chat_id] = {"step": "menu"}
        return

    keyboard = []
    for doc in r['medicos']:
        name = f"Dr/a. {doc['nombre']} {doc['apellido']}"
        keyboard.append([InlineKeyboardButton(name, callback_data=f"doc_{doc['id']}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update, 
        f"Profesionales de *{especialidad}*:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def procesar_elegir_medico(update: Update, chat_id: int, medico_id: int):
    state = user_state.get(chat_id, {})
    state["step"] = "agendar_mostrar_slots"
    state["medico_id"] = medico_id
    user_state[chat_id] = state

    r_medicos = mcp.med_listar_medicos()
    medico = None
    for m in r_medicos.get('medicos', []):
        if m['id'] == medico_id:
            medico = m
            break

    if not medico:
        await _reply(update, "Error: m\u00E9dico no encontrado.")
        return

    hoy = datetime.now()
    semana = hoy + timedelta(days=7)
    slots_r = mcp.med_buscar_slots_disponibles(
        medico_id=medico_id,
        fecha_desde=hoy.strftime("%Y-%m-%d"),
        fecha_hasta=semana.strftime("%Y-%m-%d")
    )

    if not slots_r.get('slots'):
        await _reply(update, 
            f"No hay turnos disponibles con {medico['nombre']} {medico['apellido']} "
            f"para los pr\u00F3ximos 7 d\u00EDas."
        )
        user_state[chat_id] = {"step": "menu"}
        return

    slots = slots_r['slots'][:15]

    keyboard = []
    current_date = None
    for s in slots:
        dt = datetime.fromisoformat(s)
        date_str = dt.strftime("%d/%m")
        if date_str != current_date:
            current_date = date_str
            keyboard.append([InlineKeyboardButton(f"\U0001f4c5 {date_str}", callback_data="date_sep")])
        time_str = dt.strftime("%H:%M")
        keyboard.append([InlineKeyboardButton(f"  \u23F0 {time_str}", callback_data=f"slot_{s}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update, 
        f"Turnos disponibles:",
        reply_markup=reply_markup
    )


async def procesar_elegir_slot(update: Update, chat_id: int, slot_iso: str):
    state = user_state.get(chat_id, {})
    paciente_id = state.get('paciente_id')
    medico_id = state.get('medico_id')

    if not paciente_id or not medico_id:
        await _reply(update, "Error: datos incompletos.")
        return

    r = mcp.med_crear_turno(
        paciente_id=paciente_id,
        medico_id=medico_id,
        fecha_hora=slot_iso,
        motivo_consulta="Consulta general"
    )

    if r.get('ok'):
        dt = datetime.fromisoformat(r['fecha_hora'])
        fecha_fmt = dt.strftime("%A %d de %B").capitalize()
        hora_fmt = dt.strftime("%H:%M")

        await _reply(update, 
            f"\u2705 *\u00A1Turno confirmado!*\n\n"
            f"\U0001f5d3\ufe0f {fecha_fmt} \u2014 {hora_fmt}hs\n"
            f"\U0001f468\u200D\u2695\ufe0f {r['medico']}\n"
            f"\U0001f3e5 Centro M\u00E9dico\n\n"
            f"Record\u00E1 traer DNI y carnet de obra social.\n"
            f"\u26A0\uFE0F Pod\u00E9s cancelar o modificar con al menos *24hs* de anticipaci\u00F3n.",
            parse_mode='Markdown'
        )
    else:
        await _reply(update, 
            f"\u274C No se pudo crear el turno: {r.get('error')}"
        )

    user_state[chat_id] = {"step": "menu"}


# ─── CANCELAR TURNO ─────────────────────────────────────────────────────────

async def iniciar_cancelar(update: Update, chat_id: int):
    user_state[chat_id] = {"step": "cancelar_buscar_paciente"}
    await _reply(update, 
        "\u274C *Cancelar turno*\n\n"
        "\u00BFCu\u00E1l es tu *DNI*?",
        parse_mode='Markdown'
    )


async def procesar_cancelar_paciente(update: Update, chat_id: int, dni: str):
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get('total', 0) == 0:
        await _reply(update, "No te encontr\u00E9 con ese DNI.")
        user_state[chat_id] = {"step": "menu"}
        return

    paciente_id = r['pacientes'][0]['id']
    paciente_nombre = r['pacientes'][0]['nombre'] + ' ' + r['pacientes'][0]['apellido']

    turnos_r = mcp.med_listar_turnos(paciente_id=paciente_id, estado='pendiente')
    if turnos_r.get('total', 0) == 0:
        await _reply(update, f"{paciente_nombre}, no ten\u00E9s turnos pendientes.")
        user_state[chat_id] = {"step": "menu"}
        return

    keyboard = []
    for t in turnos_r['turnos']:
        dt = datetime.fromisoformat(t['fecha_hora'])
        fecha_fmt = dt.strftime("%d/%m %H:%M")
        text = f"{fecha_fmt} - {t['medico']} ({t['especialidad']})"
        keyboard.append([InlineKeyboardButton(text, callback_data=f"cancel_{t['id']}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    state = user_state.get(chat_id, {})
    state['paciente_id'] = paciente_id
    user_state[chat_id] = state
    await _reply(update, 
        f"Estos son tus turnos pendientes. Eleg\u00ED cu\u00E1l cancelar:",
        reply_markup=reply_markup
    )


# ─── INTENT DETECTION FROM TEXT ─────────────────────────────────────────────

def detect_intent(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ['turno', 'cita', 'sacar', 'agendar', 'reservar', 'horario']):
        return 'agendar'
    if any(w in t for w in ['cancel', 'anul', 'suspender', 'borrar turno']):
        return 'cancelar'
    if any(w in t for w in ['reprogram', 'cambiar', 'modif', 'mover turno']):
        return 'reprogramar'
    return None


async def handle_greeting(update: Update):
    await _reply(update, 
        f"\u00A1Hola {get_user_name(update)}! \U0001F44B\n"
        "\u00BFEn qu\u00E9 puedo ayudarte?",
        parse_mode='Markdown'
    )
    await mostrar_menu(update)


async def mostrar_menu(update: Update):
    await _reply(update, 
        "\U0001F4c5 _Sacar turno_\n"
        "\u274C _Cancelar turno_\n"
        "\U0001F504 _Reprogramar turno_",
        parse_mode='Markdown'
    )


# ─── BUTTON HANDLER (callback queries) ──────────────────────────────────────

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    chat_id = query.message.chat_id
    state = user_state.get(chat_id, {})
    step = state.get("step", "menu")

    if data == "date_sep" or data == "ignore":
        await query.answer()
        return

    try:
        await query.answer()
    except Exception:
        pass

    if step == "agendar_mostrar_especialidades":
        if data.startswith('spec_'):
            esp = data.replace('spec_', '')
            await query.message.reply_text(f"·Elegiste: *{esp}*\nBuscando profesionales...", parse_mode='Markdown')
            await procesar_elegir_especialidad(update, chat_id, esp)
        else:
            await query.answer()
    elif step == "agendar_mostrar_medicos":
        if data.startswith('doc_'):
            medico_id = int(data.replace('doc_', ''))
            await query.message.reply_text("Buscando turnos disponibles...")
            await procesar_elegir_medico(update, chat_id, medico_id)
        else:
            await query.answer()
    elif step == "agendar_mostrar_slots":
        if data.startswith('slot_'):
            slot_iso = data.replace('slot_', '')
            await query.message.reply_text("\u23F3 Confirmando turno...")
            await procesar_elegir_slot(update, chat_id, slot_iso)
        else:
            await query.answer()
    elif step == "cancelar_mostrar_turnos":
        if data.startswith('cancel_'):
            turno_id = int(data.replace('cancel_', ''))
            await procesar_cancelar_confirmar(update, chat_id, turno_id)
        else:
            await query.answer()
    else:
        await query.answer()


async def procesar_cancelar_confirmar(update: Update, chat_id: int, turno_id: int):
    r = mcp.med_cancelar_turno(turno_id=turno_id, motivo="Cancelado por paciente via Telegram")
    if r.get('ok'):
        await _reply(update, f"✅ *Turno cancelado*\n\n{r.get('mensaje', '')}", parse_mode='Markdown')
    else:
        await _reply(update, f"\u274C {r.get('error', 'No se pudo cancelar')}")
    user_state[chat_id] = {"step": "menu"}


# ─── MAIN ───────────────────────────────────────────────────────────────────

def main():
    logger.info(f"Iniciando SetubalAI Clinic Bot...")
    logger.info(f"Bot: @SetubalClibot")

    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))

    # Text messages - route by state or intent
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, route_message))

    # Inline button clicks
    app.add_handler(CallbackQueryHandler(button_handler))

    logger.info("Bot iniciado. Escuchando mensajes...")
    app.run_polling()

if __name__ == "__main__":
    main()
