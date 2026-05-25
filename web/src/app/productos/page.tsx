"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, AlertTriangle, Search, Plus, Edit2, Trash2, Eye, X, Save, Tag } from "lucide-react";
import { useAuth, useAuthFetch } from "../auth-context";

const API = "/api";
const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

interface Producto {
  id: number; nombre: string; descripcion: string | null;
  categoria: string | null; categoria_id: number | null; precio: number; costo: number | null;
  codigo: string | null; control_stock: boolean;
  stock_actual: number | null; stock_minimo: number | null; tipo: string;
}

interface ProdForm {
  nombre: string; descripcion: string; categoria_id: string; precio: string;
  costo: string; codigo: string; control_stock: boolean;
  stock_actual: string; stock_minimo: string; tipo: string;
}

const EMPTY_FORM: ProdForm = {
  nombre: "", descripcion: "", categoria_id: "-1", precio: "",
  costo: "", codigo: "", control_stock: true, stock_actual: "0",
  stock_minimo: "5", tipo: "producto",
};

interface Categoria {
  id: number; nombre: string; descripcion: string;
}

const CAT_COLORS: Record<string, string> = {
  "Computadoras": "#06b6d4", "Electrodomésticos": "#10b981",
  "Audio y Video": "#f59e0b", "Celulares": "#5e6ad2", "Gaming": "#ef4444",
};
function catColor(cat: string | null) {
  if (!cat) return "#7170ff";
  return Object.entries(CAT_COLORS).find(([k]) => cat.toLowerCase().includes(k.toLowerCase()))?.[1] || "#7170ff";
}

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

