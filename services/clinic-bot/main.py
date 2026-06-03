#!/usr/bin/env python3
"""
SetubalAI Clinic Bot — Telegram bot para centros médicos.
Escucha pacientes en Telegram y resuelve turnos con MCP tools.
"""
import os, sys, json, logging
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ContextTypes, filters

# Load config
load_dotenv("/home/admin/.setubalai_clinic_bot.env")
BOT_TOKEN = os.getenv("SETUBALAI_CLINIC_BOT_TOKEN")

# MCP tools import
sys.path.insert(0, "/home/admin/setubalai-agente/services/api")
import mcp_server as mcp

# Database imports for direct patient lookup by telegram_chat_id
from database import get_db
from models import Paciente

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
    return update.effective_chat.id


def _lookup_paciente_by_chat(chat_id, empresa_id=16):
    """Busca un paciente vinculado a este chat_id de Telegram."""
    db = None
    try:
        db = next(get_db())
        p = db.query(Paciente).filter(
            Paciente.telegram_chat_id == chat_id,
            Paciente.empresa_id == empresa_id
        ).first()
        if p:
            return {"id": p.id, "nombre": p.nombre, "apellido": p.apellido}
    except Exception as e:
        logger.warning(f"Error lookup paciente by chat_id: {e}")
    finally:
        if db:
            db.close()
    return None


def _save_chat_id_to_paciente(paciente_id, chat_id, empresa_id=16):
    """Vincula un paciente con el chat_id de Telegram."""
    db = None
    try:
        db = next(get_db())
        db.query(Paciente).filter(
            Paciente.id == paciente_id,
            Paciente.empresa_id == empresa_id
        ).update({"telegram_chat_id": chat_id})
        db.commit()
    except Exception as e:
        logger.warning(f"Error saving chat_id: {e}")
    finally:
        if db:
            db.close()


# Conversation state per Telegram chat_id
user_state = {}

WELCOME_MSG = (
    "🏥 *Centro Médico Santa Clara*\\n\\n"
    "Soy tu asistente virtual. ¿En qué te ayudo?"
)

def get_user_name(update: Update) -> str:
    u = update.effective_user
    return f"{u.first_name or ''} {u.last_name or ''}".strip() or f"Usuario {u.id}"


def _main_menu_keyboard():
    """Botones principales del menú, siempre disponibles."""
    keyboard = [
        [InlineKeyboardButton("📅 Sacar turno", callback_data="menu_agendar")],
        [InlineKeyboardButton("📋 Ver mis turnos", callback_data="menu_ver_turnos")],
        [InlineKeyboardButton("🔄 Reprogramar", callback_data="menu_reprogramar")],
        [InlineKeyboardButton("❌ Cancelar", callback_data="menu_cancelar")],
        [InlineKeyboardButton("👋 Salir", callback_data="menu_salir")],
    ]
    return InlineKeyboardMarkup(keyboard)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = _get_chat_id(update)
    user_state[chat_id] = {"step": "menu"}
    
    # Check if patient is linked
    paciente = _lookup_paciente_by_chat(chat_id)
    if paciente:
        user_state[chat_id].update({
            "paciente_id": paciente["id"],
            "paciente_nombre": paciente["nombre"] + " " + paciente["apellido"]
        })
        await _reply(update,
            f"👋 Hola *{paciente['nombre']}*, bienvenido de vuelta!",
            parse_mode='Markdown',
            reply_markup=_main_menu_keyboard()
        )
    else:
        await _reply(update, WELCOME_MSG, parse_mode='Markdown', reply_markup=_main_menu_keyboard())


async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _reply(update, WELCOME_MSG, parse_mode='Markdown', reply_markup=_main_menu_keyboard())


def _action_buttons_keyboard(turno_id=None):
    """Botones de acción: Repongramar, Cancelar, Salir."""
    keyboard = [
        [InlineKeyboardButton("🔄 Reprogramar", callback_data="menu_reprogramar")],
        [InlineKeyboardButton("❌ Cancelar", callback_data="menu_cancelar")],
        [InlineKeyboardButton("👋 Salir", callback_data="menu_salir")],
    ]
    if turno_id:
        keyboard.insert(0, [
            InlineKeyboardButton("🔄 Reprogramar este turno", callback_data=f"vt_reprog_{turno_id}"),
        ])
        keyboard.insert(1, [
            InlineKeyboardButton("❌ Cancelar este turno", callback_data=f"vt_cancel_{turno_id}"),
        ])
    return InlineKeyboardMarkup(keyboard)


