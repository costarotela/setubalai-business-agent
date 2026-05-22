"use client";
import { useState, useEffect } from "react";
import { Package, AlertTriangle, Tag, Search, Grid, List } from "lucide-react";

const API = "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

// Colores por CATEGORIA real de la DB
const CAT_COLOR: Record<string, string> = {
  "Computadoras":       "#06b6d4",
  "Electrodomésticos":  "#10b981",
  "Audio y Video":      "#f59e0b",
  "Celulares":          "#5e6ad2",
  "Gaming":             "#ef4444",
  "Servicios":          "#8b5cf6",
};

function getCatColor(cat: string | null): string {
  if (!cat) return "#7170ff";
  const key = Object.keys(CAT_COLOR).find(k => cat.toLowerCase().includes(k.toLowerCase()));
  return key ? CAT_COLOR[key] : "#7170ff";
}

// Imágenes Unsplash por nombre de producto
const PRODUCT_IMAGE: Record<string, string> = {
  "MacBook":         "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
  "ASUS ROG":        "https://images.unsplash.com/photo-1593640408182-31c228b303be?w=400&q=80",
  "Dell XPS":        "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=400&q=80",
  "Workstation":     "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80",
  "Heladera":        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
  "Lavarropas":      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=80",
  "Aire Acondicionado": "https://images.unsplash.com/photo-1621776468860-72e665f00c26?w=400&q=80",
  "Samsung Neo":     "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=400&q=80",
  "Sony WH":         "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  "Sonos":           "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80",
  "iPhone":          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&q=80",
  "Samsung Galaxy":  "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
  "PlayStation":     "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&q=80",
  "Xbox":            "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&q=80",
  "Nintendo":        "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=400&q=80",
  "Consultor":       "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=80",
  "Instala":         "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
  "Setup":           "https://images.unsplash.com/photo-1593640408182-31c228b303be?w=400&q=80",
};

function getImage(nombre: string): string {
  const key = Object.keys(PRODUCT_IMAGE).find(k => nombre.toLowerCase().includes(k.toLowerCase()));
  return key ? PRODUCT_IMAGE[key] : "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80";
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [stockCritico, setStockCritico] = useState<any[]>([]);
  const [catFiltro, setCatFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"grid" | "lista">("grid");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/productos/`).then(r => r.json()),
      fetch(`${API}/productos/stock-critico`).then(r => r.json()),
    ]).then(([d, sc]) => {
      setProductos(d.productos || []);
      setStockCritico(sc.criticos || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Categorías únicas desde la DB
  const categorias = [...new Set(productos.map((p: any) => p.categoria).filter(Boolean))].sort();

  const filtrados = productos.filter(p => {
    const matchCat = !catFiltro || p.categoria === catFiltro;
    const matchBusq = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || "").toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ color: "#62666d", fontSize: 14 }}>Cargando productos...</div>
    </div>
  );

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Productos</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 6, marginBottom: 0 }}>
            {filtrados.length} de {productos.length} productos · {categorias.length} categorías
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {stockCritico.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8 }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>{stockCritico.length} stock crítico</span>
            </div>
          )}
          <button onClick={() => setVista("grid")} style={{ background: vista === "grid" ? "rgba(255,255,255,0.08)" : "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 10px", cursor: "pointer", color: vista === "grid" ? "#f7f8f8" : "#62666d" }}>
            <Grid size={15} />
          </button>
          <button onClick={() => setVista("lista")} style={{ background: vista === "lista" ? "rgba(255,255,255,0.08)" : "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "7px 10px", cursor: "pointer", color: vista === "lista" ? "#f7f8f8" : "#62666d" }}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Filtros: búsqueda + categorías desde DB */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar producto, categoría..."
            style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px 9px 36px", color: "#f7f8f8", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button onClick={() => setCatFiltro("")} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: !catFiltro ? "rgba(113,112,255,0.15)" : "transparent", color: !catFiltro ? "#7170ff" : "#8a8f98", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          Todos
        </button>
        {categorias.map(cat => {
          const color = getCatColor(cat);
          return (
            <button key={cat} onClick={() => setCatFiltro(catFiltro === cat ? "" : cat)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${color}30`, background: catFiltro === cat ? `${color}18` : "transparent", color: catFiltro === cat ? color : "#8a8f98", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
              <Tag size={11} style={{ marginRight: 5, display: "inline" }} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid de productos */}
      {vista === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtrados.map(p => {
            const critico = stockCritico.find((sc: any) => sc.id === p.id);
            const color = getCatColor(p.categoria);
            const stockPct = p.stock_actual != null && p.stock_minimo > 0
              ? Math.min((p.stock_actual / (p.stock_minimo * 3)) * 100, 100) : null;
            return (
              <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${critico ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ height: 150, overflow: "hidden", position: "relative", background: "#0f1011" }}>
                  <img
                    src={p.imagen_url || getImage(p.nombre)}
                    alt={p.nombre}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                    onError={(e: any) => { e.target.src = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"; }}
                  />
                  {p.categoria && (
                    <div style={{ position: "absolute", top: 10, left: 10 }}>
                      <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${color}cc`, color: "white", letterSpacing: "0.04em" }}>
                        {p.categoria}
                      </span>
                    </div>
                  )}
                  {critico && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <AlertTriangle size={16} color="#ef4444" />
                    </div>
                  )}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</h3>
                  {p.descripcion && (
                    <p style={{ fontSize: 11, color: "#62666d", margin: "0 0 12px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.descripcion}</p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.3px" }}>{fmt(p.precio)}</span>
                    {p.control_stock && p.stock_actual != null && (
                      <span style={{ fontSize: 11, color: critico ? "#ef4444" : "#8a8f98", fontWeight: 500 }}>
                        Stock: {p.stock_actual}
                      </span>
                    )}
                  </div>
                  {stockPct !== null && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${stockPct}%`, background: critico ? "#ef4444" : "#10b981", borderRadius: 2 }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Producto", "Categoría", "Precio", "Stock", "Estado"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => {
                const critico = stockCritico.find((sc: any) => sc.id === p.id);
                const color = getCatColor(p.categoria);
                return (
                  <tr key={p.id} style={{ borderBottom: i < filtrados.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{p.nombre}</div>
                      {p.descripcion && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>{p.descripcion?.slice(0, 60)}{p.descripcion?.length > 60 ? "…" : ""}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.categoria && (
                        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 11, background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 500 }}>
                          {p.categoria}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#f7f8f8" }}>{fmt(p.precio)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: critico ? "#ef4444" : "#8a8f98" }}>
                      {p.control_stock ? `${p.stock_actual} uds` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: critico ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: critico ? "#ef4444" : "#10b981", border: `1px solid ${critico ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}` }}>
                        {critico ? "Stock crítico" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
