"""
Router /api/whatsapp — Webhook de WhatsApp Cloud API (Meta)
Bot interactivo con Reply Buttons + List Messages.
Mismo flujo que Telegram: 5 opciones iguales.
Persistencia en DB, fechas Argentina (UTC-3), español.
"""
import os, sys, json, logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from fastapi import APIRouter, Request, Response, HTTPException

logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import mcp_server as mcp
from database import SessionLocal

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "pcostarotela")
EMPRESA_ID = 16

ARG = timezone(timedelta(hours=-3))
DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
            "septiembre", "octubre", "noviembre", "diciembre"]

def arg_time(dt):
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ARG)

def fmt_completa(dt):
    d = arg_time(dt)
    return DIAS_ES[d.weekday()] + " " + str(d.day) + " de " + MESES_ES[d.month-1] + ", " + d.strftime("%H:%M")

def fmt_turno(dt):
    d = arg_time(dt)
    return d.strftime("%d/%m %H:%M")

def fmt_corta(dt):
    d = arg_time(dt)
    return DIAS_ES[d.weekday()] + " " + str(d.day) + "/" + str(d.month).zfill(2)


# ═══════════════════════════════════════════════════════════
# PERSISTENCIA EN DB
# ═══════════════════════════════════════════════════════════

def _get_session(phone):
    db = SessionLocal()
    try:
        p = db.execute(
            text("SELECT id, nombre, apellido FROM pacientes "
                 "WHERE whatsapp_phone = :p AND empresa_id = :e LIMIT 1"),
            {"p": phone, "e": EMPRESA_ID}
        ).fetchone()

        s = db.execute(
            text("SELECT state_data FROM whatsapp_sessions WHERE phone = :p"),
            {"p": phone}
        ).fetchone()

        state = json.loads(s[0]) if s else {"step": "menu"}

        if p:
            state["paciente_id"] = p[0]
            state["paciente_nombre"] = p[1] + " " + p[2]

        state.setdefault("step", "menu")
        _save_raw(db, phone, state)
        return state
    finally:
        db.close()

def _save_session(phone, state):
    db = SessionLocal()
    try:
        _save_raw(db, phone, state)
    finally:
        db.close()

def _save_raw(db, phone, state):
    db.execute(text(
        "INSERT INTO whatsapp_sessions (phone, state_data) VALUES (:p, :d) "
        "ON CONFLICT (phone) DO UPDATE SET state_data = :d, updated_at = NOW()"
    ), {"p": phone, "d": json.dumps(state)})
    db.commit()

def _save_phone_to_paciente(paciente_id, phone):
    db = SessionLocal()
    try:
        db.execute(text("UPDATE pacientes SET whatsapp_phone = :p WHERE id = :i"),
                   {"p": phone, "i": paciente_id})
        db.commit()
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════
# ENVÍO DE MENSAJES
# ═══════════════════════════════════════════════════════════

SALIR = {"id": "menu_home", "title": "\U0001f44b Salir"}

