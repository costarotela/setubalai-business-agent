"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import SelectorEspecialidadMedico from "@/components/SelectorEspecialidadMedico";

interface Prestacion {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  especialidad_requerida: string | null;
  precio_particular: number | null;
  valor_modulo: number | null;
  duracion_minutos: number | null;
  requiere_autorizacion: boolean;
  activo: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function PrestacionesPage() {
  const authFetch = useAuthFetch();
  const { selectedEspecialidadId, especialidades } = useFiltrosClinica();

  const [data, setData] = useState<Prestacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    codigo: "", descripcion: "", tipo: "Consulta", especialidad_requerida: "",
    precio_particular: "0", valor_modulo: "", duracion_minutos: "30", requiere_autorizacion: false, activo: true,
  });
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/nomenclador_practicas/`.replace(API, ""));
      const responseData = await res.json();
      setData(Array.isArray(responseData) ? responseData : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openCreate = () => {
    const esp = especialidades.find(e => e.id === selectedEspecialidadId);
    setEditId(null);
    setForm({
      codigo: "", descripcion: "", tipo: "Consulta",
      especialidad_requerida: esp?.nombre || "",
      precio_particular: "0", valor_modulo: "", duracion_minutos: "30",
      requiere_autorizacion: false, activo: true,
    });
    setError(""); setShowModal(true);
  };

  const openEdit = (p: Prestacion) => {
    setEditId(p.id);
    setForm({
      codigo: p.codigo, descripcion: p.descripcion, tipo: p.tipo || "Consulta",
      especialidad_requerida: p.especialidad_requerida || "",
      precio_particular: String(p.precio_particular || 0),
      valor_modulo: p.valor_modulo ? String(p.valor_modulo) : "",
      duracion_minutos: String(p.duracion_minutos || 30),
      requiere_autorizacion: p.requiere_autorizacion, activo: p.activo,
    });
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.codigo || !form.descripcion) { setError("Código y descripción son obligatorios"); return; }
    const body = {
      codigo: form.codigo, descripcion: form.descripcion, tipo: form.tipo,
      especialidad_requerida: form.especialidad_requerida || null,
      precio_particular: Number(form.precio_particular),
      valor_modulo: form.valor_modulo ? Number(form.valor_modulo) : null,
      duracion_minutos: Number(form.duracion_minutos),
      requiere_autorizacion: form.requiere_autorizacion, activo: form.activo,
    };
    try {
      let res;
      if (editId) {
        res = await authFetch(`${API}/nomenclador_practicas/${editId}/`.replace(API, ""), {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      } else {
        res = await authFetch(`${API}/nomenclador_practicas/`.replace(API, ""), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        });
      }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.detail || "Error"); return; }
      setShowModal(false); await loadData();
    } catch { setError("Error de red"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta prestación?")) return;
    try {
      const res = await authFetch(`${API}/nomenclador_practicas/${id}/`.replace(API, ""), { method: "DELETE" });
      if (res.ok) await loadData();
    } catch (e) { console.error(e); }
  };

  // Filter by selected specialty + text search
  const selectedEsp = especialidades.find(e => e.id === selectedEspecialidadId);
  const filtered = data.filter(p => {
    // Always filter by specialty if selected
    if (selectedEsp && p.especialidad_requerida !== selectedEsp.nombre) return false;
    // Then text search
    if (filter) {
      return p.descripcion.toLowerCase().includes(filter.toLowerCase())
        || p.codigo.toLowerCase().includes(filter.toLowerCase())
        || (p.tipo && p.tipo.toLowerCase().includes(filter.toLowerCase()));
    }
    return true;
  });

  const TIPOS = ["Consulta", "Estudio", "Procedimiento", "Cirugía", "Internación", "Otro"];
  const contextLabel = selectedEsp
    ? `Especialidad: ${selectedEsp.nombre} — ${filtered.length} mostradas de ${data.length}`
    : "";

  if (!selectedEspecialidadId) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#f59e0b" }}>
        <p style={{ fontSize: 16 }}>⚠ Seleccioná una especialidad para ver las prestaciones</p>
        <p style={{ fontSize: 13, color: "#62666d", marginTop: 8 }}>Las prestaciones se filtran por especialidad médica.</p>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, color: "#62666d" }}>Cargando prestaciones...</div>;

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 4 }}>💊 Prestaciones y Nomenclador</h2>
          <p style={{ fontSize: 13, color: "#8a8f98", margin: 0 }}>{contextLabel}</p>
        </div>
        <button onClick={openCreate} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 20px", color: "#22c55e", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nueva Prestación</button>
      </div>

      {/* Selector Cascada */}
      <div style={{ marginBottom: 24 }}>
        <SelectorEspecialidadMedico onMedicoChange={() => {}} showTodosMedicos={false} />
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar por código, descripción o tipo..." style={{ width: "100%", padding: "12px 16px", background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f7f8f8", fontSize: 14 }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d" }}>No hay prestaciones para esta especialidad.</p>
          <button onClick={openCreate} style={{ marginTop: 12, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "8px 16px", color: "#22c55e", fontSize: 13, cursor: "pointer" }}>Agregar primera prestación</button>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>CÓDIGO</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DESCRIPCIÓN</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>TIPO</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DURACIÓN</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>PRECIO</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>AUT.</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ESTADO</th>
                <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "14px 20px", fontWeight: 600, color: "#818cf8", fontFamily: "monospace" }}>{p.codigo}</td>
                  <td style={{ padding: "14px 20px", color: "#f7f8f8" }}>{p.descripcion}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}><span style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#c9cbcf" }}>{p.tipo || "—"}</span></td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#c9cbcf" }}>{p.duracion_minutos ? `${p.duracion_minutos}min` : "—"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: "#c9cbcf" }}>{p.precio_particular ? `$${p.precio_particular}` : "—"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center", color: p.requiere_autorizacion ? "#fbbf24" : "#62666d" }}>{p.requiere_autorizacion ? "Sí" : "No"}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}><span style={{ background: p.activo ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${p.activo ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 20, color: p.activo ? "#22c55e" : "#ef4444", padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>{p.activo ? "ACTIVO" : "INACTIVO"}</span></td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <button onClick={() => openEdit(p)} style={{ background: "none", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 6, padding: "4px 12px", color: "#60a5fa", fontSize: 12, cursor: "pointer", marginRight: 8 }}>Editar</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 32, width: 520, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#f7f8f8", marginBottom: 24 }}>{editId ? "Editar Prestación" : "Nueva Prestación"}</h3>
            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Código</label>
                  <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="CON-001" style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Descripción</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Consulta de clínica médica" style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Duración (min)</label>
                  <input type="number" value={form.duracion_minutos} onChange={e => setForm({ ...form, duracion_minutos: e.target.value })} min={5} step={5} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Precio particular</label>
                  <input type="number" value={form.precio_particular} onChange={e => setForm({ ...form, precio_particular: e.target.value })} min={0} step={100} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Valor módulo</label>
                  <input type="number" value={form.valor_modulo} onChange={e => setForm({ ...form, valor_modulo: e.target.value })} min={0} style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4, display: "block" }}>Especialidad requerida</label>
                <input type="text" value={form.especialidad_requerida} onChange={e => setForm({ ...form, especialidad_requerida: e.target.value })} placeholder="Cardiología" style={{ width: "100%", padding: "10px 12px", background: "#27272a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#f7f8f8", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#c9cbcf", fontSize: 14 }}>
                  <input type="checkbox" checked={form.requiere_autorizacion} onChange={e => setForm({ ...form, requiere_autorizacion: e.target.checked })} style={{ accentColor: "#fbbf24", width: 16, height: 16 }} />
                  Requiere autorización
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#c9cbcf", fontSize: 14 }}>
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} style={{ accentColor: "#22c55e", width: 16, height: 16 }} />
                  Activo
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#c9cbcf", fontSize: 14, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: editId ? "rgba(96,165,250,0.2)" : "rgba(34,197,94,0.2)", color: editId ? "#60a5fa" : "#22c55e", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editId ? "Guardar" : "Crear"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