def _despedida_keyboard():
    keyboard = [[InlineKeyboardButton("🏥 Volver al menú", callback_data="menu_home")]]
    return InlineKeyboardMarkup(keyboard)


# ─── ROUTE TEXT MESSAGES ────────────────────────────────────────────────────

async def route_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = _get_chat_id(update)
    text = (_get_text(update) or '').strip()
    state = user_state.get(chat_id, {"step": "menu"})
    step = state.get("step", "menu")

    # If in menu, detect intent
    if step == "menu":
        # Auto-recognize patient linked to this chat_id
        paciente_vinculado = _lookup_paciente_by_chat(chat_id)
        if paciente_vinculado:
            user_state[chat_id] = {
                "step": "menu",
                "paciente_id": paciente_vinculado["id"],
                "paciente_nombre": f"{paciente_vinculado['nombre']} {paciente_vinculado['apellido']}"
            }
        intent = detect_intent(text)
        if intent == 'agendar':
            await iniciar_agendar(update, context, chat_id)
            return
        elif intent == 'cancelar':
            if state.get("paciente_id"):
                # Ya reconocido, ir directo a mostrar turnos
                await _reply(update,
                    f"Ok {state.get('paciente_nombre', '')}, buscando tus turnos pendientes...",
                    parse_mode='Markdown'
                )
                user_state[chat_id] = {**state, "step": "cancelar_mostrar_turnos"}
                await procesar_cancelar_mostrar_turnos(update, chat_id, state.get("paciente_id"))
            else:
                user_state[chat_id] = {"step": "cancelar_buscar_paciente"}
                await _reply(update,
                    "\u274C *Cancelar turno*\n\n"
                    "\u00BFCu\u00E1l es tu *DNI*?",
                    parse_mode='Markdown'
                )
            return
        elif intent == 'reprogramar':
            if state.get("paciente_id"):
                await _reply(update,
                    f"Ok {state.get('paciente_nombre', '')}, buscando tus turnos para reprogramar...",
                    parse_mode='Markdown'
                )
                user_state[chat_id] = {**state, "step": "reprogramar_mostrar_turnos"}
                await procesar_reprogramar_mostrar_turnos(update, chat_id, state.get("paciente_id"))
            else:
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
    elif step == "reprogramar_buscar":
        await procesar_reprogramar_buscar_paciente(update, chat_id, text)
    elif step == "ver_turnos_buscar":
        await procesar_reprogramar_buscar_paciente_verturnos(update, chat_id, text)
    else:
        # En menú o step desconocido — sugerir volver al menú
        await mostrar_menu(update)


# ─── AGENDAR TURNO ──────────────────────────────────────────────────────────

