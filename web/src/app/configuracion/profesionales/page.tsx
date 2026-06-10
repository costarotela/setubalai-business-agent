"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthFetch } from "@/app/auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  matricula_provincial: string;
  matricula_nacional: string;
  especialidades: string[];
  duracion_turno_minutos: number;
  activo: boolean;
}

interface FormState {
  nombre: string;
  apellido: string;
  matricula_provincial: string;
  matricula_nacional: string;
  especialidades: number[];
  duracion_turno_minutos: number;
  activo: boolean;
}

const EMPTY_FORM: FormState = {
  nombre: "", apellido: "", matricula_provincial: "",
  matricula_nacional: "", especialidades: [], duracion_turno_minutos: 30, activo: true,
};

export default function ProfesionalesConfigPage() {
  const authFetch = useAuthFetch();
  const f = useFiltrosClinica();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [impacto, setImpacto] = useState<{turnos: number; atenciones: number} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMedicos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/medicos/");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      // SIEMPRE cargamos TODOS (los del Context usan filtro visual arriba)
      setMedicos(list);
    } catch (err) {
      console.error("Error cargando médicos:", err);
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // Filtrado reactivo según especialidad seleccionada en el Context
  const medicosFiltrados = f.selectedEspecialidadId
    ? medicos.filter(m => {
        const esp = f.especialidades.find(e => e.id === f.selectedEspecialidadId);
        if (!esp) return true;
        const espNombre = esp.nombre;
        return (m.especialidades || []).includes(espNombre);
      })
    : medicos; // Sin filtro → mostrar todos

  useEffect(() => { loadMedicos(); }, [loadMedicos]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setError(null); };
  const openEdit = (m: Medico) => {
    // Obtener IDs de especialidades actuales
    const espIds = (m.especialidades || []).map(espNombre => {
      const found = f.especialidades.find(e => e.nombre === espNombre);
      return found ? found.id : null;
    }).filter(Boolean) as number[];
    setForm({
      nombre: m.nombre || "",
      apellido: m.apellido || "",
      matricula_provincial: m.matricula_provincial || "",
      matricula_nacional: m.matricula_nacional || "",
      especialidades: espIds,
      duracion_turno_minutos: m.duracion_turno_minutos || 30,
      activo: m.activo ?? true,
    });
    setEditingId(m.id);
    setShowForm(true);
    setError(null);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/medicos/${editingId}/` : "/medicos/";
      const res = await authFetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      loadMedicos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setDeletingId(id);
    setImpacto(null);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setError(null);
    try {
      const res = await authFetch(`/medicos/${deletingId}/`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errData.detail || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setImpacto({ turnos: result?.impacto?.turnos_eliminados || 0, atenciones: result?.impacto?.atenciones_eliminadas || 0 });
      setDeletingId(null);
      loadMedicos();
      setTimeout(() => setImpacto(null), 5000);
    } catch (err: any) {
      setError(err.message);
      setDeletingId(null);
    }
  };

  const toggleEsp = (espId: number) => {
    setForm(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(espId)
        ? prev.especialidades.filter(id => id !== espId)
        : [...prev.especialidades, espId],
    }));
  };

  if (loading && medicos.length === 0) {
    return <div style={{ padding: "40px", color: "#62666d" }}>Cargando profesionales...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
              👨‍⚕️ Profesionales
            </h2>
            <p style={{ fontSize: 13, color: "#62666d", margin: "6px 0 0" }}>
              {medicosFiltrados.length} profesional{medicosFiltrados.length !== 1 ? "es" : ""}{f.selectedEspecialidadId ? ` en ${f.especialidades.find(e => e.id === f.selectedEspecialidadId)?.nombre || ""}` : ""}
            </p>
          </div>
          <button onClick={openCreate} style={{
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: "#5e6ad2", color: "white", border: "none", cursor: "pointer",
          }}>
            + Nuevo profesional
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#ef4444", fontSize: 13 }}>⚠️ {error}</div>}

      {/* Impacto de borrado */}
      {impacto && (
        <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f59e0b", fontSize: 13 }}>
          🗑️ Profesional eliminado — {impacto.turnos} turnos y {impacto.atenciones} atenciones eliminadas (cascade)
        </div>
      )}

      {/* Form crear/editar */}
      {showForm && (
        <div style={{ background: "#111214", border: "1px solid rgba(94,106,210,0.3)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>
            {editingId ? "Editar profesional" : "Nuevo profesional"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre</label>
                <input required value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Apellido</label>
                <input required value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Matricula Provincial</label>
                <input value={form.matricula_provincial} onChange={e => setForm(p => ({ ...p, matricula_provincial: e.target.value }))}
                  placeholder="MP XXXX"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em" }}>Duración turno (min)</label>
                <input type="number" min={10} max={120} value={form.duracion_turno_minutos} onChange={e => setForm(p => ({ ...p, duracion_turno_minutos: parseInt(e.target.value) || 30 }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, marginTop: 4, background: "#0f1011", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13 }} />
              </div>
            </div>

            {/* Especialidades */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Especialidad(es)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {f.especialidades.map(esp => {
                  const checked = form.especialidades.includes(esp.id);
                  return (
                    <button key={esp.id} type="button" onClick={() => toggleEsp(esp.id)}
                      style={{
                        padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        background: checked ? "rgba(94,106,210,0.2)" : "transparent",
                        color: checked ? "#7170ff" : "#62666d",
                        border: checked ? "1px solid rgba(113,112,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      {checked ? "✓ " : ""}{esp.nombre}
                    </button>
                  );
                })}
              </div>
              {form.especialidades.length === 0 && (
                <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0" }}>Seleccionar al menos una especialidad</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#22c55e", color: "white", border: "none", cursor: "pointer" }}>
                {editingId ? "Guardar cambios" : "Crear profesional"}
              </button>
              <button type="button" onClick={cancelForm} style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "transparent", color: "#62666d", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro de especialidades — conectado al Context */}
      <div style={{ background: "#111214", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 20px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 10 }}>Filtrar por especialidad</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            onClick={() => f.setEspecialidadId(null)}
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
              background: !f.selectedEspecialidadId ? "rgba(94,106,210,0.25)" : "transparent",
              color: !f.selectedEspecialidadId ? "#7170ff" : "#62666d",
              border: !f.selectedEspecialidadId ? "1.5px solid rgba(113,112,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}>
            Todos ({medicos.length})
          </button>
          {f.especialidades.map(esp => {
            const count = medicos.filter(m => (m.especialidades || []).includes(esp.nombre)).length;
            const active = f.selectedEspecialidadId === esp.id;
            return (
              <button key={esp.id} type="button" onClick={() => f.setEspecialidadId(active ? null : esp.id)}
                style={{
                  padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  background: active ? "rgba(94,106,210,0.25)" : "transparent",
                  color: active ? "#7170ff" : "#62666d",
                  border: active ? "1.5px solid rgba(113,112,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {active ? "✓ " : ""}{esp.nombre} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla */}
      {medicosFiltrados.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d", fontSize: 14 }}>No hay profesionales en esta especialidad.</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>PROFESIONAL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>ESPECIALIDADES</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>DURACIÓN</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>ESTADO</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {medicosFiltrados.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "#f7f8f8" }}>Dr/a. {m.nombre} {m.apellido}</div>
                    {m.matricula_provincial && <div style={{ fontSize: 12, color: "#62666d", marginTop: 4 }}>{m.matricula_provincial}</div>}
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(m.especialidades || []).map((esp, idx) => (
                        <span key={idx} style={{ background: "rgba(113,112,255,0.12)", border: "1px solid rgba(113,112,255,0.2)", color: "#7170ff", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{esp}</span>
                      ))}
                      {(!m.especialidades || m.especialidades.length === 0) && <span style={{ fontSize: 12, color: "#62666d" }}>Sin especialidad</span>}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}><span style={{ fontSize: 13, color: "#f7f8f8" }}>{m.duracion_turno_minutos || 30} min</span></td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span style={{ background: m.activo ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: m.activo ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)", color: m.activo ? "#10b981" : "#ef4444", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{m.activo ? "ACTIVO" : "INACTIVO"}</span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button onClick={() => openEdit(m)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "none", cursor: "pointer" }}>Editar</button>
                      <button onClick={() => handleDelete(m.id)} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "none", cursor: "pointer" }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal confirmación borrado */}
      {deletingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#141517", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 32, maxWidth: 480, width: "90%" }}>
            <h3 style={{ margin: "0 0 16px", color: "#ef4444", fontSize: 18 }}>⚠️ Eliminar profesional</h3>
            <p style={{ color: "#8a8f98", margin: "0 0 12px", fontSize: 14 }}>
              ¿Estás seguro de eliminar este profesional? Se eliminarán automáticamente:
            </p>
            <ul style={{ color: "#8a8f98", margin: "0 0 24px 20px", fontSize: 13 }}>
              <li>Todos los turnos asignados</li>
              <li>Atenciones médicas</li>
              <li>Recetas y prácticas asociadas</li>
              <li>Grillas horarias</li>
            </ul>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeletingId(null)} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "transparent", color: "#62666d", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmDelete} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