export default function ProductosPage() {
  const { token } = useAuth();
  const authFetch = useAuthFetch();
  const authHeaders = token ? { headers: { "Authorization": `Bearer ${token}` } } : {};
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stockCritico, setStockCritico] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Load categorias
  useEffect(() => {
    authFetch(`${API}/categorias/`)
      .then(r => r.json())
      .then(d => setCategorias(d.categorias || []))
      .catch(() => {});
  }, [authFetch]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Producto | null>(null);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProdForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Producto | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/productos`).then(r => r.json()),
      fetch(`${API}/productos/stock-critico`).then(r => r.json()),
    ]).then(([d, sc]) => {
      setProductos((d?.productos || []).filter((p: any) => p.tipo === "producto"));
      setStockCritico(sc?.criticos || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const categoriasDerivadas = [...new Set(productos.map(p => p.categoria as string).filter(Boolean))].sort();

  const filtrados = productos.filter(p => {
    const matchCat = !catFiltro || p.categoria === catFiltro;
    const matchBusq = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  });

  const openNew = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setShowForm(true); };
  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({
      nombre: p.nombre, descripcion: p.descripcion || "", categoria_id: String(p.categoria_id || "-1"),
      precio: String(p.precio ?? ""), costo: String(p.costo ?? ""), codigo: p.codigo || "",
      control_stock: p.control_stock ?? false, stock_actual: String(p.stock_actual ?? 0),
      stock_minimo: String(p.stock_minimo ?? 0), tipo: "producto",
    });
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.nombre || !form.precio) return;
    setSaving(true);
    const body: any = {
      nombre: form.nombre, descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      costo: form.costo ? parseFloat(form.costo) : null,
      codigo: form.codigo || null, control_stock: !!form.control_stock,
      stock_actual: form.control_stock ? (parseInt(form.stock_actual) || 0) : null,
      stock_minimo: form.control_stock ? (parseInt(form.stock_minimo) || 0) : 0,
      tipo: "producto",
      categoria_id: form.categoria_id && form.categoria_id !== "-1" ? parseInt(form.categoria_id) : null,
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
      <div style={{ color: "#62666d", fontSize: 14 }}>Cargando productos...</div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Productos</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 5, marginBottom: 0 }}>
            {filtrados.length} de {productos.length} productos · {categorias.length} categorías
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {stockCritico.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{stockCritico.length} stock crítico</span>
            </div>
          )}
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "#7170ff", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto, código, categoría..."
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px 9px 36px", color: "#f7f8f8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        {[{ label: "Todos", color: "#7170ff", active: !catFiltro }].concat(categorias.map(c => ({ label: c.nombre, color: catColor(c.nombre), active: catFiltro === c.nombre }))).map(({ label, color, active }) => (
          <button key={label} onClick={() => setCatFiltro(active ? "" : label)} style={{
            padding: "8px 14px", borderRadius: 20, border: `1px solid ${color}${active ? "50" : "20"}`,
            background: active ? `${color}18` : "transparent", color: active ? color : "#8a8f98",
            fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            {!active && label === "Todos" && <Tag size={11} />}
            {label}
          </button>
        ))}
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Catálogo de productos</div>
          <div style={{ fontSize: 12, color: "#62666d" }}>{filtrados.length} registros</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              {["Código", "Producto", "Categoría", "Costo", "Precio", "Stock", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>No se encontraron productos</td></tr>
            ) : filtrados.map(p => {
              const critico = stockCritico.find((sc: any) => sc.id === p.id);
              const cc = catColor(p.categoria);
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "13px 20px" }}>
                    <code style={{ fontSize: 12, color: "#8a8f98", fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
                      {p.codigo || "—"}
                    </code>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{p.nombre}</div>
                    {p.descripcion && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descripcion}</div>}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    {p.categoria && <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${cc}15`, color: cc, border: `1px solid ${cc}30` }}>{p.categoria}</span>}
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#8a8f98" }}>{p.costo != null ? fmt(p.costo) : "—"}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.3px" }}>{fmt(p.precio)}</span>
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    {p.control_stock !== false && p.stock_actual != null ? (
                      <span style={{ fontSize: 12, fontWeight: 600, color: critico ? "#ef4444" : "#8a8f98" }}>
                        {p.stock_actual} uds{critico ? " ⚠" : ""}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button onClick={() => setShowDetail(p)} title="Ver detalle" style={btnIcon("rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)", "#8a8f98")}>
                        <Eye size={13} />
                      </button>
                      <button onClick={() => openEdit(p)} title="Editar" style={btnIcon("rgba(245,158,11,0.1)", "rgba(245,158,11,0.25)", "#f59e0b")}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setConfirmDel(p)} title="Eliminar" style={btnIcon("rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)", "#ef4444")}>
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
          <div style={{ ...boxS, maxWidth: 520 }}>
            <div style={headerS}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>{editing ? "Editar Producto" : "Nuevo Producto"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex" }}><X size={18} /></button>
            </div>
            <div style={bodyS}>
              {/* Nombre + Código */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Código</label>
                  <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="SKU" style={inputS} />
                </div>
              </div>
              {/* Categoría + Precio + Costo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelS}>Categoría</label>
                  <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })} style={inputS}>
                    <option value="-1">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelS}>Precio (USD) *</label>
                  <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Costo (USD)</label>
                  <input type="number" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} placeholder="0" style={inputS} />
                </div>
              </div>
              {/* Stock toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#8a8f98", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={!!form.control_stock} onChange={e => setForm({ ...form, control_stock: e.target.checked })} style={{ accentColor: "#7170ff" }} />
                  Control de stock
                </label>
                {form.control_stock && (
                  <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                    <div>
                      <label style={{ ...labelS, marginBottom: 2 }}>Actual</label>
                      <input type="number" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} style={{ ...inputS, width: 70, padding: "5px 8px", fontSize: 12 }} />
                    </div>
                    <div>
                      <label style={{ ...labelS, marginBottom: 2 }}>Mínimo</label>
                      <input type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} style={{ ...inputS, width: 70, padding: "5px 8px", fontSize: 12 }} />
                    </div>
                  </div>
                )}
              </div>
              {/* Descripción */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelS}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción opcional..." rows={3} style={{ ...inputS, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              {/* Botones */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} style={btnCancel}>Cancelar</button>
                <button onClick={guardar} disabled={saving || !form.nombre || !form.precio} style={{ ...btnPrimary, opacity: (saving || !form.nombre || !form.precio) ? 0.6 : 1 }}>
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear Producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detalle ─────────────────────────────────────────────────── */}
      {showDetail && (
        <div style={overlayS} onClick={e => { if (e.target === e.currentTarget) setShowDetail(null); }}>
          <div style={{ ...boxS, maxWidth: 460 }}>
            <div style={headerS}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>Detalle del Producto</div>
              <button onClick={() => setShowDetail(null)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex" }}><X size={18} /></button>
            </div>
            <div style={bodyS}>
              {[
                ["Código", showDetail.codigo || "—"],
                ["Nombre", showDetail.nombre],
                ["Categoría", showDetail.categoria || "—"],
                ["Precio", fmt(showDetail.precio)],
                ["Costo", showDetail.costo != null ? fmt(showDetail.costo) : "—"],
                ["Stock Actual", (showDetail.control_stock !== false && showDetail.stock_actual != null) ? `${showDetail.stock_actual} uds` : "No se controla"],
                ["Stock Mínimo", showDetail.stock_minimo != null ? `${showDetail.stock_minimo} uds` : "—"],
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
        title="Eliminar producto"
        msg={`¿Estás seguro de eliminar "${confirmDel?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={eliminar}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
