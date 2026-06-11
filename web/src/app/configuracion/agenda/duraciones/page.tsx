"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import SelectorEspecialidadMedico from "@/components/SelectorEspecialidadMedico";

interface DuracionPrestacion {
  id: number;
  empresa_id: number;
  especialidad: string;
  duracion_minutos: number;
  sobre_turnos_permitidos: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function DuracionesPage() {
  const authFetch = useAuthFetch();
  const { selectedEspecialidadId, especialidades, medicosFiltrados } = useFiltrosClinica();

  const [duraciones, setDuraciones] = useState<DuracionPrestacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ duracion_minutos: 30, sobre_turnos_permitidos: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedEspecialidadId) {
      setDuraciones([]);
      setLoading(false);
      return;
    }
    loadData();
  }, [selectedEspecialidadId]);

  const loadData = async () => {
    if (!selectedEspecialidadId) return;
    setLoading(true);
    setError("");
    try {
      const rD = await authFetch("/configuracion-agenda/duracion-prestaciones/");
      const dataD = await rD.json();
      // Filtrar client-side para la especialidad seleccionada
      const esp = especialidades.find(e => e.id === selectedEspecialidadId);
      if (esp) {
        const filtered = (Array.isArray(dataD) ? dataD : []).filter(
          (d: DuracionPrestacion) => d.especialidad === esp.nombre
        );
        setDuraciones(filtered);
      } else {
        setDuraciones([]);
      }
    } catch {
      setDuraciones([]);
    }
    setLoading(false);
  };

  const openEdit = (d: DuracionPrestacion) => {
    setEditId(d.id);
    setForm({ duracion_minutos: d.duracion_minutos, sobre_turnos_permitidos: d.sobre_turnos_permitidos });
    setError("");
    setShowCreate(true);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ duracion_minutos: 30, sobre_turnos_permitidos: 0 });
    setError("");
    setShowCreate(true);
  };

  const handleSave = async () => {
    setError("");
    // Find existing duracion for this specialty to update
    const esp = especialidades.find(e => e.id === selectedEspecialidadId);
    const existing = duraciones.find(d => d.especialidad === esp?.nombre);

    if (editId) {
      const payload = { duracion_minutos: form.duracion_minutos, sobre_turnos_permitidos: form.sobre_turnos_permitidos };
      try {
        const res = await authFetch(`${API}/configuracion-agenda/duracion-prestaciones/${editId}`.replace(API, ""), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || "Error"); return; }
        setShowCreate(false); await loadData();
      } catch { setError("Error de red"); }
    } else if (existing) {
      // Update existing via edit id
      setEditId(existing.id);
      handleSave();
    } else {
      // POST new
      const payload = { especialidad_id: selectedEspecialidadId!, duracion_minutos: form.duracion_minutos, sobre_turnos_permitidos: form.sobre_turnos_permitidos };
      try {
        const res = await authFetch(`${API}/configuracion-agenda/duracion-prestaciones/`.replace(API, ""), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || "Error"); return; }
        setShowCreate(false); await loadData();
      } catch { setError("Error de red"); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta duración de turno?")) return;
    setDeleting(id);
    try {
      const res = await authFetch(`${API}/configuracion-agenda/duracion-prestaciones/${id}/`.replace(API, ""), { method: "DELETE" });
      if (res.ok) await loadData();
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const selectedEsp = especialidades.find(e => e.id === selectedEspecialidadId);
  const contextLabel = selectedEsp ? `Especialidad: ${selectedEsp.nombre}` : "";

  if (!selectedEspecialidadId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#f59e0b" }}>
        <p style={{ fontSize: 16 }}>⚠ Seleccioná una especialidad para ver las duraciones</p>
        <p style={{ fontSize: 13, color: "#62666d", marginTop: 8 }}>
          Las duraciones de turno se configuran por especialidad médica.
        </p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, color: "#62666d" }}>Cargando duraciones...</div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 4 }}>⏱️ Duración de Turnos</h2>
          <p style={{ fontSize: 13, color: "#8a8f98", margin: 0 }}>{contextLabel} — {duraciones.length} configuradas</p>
        </div>
        <button onClick={openCreate} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 20px", color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nueva Duración</button>
      </div>

      {/* Selector Cascada (medical field hidden - duraciones are per specialty only) */}
      <div style={{ marginBottom: 24 }}>
        <SelectorEspecialidadMedico onMedicoChange={() => {}} showTodosMedicos={false} />
      </div>

      {duraciones.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d" }}>No hay duraciones configuradas para esta especialidad.</p>
          <button onClick={openCreate} style={{ marginTop: 12, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 16px", color: "#22c55e", fontSize: 13, cursor: "pointer" }}>
            Configurar duración
          </button>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ESPECIALIDAD</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DURACIÓN</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>SOBRETORNOS</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {duraciones.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 500, color: "#f7f8f8" }}>{d.especialidad}</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#c9cbcf" }}>{d.duracion_minutos} minutos</td>
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "#c9cbcf" }}>{d.sobre_turnos_permitidos}</td>
                  <td style={{ padding: "16px 20px", textAlign: "right" }}>
                    <button onClick={() => openEdit(d)} style={{ background: "none", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 6, padding: "4px 12px", color: "#60a5fa", fontSize: 12, cursor: "pointer", marginRight: 8 }}>Editar</button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>
                      {deleting === d.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Edit/Create */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, width: 440, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#f7f8f8", marginBottom: 24 }}>{editId ? "Editar Duración" : "Nueva Duración"}</h3>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Duración (minutos)</label>
                <input type="number" value={form.duracion_minutos} onChange={e => setForm({ ...form, duracion_minutos: Number(e.target.value) })} min={5} max={120} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Sobreturnos permitidos</label>
                <input type="number" value={form.sobre_turnos_permitidos} onChange={e => setForm({ ...form, sobre_turnos_permitidos: Number(e.target.value) })} min={0} max={10} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#c9cbcf", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: editId ? "rgba(96,165,250,0.2)" : "rgba(34,197,94,0.2)", color: editId ? "#60a5fa" : "#22c55e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editId ? "Guardar" : "Crear"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
