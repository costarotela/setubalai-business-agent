"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import SelectorEspecialidadMedico from "@/components/SelectorEspecialidadMedico";

interface GrillaMedica {
  id: number;
  especialidad_id: number;
  especialidad_nombre: string;
  medico_id: number | null;
  medico_nombre: string;
  medico_apellido: string;
  dia_semana: number;
  dia_semana_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function GrillasPage() {
  const authFetch = useAuthFetch();
  const { selectedEspecialidadId, selectedMedicoId, especialidades, medicosFiltrados } = useFiltrosClinica();

  const [grillas, setGrillas] = useState<GrillaMedica[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    medico_id: "",
    dia_semana: "1",
    hora_inicio: "08:00",
    hora_fin: "12:00",
    activo: true,
  });
  const [error, setError] = useState("");

  // Cargar cuando cambia la selección de especialidad o médico
  useEffect(() => {
    if (!selectedEspecialidadId) {
      setGrillas([]);
      setLoading(false);
      return;
    }
    loadData();
  }, [selectedEspecialidadId, selectedMedicoId]);

  const loadData = async () => {
    if (!selectedEspecialidadId) return;
    setLoading(true);
    setError("");
    try {
      let url = `/configuracion-agenda/grillas-medicas/?especialidad_id=${selectedEspecialidadId}`;
      if (selectedMedicoId) url += `&medico_id=${selectedMedicoId}`;

      const r = await authFetch(url);
      const data = await r.json();
      setGrillas(Array.isArray(data) ? data : []);
    } catch {
      setGrillas([]);
    }
    setLoading(false);
  };

  const openNew = () => {
    // Default: médico seleccionado ya viene del Context
    setEditId(null);
    setForm({
      medico_id: selectedMedicoId ? String(selectedMedicoId) : "",
      dia_semana: "1",
      hora_inicio: "08:00",
      hora_fin: "12:00",
      activo: true,
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (g: GrillaMedica) => {
    setEditId(g.id);
    setForm({
      medico_id: g.medico_id ? String(g.medico_id) : "",
      dia_semana: String(g.dia_semana),
      hora_inicio: g.hora_inicio,
      hora_fin: g.hora_fin,
      activo: g.activo,
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.medico_id) { setError("Seleccioná un profesional"); return; }
    if (form.hora_inicio >= form.hora_fin) { setError("Hora fin debe ser mayor que hora inicio"); return; }

    const payload = {
      especialidad_id: selectedEspecialidadId!,
      medico_id: Number(form.medico_id),
      dia_semana: Number(form.dia_semana),
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      activo: form.activo,
    };

    try {
      let res;
      if (editId) {
        res = await authFetch(`/configuracion-agenda/grillas-medicas/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch("/configuracion-agenda/grillas-medicas/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.detail || `Error ${res.status}`);
        return;
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Error de red");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta grilla horaria?")) return;
    try {
      const res = await authFetch(`/configuracion-agenda/grillas-medicas/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) await loadData();
    } catch { /* ignore */ }
  };

  // --- Indicador de contexto ---
  const selectedEsp = especialidades.find(e => e.id === selectedEspecialidadId);
  const selectedMed = medicosFiltrados.find(m => m.id === selectedMedicoId);
  const contextLabel = selectedMedicoId
    ? `Configurando para: Dr. ${selectedMed?.apellido || ""} ${selectedMed?.nombre || ""} (${selectedEsp?.nombre || ""})`
    : `Configurando para TODOS: ${selectedEsp?.nombre || ""} (${medicosFiltrados.length} profesionales)`;

  if (!selectedEspecialidadId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#f59e0b" }}>
        <p style={{ fontSize: 16 }}>⚠ Seleccioná una especialidad para ver las grillas horarias</p>
        <p style={{ fontSize: 13, color: "#62666d", marginTop: 8 }}>
          La configuración de agenda se aplica por especialidad médica.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>Cargando grillas...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 4 }}>📅 Grillas Horarias</h2>
          <p style={{ fontSize: 13, color: "#8a8f98", margin: 0 }}>{contextLabel}</p>
        </div>
        <button
          onClick={openNew}
          style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "8px 16px", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + Nueva Grilla
        </button>
      </div>

      {/* Selector Cascada */}
      <div style={{ marginBottom: 24 }}>
        <SelectorEspecialidadMedico />
      </div>

      {/* Table */}
      {grillas.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d" }}>No hay grillas configuradas.</p>
          <button onClick={openNew} style={{ marginTop: 12, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 16px", color: "#22c55e", fontSize: 13, cursor: "pointer" }}>
            Crear grilla default
          </button>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>PROFESIONAL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DÍA</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>HORARIO</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ESTADO</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {grillas.map((g) => (
                <tr key={g.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 500, color: "#f7f8f8" }}>
                      Dr. {g.medico_apellido || "—"}, {g.medico_nombre || "—"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", color: "#c9cbcf" }}>{g.dia_semana_nombre || DIAS[g.dia_semana]}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#c9cbcf" }}>{g.hora_inicio} - {g.hora_fin}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{ background: g.activo ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${g.activo ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 20, color: g.activo ? "#22c55e" : "#ef4444", padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>
                      {g.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => openEdit(g)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 14, marginRight: 12 }}>✏️</button>
                    <button onClick={() => handleDelete(g.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, width: 480, maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#f7f8f8", marginBottom: 24 }}>
              {editId ? "Editar Grilla" : "Nueva Grilla Horaria"}
            </h3>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>
                  Profesional
                </label>
                <select
                  value={form.medico_id}
                  onChange={e => setForm({ ...form, medico_id: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }}
                >
                  <option value="">Seleccionar...</option>
                  {medicosFiltrados.filter(m => m.id !== undefined).map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>
                  ))}
                  {selectedEsp && medicosFiltrados.length === 0 && (
                    <option disabled>— sin médicos en esta especialidad —</option>
                  )}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Día</label>
                <select value={form.dia_semana} onChange={e => setForm({ ...form, dia_semana: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }}>
                  {DIAS.slice(1).map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Hora inicio</label>
                  <input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Hora fin</label>
                  <input type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#c9cbcf", cursor: "pointer" }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ accentColor: "#3b82f6", width: 16, height: 16 }} />
                Activo
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", color: "#c9cbcf", fontSize: 14, backgroundColor: "transparent", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleSave} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{editId ? "Guardar" : "Crear"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
