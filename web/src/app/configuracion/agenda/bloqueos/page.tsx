"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";

interface Bloqueo {
  id: number;
  medico_id: number;
  fecha_desde: string;
  fecha_hasta: string;
  motivo?: string;
  medico_nombre?: string;
  medico_apellido?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function BloqueosPage() {
  const authFetch = useAuthFetch();
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ medico_id: "", fecha_desde: "", fecha_hasta: "", motivo: "" });
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rB, rM] = await Promise.all([
        authFetch("/configuracion-agenda/bloqueos-grilla/"),
        authFetch("/medicos/")
      ]);
      const dataB = await rB.json();
      const dataM = await rM.json();
      setBloqueos(Array.isArray(dataB) ? dataB : []);
      setMedicos(Array.isArray(dataM) ? dataM : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openAdd = () => {
    setForm({ medico_id: "", fecha_desde: new Date().toISOString().slice(0, 10), fecha_hasta: "", motivo: "" });
    setEditId(null); setError(""); setShowModal(true);
  };

  const openEdit = (b: Bloqueo) => {
    setForm({ medico_id: String(b.medico_id), fecha_desde: b.fecha_desde.slice(0, 10), fecha_hasta: b.fecha_hasta.slice(0, 10), motivo: b.motivo || "" });
    setEditId(b.id); setError(""); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const isEdit = !!editId;
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${API}/configuracion-agenda/bloqueos-grilla/${editId}` : `${API}/configuracion-agenda/bloqueos-grilla/`;
    const body = { medico_id: Number(form.medico_id), fecha_desde: form.fecha_desde, fecha_hasta: form.fecha_hasta, motivo: form.motivo || null };
    try {
      const res = await authFetch(url.replace(API, ""), { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || "Error"); return; }
      setShowModal(false); await loadData();
    } catch { setError("Error de red"); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`${API}/configuracion-agenda/bloqueos-grilla/${id}`.replace(API, ""), { method: "DELETE" });
      if (res.ok || res.status === 204) await loadData();
    } catch (e) { console.error(e); }
    setConfirmDelete(null);
  };

  if (loading) return <div style={{ padding: 40, color: "#62666d" }}>Cargando bloqueos...</div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>🚫 Bloqueos de Agenda</h2>
          <p style={{ fontSize: 13, color: "#62666d", margin: 0 }}>{bloqueos.length} bloqueos registrados</p>
        </div>
        <button onClick={openAdd} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 20px", color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nuevo Bloqueo</button>
      </div>

      {bloqueos.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d" }}>No hay bloqueos configurados.</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>PROFESIONAL</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DESDE</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>HASTA</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>MOTIVO</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 500, color: "#f7f8f8" }}>Dr. {b.medico_apellido || "—"}</div>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#c9cbcf" }}>{b.fecha_desde}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#c9cbcf" }}>{b.fecha_hasta}</td>
                  <td style={{ padding: "14px 20px", color: "#c9cbcf" }}>{b.motivo || "—"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => openEdit(b)} style={{ background: "none", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 6, padding: "4px 12px", color: "#60a5fa", fontSize: 12, cursor: "pointer", marginRight: 8 }}>Editar</button>
                    <button onClick={() => setConfirmDelete(b.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, width: 440, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#f7f8f8", marginBottom: 24 }}>{editId ? "Editar Bloqueo" : "Nuevo Bloqueo"}</h3>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Profesional</label>
                  <select value={form.medico_id} onChange={e => setForm({ ...form, medico_id: e.target.value })} required style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }}>
                    <option value="">Seleccionar profesional...</option>
                    {medicos.filter((m: any) => m.activo !== false).map((m: any) => (
                      <option key={m.id} value={m.id}>{m.nombre} {m.apellido} (ID: {m.id})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Desde</label>
                    <input type="date" value={form.fecha_desde} onChange={e => setForm({ ...form, fecha_desde: e.target.value })} required style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Hasta</label>
                    <input type="date" value={form.fecha_hasta} onChange={e => setForm({ ...form, fecha_hasta: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Motivo</label>
                  <input type="text" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Vacaciones, congreso..." style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#c9cbcf", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                  <button type="submit" style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: editId ? "rgba(96,165,250,0.2)" : "rgba(34,197,94,0.2)", color: editId ? "#60a5fa" : "#22c55e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editId ? "Guardar" : "Crear"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setConfirmDelete(null)}>
          <div style={{ background: "#18181b", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 32, width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#f7f8f8", marginBottom: 12 }}>Eliminar Bloqueo</h3>
            <p style={{ color: "#8a8f98", fontSize: 14, marginBottom: 24 }}>¿Confirmás eliminar este bloqueo de agenda?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#c9cbcf", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
