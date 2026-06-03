/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useAuthFetch } from "../../auth-context";
import { useFiltrosClinica } from "../../../contexts/FiltrosClinicaContext";
import { SelectSoloEspecialidad } from "../../../components/SelectEspecialidadMedico";
import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CalendarioTurno {
  id: number;
  fecha_hora: string;
  fecha: string;       // YYYY-MM-DD
  hora: string;        // HH:MM
  duracion_minutos: number;
  paciente_id: number;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_completo: string;
  obra_social: string | null;
  medico_id: number;
  medico_nombre: string;
  medico_apellido: string;
  medico_completo: string;
  medico_display: string;
  especialidades: string[];
  estado: string;
  motivo: string;
  tipo_visita: string;
  cancelacion_motivo: string | null;
  reprogramado_a_visita_id: number | null;
  created_at: string;
}

interface CalendarioResponse {
  mes: string;
  total: number;
  turnos: CalendarioTurno[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  pendiente:   { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24" },
  completado:  { bg: "rgba(59,130,246,0.12)",   text: "#3b82f6" },
  "en-curso":  { bg: "rgba(16,185,129,0.12)",   text: "#10b981" },
  en_curso:    { bg: "rgba(16,185,129,0.12)",   text: "#10b981" },
  cancelado:   { bg: "rgba(239,68,68,0.12)",    text: "#ef4444" },
};

const SPEC_COLORS = ["#7170ff","#10b981","#f59e0b","#f472b6","#38bdf8","#a78bfa","#fb923c"];
function specColor(esp: string): string {
  let h = 0;
  for (let i = 0; i < esp.length; i++) h = esp.charCodeAt(i) + ((h << 5) - h);
  return SPEC_COLORS[Math.abs(h) % SPEC_COLORS.length];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number): number {
  // 0=DOM, 1=LUN... Adjust to 0=LUN, 6=DOM
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function mesLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const af = useAuthFetch();
  const filtros = useFiltrosClinica();
  const today = new Date();

  // Estado del mes
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const mesQuery = `${year}-${String(month + 1).padStart(2, "0")}`;

  // Datos del calendario
  const [turnos, setTurnos] = useState<CalendarioTurno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros (derivados de los turnos, pero selección es estado)
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string | null>(null);
  const [filtroProfesional, setFiltroProfesional] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);

  // Día seleccionado (panel lateral)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // ── Fetch datos del mes ─────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await af(`/api/calendario?mes=${mesQuery}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: CalendarioResponse = await r.json();
      setTurnos(data.turnos || []);
    } catch (e: any) {
      setError(e.message || "Error cargando calendario");
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, [mesQuery, af]);

  useEffect(() => { cargar(); setDiaSeleccionado(null); }, [cargar]);

  // ── Derivados de datos ──────────────────────────────────────────────────
  const especialidades = useMemo(() => {
    const set = new Set<string>();
    for (const t of turnos) for (const e of t.especialidades) set.add(e);
    return [...set].sort();
  }, [turnos]);

  const profesionales = useMemo(() => {
    const set = new Set<string>();
    for (const t of turnos) set.add(t.medico_display);
    return [...set].filter(Boolean).sort();
  }, [turnos]);

  // ── Filtros ─────────────────────────────────────────────────────────────
  const turnosFiltrados = useMemo(() => {
    return turnos.filter(t => {
      if (filtroEspecialidad && !t.especialidades.includes(filtroEspecialidad)) return false;
      if (filtroProfesional && t.medico_display !== filtroProfesional) return false;
      if (filtroEstado && t.estado !== filtroEstado) return false;
      return true;
    });
  }, [turnos, filtroEspecialidad, filtroProfesional, filtroEstado]);

