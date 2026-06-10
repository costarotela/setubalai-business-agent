"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, Eye, X, Save, Wrench } from "lucide-react";
import { useAuth } from "../auth-context";

const API = "/api";
const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const PRECIO_TIPO_LABEL: Record<string, string> = {
  unico: "Precio fijo", mensual: "mensual", por_hora: "por hora", anual: "anual",
};
const PRECIO_TIPO_COLOR: Record<string, string> = {
  unico: "#7170ff", mensual: "#10b981", por_hora: "#f59e0b", anual: "#5e6ad2",
};

interface Servicio {
  id: number; nombre: string; descripcion: string | null;
  precio: number; precio_tipo: string; tipo: string;
}

interface SvcForm {
  nombre: string; descripcion: string; precio: string; precio_tipo: string;
}

const EMPTY_FORM: SvcForm = { nombre: "", descripcion: "", precio: "", precio_tipo: "unico" };

// ── Shared Styles ──────────────────────────────────────────────────────────────

const inputS: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f7f8f8", outline: "none", boxSizing: "border-box",
};
const labelS: React.CSSProperties = {
  display: "block", fontSize: 10, color: "#62666d", marginBottom: 4,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
};
const overlayS: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
  zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
};
const boxS: React.CSSProperties = {
  background: "#0f1012", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14, width: "100%", maxHeight: "90vh", overflow: "auto",
};
const headerS: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
};
const bodyS: React.CSSProperties = { padding: "20px 24px" };
const btnPrimary: React.CSSProperties = {
  padding: "9px 20px", background: "#7170ff", color: "white", border: "none",
  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnCancel: React.CSSProperties = {
  padding: "9px 18px", background: "transparent", color: "#8a8f98",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, cursor: "pointer",
};
const btnIcon: (bg: string, border: string, color: string) => React.CSSProperties =
  (bg, border, color) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: 6,
    padding: "5px 8px", color, cursor: "pointer", display: "flex", alignItems: "center",
  });

// ── ConfirmModal ───────────────────────────────────────────────────────────────

