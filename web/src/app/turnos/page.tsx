"use client";
import { useAuthFetch } from "../auth-context";
import { SelectEspecialidadMedico } from "../../components/SelectEspecialidadMedico";
import { useFiltrosClinica } from "../../contexts/FiltrosClinicaContext";
import { useState, useEffect } from "react";

interface Turno {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha_hora: string;
  duracion_minutos: number;
  estado: string;
  motivo_consulta: string;
  tipo_visita: string;
  cancelacion_motivo?: string;
  // Enriched fields
  paciente_nombre?: string;
  medico_nombre?: string;
  servicio?: string;
}

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
}

export default function TurnosPage() {
  const af = useAuthFetch();
  const filtros = useFiltrosClinica();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [showNuevo, setShowNuevo] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Form states
  const [formPaciente, setFormPaciente] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState<number | null>(null);
  const [formMedico, setFormMedico] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("");
  const [formMotivo, setFormMotivo] = useState("");
  const [formTipo, setFormTipo] = useState("Consulta General");

  // Lista pacientes para dropdown
  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      af("/api/turnos/").then(r => r.json()),
      af("/api/medicos/").then(r => r.json()),
      af("/api/pacientes/").then(r => r.json()),
    ])
      .then(([t, m, p]) => {
        // Enriquecer turnos con nombres
        const enriched = t.map((turno: any) => {
          const med = m.find((x: any) => x.id === turno.medico_id);
          console.log("Turno:", turno, "Paciente ID:", turno.paciente_id, "Pacientes:", p);
          return {
            ...turno,
            paciente_nombre: turno.paciente_nombre || (
              (() => {
                const pac = p.find((x: any) => x.id === turno.paciente_id);
                return pac ? `${pac.nombre} ${pac.apellido}` : "Sin paciente";
              })()
            ),
            medico_nombre: med ? `Dr/a. ${med.nombre} ${med.apellido}` : "",
            servicio: turno.servicio || turno.tipo_visita,
          };
        });
        console.log("Enriched:", enriched);
        setTurnos(enriched);
        setMedicos(m);
        setPacientes(p);
      })
      .catch(err => console.error("Error cargando turnos:", err))
      .finally(() => setLoading(false));
  }, []);

  const estadoColor = (estado: string) => {
    switch (estado) {
      case "completado": return "#22c55e";
      case "pendiente": return "#f59e0b";
      case "en-curso": return "#3b82f6";
      case "cancelado": return "#ef4444";
      default: return "#8a8f98";
    }
  };

  const filtered = filtro === "todos" ? turnos : turnos.filter(t => t.estado === filtro);

  const handleCrear = async () => {
    if (!formFecha || !formHora || !formPaciente || !formMedico) return;
    const fecha_hora = `${formFecha}T${formHora}:00`;
    try {
      await af("/api/turnos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_nuevo_id: parseInt(formPaciente),
          medico_id: parseInt(formMedico),
          fecha: formFecha,
          hora: formHora,
          motivo: formMotivo,
          tipo_visita: formTipo,
        }),
      });
      setShowNuevo(false);
      // Reload
      const t = await af("/api/turnos/").then(r => r.json());
      setTurnos(t);
    } catch (e) {
      console.error("Error creando turno:", e);
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await af(`/api/turnos/${id}/cancelar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: "Cancelado por administración" }),
      });
      setTurnos(prev => prev.map(t => t.id === id ? { ...t, estado: "cancelado" } : t));
    } catch (e) {
      console.error("Error cancelando:", e);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este turno permanentemente?")) return;
    try {
      await af(`/api/turnos/${id}`, { method: "DELETE" });
      setTurnos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Error eliminando:", e);
    }
  };

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando turnos...</div>;

  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div style={{padding: "32px"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <div>
          <h1 style={{fontSize: 24, fontWeight: 700, margin: 0}}>📅 Turnos</h1>
          <p style={{color: "#62666d", margin: "4px 0 0"}}>{turnos.length} turnos registrados — {turnos.filter(t => t.estado === "pendiente").length} pendientes</p>
        </div>
        <button
          onClick={() => setShowNuevo(!showNuevo)}
          style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "#5e6ad2", color: "white", border: "none", cursor: "pointer",
          }}
        >
          + Nuevo Turno
        </button>
      </div>

      {/* Filtros */}
      <div style={{display: "flex", gap: 8, marginBottom: 16}}>
        {["todos", "pendiente", "en-curso", "completado", "cancelado"].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: filtro === f ? "rgba(94,106,210,0.2)" : "#141517",
              color: filtro === f ? "#7170ff" : "#62666d",
              border: filtro === f ? "1px solid rgba(113,112,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Form nuevo turno */}
      {showNuevo && (
        <div style={{
          background: "#141517", borderRadius: 12, padding: 24, marginBottom: 16,
          border: "1px solid rgba(94,106,210,0.3)",
        }}>
          <h3 style={{margin: "0 0 16px", fontSize: 16, fontWeight: 600}}>Nuevo Turno</h3>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Paciente</label>
              <select value={formPaciente} onChange={e => setFormPaciente(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4,
                  background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f7f8f8", fontSize: 13,
                }}>
                <option value="">Seleccionar...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Especialidad + Médico (dependientes) */}
          <div style={{ marginBottom: 12 }}>
            <SelectEspecialidadMedico
              onEspecialidadChange={(id) => setFormEspecialidad(id ?? null)}
              onMedicoChange={(id) => setFormMedico(id ? String(id) : "")}
              showLabels={true}
              horizontal={true}
            />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Fecha</label>
              <input type="date" value={formFecha} onChange={e => setFormFecha(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4,
                  background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f7f8f8", fontSize: 13,
                }} />
            </div>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Hora</label>
              <input type="time" value={formHora} onChange={e => setFormHora(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4,
                  background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f7f8f8", fontSize: 13,
                }} />
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Tipo</label>
              <select value={formTipo} onChange={e => setFormTipo(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4,
                  background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f7f8f8", fontSize: 13,
                }}>
                <option value="">Seleccionar tipo...</option>
                {filtros.practicasFiltradas.map(p => (
                  <option key={p.id} value={p.descripcion}>{p.descripcion}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Motivo</label>
              <input value={formMotivo} onChange={e => setFormMotivo(e.target.value)}
                placeholder="Motivo de la consulta..."
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4,
                  background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f7f8f8", fontSize: 13,
                }} />
            </div>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <button onClick={handleCrear}
              style={{
                padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "#22c55e", color: "white", border: "none", cursor: "pointer",
              }}>Confirmar Turno</button>
            <button onClick={() => setShowNuevo(false)}
              style={{
                padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: "transparent", color: "#62666d", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
              }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabla de turnos */}
      <div style={{
        background: "#111214", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* Desktop table */}
        <div style={{display: "block"}}>
          <table style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
              <tr style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
                {["Fecha", "Hora", "Paciente", "Médico", "Servicio", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const fecha = t.fecha_hora ? t.fecha_hora.split("T")[0] : "";
                const hora = t.fecha_hora ? t.fecha_hora.split("T")[1]?.substring(0,5) : "";
                const esHoy = fecha === hoy;
                const esPasado = fecha < hoy;
                return (
                  <tr key={t.id} style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: esHoy && t.estado === "pendiente" ? "rgba(245,158,11,0.04)" : "transparent",
                  }}>
                    <td style={{padding: "10px 16px", fontSize: 13, fontWeight: esHoy ? 600 : 400, color: esHoy ? "#f59e0b" : "#8a8f98"}}>
                      {esHoy ? "HOY" : esPasado ? "Pasado" : new Date(fecha).toLocaleDateString("es-AR")}
                    </td>
                    <td style={{padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "#8a8f98"}}>{hora}</td>
                    <td style={{padding: "10px 16px", fontSize: 13}}>{t.paciente_nombre}</td>
                    <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{t.medico_nombre}</td>
                    <td style={{padding: "10px 16px", fontSize: 12, color: "#8a8f98"}}>{t.servicio}</td>
                    <td style={{padding: "10px 16px"}}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                        background: `${estadoColor(t.estado)}18`,
                        color: estadoColor(t.estado),
                      }}>{t.estado}</span>
                      {t.cancelacion_motivo && (
                        <div style={{fontSize: 11, color: "#ef4444", marginTop: 4}}>{t.cancelacion_motivo}</div>
                      )}
                    </td>
                    <td style={{padding: "10px 16px"}}>
                      <div style={{display: "flex", gap: 6}}>
                        {t.estado === "pendiente" && (
                          <>
                            <button onClick={() => handleCancelar(t.id)} title="Cancelar turno"
                              style={{
                                padding: "4px 10px", borderRadius: 4, fontSize: 11,
                                background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                                border: "none", cursor: "pointer",
                              }}>Cancelar</button>
                            <button onClick={() => handleEliminar(t.id)} title="Eliminar turno"
                              style={{
                                padding: "4px 10px", borderRadius: 4, fontSize: 11,
                                background: "rgba(239,68,68,0.15)", color: "#ef4444",
                                border: "none", cursor: "pointer",
                              }}>Eliminar</button>
                          </>
                        )}
                        {t.estado === "cancelado" && (
                          <button onClick={() => handleEliminar(t.id)} title="Eliminar registro"
                            style={{
                              padding: "4px 10px", borderRadius: 4, fontSize: 11,
                              background: "rgba(239,68,68,0.15)", color: "#ef4444",
                              border: "none", cursor: "pointer",
                            }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{padding: "40px", textAlign: "center", color: "#62666d"}}>No hay turnos con este filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards - responsive */}
        <div style={{padding: 8}}>
          {filtered.map(t => {
            const fecha = t.fecha_hora ? t.fecha_hora.split("T")[0] : "";
            const hora = t.fecha_hora ? t.fecha_hora.split("T")[1]?.substring(0,5) : "";
            const esHoy = fecha === hoy;
            return (
              <div key={t.id} style={{
                background: "#141517", borderRadius: 10, padding: 14, marginBottom: 8,
                border: `1px solid ${esHoy && t.estado === "pendiente" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.05)"}`,
                display: "none", // shown via media query in real implementation
              }}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8}}>
                  <div>
                    <div style={{fontSize: 14, fontWeight: 600}}>{t.paciente_nombre}</div>
                    <div style={{fontSize: 12, color: "#8a8f98"}}>{t.medico_nombre}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                    background: `${estadoColor(t.estado)}18`,
                    color: estadoColor(t.estado),
                  }}>{t.estado}</span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#62666d"}}>
                  <div>
                    <span style={{fontWeight: 500, color: esHoy ? "#f59e0b" : "#8a8f98"}}>
                      {esHoy ? "HOY" : new Date(fecha).toLocaleDateString("es-AR")}
                    </span> {" "}
                    <span style={{fontFamily: "monospace"}}>{hora}</span>
                  </div>
                  <div style={{display: "flex", gap: 6}}>
                    {t.estado === "pendiente" && (
                      <>
                        <button onClick={() => handleCancelar(t.id)}
                          style={{padding: "4px 10px", borderRadius: 4, fontSize: 11, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "none", cursor: "pointer"}}>Cancelar</button>
                        <button onClick={() => handleEliminar(t.id)}
                          style={{padding: "4px 10px", borderRadius: 4, fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", cursor: "pointer"}}>Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