  // ── Agrupar por día ─────────────────────────────────────────────────────
  const turnosPorDia = useMemo(() => {
    const map: Record<string, CalendarioTurno[]> = {};
    for (const t of turnosFiltrados) {
      if (!map[t.fecha]) map[t.fecha] = [];
      map[t.fecha].push(t);
    }
    // Ordenar turnos de cada día por hora
    for (const dia of Object.keys(map)) {
      map[dia].sort((a, b) => a.hora.localeCompare(b.hora));
    }
    return map;
  }, [turnosFiltrados]);

  // ── Stats del mes ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pendientes = turnosFiltrados.filter(t => t.estado === "pendiente").length;
    const completados = turnosFiltrados.filter(t => t.estado === "completado" || t.estado === "en-curso" || t.estado === "en_curso").length;
    const cancelados = turnosFiltrados.filter(t => t.estado === "cancelado").length;
    return { pendientes, completados, cancelados, total: turnosFiltrados.length };
  }, [turnosFiltrados]);

  // ── Turnos del día seleccionado ─────────────────────────────────────────
  const turnosDelDia = useMemo(() => {
    return diaSeleccionado ? (turnosPorDia[diaSeleccionado] || []) : [];
  }, [diaSeleccionado, turnosPorDia]);

  // ── Handlers CRUD ───────────────────────────────────────────────────────
  const handleCancelar = async (id: number) => {
    try {
      await af(`/api/turnos/${id}/cancelar`, { method: "POST" });
      // Re-fetch para actualizar
      await cargar();
    } catch (e) { console.error("Error cancelando:", e); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este turno permanentemente?")) return;
    try {
      await af(`/api/turnos/${id}`, { method: "DELETE" });
      await cargar();
    } catch (e) { console.error("Error eliminando:", e); }
  };

  // ── Navegación de meses ─────────────────────────────────────────────────
  const mesAnterior = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const mesSiguiente = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const irAHoy = () => { setMonth(today.getMonth()); setYear(today.getFullYear()); };

  // ── Render ──────────────────────────────────────────────────────────────
  const diasEnMes = getDaysInMonth(year, month);
  const primerDia = getFirstDayOfMonth(year, month);
  const hoyStr = today.toISOString().split("T")[0];
  const diaHoy = String(today.getDate());

  // Construir grilla: día offset + daysInMonth + fill remaining cells
  const gridDays: (number | null)[] = [];
  for (let i = 0; i < primerDia; i++) gridDays.push(null);
  for (let d = 1; d <= diasEnMes; d++) gridDays.push(d);
  while (gridDays.length % 7 !== 0) gridDays.push(null);

  const diaStr = (d: number | null) => d ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;

  const btnFiltro = (label: string, key: string, isActive: boolean, onClick: () => void, color?: string) => (
    <button key={key} onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
      background: isActive ? (color ? `${color}22` : "rgba(113,112,255,0.15)") : "rgba(255,255,255,0.03)",
      color: isActive ? (color || "#a5a4ff") : "#6b7280",
      border: isActive ? `1px solid ${color ? `${color}40` : "rgba(113,112,255,0.3)"}` : "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer", textTransform: "capitalize",
      transition: "all 0.15s",
    }}>{label}</button>
  );

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#08090d", color: "#e5e7eb" }}>
      {/* ── HEADER ── */}
      <div style={{ padding: "20px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f7f8f8" }}>
              {mesLabel(year, month).replace(/^./, s => s.toUpperCase())}
            </h1>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
              {stats.total} turnos · {stats.pendientes} pendientes · {stats.completados} completados
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={mesAnterior} style={navBtn()}>← Anterior</button>
            <button onClick={irAHoy} style={{...navBtn(), background: "rgba(113,112,255,0.15)", color: "#a5a4ff", borderColor: "rgba(113,112,255,0.3)"}}>
              Hoy
            </button>
            <button onClick={mesSiguiente} style={navBtn()}>Siguiente →</button>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          {([
            { label: "Pendientes", val: stats.pendientes, color: "#fbbf24" },
            { label: "Completados", val: stats.completados, color: "#3b82f6" },
            { label: "Cancelados", val: stats.cancelados, color: "#ef4444" },
          ]).map(s => (
            <div key={s.label} style={{
              padding: "8px 16px", borderRadius: 10,
              background: `${s.color}08`, border: `1px solid ${s.color}18`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── FILTROS DINÁMICOS ── */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>Filtros:</span>
          
          {/* Especialidades → componente reutilizable del Context */}
          <SelectSoloEspecialidad
            showLabels={false}
            onEspecialidadChange={(id) => {
              if (!id) { setFiltroEspecialidad(null); return; }
              const esp = filtros.especialidades.find(e => e.id === id);
              setFiltroEspecialidad(esp?.nombre || null);
            }}
            className="calendario-esp-filter"
          />
          
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />
          
          {/* Profesionales */}
          {btnFiltro("Todos", "todos-prof", filtroProfesional === null, () => setFiltroProfesional(null))}
          {profesionales.slice(0, 6).map(p => btnFiltro(p, `prof-${p}`, filtroProfesional === p, () => setFiltroProfesional(p)))}
          {profesionales.length > 6 && (
            <span style={{ fontSize: 10, color: "#4b5563" }}>+{profesionales.length - 6} más</span>
          )}

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.06)" }} />
          
          {/* Estados */}
          {btnFiltro("Todos", "todos-estado", filtroEstado === null, () => setFiltroEstado(null))}
          {[["pendiente", "completado", "en-curso", "cancelado"]].flat().map(e => 
            estadEnFiltro(e) && btnFiltro(e, `estado-${e}`, filtroEstado === e, () => setFiltroEstado(e), ESTADO_COLOR[e]?.text)
          )}

          {/* Limpiar filtros */}
          {(filtroEspecialidad || filtroProfesional || filtroEstado) && (
            <button onClick={() => { setFiltroEspecialidad(null); setFiltroProfesional(null); setFiltroEstado(null); }} style={{
              fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600,
              marginLeft: 4,
            }}>✕ Limpiar</button>
          )}
        </div>

        {/* Resumen filtros activos */}
        {(filtroEspecialidad || filtroProfesional || filtroEstado) && (
          <div style={{ marginTop: 10, padding: "6px 12px", borderRadius: 8, background: "rgba(113,112,255,0.06)", border: "1px solid rgba(113,112,255,0.15)", fontSize: 11, color: "#a5a4ff" }}>
            Mostrando {turnosFiltrados.length} de {turnos.length} turnos
            {filtroEspecialidad ? ` · ${filtroEspecialidad}` : ""}
            {filtroProfesional ? ` · ${filtroProfesional}` : ""}
            {filtroEstado ? ` · ${filtroEstado}` : ""}
          </div>
        )}
      </div>

      {/* ── CALENDAR GRID ── */}
      <div style={{ padding: "16px 28px" }}>
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#6b7280" }}>
            Cargando turnos de {mesLabel(year, month)}...
          </div>
        ) : error ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "#ef4444" }}>
            {error}<br />
            <button onClick={cargar} style={{ marginTop: 12, padding: "8px 16px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, cursor: "pointer" }}>Reintentar</button>
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, marginBottom: 1 }}>
              {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
                <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 10, color: "#4b5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em" }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {gridDays.map((d, i) => {
                const ds = diaStr(d);
                const turnosThisDay = ds ? (turnosPorDia[ds] || []) : [];
                const isToday = d !== null && ds === hoyStr;
                const isSel = ds === diaSeleccionado;

                return (
                  <div
                    key={i}
                    onClick={() => d ? (isSel ? setDiaSeleccionado(null) : setDiaSeleccionado(ds)) : undefined}
                    style={{
                      background: isSel ? "rgba(113,112,255,0.08)" : d === null ? "transparent" : "rgba(255,255,255,0.01)",
                      border: isSel ? "1px solid rgba(113,112,255,0.25)" : "1px solid rgba(255,255,255,0.04)",
                      borderRadius: d ? 6 : 0,
                      minHeight: 110,
                      padding: d ? "6px 8px" : 0,
                      cursor: d ? "pointer" : "default",
                      transition: "background 0.15s",
                      opacity: d ? 1 : 0.15,
                    }}
                  >
                    {d && (
                      <>
                        <div style={{
                          fontSize: 13, fontWeight: isToday ? 800 : 600,
                          color: isToday ? "#7170ff" : "#9ca3af",
                          marginBottom: 4,
                        }}>{d}</div>
                        {turnosThisDay.slice(0, 3).map(t => {
                          const ec = ESTADO_COLOR[t.estado] || ESTADO_COLOR.pendiente;
                          const esp = t.especialidades[0] || "";
                          return (
                            <div key={t.id} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              fontSize: 10, fontWeight: 600, color: ec.text,
                              padding: "1px 4px", borderRadius: 3,
                              background: ec.bg, marginBottom: 2,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: ec.text, flexShrink: 0 }} />
                              <span style={{ opacity: 0.7 }}>{t.hora}</span>
                              <span>{t.paciente_completo.split(",")[0]}</span>
                            </div>
                          );
                        })}
                        {turnosThisDay.length > 3 && (
                          <div style={{ fontSize: 9, color: "#6b7280", paddingLeft: 4 }}>+{turnosThisDay.length - 3} más</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── DAY PANEL (lateral) ── */}
      {diaSeleccionado && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDiaSeleccionado(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }}
          />
          {/* Panel */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: 480, maxWidth: "90vw",
            background: "#0f1015", borderLeft: "1px solid rgba(255,255,255,0.06)",
            zIndex: 101, overflowY: "auto",
            animation: "slideIn 0.2s ease",
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0f1015", zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
                  {new Date(diaSeleccionado + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, s => s.toUpperCase())}
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
                  {turnosDelDia.length} turno{turnosDelDia.length !== 1 ? "s" : ""} programado{turnosDelDia.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setDiaSeleccionado(null)} style={{
                padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af",
                fontSize: 14, cursor: "pointer",
              }}>✕</button>
            </div>

            {/* Timeline */}
            <div style={{ padding: "16px 24px" }}>
              {turnosDelDia.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
                  No hay turnos para este día
                </div>
              ) : (
                turnosDelDia.map(t => {
                  const ec = ESTADO_COLOR[t.estado] || ESTADO_COLOR.pendiente;
                  const esp = t.especialidades[0] || "";
                  return (
                    <div key={t.id} style={{
                      padding: "12px 14px", borderRadius: 10, marginBottom: 10,
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${ec.text}15`,
                      cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8" }}>{t.paciente_completo}</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                            {t.medico_completo} · {t.hora}hs
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                          background: ec.bg, color: ec.text, textTransform: "uppercase",
                        }}>{t.estado}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                        {btnFiltroSmall(`✏️ Editar`, () => {})}
                        {btnFiltroSmall(`↻ Reprog.`, () => {})}
                        {btnFiltroSmall("Cancelar", () => handleCancelar(t.id), "#ef4444")}
                        {btnFiltroSmall("Eliminar", () => handleEliminar(t.id), "#ef4444")}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small helper components ─────────────────────────────────────────────────
function navBtn() {
  return {
    padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#9ca3af", cursor: "pointer",
  };
}

function btnFiltroSmall(label: string, onClick: () => void, color?: string) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
      background: color ? `${color}12` : "rgba(255,255,255,0.04)",
      border: color ? `1px solid ${color}25` : "1px solid rgba(255,255,255,0.08)",
      color: color || "#9ca3af", cursor: "pointer",
    }}>{label}</button>
  );
}

function estadEnFiltro(e: string) {
  // Helper: solo mostrar estados que existen en los datos
  return true;
}
