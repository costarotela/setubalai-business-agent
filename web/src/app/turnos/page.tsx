"use client";
import { useAuthFetch } from "../auth-context";
import BreadcrumbNav from "../../components/BreadcrumbNav";
import PatientLink from "../../components/PatientLink";
import MedicoLink from "../../components/MedicoLink";
import ClinicaFilterBar from "../../components/ClinicaFilterBar";
import { SelectEspecialidadMedico } from "../../components/SelectEspecialidadMedico";
import { useFiltrosClinica } from "../../contexts/FiltrosClinicaContext";
import { useState, useEffect, useCallback } from "react";

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
  paciente_nombre?: string;
  medico_nombre?: string;
  servicio?: string;
}

export default function TurnosPage() {
  const af = useAuthFetch();
  const f = useFiltrosClinica();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");
  const [showNuevo, setShowNuevo] = useState(false);
  const [formPaciente, setFormPaciente] = useState("");
  const [formEspecialidad, setFormEspecialidad] = useState<number | null>(null);
  const [formMedico, setFormMedico] = useState("");
  const [formFecha, setFormFecha] = useState("");
  const [formHora, setFormHora] = useState("");
  const [formMotivo, setFormMotivo] = useState("");
  const [formTipo, setFormTipo] = useState("Consulta General");

  // Cargar turnos — refresca automáticamente al cambiar contexto
  const cargarTurnos = useCallback(async () => {
    if (f.loading || f.especialidades.length === 0) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.selectedEspecialidadId) params.set("especialidad_id", String(f.selectedEspecialidadId));
      if (f.selectedMedicoId) params.set("medico_id", String(f.selectedMedicoId));
      const q = params.toString() ? `?${params.toString()}` : "";

      const [t, m, p] = await Promise.all([
        af(`/api/turnos/${q}`).then(r => r.json()),
        af("/api/medicos/").then(r => r.json()),
        af("/api/pacientes/").then(r => r.json()),
      ]);
      const enriched = t.map((turno: any) => {
        const med = m.find((x: any) => x.id === turno.medico_id);
        const pac = p.find((x: any) => x.id === turno.paciente_id);
        return {
          ...turno,
          paciente_nombre: turno.paciente_nombre || (pac ? `${pac.nombre || ""} ${pac.apellido || ""}` : "Sin paciente"),
          medico_nombre: med ? `Dr/a. ${med.nombre || ""} ${med.apellido || ""}` : "",
          servicio: turno.servicio || turno.tipo_visita,
        };
      });
      setTurnos(enriched);
      setPacientes(p);
    } catch (err) {
      console.error("Error cargando turnos:", err);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, [af, f.loading, f.especialidades, f.selectedEspecialidadId, f.selectedMedicoId, f.medicos]);

  useEffect(() => { cargarTurnos(); }, [cargarTurnos]);

  const estadoColor = (estado: string) => {
    const map: Record<string, string> = { completado: "#22c55e", pendiente: "#f59e0b", "en-curso": "#3b82f6", cancelado: "#ef4444" };
    return map[estado] || "#8a8f98";
  };

  // Filtrar por estado (botones) + contexto (Context)
  const filtered = (filtro === "todos" ? turnos : turnos.filter(t => t.estado === filtro))
    .filter(t => !f.selectedMedicoId || t.medico_id === f.selectedMedicoId);

  const handleCrear = async () => {
    if (!formFecha || !formHora || !formPaciente || !formMedico) return;
    try {
      await af("/api/turnos/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente_nuevo_id: parseInt(formPaciente),
          medico_id: parseInt(formMedico),
          fecha: formFecha, hora: formHora, motivo: formMotivo, tipo_visita: formTipo,
        }),
      });
      setShowNuevo(false);
      cargarTurnos();
    } catch (e) { console.error("Error creando turno:", e); }
  };

  const handleCancelar = async (id: number) => {
    await af(`/api/turnos/${id}/cancelar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ motivo: "Cancelado por administración" }) });
    cargarTurnos();
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este turno permanentemente?")) return;
    await af(`/api/turnos/${id}`, { method: "DELETE" });
    cargarTurnos();
  };

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando turnos...</div>;

  const hoy = new Date().toISOString().split("T")[0];
  const medicosFiltrados = f.medicosFiltrados || [];

  return (
    <div style={{padding: "32px"}}>
      <BreadcrumbNav items={[{ label: "Turnos" }]} />

      {/* FILTER BAR — Context Provider: especialidad + médico */}
      <ClinicaFilterBar
        title="Filtros"
        subtitle="Turnos filtrados por especialidad y médico seleccionados"
      />

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <div>
          <h1 style={{fontSize: 24, fontWeight: 700, margin: 0}}>📅 Turnos</h1>
          <p style={{color: "#62666d", margin: "4px 0 0"}}>{filtered.length} turnos — {turnos.filter(t => t.estado === "pendiente").length} pendientes</p>
        </div>
        <button onClick={() => setShowNuevo(!showNuevo)}
          style={{padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#5e6ad2", color: "white", border: "none", cursor: "pointer"}}>
          + Nuevo Turno
        </button>
      </div>

      {/* Filtro por estado */}
      <div style={{display: "flex", gap: 8, marginBottom: 16}}>
        {["todos", "pendiente", "en-curso", "completado", "cancelado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500,
            background: filtro === f ? "rgba(94,106,210,0.2)" : "#141517",
            color: filtro === f ? "#7170ff" : "#62666d",
            border: filtro === f ? "1px solid rgba(113,112,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {/* Form nuevo turno */}
      {showNuevo && (
        <div style={{background: "#141517", borderRadius: 12, padding: 24, marginBottom: 16, border: "1px solid rgba(94,106,210,0.3)"}}>
          <h3 style={{margin: "0 0 16px", fontSize: 16, fontWeight: 600}}>Nuevo Turno</h3>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>Paciente</label>
              <select value={formPaciente} onChange={e => setFormPaciente(e.target.value)}
                style={{width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13}}>
                <option value="">Seleccionar...</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre || ""} {p.apellido || ""}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <SelectEspecialidadMedico variant="local" onEspecialidadChange={(id) => setFormEspecialidad(id ?? null)} onMedicoChange={(id) => setFormMedico(id ? String(id) : "")} showLabels={true} horizontal={true} />
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Fecha</label>
              <input type="date" value={formFecha} onChange={e => setFormFecha(e.target.value)}
                style={{width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13}} />
            </div>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Hora</label>
              <input type="time" value={formHora} onChange={e => setFormHora(e.target.value)}
                style={{width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13}} />
            </div>
          </div>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16}}>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Tipo</label>
              <select value={formTipo} onChange={e => setFormTipo(e.target.value)}
                style={{width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13}}>
                <option value="">Seleccionar tipo...</option>
                {f.practicasFiltradas.map(p => <option key={p.id} value={p.descripcion}>{p.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Motivo</label>
              <input value={formMotivo} onChange={e => setFormMotivo(e.target.value)} placeholder="Motivo de la consulta..."
                style={{width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13}} />
            </div>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <button onClick={handleCrear} style={{padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#22c55e", color: "white", border: "none", cursor: "pointer"}}>Confirmar Turno</button>
            <button onClick={() => setShowNuevo(false)} style={{padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "transparent", color: "#62666d", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer"}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{background: "#111214", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden"}}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
              {["Fecha", "Hora", "Paciente", "Médico", "Servicio", "Estado", "Acciones"].map(h => (
                <th key={h} style={{textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase"}}>{h}</th>
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
                <tr key={t.id} style={{borderBottom: "1px solid rgba(255,255,255,0.03)", background: esHoy && t.estado === "pendiente" ? "rgba(245,158,11,0.04)" : "transparent"}}>
                  <td style={{padding: "10px 16px", fontSize: 13, fontWeight: esHoy ? 600 : 400, color: esHoy ? "#f59e0b" : "#8a8f98"}}>
                    {esHoy ? "HOY" : esPasado ? "Pasado" : new Date(fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td style={{padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "#8a8f98"}}>{hora}</td>
                  <td style={{padding: "10px 16px", fontSize: 13}}>
                    <PatientLink id={t.paciente_id} nombre={t.paciente_nombre || "Sin paciente"} />
                  </td>
                  <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>
                    <MedicoLink id={t.medico_id} nombre={t.medico_nombre || ""} />
                  </td>
                  <td style={{padding: "10px 16px", fontSize: 12, color: "#8a8f98"}}>{t.servicio}</td>
                  <td style={{padding: "10px 16px"}}>
                    <span style={{fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: `${estadoColor(t.estado)}18`, color: estadoColor(t.estado)}}>{t.estado}</span>
                    {t.cancelacion_motivo && <div style={{fontSize: 11, color: "#ef4444", marginTop: 4}}>{t.cancelacion_motivo}</div>}
                  </td>
                  <td style={{padding: "10px 16px"}}>
                    {t.estado === "pendiente" && (
                      <div style={{display: "flex", gap: 6}}>
                        <button onClick={() => handleCancelar(t.id)} style={{padding: "4px 10px", borderRadius: 4, fontSize: 11, background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "none", cursor: "pointer"}}>Cancelar</button>
                        <button onClick={() => handleEliminar(t.id)} style={{padding: "4px 10px", borderRadius: 4, fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", cursor: "pointer"}}>Eliminar</button>
                      </div>
                    )}
                    {t.estado === "cancelado" && (
                      <button onClick={() => handleEliminar(t.id)} style={{padding: "4px 10px", borderRadius: 4, fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", cursor: "pointer"}}>Eliminar</button>
                    )}
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
    </div>
  );
}