async def _raw(phone, payload):
    import httpx
    pid = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    tok = os.getenv("WHATSAPP_ACCESS_TOKEN")
    if not pid or not tok:
        return None
    url = "https://graph.facebook.com/v23.0/" + pid + "/messages"
    h = {"Authorization": "Bearer " + tok, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as c:
        try:
            r = await c.post(url, headers=h, json=payload)
            if r.status_code == 200:
                logger.info("✅ Sent to " + phone)
                return r.json()
            logger.error("❌ Send " + str(r.status_code) + " " + r.text[:300])
            return None
        except Exception as e:
            logger.error("❌ " + str(e))
            return None

async def txt(phone, body):
    return await _raw(phone, {"messaging_product": "whatsapp", "to": phone,
        "type": "text", "text": {"body": body}})

async def btns(phone, header, body, buttons):
    bl = [{"type": "reply", "reply": {"id": x["id"], "title": x["title"][:20]}} for x in buttons]
    return await _raw(phone, {"messaging_product": "whatsapp", "to": phone, "type": "interactive",
        "interactive": {"type": "button", "header": {"type": "text", "text": header},
                         "body": {"text": body}, "action": {"buttons": bl}}})

async def wha_list(phone, header, body, btn_label, rows):
    if not rows:
        return await txt(phone, "No hay opciones disponibles.")
    if len(rows) <= 3:
        return await btns(phone, header, body, rows)
    return await _raw(phone, {"messaging_product": "whatsapp", "to": phone, "type": "interactive",
        "interactive": {"type": "list", "header": {"type": "text", "text": header},
                         "body": {"text": body},
                         "action": {"button": btn_label,
                                    "sections": [{"title": "Opciones", "rows": rows[:10]}]}}})

async def confirm(phone, emoji, titulo, detalles):
    return await btns(phone, emoji + " " + titulo, "\n".join(detalles), [SALIR])


# ═══════════════════════════════════════════════════════════
# FLUJO DEL BOT (mismo que Telegram)
# ═══════════════════════════════════════════════════════════

async def menu(phone, state):
    """Menú principal - List con iconos + descripción igual que Telegram"""
    state["step"] = "menu"
    nombre = state.get("paciente_nombre", "")
    saludo = "Hola " + nombre + ", bienvenido de vuelta!" if nombre else "Hola, bienvenido!"
    await wha_list(phone, "Centro M\u00e9dico Santa Clara", saludo + "\nSoy tu asistente virtual.", "Eleg\u00ed una opci\u00f3n:", [
        {"id": "menu_agendar",       "title": "\U0001f4c5 Sacar turno",     "description": "Solicitar un turno nuevo"},
        {"id": "menu_ver_turnos",    "title": "\U0001f4cb Ver mis turnos",  "description": "Consultar turnos pendientes"},
        {"id": "menu_reprogramar",   "title": "\U0001f504 Reprogramar",     "description": "Cambiar fecha de un turno"},
        {"id": "menu_cancelar",      "title": "\u274c Cancelar",             "description": "Anular un turno existente"},
        {"id": "menu_home_exit",     "title": "\U0001f44b Salir",           "description": "Finalizar conversaci\u00f3n"},
    ])
    _save_session(phone, state)

async def agendar(phone, state):
    if state.get("paciente_id"):
        nom = state.get("paciente_nombre", "")
        await txt(phone, "Ok " + nom + "! ¿Para qué especialidad querés turno?")
        state["step"] = "agendar_esp"
        await esp_especialidades(phone, state)
    else:
        state["step"] = "agendar_dni"
        await txt(phone, "\U0001f4c5 Sacar turno\n\nPrimero necesito identificarte.\n¿Cuál es tu DNI?")
        _save_session(phone, state)

async def esp_especialidades(phone, state):
    r = mcp.med_especialidades_disponibles()
    specs = r.get("especialidades", [])
    if not specs:
        await txt(phone, "No hay especialidades disponibles.")
        await menu(phone, state)
        return
    rows = [{"id": "esp_" + s["nombre"], "title": s["nombre"], "description": ""} for s in specs]
    await wha_list(phone, "\U0001fa7a Especialidades", "Seleccioná una especialidad:", "Ver especialidades", rows)
    state["step"] = "agendar_esp"
    _save_session(phone, state)

async def elegir_especialidad(phone, state, esp):
    state["step"] = "agendar_medicos"
    state["especialidad"] = esp
    r = mcp.med_listar_medicos(especialidad=esp)
    if r.get("total", 0) == 0:
        await txt(phone, "No hay médicos para " + esp + ".")
        await menu(phone, state)
        return
    rows = [{"id": "doc_" + str(m["id"]), "title": "Dr/a. " + m["nombre"] + " " + m["apellido"],
             "description": m.get("especialidad", "")} for m in r["medicos"][:10]]
    await wha_list(phone, "\U0001f468\u200d\u2695\ufe0f " + esp, "Elegí un profesional:", "Ver profesionales", rows)
    state["medicos_list"] = r["medicos"][:10]
    _save_session(phone, state)

async def elegir_medico(phone, state, med_id):
    state["step"] = "agendar_slots"
    state["medico_id"] = med_id
    medico = None
    for m in state.get("medicos_list", []):
        if str(m["id"]) == str(med_id):
            medico = m
            break
    if not medico:
        await menu(phone, state)
        return
    state["medico_nombre"] = medico["nombre"] + " " + medico["apellido"]
    hoy = datetime.now(ARG)
    r = mcp.med_buscar_slots_disponibles(
        medico_id=med_id, fecha_desde=hoy.strftime("%Y-%m-%d"),
        fecha_hasta=(hoy + timedelta(days=7)).strftime("%Y-%m-%d"))
    slots = r.get("slots", [])
    if not slots:
        await txt(phone, "No hay turnos con " + state["medico_nombre"] + " en 7 días.")
        await menu(phone, state)
        return

    by_date = {}
    for s in slots[:20]:
        d = s["fecha"]
        h = s["hora"]
        try:
            dt = datetime(int(d[:4]), int(d[5:7]), int(d[8:10]))
            dt = dt.replace(tzinfo=ARG)
        except Exception:
            dt = hoy
        by_date.setdefault(d, {"fmt": fmt_corta(dt), "horas": []})
        by_date[d]["horas"].append({"fecha": d, "hora": h})

    rows = []
    for k, v in list(by_date.items())[:6]:
        hs = ", ".join(x["hora"] for x in v["horas"][:5])
        rows.append({"id": "slot_" + v["horas"][0]["fecha"] + "T" + v["horas"][0]["hora"],
                      "title": v["fmt"], "description": "Horarios: " + hs})

    # Si es reprogramando, mostrar 3+volver también
    accion = state.get("accion", "")
    extra_btns = []
    if accion == "reprogramando" and state.get("turno_viejo"):
        pass  # ya tiene menú abajo de slots

    await wha_list(phone, "\U0001f4c5 Con " + state["medico_nombre"],
        "Seleccioná fecha y horario:", "Ver fechas", rows)
    state["slots_data"] = slots[:20]
    _save_session(phone, state)

async def elegir_slot(phone, state, slot_id):
    parts = slot_id.replace("slot_", "").split("T")
    if len(parts) != 2:
        await menu(phone, state)
        return
    fecha, hora = parts
    if not state.get("paciente_id") or not state.get("medico_id"):
        await menu(phone, state)
        return

    r = mcp.med_crear_turno(paciente_id=state["paciente_id"], medico_id=state["medico_id"],
                            fecha_hora=fecha + "T" + hora + ":00", motivo_consulta="Consulta general")
    if r.get("ok"):
        try:
            dt = arg_time(datetime.fromisoformat(r["fecha_hora"]))
        except Exception:
            dt = datetime.now(ARG)

        # Si es reprogramar, cancelar el viejo
        if state.get("accion") == "reprogramando" and state.get("turno_viejo_id"):
            mcp.med_cancelar_turno(turno_id=state["turno_viejo_id"])
            await confirm(phone, "\U0001f504", "Turno reprogramado", [
                "Fecha: " + fmt_completa(dt),
                "Profesional: " + r.get("medico", state.get("medico_nombre", "")),
                "El turno anterior fue cancelado."
            ])
        else:
            await confirm(phone, "\u2705", "\u00a1Turno confirmado!", [
                "Fecha: " + fmt_completa(dt),
                "Profesional: " + r.get("medico", state.get("medico_nombre", "")),
                "Recordá traer DNI y carnet de obra social."
            ])
    else:
        await txt(phone, "No se pudo crear: " + str(r.get("error", "")))
    await menu(phone, state)

async def buscar_paciente_agendar(phone, state, dni):
    if not dni.isdigit():
        await txt(phone, "Ingresá un DNI válido o tocá Salir en la lista del menú.")
        return
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get("total", 0) > 0:
        p = r["pacientes"][0]
        state["paciente_id"] = p["id"]
        state["paciente_nombre"] = p["nombre"] + " " + p["apellido"]
        _save_phone_to_paciente(p["id"], phone)
        await txt(phone, "\u2705 Te encontré: *" + p["nombre"] + " " + p["apellido"] + "*\nObra social: " + (p.get("obra_social") or "Particular"))
        await esp_especialidades(phone, state)
    else:
        state["step"] = "crear_paciente"
        state["dni_temp"] = dni
        await txt(phone, "No te encontré.\n\nEnviá en un solo mensaje:\nNombre, Apellido, Teléfono, Obra Social")
        _save_session(phone, state)

async def crear_paciente(phone, state, t):
    parts = [x.strip() for x in t.split(",")]
    if len(parts) < 4:
        await txt(phone, "Necesito 4 datos separados por coma:\nNombre, Apellido, Teléfono, Obra Social")
        return
    r = mcp.med_crear_paciente(nombre=parts[0], apellido=parts[1],
        dni=state.get("dni_temp", ""), telefono=parts[2], obra_social=parts[3])
    if r.get("ok"):
        state["paciente_id"] = r["id"]
        state["paciente_nombre"] = parts[0] + " " + parts[1]
        await txt(phone, "\u2705 Registrado: " + parts[0] + " " + parts[1])
        await esp_especialidades(phone, state)
    else:
        await txt(phone, "Error: " + str(r.get("error", "")))

async def ver_turnos(phone, state, accion="ver"):
    if not state.get("paciente_id"):
        # Pedir DNI
        if accion == "ver":
            state["step"] = "verbusca"
        elif accion == "cancelar":
            state["step"] = "cancelbusca"
        else:
            state["step"] = "reprogrambusca"
        state["accion"] = accion
        await txt(phone, "Primero necesito identificarte.\n¿Cuál es tu DNI?")
        _save_session(phone, state)
        return

    r = mcp.med_listar_turnos(paciente_id=state["paciente_id"], estado="pendiente")
    if r.get("total", 0) == 0:
        await txt(phone, "No tenés turnos pendientes.")
        await menu(phone, state)
        return

    turnos = r["turnos"]

    if accion == "ver":
        lines = []
        for t in turnos:
            try:
                dt = datetime.fromisoformat(t["fecha_hora"])
                fh = fmt_turno(dt)
            except Exception:
                fh = str(t.get("fecha_hora", ""))
            lines.append("\u2022 " + fh + " - Dr/a. " + t["medico"] + " (" + t["especialidad"] + ")")
        await confirm(phone, "\U0001f4cb", "Tus turnos pendientes", lines)
        await menu(phone, state)
        return

    # Cancelar o reprogramar: mostrar lista
    rows = []
    for t in turnos:
        try:
            dt = datetime.fromisoformat(t["fecha_hora"])
            fh = fmt_turno(dt)
        except Exception:
            fh = str(t.get("fecha_hora", ""))
        rows.append({"id": "turno_" + str(t["id"]), "title": fh,
                      "description": "Dr/a. " + t["medico"] + " - " + t["especialidad"]})
    etiqueta = "\u274c Cancelar turno" if accion == "cancelar" else "\U0001f504 Reprogramar turno"
    await wha_list(phone, "\U0001f4cb " + etiqueta, "Seleccioná el turno:", "Ver turnos", rows)
    state["step"] = "sel_" + accion
    _save_session(phone, state)

async def confirmar_cancelar(phone, state, turno_id):
    r = mcp.med_cancelar_turno(turno_id=turno_id)
    if r.get("ok"):
        await confirm(phone, "\u274c", "Turno cancelado", ["Tu turno fue cancelado correctamente."])
    else:
        await txt(phone, "No se pudo cancelar: " + str(r.get("error", "")))
    await menu(phone, state)

async def reprogramar_elegir_turno(phone, state, turno_id):
    # Guardar el turno viejo para cancelarlo después
    state["turno_viejo_id"] = turno_id
    state["accion"] = "reprogramando"
    await txt(phone, "Ok, ahora elegí especialidad para el nuevo turno.")
    state["step"] = "agendar_esp"
    await esp_especialidades(phone, state)

# ═══════════════════════════════════════════════════════════
# ROUTER
# ═══════════════════════════════════════════════════════════

async def route(phone, t_raw, state):
    t = t_raw.strip()
    logger.info("Route step=" + str(state.get("step")) + " text=" + t)

    # Salir siempre va al menú
    if t == "menu_home" or t == "menu_home_exit" or t == "Salir":
        await menu(phone, state)
        return

    step = state.get("step", "menu")

    # MENU: 5 opciones como LIST
    if step == "menu":
        if t == "menu_agendar":
            await agendar(phone, state)
        elif t == "menu_ver_turnos":
            await ver_turnos(phone, state, "ver")
        elif t == "menu_cancelar":
            await ver_turnos(phone, state, "cancelar")
        elif t == "menu_reprogramar":
            await ver_turnos(phone, state, "reprogramar")
        else:
            await menu(phone, state)
        return

    # BUSCAR PACIENTE (agendar)
    if step == "agendar_dni":
        await buscar_paciente_agendar(phone, state, t)
        return

    # CREAR PACIENTE
    if step == "crear_paciente":
        await crear_paciente(phone, state, t)
        return

    # BUSCAR para VER turnos
    if step == "verbusca":
        if t.isdigit():
            _vincular_dni(phone, state, t)
            await ver_turnos(phone, state, "ver")
        else:
            await txt(phone, "Ingresá un DNI válido o tocá Salir.")
        return

    # BUSCAR para CANCELAR
    if step == "cancelbusca":
        if t.isdigit():
            _vincular_dni(phone, state, t)
            await ver_turnos(phone, state, "cancelar")
        else:
            await txt(phone, "Ingresá un DNI válido o tocá Salir.")
        return

    # BUSCAR para REPROGRAMAR
    if step == "reprogrambusca":
        if t.isdigit():
            _vincular_dni(phone, state, t)
            await ver_turnos(phone, state, "reprogramar")
        else:
            await txt(phone, "Ingresá un DNI válido o tocá Salir.")
        return

    # ELEGIR ESPECIALIDAD
    if step == "agendar_esp":
        esp = t.replace("esp_", "") if t.startswith("esp_") else t
        await elegir_especialidad(phone, state, esp)
        return

    # ELEGIR MÉDICO
    if step == "agendar_medicos":
        if t.startswith("doc_"):
            await elegir_medico(phone, state, int(t.replace("doc_", "")))
        return

    # ELEGIR SLOT
    if step == "agendar_slots":
        if t.startswith("slot_"):
            await elegir_slot(phone, state, t)
        return

    # SELECCIONAR TURNO (cancelar)
    if step == "sel_cancelar":
        if t.startswith("turno_"):
            await confirmar_cancelar(phone, state, int(t.replace("turno_", "")))
        return

    # SELECCIONAR TURNO (reprogramar)
    if step == "sel_reprogramar":
        if t.startswith("turno_"):
            await reprogramar_elegir_turno(phone, state, int(t.replace("turno_", "")))
        return

    # Default: volver al menú
    await menu(phone, state)

def _vincular_dni(phone, state, dni):
    r = mcp.med_buscar_paciente(dni=dni)
    if r.get("total", 0) > 0:
        p = r["pacientes"][0]
        state["paciente_id"] = p["id"]
        state["paciente_nombre"] = p["nombre"] + " " + p["apellido"]
        _save_phone_to_paciente(p["id"], phone)

# ═══════════════════════════════════════════════════════════
# WEBHOOKS
# ═══════════════════════════════════════════════════════════

@router.get("/webhook")
async def wb_get(request: Request):
    m = request.query_params.get("hub.mode")
    t = request.query_params.get("hub.verify_token")
    c = request.query_params.get("hub.challenge")
    if m == "subscribe" and t == VERIFY_TOKEN:
        return Response(content=c, status_code=200, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Failed")

@router.post("/webhook")
async def wb_post(request: Request):
    body = await request.json()
    if body.get("object") != "whatsapp_business_account":
        raise HTTPException(status_code=404, detail="No")
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for msg in value.get("messages", []):
                phone = msg.get("from", "")
                state = _get_session(phone)
                mt = msg.get("type", "")
                if mt == "text":
                    text = msg.get("text", {}).get("body", "")
                    logger.info("\U0001f4e8 WA text " + phone + ": " + text)
                    await route(phone, text, state)
                elif mt == "interactive":
                    iw = msg.get("interactive", {})
                    it = iw.get("type", "")
                    rid = ""
                    if it == "button_reply":
                        rid = iw.get("button_reply", {}).get("id", "")
                    elif it == "list_reply":
                        rid = iw.get("list_reply", {}).get("id", "")
                    logger.info("\U0001f4e8 WA list " + phone + ": " + rid)
                    await route(phone, rid, state)
                else:
                    await txt(phone, "Recibo solo mensajes de texto por ahora.")
            for st in value.get("statuses", []):
                logger.info("\U0001f4ca WA " + str(st.get("status")) + " to " + str(st.get("recipient_id")))
    return Response(status_code=200)