async def iniciar_agendar(update: Update, context: ContextTypes.DEFAULT_TYPE, chat_id: int = None):
    if chat_id is None:
        chat_id = _get_chat_id(update)
    state = user_state.get(chat_id, {})
    if state.get("paciente_id"):
        # Ya reconocido por chat_id, ir directo a especialidades
        await _reply(update,
            f"Ok {state.get('paciente_nombre', '')}! \\u00BFPara qu\\u00E9 *especialidad* quer\\u00E9s turno?",
            parse_mode='Markdown'
        )
        user_state[chat_id] = {**state, "step": "agendar_mostrar_especialidades"}
        await mostrar_especialidades(update, chat_id)
        return
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
        # Vincular este chat_id al paciente identificado por DNI
        _save_chat_id_to_paciente(p['id'], chat_id)
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
    keyboard = [[InlineKeyboardButton(s['nombre'], callback_data=f"spec_{s['nombre']}")] for s in specs]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update, "Eleg\\u00ED una especialidad:", reply_markup=reply_markup)


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
        # Vincular este chat_id al paciente creado
        _save_chat_id_to_paciente(r['id'], chat_id)
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

    slots = slots_r['slots'][:20]

    keyboard = []
    current_date = None
    for s in slots:
        # s is a dict: {'fecha': datetime.date, 'hora': '08:00', ...}
        slot_date = s['fecha']
        slot_hora = s['hora']
        dt = datetime(slot_date.year, slot_date.month, slot_date.day,
                      int(slot_hora.split(':')[0]), int(slot_hora.split(':')[1]))
        date_str = dt.strftime("%d/%m")
        if date_str != current_date:
            current_date = date_str
            keyboard.append([InlineKeyboardButton(f"📅 {date_str}", callback_data="date_sep")])
        time_str = dt.strftime("%H:%M")
        slot_iso = dt.strftime("%Y-%m-%dT%H:%M:00")
        keyboard.append([InlineKeyboardButton(f"  ⏰ {time_str}", callback_data=f"slot_{slot_iso}")])

    # Botón para volver
    keyboard.append([InlineKeyboardButton("↩️ Volver al menú", callback_data="menu_home")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update,
        f"Turnos disponibles con {medico['nombre']} {medico['apellido']}:",
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
        medico_nombre = r.get('medico', '')

        await _reply(update,
            f"\u2705 *\u00A1Turno confirmado!*\n\n"
            f"\U0001f5d3\ufe0f {fecha_fmt} \u2014 {hora_fmt}hs\n"
            f"\U0001f468\u200D\u2695\ufe0f {medico_nombre}\n"
            f"\U0001f3e5 Centro M\u00E9dico Santa Clara\n\n"
            f"Record\u00E1 traer *DNI* y *carnet de obra social*.\n"
            f"\u26A0\ufe0f Pod\u00E9s cancelar o modificar con al menos *24hs* de anticipaci\u00F3n.",
            parse_mode='Markdown',
            reply_markup=_main_menu_keyboard()
        )
    else:
        await _reply(update,
            f"\u274C No se pudo crear el turno: {r.get('error')}",
            reply_markup=_main_menu_keyboard()
        )

    user_state[chat_id] = {"step": "menu"}
    await mostrar_menu(update)


# ─── CANCELAR TURNO ─────────────────────────────────────────────────────────

async def iniciar_cancelar(update: Update, chat_id: int):
    user_state[chat_id] = {"step": "cancelar_buscar_paciente"}
    await _reply(update, 
        "\u274C *Cancelar turno*\n\n"
        "\u00BFCu\u00E1l es tu *DNI*?",
        parse_mode='Markdown'
    )


async def procesar_cancelar_mostrar_turnos(update: Update, chat_id: int, paciente_id: int):
    """Muestra los turnos pendientes de un paciente ya identificado."""
    turnos_r = mcp.med_listar_turnos(paciente_id=paciente_id, estado='pendiente')
    if turnos_r.get('total', 0) == 0:
        await _reply(update, "No ten\u00E9s turnos pendientes.")
        user_state[chat_id] = {"step": "menu"}
        return

    keyboard = []
    for t in turnos_r['turnos']:
        dt = datetime.fromisoformat(t['fecha_hora'])
        fecha_fmt = dt.strftime("%d/%m %H:%M")
        text = f"{fecha_fmt} - {t['medico']} ({t['especialidad']})"
        keyboard.append([InlineKeyboardButton(text, callback_data=f"cancel_{t['id']}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update,
        f"Estos son tus turnos pendientes. Eleg\u00ED cu\u00E1l cancelar:",
        reply_markup=reply_markup
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
    state['step'] = 'cancelar_mostrar_turnos'
    user_state[chat_id] = state
    # Vincular chat_id al paciente
    _save_chat_id_to_paciente(paciente_id, chat_id)
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


async def mostrar_menu(update):
    await _reply(update,
        "🏥 *Centro Médico Santa Clara*\\n\\n"
        "¿En qué te ayudo? Elegí una opción:",
        reply_markup=_main_menu_keyboard(),
        parse_mode='Markdown'
    )


# ─── BUTTON HANDLER (callback queries) ──────────────────────────────────────

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    chat_id = query.message.chat_id
    state = user_state.get(chat_id, {})
    step = state.get("step", "menu")

    try:
        await query.answer()
    except Exception:
        pass

    # ─── MAIN MENU BUTTONS (always available) ─────────────────────────
    if data == "menu_agendar":
        await iniciar_agendar(update, context, chat_id)
        return
    elif data == "menu_cancelar":
        if state.get("paciente_id"):
            await _reply(update,
                f"Ok {state.get('paciente_nombre', '')}, buscando tus turnos pendientes...",
                parse_mode='Markdown'
            )
            user_state[chat_id] = {**state, "step": "cancelar_mostrar_turnos"}
            await procesar_cancelar_mostrar_turnos(update, chat_id, state.get("paciente_id"))
        else:
            user_state[chat_id] = {"step": "cancelar_buscar_paciente"}
            await _reply(update,
                "❌ *Cancelar turno*\\n\\n¿Cuál es tu *DNI*?",
                parse_mode='Markdown'
            )
        return
    elif data == "menu_reprogramar":
        if state.get("paciente_id"):
            await _reply(update,
                f"Ok {state.get('paciente_nombre', '')}, buscando tus turnos...",
                parse_mode='Markdown'
            )
            user_state[chat_id] = {**state, "step": "reprogramar_mostrar_turnos"}
            await procesar_reprogramar_mostrar_turnos(update, chat_id, state.get("paciente_id"))
        else:
            await _reply(update,
                "🔄 *Reprogramar turno*\\n\\n¿Cuál es tu *DNI*?",
                parse_mode='Markdown'
            )
            user_state[chat_id] = {"step": "reprogramar_buscar"}
        return
    elif data == "menu_ver_turnos":
        if state.get("paciente_id"):
            user_state[chat_id] = {**state, "step": "menu"}
            await mostrar_mis_turnos(update, chat_id, state.get("paciente_id"))
        else:
            await _reply(update,
                "Primero necesito identificarte. ¿Cuál es tu *DNI*?",
                parse_mode='Markdown'
            )
            user_state[chat_id] = {"step": "ver_turnos_buscar"}
        return
    elif data == "menu_home":
        await mostrar_menu(update)
        user_state[chat_id] = {"step": "menu"}
        return
    elif data == "menu_salir":
        await _reply(update,
            "👋 *¡Hasta pronto!*\n\n"
            "Gracias por confiar en *Centro Médico Santa Clara*.\n"
            "Esperamos verte en tu próxima visita. 💙\n\n"
            "⚕️ *Cuidamos tu salud siempre.*",
            parse_mode='Markdown',
            reply_markup=_despedida_keyboard()
        )
        user_state[chat_id] = {"step": "menu"}
        return

    if data == "date_sep" or data == "ignore":
        await query.answer()
        return

    # ─── VER MIS TURNOS buttons ─────────────────────────
    if data.startswith('vt_'):
        turno_id = int(data.replace('vt_', ''))
        # Show options: cancelar o reprogramar este turno
        keyboard = [
            [InlineKeyboardButton("🔄 Reprogramar", callback_data=f"vt_reprog_{turno_id}")],
            [InlineKeyboardButton("❌ Cancelar", callback_data=f"vt_cancel_{turno_id}")],
            [InlineKeyboardButton("↩️ Volver", callback_data="menu_home")],
        ]
        await _reply(update, "¿Qué querés hacer con este turno?",
            reply_markup=InlineKeyboardMarkup(keyboard))
        return

    if data.startswith('vt_reprog_'):
        turno_id = int(data.replace('vt_reprog_', ''))
        user_state[chat_id] = {**state, "step": "reprogramar_mostrar_turnos", "reprog_turno_id": turno_id}
        await procesar_reprogramar_elegir_turno(update, chat_id, turno_id)
        return

    if data.startswith('vt_cancel_'):
        turno_id = int(data.replace('vt_cancel_', ''))
        user_state[chat_id] = {**state, "step": "cancelar_mostrar_turnos"}
        await procesar_cancelar_confirmar(update, chat_id, turno_id)
        return

    # ─── AGENDAR buttons ─────────────────────────
    if step == "agendar_mostrar_especialidades":
        if data.startswith('spec_'):
            esp = data.replace('spec_', '')
            await query.message.reply_text(f"·Elegiste: *{esp}*\\nBuscando profesionales...", parse_mode='Markdown')
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
            await query.message.reply_text("\\u23F3 Confirmando turno...")
            await procesar_elegir_slot(update, chat_id, slot_iso)
        else:
            await query.answer()
    elif step == "cancelar_mostrar_turnos":
        if data.startswith('cancel_'):
            turno_id = int(data.replace('cancel_', ''))
            await procesar_cancelar_confirmar(update, chat_id, turno_id)
        else:
            await query.answer()
    elif step == "reprogramar_mostrar_turnos":
        if data.startswith('reprog_'):
            turno_id = int(data.replace('reprog_', ''))
            await procesar_reprogramar_elegir_turno(update, chat_id, turno_id)
        else:
            await query.answer()
    elif step == "reprogramar_elegir_slot":
        if data.startswith('newslot_'):
            slot_iso = data.replace('newslot_', '')
            await query.message.reply_text("⏳ Reprogramando turno...")
            await procesar_reprogramar_confirmar(update, chat_id, slot_iso)
        else:
            await query.answer()
    else:
        await query.answer()


async def procesar_cancelar_confirmar(update: Update, chat_id: int, turno_id: int):
    r = mcp.med_cancelar_turno(turno_id=turno_id, motivo="Cancelado por paciente via Telegram")
    if r.get('ok'):
        await _reply(update,
            f"✅ *Turno cancelado*\n\n{r.get('mensaje', '')}",
            parse_mode='Markdown',
            reply_markup=_action_buttons_keyboard()
        )
    else:
        await _reply(update,
            f"❌ {r.get('error', 'No se pudo cancelar')}",
            reply_markup=_action_buttons_keyboard()
        )
    user_state[chat_id] = {"step": "menu"}
    await mostrar_menu(update)


# ─── REPROGRAMAR TURNO ─────────────────────────────────────────────────────

async def procesar_reprogramar_buscar_paciente(update: Update, chat_id: int, dni: str):
    """Busca paciente por DNI en flujo reprogramar, muestra turnos pendientes."""
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get('total', 0) == 0:
        await _reply(update, "No te encontré con ese DNI.",
            reply_markup=_despedida_keyboard())
        user_state[chat_id] = {"step": "menu"}
        return

    paciente_id = r['pacientes'][0]['id']
    _save_chat_id_to_paciente(paciente_id, chat_id)
    await procesar_reprogramar_mostrar_turnos(update, chat_id, paciente_id)


async def procesar_reprogramar_buscar_paciente_verturnos(update: Update, chat_id: int, dni: str):
    """Busca paciente por DNI desde 'Ver mis turnos'."""
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get('total', 0) == 0:
        await _reply(update, "No te encontré con ese DNI.",
            reply_markup=_despedida_keyboard())
        user_state[chat_id] = {"step": "menu"}
        return

    p = r['pacientes'][0]
    _save_chat_id_to_paciente(p['id'], chat_id)
    user_state[chat_id] = {
        "step": "menu",
        "paciente_id": p['id'],
        "paciente_nombre": f"{p['nombre']} {p['apellido']}"
    }
    await mostrar_mis_turnos(update, chat_id, p['id'])


async def procesar_reprogramar_mostrar_turnos(update: Update, chat_id: int, paciente_id: int):
    """Muestra turnos pendientes del paciente para que elija cuál reprogramar."""
    turnos_r = mcp.med_listar_turnos(paciente_id=paciente_id, estado='pendiente')
    if turnos_r.get('total', 0) == 0:
        await _reply(update, "No tenés turnos pendientes para reprogramar.")
        user_state[chat_id] = {"step": "menu"}
        return

    keyboard = []
    for t in turnos_r['turnos']:
        dt = datetime.fromisoformat(t['fecha_hora'])
        fecha_fmt = dt.strftime("%d/%m %H:%M")
        reprog_info = ""
        if t.get('cant_reprogramaciones', 0) > 0:
            reprog_info = f" ({t['cant_reprogramaciones']}/3 reps)"
        text = f"{fecha_fmt} - {t['medico']} ({t['especialidad']}){reprog_info}"
        keyboard.append([InlineKeyboardButton(text, callback_data=f"reprog_{t['id']}")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update,
        "🔄 *Turnos pendientes* — Elegí cuál reprogramar:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def procesar_reprogramar_elegir_turno(update: Update, chat_id: int, turno_id: int):
    """Cuando el paciente eligió qué turno reprogramar: busca slots del mismo médico."""
    state = user_state.get(chat_id, {})

    # Guardar qué turno se quiere reprogramar
    state['reprog_turno_id'] = turno_id
    user_state[chat_id] = state

    # Obtener info del turno para saber el médico
    turnos_r = mcp.med_listar_turnos(paciente_id=state.get('paciente_id'))
    turno = None
    for t in turnos_r.get('turnos', []):
        if t['id'] == turno_id:
            turno = t
            break

    if not turno:
        await _reply(update, "⚠️ No encontré ese turno.")
        user_state[chat_id] = {"step": "menu"}
        return

    state['reprog_turno_info'] = turno
    user_state[chat_id] = state

    # Buscar slots disponibles del mismo médico en los próximos 7 días
    medico_id = turno['medico_id']
    hoy = datetime.now()
    semana = hoy + timedelta(days=7)
    slots_r = mcp.med_buscar_slots_disponibles(
        medico_id=medico_id,
        fecha_desde=hoy.strftime("%Y-%m-%d"),
        fecha_hasta=semana.strftime("%Y-%m-%d")
    )

    if not slots_r.get('slots'):
        await _reply(update,
            f"No hay turnos disponibles con {turno['medico']} "
            f"para los próximos 7 días. Intentá más tarde."
        )
        user_state[chat_id] = {"step": "menu"}
        return

    slots = slots_r['slots'][:20]

    keyboard = []
    current_date = None
    for s in slots:
        slot_date = s['fecha']
        slot_hora = s['hora']
        dt = datetime(slot_date.year, slot_date.month, slot_date.day,
                      int(slot_hora.split(':')[0]), int(slot_hora.split(':')[1]))
        date_str = dt.strftime("%d/%m")
        if date_str != current_date:
            current_date = date_str
            keyboard.append([InlineKeyboardButton(f"📅 {date_str}", callback_data="date_sep")])
        time_str = dt.strftime("%H:%M")
        slot_iso = dt.strftime("%Y-%m-%dT%H:%M:00")
        keyboard.append([InlineKeyboardButton(f"  ⏰ {time_str}", callback_data=f"newslot_{slot_iso}")])

    # Botón para volver
    keyboard.append([InlineKeyboardButton("↩️ Volver al menú", callback_data="menu_home")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    dt_orig = datetime.fromisoformat(turno['fecha_hora'])
    state['step'] = 'reprogramar_elegir_slot'
    user_state[chat_id] = state
    await _reply(update,
        f"🔄 Turno actual: *{dt_orig.strftime('%d/%m %H:%M')}*\n"
        f"Elegí nuevo horario:",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def procesar_reprogramar_confirmar(update: Update, chat_id: int, new_slot_iso: str):
    """Confirma la reprogramación con el nuevo slot, aplicando anti-abuse."""
    state = user_state.get(chat_id, {})
    turno_id = state.get('reprog_turno_id')

    if not turno_id:
        await _reply(update, "⚠️ Error: datos incompletos.")
        user_state[chat_id] = {"step": "menu"}
        return

    r = mcp.med_modificar_turno(turno_id=turno_id, nueva_fecha_hora=new_slot_iso)

    if r.get('ok'):
        dt_nuevo = datetime.fromisoformat(r['fecha_nueva'])
        fecha_fmt = dt_nuevo.strftime("%A %d de %B").capitalize()
        hora_fmt = dt_nuevo.strftime("%H:%M")
        reps = r.get('cant_reprogramaciones', 0)
        turno_info = state.get('reprog_turno_info', {})
        medico_nombre = turno_info.get('medico', 'Tu médico')
        await _reply(update,
            f"✅ *¡Turno reprogramado!*\n\n"
            f"🗓️ {fecha_fmt} — {hora_fmt}hs\n"
            f"👨‍⚕️ {medico_nombre}\n"
            f"🏥 Centro Médico Santa Clara\n\n"
            f"({reps}/3 reprogramaciones utilizadas)\n"
            f"Recordá traer DNI y carnet de obra social.",
            parse_mode='Markdown',
            reply_markup=_main_menu_keyboard()
        )
    else:
        await _reply(update,
            f"❌ No se pudo reprogramar: {r.get('error')}",
            parse_mode='Markdown',
            reply_markup=_main_menu_keyboard()
        )

    user_state[chat_id] = {"step": "menu"}
    await mostrar_menu(update)


# ─── VER MIS TURNOS ────────────────────────────────────────────────────────

async def mostrar_mis_turnos(update: Update, chat_id: int, paciente_id: int):
    """Lista los turnos pendientes/futuros del paciente."""
    turnos_r = mcp.med_listar_turnos(paciente_id=paciente_id, estado='pendiente')
    if turnos_r.get('total', 0) == 0:
        await _reply(update,
            "📋 *No tenés turnos pendientes.*\\n\\n"
            "¿Querés sacar un turno nuevo?",
            reply_markup=_main_menu_keyboard(),
            parse_mode='Markdown'
        )
        user_state[chat_id] = {"step": "menu"}
        return

    now = datetime.now(timezone.utc)
    upcoming = []
    for t in turnos_r['turnos']:
        fh = datetime.fromisoformat(t['fecha_hora'])
        if fh.tzinfo is None:
            fh = fh.replace(tzinfo=timezone.utc)
        if fh >= now:
            upcoming.append(t)

    if not upcoming:
        await _reply(update,
            "📋 No tenés turnos próximos. Todos los que tenías ya pasaron.",
            reply_markup=_main_menu_keyboard()
        )
        user_state[chat_id] = {"step": "menu"}
        return

    msg = "📋 *Tus turnos próximos:*\n\n"
    keyboard = []
    for t in upcoming:
        dt = datetime.fromisoformat(t['fecha_hora'])
        fecha_fmt = dt.strftime("%d/%m %H:%M")
        msg += f"▫️ *{fecha_fmt}* — {t['medico']} ({t['especialidad']})\n"
        keyboard.append([InlineKeyboardButton(
            f"  {fecha_fmt} | {t['medico']} ({t['especialidad']})",
            callback_data=f"vt_{t['id']}"
        )])

    # Add action buttons
    keyboard.append([InlineKeyboardButton("🔄 Reprogramar", callback_data="menu_reprogramar")])
    keyboard.append([InlineKeyboardButton("❌ Cancelar", callback_data="menu_cancelar")])
    keyboard.append([InlineKeyboardButton("👋 Salir", callback_data="menu_salir")])

    msg += "\n¿Querés cancelar o reprogramar alguno?"
    reply_markup = InlineKeyboardMarkup(keyboard)
    await _reply(update, msg, reply_markup=reply_markup, parse_mode='Markdown')


# ─── MAIN ───────────────────────────────────────────────────────────────────

async def vincular(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /vincular DNI — vincula manualmente el chat de Telegram al paciente."""
    chat_id = _get_chat_id(update)
    text = ' '.join(context.args).strip() if context.args else ''
    if not text:
        await _reply(update, "Uso: /vincular <tu DNI>\nEjemplo: /vincular 28345678")
        return
    dni = text
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get('total', 0) == 0:
        await _reply(update, f"No encontr\\u00E9 un paciente con DNI {dni}.")
        return
    p = r['pacientes'][0]
    _save_chat_id_to_paciente(p['id'], chat_id)
    user_state[chat_id] = {
        "step": "menu",
        "paciente_id": p['id'],
        "paciente_nombre": f"{p['nombre']} {p['apellido']}"
    }
    await _reply(update,
        f"\\u2705 Listo {p['nombre']}! Ya te reconozco. "
        f"Ahora puedo agendar, cancelar o reprogramar turnos sin pedirte DNI.",
        parse_mode='Markdown'
    )


def main():
    logger.info(f"Iniciando SetubalAI Clinic Bot...")
    logger.info(f"Bot: @SetubalClibot")

    app = Application.builder().token(BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("vincular", vincular))

    # Text messages - route by state or intent
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, route_message))

    # Inline button clicks
    app.add_handler(CallbackQueryHandler(button_handler))

    logger.info("Bot iniciado. Escuchando mensajes...")
    app.run_polling()

if __name__ == "__main__":
    main()
