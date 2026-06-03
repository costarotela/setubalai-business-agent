"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth, useAuthFetch } from "../auth-context";
import Link from "next/link";

interface ObraSocial {
  id: number;
  nombre: string;
  codigo: string;
  rnic: string | null;
  tipo: string;
  cobertura_default: number;
  activo: boolean;
}

export default function ObrasSocialesPage() {
  const authFetch = useAuthFetch();
  const [items, setItems] = useState<ObraSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "", codigo: "", rnic: "",
    tipo: "OS", cobertura_default: 100, activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const r = await authFetch("/obras-sociales/?activo=true");
      const d = await r.json();
      setItems(d.obras_sociales || []);
    } catch (e) {
      console.error("Error cargando obras sociales:", e);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const resetForm = () => {
    setFormData({ nombre: "", codigo: "", rnic: "", tipo: "OS", cobertura_default: 100, activo: true });
    setEditingId(null);
    setError("");
  };

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      setError("Nombre y código son obligatorios");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await authFetch(`/obras-sociales/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await authFetch("/obras-sociales/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      resetForm();
      loadItems();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ObraSocial) => {
    setFormData({
      nombre: item.nombre, codigo: item.codigo, rnic: item.rnic || "",
      tipo: item.tipo, cobertura_default: item.cobertura_default, activo: item.activo,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleDelete = async (item: ObraSocial) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    try {
      await authFetch(`/obras-sociales/${item.id}`, { method: "DELETE" });
      loadItems();
    } catch (e: any) {
      setError(e.message || "Error al eliminar");
    }
  };

  const tipoColor = (tipo: string) => {
    switch (tipo) {
      case "OS": return ["rgba(59,130,246,0.12)", "rgba(59,130,246,0.25)", "#60a5fa"];
      case "PREPAGA": return ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.25)", "#34d399"];
      case "PARTICULAR": return ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.25)", "#fbbf24"];
      default: return ["rgba(139,92,246,0.12)", "rgba(139,92,246,0.25)", "#a78bfa"];
    }
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", marginBottom: 8, margin: 0 }}>
              🏥 Obras Sociales y Prepagas
            </h2>
            <p style={{ fontSize: 13, color: "#62666d", margin: 0, marginTop: 6 }}>
              {items.length} {items.length === 1 ? "obra social" : "obras sociales"} configuradas
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            style={{
              background: "#7170ff", color: "white", border: "none",
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            + Nueva obra social
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", marginBottom: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 13, color: "#ef4444" }}>
          {error}
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#ef4444", marginLeft: 8, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d", fontSize: 14 }}>No hay obras sociales configuradas.</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Nombre", "Código", "Tipo", "Cobertura", "RNIC", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((os) => {
                const [bg, border, color] = tipoColor(os.tipo);
                return (
                  <tr key={os.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#f7f8f8" }}>{os.nombre}</div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4, fontSize: 12, color: "#d0d6e0" }}>{os.codigo}</code>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ background: bg, border: `1px solid ${border}`, color, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{os.tipo}</span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: os.cobertura_default === 100 ? "#10b981" : "#f59e0b" }}>
                        {os.cobertura_default}%
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 12, color: "#62666d" }}>
                      {os.rnic || "—"}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEdit(os)} style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Editar</button>
                        <button onClick={() => handleDelete(os)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", padding: "5px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setShowModal(false); resetForm(); }}>
          <div style={{ background: "#1a1b23", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f7f8f8", marginBottom: 24, marginTop: 0 }}>
              {editingId ? "Editar" : "Nueva"} obra social
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#62666d", marginBottom: 4, fontWeight: 600 }}>Nombre *</label>
                <input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8" }} placeholder="Ej: OSDE" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#62666d", marginBottom: 4, fontWeight: 600 }}>Código *</label>
                  <input value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8" }} placeholder="OSDE" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#62666d", marginBottom: 4, fontWeight: 600 }}>RNIC</label>
                  <input value={formData.rnic} onChange={e => setFormData({ ...formData, rnic: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8" }} placeholder="R-0001" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#62666d", marginBottom: 4, fontWeight: 600 }}>Tipo</label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8" }}>
                    <option value="OS">Obra Social</option>
                    <option value="PREPAGA">Prepaga</option>
                    <option value="PARTICULAR">Particular</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#62666d", marginBottom: 4, fontWeight: 600 }}>Cobertura %</label>
                  <input type="number" min="0" max="100" value={formData.cobertura_default} onChange={e => setFormData({ ...formData, cobertura_default: Number(e.target.value) })} style={{ width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={{ padding: "9px 18px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "9px 18px", background: "#7170ff", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