function ConfirmModal({ open, title, msg, onConfirm, onCancel }: {
  open: boolean; title: string; msg: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={overlayS} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ ...boxS, maxWidth: 420 }}>
        <div style={bodyS}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", marginBottom: 10 }}>{title}</div>
          <div style={{ fontSize: 13, color: "#8a8f98", marginBottom: 24, lineHeight: 1.5 }}>{msg}</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onCancel} style={btnCancel}>Cancelar</button>
            <button onClick={onConfirm} style={{ ...btnPrimary, background: "#ef4444" }}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  const { token } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Servicio | null>(null);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState<SvcForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Servicio | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    fetch(`${API}/productos/?tipo_filtro=servicio`)
      .then(r => r.json())
      .then(d => { setServicios((d?.productos || []).filter((p: any) => p.tipo === "servicio")); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = servicios.filter(s =>
    !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.descripcion || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const avg = servicios.length ? servicios.reduce((a, x) => a + x.precio, 0) / servicios.length : 0;

  const openNew = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); };
  const openEdit = (s: Servicio) => {
    setEditing(s);
    setForm({ nombre: s.nombre, descripcion: s.descripcion || "", precio: String(s.precio), precio_tipo: s.precio_tipo || "unico" });
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.precio) return;
    setSaving(true);
    const body: any = {
      nombre: form.nombre, descripcion: form.descripcion || null,
      precio: parseFloat(form.precio), precio_tipo: form.precio_tipo,
      tipo: "servicio", control_stock: false, empresa_id: 1,
    };
    try {
      if (editing) {
        await fetch(`${API}/productos/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) });
      } else {
        await fetch(`${API}/productos/`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(body) });
      }
      setShowForm(false); setEditing(null); cargar();
    } finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (!confirmDel) return;
    try { await fetch(`${API}/productos/${confirmDel.id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); cargar(); }
    finally { setConfirmDel(null); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ color: "#62666d", fontSize: 14 }}>Cargando servicios...</div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Servicios</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 5, marginBottom: 0 }}>{filtrados.length} servicios en catálogo</p>
        </div>
        <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Nuevo Servicio
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { icon: Wrench, label: "Total servicios", val: String(servicios.length), color: "#7170ff" },
          { icon: () => <span style={{ fontSize: 16 }}>💰</span>, label: "Precio promedio", val: fmt(avg), color: "#10b981" },
          { icon: () => <span style={{ fontSize: 16 }}>⏱</span>, label: "Tarifa por hora", val: String(servicios.filter(s => s.precio_tipo === "por_hora").length), color: "#f59e0b" },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: "#62666d", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.5px" }}>{val}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Buscador ──────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar servicio por nombre o descripción..."
          style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px 9px 36px", color: "#f7f8f8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Catálogo de servicios</div>
          <div style={{ fontSize: 12, color: "#62666d" }}>{filtrados.length} registros</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              {["#", "Servicio", "Tipo precio", "Precio", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>No se encontraron servicios</td></tr>
            ) : filtrados.map(s => {
              const color = PRECIO_TIPO_COLOR[s.precio_tipo] || "#7170ff";
              return (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#62666d", fontWeight: 500 }}>#{s.id}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{s.nombre}</div>
                    {s.descripcion && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.descripcion}</div>}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {PRECIO_TIPO_LABEL[s.precio_tipo] || s.precio_tipo}
                    </span>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.3px" }}>{fmt(s.precio)}</span>
                    <span style={{ fontSize: 11, marginLeft: 8, fontWeight: 500, color }}>{PRECIO_TIPO_LABEL[s.precio_tipo]}</span>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => setShowDetail(s)} title="Ver detalle" style={btnIcon("rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)", "#8a8f98")}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(s)} title="Editar" style={btnIcon("rgba(245,158,11,0.1)", "rgba(245,158,11,0.25)", "#f59e0b")}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setConfirmDel(s)} title="Eliminar" style={btnIcon("rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)", "#ef4444")}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear/Editar ────────────────────────────────────────────── */}
      {showForm && (
        <div style={overlayS} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ ...boxS, maxWidth: 460 }}>
            <div style={headerS}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>{editing ? "Editar Servicio" : "Nuevo Servicio"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex" }}><X size={18} /></button>
            </div>
            <div style={bodyS}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelS}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Consultoría de Sistemas" style={inputS} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>Precio (USD) *</label>
                  <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Modalidad</label>
                  <select value={form.precio_tipo} onChange={e => setForm({ ...form, precio_tipo: e.target.value })} style={inputS}>
                    <option value="unico">Precio fijo</option>
                    <option value="por_hora">Por hora</option>
                    <option value="mensual">Por mes</option>
                    <option value="anual">Por año</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelS}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del servicio..." rows={3} style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={btnCancel}>Cancelar</button>
                <button onClick={guardar} disabled={saving || !form.nombre || !form.precio} style={{ ...btnPrimary, background: "#5e6ad2", opacity: (saving || !form.nombre || !form.precio) ? 0.6 : 1 }}>
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear Servicio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detalle ─────────────────────────────────────────────────── */}
      {showDetail && (
        <div style={overlayS} onClick={e => { if (e.target === e.currentTarget) setShowDetail(null); }}>
          <div style={{ ...boxS, maxWidth: 420 }}>
            <div style={headerS}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>Detalle del Servicio</div>
              <button onClick={() => setShowDetail(null)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex" }}><X size={18} /></button>
            </div>
            <div style={bodyS}>
              {[
                ["Nombre", showDetail.nombre],
                ["Precio", `${fmt(showDetail.precio)} ${PRECIO_TIPO_LABEL[showDetail.precio_tipo] || ""}`],
                ["Tipo", PRECIO_TIPO_LABEL[showDetail.precio_tipo] || "—"],
                ["Descripción", showDetail.descripcion || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 11, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</span>
                  <span style={{ fontSize: 13, color: "#d0d6e0", textAlign: "right" }}>{v as string}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => { openEdit(showDetail); setShowDetail(null); }} style={{ padding: "8px 16px", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Edit2 size={13} /> Editar
                </button>
                <button onClick={() => { setConfirmDel(showDetail); setShowDetail(null); }} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete ────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmDel}
        title="Eliminar servicio"
        msg={`¿Estás seguro de eliminar "${confirmDel?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={eliminar}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
