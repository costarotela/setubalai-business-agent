"use client";
import { useState, useEffect } from "react";
import { Wrench, Plus, Search, Clock, DollarSign, Star } from "lucide-react";

const API = "/api";
const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const PRECIO_TIPO_LABEL: Record<string, string> = {
  unico: "Precio fijo", mensual: "/ mes", por_hora: "/ hora", anual: "/ año",
};
const PRECIO_TIPO_COLOR: Record<string, string> = {
  unico: "#7170ff", mensual: "#10b981", por_hora: "#f59e0b", anual: "#5e6ad2",
};

// Imágenes Unsplash para servicios
const SERVICE_IMAGE: Record<string, string> = {
  "Consultor":  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80",
  "Instalac":   "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
  "Setup":      "https://images.unsplash.com/photo-1593640408182-31c228b303be?w=400&q=80",
  "Mantenim":   "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  "Capacit":    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80",
  "Red":        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
  "Recuper":    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80",
  "Soporte":    "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80",
};

function getImage(nombre: string): string {
  const key = Object.keys(SERVICE_IMAGE).find(k => nombre.toLowerCase().includes(k.toLowerCase()));
  return key ? SERVICE_IMAGE[key] : "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80";
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", descripcion: "", precio: "", precio_tipo: "unico",
  });

  const cargar = () => {
    setLoading(true);
    fetch(`${API}/productos/?tipo_filtro=servicio`)
      .then(r => r.json())
      .then(d => {
        const todos = d.productos || [];
        setServicios(todos.filter((p: any) => p.tipo === "servicio"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre || !form.precio) return;
    setSaving(true);
    await fetch(`${API}/productos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tipo: "servicio", precio: parseFloat(form.precio), empresa_id: 1, control_stock: false }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ nombre: "", descripcion: "", precio: "", precio_tipo: "unico" });
    cargar();
  };

  const filtrados = servicios.filter(s =>
    !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.descripcion || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, fontSize: 11, color: "#62666d", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Servicios</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 6, margin: "6px 0 0" }}>
            {filtrados.length} servicios en catálogo
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Nuevo servicio
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: Wrench, label: "Total servicios", val: servicios.length, color: "#7170ff" },
          { icon: DollarSign, label: "Precio promedio", val: fmt(servicios.reduce((s, x) => s + x.precio, 0) / (servicios.length || 1)), color: "#10b981" },
          { icon: Clock, label: "Con precio/hora", val: servicios.filter(s => s.precio_tipo === "por_hora").length, color: "#f59e0b" },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.4px" }}>{val}</div>
              <div style={{ fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar servicio..." style={{ ...inputStyle, paddingLeft: 36, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(113,112,255,0.25)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#d0d6e0", marginBottom: 16 }}>Nuevo servicio</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Consultoría de Sistemas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Precio (USD) *</label>
              <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Modalidad</label>
              <select value={form.precio_tipo} onChange={e => setForm({ ...form, precio_tipo: e.target.value })} style={inputStyle}>
                <option value="unico">Precio fijo</option>
                <option value="por_hora">Por hora</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del servicio..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={guardar} disabled={saving || !form.nombre || !form.precio} style={{ padding: "9px 20px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !form.nombre || !form.precio ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar servicio"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 16px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid de servicios */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#62666d", fontSize: 13 }}>Cargando servicios...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtrados.map(s => {
            const color = PRECIO_TIPO_COLOR[s.precio_tipo] || "#7170ff";
            return (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                {/* Imagen */}
                <div style={{ height: 140, overflow: "hidden", position: "relative", background: "#0f1011" }}>
                  <img
                    src={getImage(s.nombre)}
                    alt={s.nombre}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                    onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80"; }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,16,17,0.8) 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", top: 10, left: 10 }}>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${color}cc`, color: "white" }}>
                      {PRECIO_TIPO_LABEL[s.precio_tipo] || "Servicio"}
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: "16px 18px" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: "0 0 6px" }}>{s.nombre}</h3>
                  {s.descripcion && (
                    <p style={{ fontSize: 12, color: "#8a8f98", margin: "0 0 14px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.descripcion}</p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.4px" }}>{fmt(s.precio)}</span>
                      <span style={{ fontSize: 12, color: color, marginLeft: 6, fontWeight: 500 }}>
                        {PRECIO_TIPO_LABEL[s.precio_tipo]}
                      </span>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Star size={14} color={color} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
