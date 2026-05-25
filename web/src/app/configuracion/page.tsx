"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Tag, CreditCard, Save, Plus, Edit2, Trash2, X, Loader2, Sparkles, CheckCircle, Globe, QrCode, Link as LinkIcon, LayoutGrid } from "lucide-react";
import { useAuth, useAuthFetch } from "../auth-context";

const API = "/api";

// ── Shared Styles ──────────────────────────────────────────────────────────────

const inputS: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#f7f8f8", outline: "none", boxSizing: "border-box",
};
const selectS: React.CSSProperties = {
  ...inputS, cursor: "pointer",
};
const labelS: React.CSSProperties = {
  display: "block", fontSize: 10, color: "#62666d", marginBottom: 4,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
};
const sectionS: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12, overflow: "hidden", marginBottom: 24,
};
const sectionHeaderS: React.CSSProperties = {
  padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)",
  display: "flex", alignItems: "center", gap: 10,
};
const sectionBodyS: React.CSSProperties = { padding: "20px 24px" };
const btnPrimary: React.CSSProperties = {
  padding: "9px 20px", background: "#7170ff", color: "white", border: "none",
  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 6,
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
const toggleS = (on: boolean): React.CSSProperties => ({
  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
  background: on ? "#7170ff" : "rgba(255,255,255,0.1)", position: "relative",
  transition: "background 0.2s", flexShrink: 0,
});
const toggleDotS = (on: boolean): React.CSSProperties => ({
  width: 16, height: 16, borderRadius: "50%", background: "white",
  position: "absolute", top: 3, left: on ? 21 : 3, transition: "left 0.2s",
});

type Tab = "empresa" | "categorias" | "cobros" | "catalogo";

interface Categoria {
  id: number; nombre: string; descripcion: string;
  categoria_padre_id: number | null; orden: number; activo: boolean;
  hijos?: Categoria[];
}

interface Producto {
  id: number; nombre: string; descripcion: string | null;
  categoria: string | null; categoria_id: number | null; precio: number;
  costo: number | null;
  codigo: string | null; control_stock: boolean;
  stock_actual: number | null; stock_minimo: number | null; tipo: string;
  visible_en_catalogo: boolean; destacado_en_catalogo: boolean;
  precio_oferta: number | null; descripcion_catalogo: string | null; imagen_url: string | null;
}

interface EmpresaData {
  nombre: string; rubro: string; email: string; telefono: string;
  direccion: string; moneda: string; cuit: string; cbu: string;
  alias_cbu: string; banco: string; contacto_nombre: string;
  web: string; instagram: string; configuracion: Record<string, any>; stats: any;
}

const EMPTY_EMPRESA: EmpresaData = {
  nombre: "", rubro: "", email: "", telefono: "",
  direccion: "", moneda: "USD", cuit: "", cbu: "",
  alias_cbu: "", banco: "", contacto_nombre: "",
  web: "", instagram: "", configuracion: {}, stats: {},
};

export default function ConfigPage() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [activeTab, setActiveTab] = useState<Tab>("empresa");

  // Empresa
  const [empresa, setEmpresa] = useState<EmpresaData>(EMPTY_EMPRESA);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [savingEmpresa, setSavingEmpresa] = useState(false);
  const [empresaSaved, setEmpresaSaved] = useState(false);

  // Categorías
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [nuevaCat, setNuevaCat] = useState({ nombre: "", descripcion: "", categoria_padre_id: null as number | null, orden: 0 });
  const [showAddCat, setShowAddCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Categoria | null>(null);
  const [catForm, setCatForm] = useState({ nombre: "", descripcion: "", categoria_padre_id: null as number | null, orden: 0 });
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Catálogo público
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProds, setLoadingProds] = useState(true);
  const [savingCatalogo, setSavingCatalogo] = useState(false);
  const [catalogoSaved, setCatalogoSaved] = useState(false);
  const [catalogoSlug, setCatalogoSlug] = useState("");
  const [catalogoActivo, setCatalogoActivo] = useState(false);
  const [catalogoEmpresaSaved, setCatalogoEmpresaSaved] = useState(false);

  // ── Load empresa data ─────────────────────────────────────────────────────
  const loadEmpresa = useCallback(async () => {
    try {
      const r = await authFetch(`${API}/mi-empresa`);
      const data = await r.json();
      setEmpresa({
        nombre: data.nombre || "", rubro: data.rubro || "", email: data.email || "",
        telefono: data.telefono || "", direccion: data.direccion || "",
        moneda: data.moneda || "USD", cuit: data.cuit || "", cbu: data.cbu || "",
        alias_cbu: data.alias_cbu || "", banco: data.banco || "",
        contacto_nombre: data.contacto_nombre || "", web: data.web || "",
        instagram: data.instagram || "", configuracion: data.configuracion || {}, stats: data.stats || {},
      });
      setCatalogoSlug(data.configuracion?.catalogo_slug || "");
      setCatalogoActivo(data.configuracion?.catalogo_activo || false);
    } catch { /* no auth, use defaults */ }
    finally { setLoadingEmpresa(false); }
  }, [authFetch]);

  // ── Load categorias ───────────────────────────────────────────────────────
  const loadCategorias = useCallback(async () => {

    try {
      const r = await authFetch(`${API}/categorias/arbol`);
      const data = await r.json();
      setCategorias(data.categorias || []);
    } catch { /* server error */ }
    finally { setLoadingCats(false); }
  }, [authFetch]);

  const loadCategoriasFlat = useCallback(async (): Promise<Categoria[]> => {
    try {
      const r = await authFetch(`${API}/categorias/`);
      const data = await r.json();
      return data.categorias || [];
    } catch { return []; }
  }, [authFetch]);

  // ── Load productos ────────────────────────────────────────────────────────
  const loadProductos = useCallback(async () => {
    setLoadingProds(true);
    try {
      const r = await authFetch(`${API}/productos/?activo=true`);
      const data = await r.json();
      setProductos(data.productos || []);
    } catch { /* */ }
    finally { setLoadingProds(false); }
  }, [authFetch]);

  useEffect(() => { loadEmpresa(); loadCategorias(); }, [loadEmpresa, loadCategorias]);
  useEffect(() => { if (activeTab === "catalogo") loadProductos(); }, [activeTab, loadProductos]);

  // ── Save empresa ──────────────────────────────────────────────────────────
  const saveEmpresa = async () => {
    setSavingEmpresa(true); setEmpresaSaved(false);
    try {
      await authFetch(`${API}/mi-empresa`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: empresa.nombre, rubro: empresa.rubro, email: empresa.email,
          telefono: empresa.telefono, direccion: empresa.direccion,
          moneda: empresa.moneda, cuit: empresa.cuit, cbu: empresa.cbu,
          alias_cbu: empresa.alias_cbu, banco: empresa.banco,
          contacto_nombre: empresa.contacto_nombre, web: empresa.web,
          instagram: empresa.instagram,
        }),
      });
      setEmpresaSaved(true);
      setTimeout(() => setEmpresaSaved(false), 3000);
    } catch { /* error */ }
    finally { setSavingEmpresa(false); }
  };

  // ── Save catalog config ──────────────────────────────────────────────────
  const saveCatalogoConfig = async () => {
    setSavingCatalogo(true); setCatalogoEmpresaSaved(false);
    try {
      // Merge existing config with new catalog settings
      const existingCfg = empresa.configuracion || {};
      const newCfg = {
        ...existingCfg,
        catalogo_slug: catalogoSlug.trim(),
        catalogo_activo: catalogoActivo,
      };
      await authFetch(`${API}/mi-empresa`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: empresa.nombre, rubro: empresa.rubro, email: empresa.email,
          telefono: empresa.telefono, direccion: empresa.direccion,
          moneda: empresa.moneda, cuit: empresa.cuit, cbu: empresa.cbu,
          alias_cbu: empresa.alias_cbu, banco: empresa.banco,
          contacto_nombre: empresa.contacto_nombre, web: empresa.web,
          instagram: empresa.instagram,
          configuracion: newCfg,
        }),
      });
      setCatalogoEmpresaSaved(true);
      // Reload to confirm
      await loadEmpresa();
      setTimeout(() => setCatalogoEmpresaSaved(false), 3000);
    } catch { /* */ }
    finally { setSavingCatalogo(false); }
  };

  // ── Toggle producto visible ──────────────────────────────────────────────
  const toggleProducto = async (prod: Producto, field: "visible_en_catalogo" | "destacado_en_catalogo") => {
    const newVal = !prod[field];
    try {
      await authFetch(`${API}/productos/${prod.id}`, {
        method: "PUT",
        body: JSON.stringify({ [field]: newVal }),
      });
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, [field]: newVal } : p));
    } catch { /* */ }
  };

  const updatePrecioOferta = async (prod: Producto, value: string) => {
    const numVal = value === "" ? null : parseFloat(value);
    try {
      await authFetch(`${API}/productos/${prod.id}`, {
        method: "PUT",
        body: JSON.stringify({ precio_oferta: numVal }),
      });
      setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, precio_oferta: numVal } : p));
    } catch { /* */ }
  };

  // ── Seed data ─────────────────────────────────────────────────────────────
  const runSeed = async () => {
    setSeedLoading(true); setSeedResult(null); setCatError("");
    try {
      const r = await authFetch(`${API}/configuracion/seed`, { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        setSeedResult(`✅ ${data.categorias_creadas} categorías y ${data.productos_creados} productos creados`);
        loadCategorias();
      } else {
        setCatError(data.detail || "Error al cargar datos");
      }
    } catch { setCatError("Error de conexión"); }
    finally { setSeedLoading(false); }
  };

  // ── Categorías CRUD ──────────────────────────────────────────────────────
  const addCategoria = async () => {
    if (!nuevaCat.nombre.trim()) { setCatError("El nombre es obligatorio"); return; }
    setSavingCat(true); setCatError("");
    try {
      await authFetch(`${API}/categorias/`, {
        method: "POST",
        body: JSON.stringify(nuevaCat),
      });
      setNuevaCat({ nombre: "", descripcion: "", categoria_padre_id: null, orden: 0 });
      setShowAddCat(false);
      loadCategorias();
    } catch (e: any) {
      setCatError(e.message || "Error al crear categoría");
    } finally { setSavingCat(false); }
  };

  const saveEditCat = async () => {
    if (!editingCat) return;
    if (!catForm.nombre.trim()) { setCatError("El nombre es obligatorio"); return; }
    setSavingCat(true); setCatError("");
    try {
      await authFetch(`${API}/categorias/${editingCat.id}`, {
        method: "PUT",
        body: JSON.stringify(catForm),
      });
      setEditingCat(null);
      loadCategorias();
    } catch (e: any) {
      setCatError(e.message || "Error al editar categoría");
    } finally { setSavingCat(false); }
  };

  const deleteCat = async (cat: Categoria) => {
    setCatError("");
    try {
      const r = await authFetch(`${API}/categorias/${cat.id}`, { method: "DELETE" });
      const data = await r.json();
      if (!r.ok) {
        setCatError(data.detail || "No se pudo eliminar");
      } else {
        loadCategorias();
      }
    } catch (e: any) {
      setCatError(e.message || "Error al eliminar");
    }
  };

  const startEditCat = (cat: Categoria) => {
    setEditingCat(cat);
    setCatForm({ nombre: cat.nombre, descripcion: cat.descripcion || "", categoria_padre_id: cat.categoria_padre_id, orden: cat.orden ?? 0 });
  };

  const fmt = (val: number | string | undefined) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: empresa.moneda || "USD", maximumFractionDigits: 0 }).format(Number(val) || 0);

  // Render categories recursively (tree)
  const renderCatRow = (cat: Categoria, depth: number = 0, allCats: Categoria[] = []) => {
    const indent = depth * 24;
    const parentName = cat.categoria_padre_id
      ? allCats.find(c => c.id === cat.categoria_padre_id)?.nombre
      : null;
    const isChild = cat.categoria_padre_id !== null;
    const rows = [
      <tr key={cat.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <td style={{ padding: "13px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isChild && <span style={{ color: "#7170ff", fontSize: 10, opacity: 0.5 }}>└─</span>}
            <span style={{
              padding: "3px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: isChild ? "rgba(113,112,255,0.06)" : "rgba(113,112,255,0.1)",
              color: isChild ? "#9d9dff" : "#7170ff",
              border: `1px solid ${isChild ? "rgba(113,112,255,0.12)" : "rgba(113,112,255,0.2)"}`,
              marginLeft: indent,
            }}>{cat.nombre}</span>
            {isChild && <span style={{ fontSize: 10, color: "#62666d", fontStyle: "italic" }}>(subcat: {parentName})</span>}
          </div>
        </td>
        <td style={{ padding: "13px 20px", fontSize: 12, color: "#62666d", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cat.descripcion || "—"}
        </td>
        <td style={{ padding: "13px 20px", fontSize: 11, color: "#62666d", textAlign: "center" }}>
          {cat.orden ?? 0}
        </td>
        <td style={{ padding: "13px 20px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => startEditCat(cat)} title="Editar" style={btnIcon("rgba(245,158,11,0.1)", "rgba(245,158,11,0.25)", "#f59e0b")}>
              <Edit2 size={13} />
            </button>
            <button onClick={() => deleteCat(cat)} title="Eliminar" style={btnIcon("rgba(239,68,68,0.1)", "rgba(239,68,68,0.25)", "#ef4444")}>
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>,
    ];
    // Render children recursively
    if (cat.hijos && cat.hijos.length > 0) {
      for (const child of cat.hijos) {
        rows.push(...renderCatRow(child, depth + 1, allCats));
      }
    }
    return rows;
  };

  // Flatten for select dropdown
  const flattenForSelect = (cats: Categoria[]): { id: number; nombre: string; depth: number }[] => {
    const result: { id: number; nombre: string; depth: number }[] = [];
    const walk = (list: Categoria[], d: number) => {
      for (const c of list) {
        result.push({ id: c.id, nombre: c.nombre, depth: d });
        if (c.hijos && c.hijos.length > 0) walk(c.hijos, d + 1);
      }
    };
    walk(cats, 0);
    return result;
  };

  if (loadingEmpresa) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={24} color="#7170ff" className="animate-spin" />
        <span style={{ color: "#62666d", fontSize: 14, marginLeft: 12 }}>Cargando configuración...</span>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "empresa", label: "Datos de Empresa", icon: Building2 },
    { key: "categorias", label: "Categorías", icon: Tag },
    { key: "cobros", label: "Datos de Cobro", icon: CreditCard },
    { key: "catalogo", label: "Catálogo Público", icon: Globe },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>
          Configuración
        </h1>
        <p style={{ fontSize: 13, color: "#62666d", marginTop: 5, marginBottom: 0 }}>
          Administrá los datos de tu negocio, categorías y catálogo público
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: isActive ? "2px solid #7170ff" : "2px solid transparent",
                color: isActive ? "#7170ff" : "#62666d",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                transition: "all 0.15s",
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: Datos de Empresa ──────────────────────────────────────── */}
      {activeTab === "empresa" && (
        <div style={sectionS}>
          <div style={sectionHeaderS}>
            <Building2 size={18} color="#7170ff" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>Datos de Empresa</div>
              <div style={{ fontSize: 11, color: "#62666d" }}>Información fiscal y de contacto</div>
            </div>
          </div>
          <div style={sectionBodyS}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelS}>Nombre *</label>
                <input value={empresa.nombre} onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} placeholder="Nombre de la empresa" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Rubro</label>
                <input value={empresa.rubro} onChange={e => setEmpresa({ ...empresa, rubro: e.target.value })} placeholder="Ej: Tecnología, Alimentos..." style={inputS} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelS}>CUIT</label>
                <input value={empresa.cuit} onChange={e => setEmpresa({ ...empresa, cuit: e.target.value })} placeholder="XX-XXXXXXXX-X" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Moneda</label>
                <select value={empresa.moneda} onChange={e => setEmpresa({ ...empresa, moneda: e.target.value })} style={selectS}>
                  <option value="USD">USD — Dólar estadounidense</option>
                  <option value="ARS">ARS — Peso argentino</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="BRL">BRL — Real brasileño</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelS}>Email</label>
                <input type="email" value={empresa.email} onChange={e => setEmpresa({ ...empresa, email: e.target.value })} placeholder="contacto@empresa.com" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Teléfono</label>
                <input value={empresa.telefono} onChange={e => setEmpresa({ ...empresa, telefono: e.target.value })} placeholder="+54 11 1234-5678" style={inputS} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelS}>Dirección</label>
              <input value={empresa.direccion} onChange={e => setEmpresa({ ...empresa, direccion: e.target.value })} placeholder="Calle 123, Ciudad, Provincia" style={inputS} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={labelS}>Contacto</label>
                <input value={empresa.contacto_nombre} onChange={e => setEmpresa({ ...empresa, contacto_nombre: e.target.value })} placeholder="Nombre del contacto" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Sitio web</label>
                <input value={empresa.web} onChange={e => setEmpresa({ ...empresa, web: e.target.value })} placeholder="https://www.empresa.com" style={inputS} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
              {empresaSaved && (
                <span style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={14} /> Guardado
                </span>
              )}
              <button onClick={saveEmpresa} disabled={savingEmpresa || !empresa.nombre} style={{ ...btnPrimary, opacity: (savingEmpresa || !empresa.nombre) ? 0.5 : 1 }}>
                {savingEmpresa ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {savingEmpresa ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Categorías ────────────────────────────────────────────── */}
      {activeTab === "categorias" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#62666d" }}>
              {categorias.length} categorías
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={runSeed}
                disabled={seedLoading}
                style={{
                  padding: "8px 14px", background: "rgba(16,185,129,0.1)", color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Sparkles size={13} />
                {seedLoading ? "Cargando..." : "Cargar datos de ejemplo"}
              </button>
              <button
                onClick={() => { setShowAddCat(true); setNuevaCat({ nombre: "", descripcion: "", categoria_padre_id: null, orden: categorias.length }); setCatError(""); }}
                style={{
                  padding: "8px 14px", background: "#7170ff", color: "white",
                  border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Plus size={13} /> Nueva categoría
              </button>
            </div>
          </div>
          {seedResult && (
            <div style={{ padding: "10px 14px", marginBottom: 12, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 12, color: "#10b981" }}>
              {seedResult}
              <button onClick={() => setSeedResult(null)} style={{ background: "none", border: "none", color: "#10b981", marginLeft: 8, cursor: "pointer", padding: "0 4px" }}>×</button>
            </div>
          )}
          {catError && (
            <div style={{ padding: "10px 14px", marginBottom: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 12, color: "#ef4444" }}>
              {catError}
              <button onClick={() => setCatError("")} style={{ background: "none", border: "none", color: "#ef4444", marginLeft: 8, cursor: "pointer", padding: "0 4px" }}>×</button>
            </div>
          )}

          {/* Agregar nueva categoría */}
          {showAddCat && (
            <div style={{ ...sectionS, borderColor: "rgba(113,112,255,0.2)" }}>
              <div style={sectionHeaderS}>
                <Plus size={16} color="#7170ff" />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8" }}>Nueva categoría</div>
              </div>
              <div style={sectionBodyS}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelS}>Nombre *</label>
                    <input value={nuevaCat.nombre} onChange={e => setNuevaCat({ ...nuevaCat, nombre: e.target.value })} placeholder="Ej: Servicios" style={inputS} />
                  </div>
                  <div>
                    <label style={labelS}>Descripción</label>
                    <input value={nuevaCat.descripcion} onChange={e => setNuevaCat({ ...nuevaCat, descripcion: e.target.value })} placeholder="Descripción opcional" style={inputS} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelS}>Categoría padre (opcional)</label>
                    <ParentSelect value={nuevaCat.categoria_padre_id} onChange={(v) => setNuevaCat({ ...nuevaCat, categoria_padre_id: v })} categories={categorias} authFetch={authFetch} />
                  </div>
                  <div>
                    <label style={labelS}>Orden</label>
                    <input type="number" value={nuevaCat.orden} onChange={e => setNuevaCat({ ...nuevaCat, orden: parseInt(e.target.value) || 0 })} style={inputS} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowAddCat(false)} style={btnCancel}>Cancelar</button>
                  <button onClick={addCategoria} disabled={savingCat || !nuevaCat.nombre} style={{ ...btnPrimary, opacity: (savingCat || !nuevaCat.nombre) ? 0.5 : 1 }}>
                    <Save size={13} /> Crear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Editar categoría */}
          {editingCat && (
            <div style={{ ...sectionS, borderColor: "rgba(245,158,11,0.2)" }}>
              <div style={sectionHeaderS}>
                <Edit2 size={16} color="#f59e0b" />
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8" }}>Editando: {editingCat.nombre}</div>
              </div>
              <div style={sectionBodyS}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelS}>Nombre *</label>
                    <input value={catForm.nombre} onChange={e => setCatForm({ ...catForm, nombre: e.target.value })} style={inputS} />
                  </div>
                  <div>
                    <label style={labelS}>Descripción</label>
                    <input value={catForm.descripcion} onChange={e => setCatForm({ ...catForm, descripcion: e.target.value })} placeholder="Descripción opcional" style={inputS} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelS}>Categoría padre (opcional)</label>
                    <ParentSelect value={catForm.categoria_padre_id} excludeId={editingCat?.id} onChange={(v) => setCatForm({ ...catForm, categoria_padre_id: v })} categories={categorias} authFetch={authFetch} />
                  </div>
                  <div>
                    <label style={labelS}>Orden</label>
                    <input type="number" value={catForm.orden} onChange={e => setCatForm({ ...catForm, orden: parseInt(e.target.value) || 0 })} style={inputS} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingCat(null)} style={btnCancel}>Cancelar</button>
                  <button onClick={saveEditCat} disabled={savingCat || !catForm.nombre} style={{ ...btnPrimary, background: "#f59e0b", color: "#0f1012", opacity: (savingCat || !catForm.nombre) ? 0.5 : 1 }}>
                    <Save size={13} /> Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de categorías (jerárquica) */}
          <div style={sectionS}>
            <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Categorías de productos</div>
              <div style={{ fontSize: 11, color: "#62666d" }}>Árbol jerárquico — las subcategorías aparecen indentadas</div>
            </div>
            {loadingCats ? (
              <div style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>Cargando...</div>
            ) : categorias.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>
                No hay categorías. Creá una nueva o cargá datos de ejemplo.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Nombre", "Descripción", "Orden", "Acciones"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(cat => renderCatRow(cat, 0, categorias).map((row, i) => row))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: Datos de Cobro ────────────────────────────────────────── */}
      {activeTab === "cobros" && (
        <div style={sectionS}>
          <div style={sectionHeaderS}>
            <CreditCard size={18} color="#7170ff" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>Datos de Cobro</div>
              <div style={{ fontSize: 11, color: "#62666d" }}>Información bancaria para facturas y cobros</div>
            </div>
          </div>
          <div style={sectionBodyS}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelS}>Banco</label>
                <input value={empresa.banco} onChange={e => setEmpresa({ ...empresa, banco: e.target.value })} placeholder="Nombre del banco" style={inputS} />
              </div>
              <div>
                <label style={labelS}>CBU</label>
                <input value={empresa.cbu} onChange={e => setEmpresa({ ...empresa, cbu: e.target.value })} placeholder="0000000000000000000000" style={inputS} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelS}>Alias CBU</label>
              <input value={empresa.alias_cbu} onChange={e => setEmpresa({ ...empresa, alias_cbu: e.target.value })} placeholder="MI.EMPRESA.ALIAS" style={inputS} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
              {empresaSaved && (
                <span style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={14} /> Guardado
                </span>
              )}
              <button onClick={saveEmpresa} disabled={savingEmpresa} style={{ ...btnPrimary, opacity: savingEmpresa ? 0.5 : 1 }}>
                {savingEmpresa ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {savingEmpresa ? "Guardando..." : "Guardar datos de cobro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Catálogo Público ──────────────────────────────────────── */}
      {activeTab === "catalogo" && (
        <div>
          {/* Sección: Configuración del catálogo */}
          <div style={sectionS}>
            <div style={sectionHeaderS}>
              <Globe size={18} color="#7170ff" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>Configuración del Catálogo Público</div>
                <div style={{ fontSize: 11, color: "#62666d" }}>Activá tu vitrina online para compartir con clientes</div>
              </div>
            </div>
            <div style={sectionBodyS}>
              {/* Toggle activo */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={() => setCatalogoActivo(!catalogoActivo)}
                  style={toggleS(catalogoActivo)}
                >
                  <div style={toggleDotS(catalogoActivo)} />
                </button>
                <span style={{ fontSize: 14, color: catalogoActivo ? "#10b981" : "#62666d", fontWeight: 600 }}>
                  Catálogo {catalogoActivo ? "activado" : "desactivado"}
                </span>
              </div>

              {/* Slug */}
              {catalogoActivo && (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelS}>URL personalizada (slug)</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        value={catalogoSlug}
                        onChange={e => setCatalogoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="mi-negocio"
                        style={inputS}
                      />
                    </div>
                    {catalogoSlug && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#10b981" }}>
                        <LinkIcon size={12} />
                        <span style={{ wordBreak: "break-all" }}>https://business.setubalai.org/catalogo/{catalogoSlug}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {catalogoSlug && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 120, height: 120, background: "white", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`https://business.setubalai.org/catalogo/${catalogoSlug}`)}&size=100x100&color=1a1b23`}
                          alt="QR Catálogo"
                          style={{ width: 100, height: 100 }}
                        />
                      </div>
                      <div style={{ fontSize: 12, color: "#62666d" }}>
                        <div style={{ color: "#d0d6e0", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <QrCode size={14} color="#7170ff" /> Código QR
                        </div>
                        Imprimí este QR y pegalo en tu local, redes o facturitas. Tus clientes escanean y ven tu catálogo.
                      </div>
                    </div>
                  )}

                  {/* Save config button */}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
                    {catalogoEmpresaSaved && (
                      <span style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={14} /> Configuración guardada
                      </span>
                    )}
                    <button
                      onClick={() => { setCatalogoSlug(catalogoSlug.trim()); saveCatalogoConfig(); }}
                      disabled={savingCatalogo || !catalogoSlug}
                      style={{ ...btnPrimary, opacity: (savingCatalogo || !catalogoSlug) ? 0.5 : 1 }}
                    >
                      {savingCatalogo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {savingCatalogo ? "Guardando..." : "Guardar configuración"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sección: Productos del catálogo */}
          {catalogoActivo && catalogoSlug && (
            <div style={sectionS}>
              <div style={sectionHeaderS}>
                <LayoutGrid size={18} color="#7170ff" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>Productos del Catálogo</div>
                  <div style={{ fontSize: 11, color: "#62666d" }}>
                    {productos.filter(p => p.visible_en_catalogo).length} de {productos.length} productos visibles
                  </div>
                </div>
              </div>
              {loadingProds ? (
                <div style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>
                  <Loader2 size={20} className="animate-spin" style={{ display: "inline", animation: "spin 1s linear infinite" }} /> Cargando...
                </div>
              ) : productos.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>
                  No hay productos. Creá productos primero en la sección Catálogo &gt; Productos.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["", "Producto", "Precio", "En catálogo", "Destacado", "Precio oferta"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map(prod => (
                      <tr key={prod.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 12px", width: 36 }}>
                          {prod.imagen_url ? (
                            <img src={prod.imagen_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📦</div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{prod.nombre}</div>
                          {prod.categoria && <div style={{ fontSize: 10, color: "#62666d" }}>{prod.categoria}</div>}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#d0d6e0", fontWeight: 600 }}>
                          {fmt(prod.precio)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <button
                            onClick={() => toggleProducto(prod, "visible_en_catalogo")}
                            style={toggleS(prod.visible_en_catalogo)}
                          >
                            <div style={toggleDotS(prod.visible_en_catalogo)} />
                          </button>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {prod.visible_en_catalogo && (
                            <button
                              onClick={() => toggleProducto(prod, "destacado_en_catalogo")}
                              style={toggleS(prod.destacado_en_catalogo)}
                            >
                              <div style={toggleDotS(prod.destacado_en_catalogo)} />
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {prod.visible_en_catalogo ? (
                            <input
                              type="number"
                              value={prod.precio_oferta ?? ""}
                              onChange={e => updatePrecioOferta(prod, e.target.value)}
                              placeholder="Sin oferta"
                              style={{ ...inputS, width: 120 }}
                            />
                          ) : (
                            <span style={{ fontSize: 11, color: "#62666d" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper: Parent Category Select ───────────────────────────────────────────
function ParentSelect({ value, onChange, categories, excludeId }: {
  value: number | null;
  onChange: (v: number | null) => void;
  categories: Categoria[];
  excludeId?: number;
  authFetch?: (url: string, opts?: RequestInit) => Promise<Response>;
}) {
  // Flatten categories for the dropdown
  const flat = flattenCats(categories);
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value === "" ? null : parseInt(e.target.value))}
      style={{ ...selectS, width: "100%" }}
    >
      <option value="">Sin categoría padre (raíz)</option>
      {flat.filter(c => c.id !== excludeId).map(c => (
        <option key={c.id} value={c.id} style={{ paddingLeft: c.depth * 12 }}>
          {"  ".repeat(c.depth)}{c.depth > 0 ? "└─ " : ""}{c.nombre}
        </option>
      ))}
    </select>
  );
}

function flattenCats(cats: Categoria[], depth = 0): { id: number; nombre: string; depth: number }[] {
  const result: { id: number; nombre: string; depth: number }[] = [];
  for (const c of cats) {
    result.push({ id: c.id, nombre: c.nombre, depth });
    if (c.hijos && c.hijos.length > 0) {
      result.push(...flattenCats(c.hijos, depth + 1));
    }
  }
  return result;
}
