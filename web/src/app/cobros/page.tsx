"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth-context";
import {
  CheckCircle, Clock, AlertTriangle, Download, Plus, X,
  FileText, Trash2, CreditCard,
} from "lucide-react";

const API = "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (s: string | null | undefined) => s?.slice(0, 10) || "—";

const defaultVenc = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Factura {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  empresa_nombre?: string;
  total: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
}

interface PagoHistorial {
  id: number;
  cliente_nombre: string;
  empresa_nombre?: string;
  total: number;
  fecha_pago: string;
  metodo_pago: string;
}

interface Cliente {
  id: number;
  nombre: string;
  empresa_nombre?: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precio_venta?: number;
}

interface Item {
  producto_id: number | "";
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, color, icon: Icon }: {
  title: string; value: string; sub?: string; color: string; icon: React.FC<any>;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#62666d", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.5px" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "#8a8f98", marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

// ─── Estado Badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pendiente: { label: "Pendiente", color: "#f59e0b" },
    vencida:   { label: "Vencida",   color: "#ef4444" },
    pagada:    { label: "Pagada",    color: "#10b981" },
  };
  const e = map[estado?.toLowerCase()] || { label: estado, color: "#8a8f98" };
  return (
    <span style={{
      fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 600,
      background: `${e.color}15`, color: e.color, border: `1px solid ${e.color}30`,
    }}>
      {e.label}
    </span>
  );
}

// ─── MetodoBadge ──────────────────────────────────────────────────────────────

function MetodoBadge({ metodo }: { metodo: string }) {
  const label = metodo || "—";
  return (
    <span style={{
      fontSize: 11, padding: "3px 9px", borderRadius: 6, fontWeight: 500,
      background: "rgba(113,112,255,0.12)", color: "#7170ff",
      border: "1px solid rgba(113,112,255,0.25)",
    }}>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CobrosPage() {
  const { token } = useAuth();

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Tabla principal
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [historial, setHistorial] = useState<PagoHistorial[]>([]);
  const [loadingTabla, setLoadingTabla] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [filtroCliente, setFiltroCliente] = useState<string>("");

  // Historial inferior
  const [historialReciente, setHistorialReciente] = useState<PagoHistorial[]>([]);

  // Pagar
  const [pagando, setPagando] = useState<number | null>(null);

  // Descargar recibo
  const [descargando, setDescargando] = useState<number | null>(null);

  // Modal nueva factura
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({
    cliente_id: "",
    fecha_vencimiento: defaultVenc(),
    notas: "",
  });
  const [items, setItems] = useState<Item[]>([
    { producto_id: "", nombre: "", cantidad: 1, precio_unitario: 0 },
  ]);
  const [creando, setCreando] = useState(false);

  // ── Cargar stats + historial reciente (siempre) ──────────────────────────

  const cargarStats = useCallback(() => {
    fetch(`${API}/cobros/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const cargarHistorialReciente = useCallback(() => {
    fetch(`${API}/cobros/historial?limit=10`)
      .then(r => r.json())
      .then(d => setHistorialReciente(d?.pagos || d?.historial || []))
      .catch(() => {});
  }, []);

  // ── Cargar tabla según filtros ────────────────────────────────────────────

  const cargarTabla = useCallback(() => {
    setLoadingTabla(true);

    const clienteParam = filtroCliente ? `&cliente_id=${filtroCliente}` : "";

    if (filtroEstado === "pagada") {
      // Historial de pagados
      fetch(`${API}/cobros/historial?limit=200${clienteParam}`)
        .then(r => r.json())
        .then(d => {
          setHistorial(d?.pagos || d?.historial || []);
          setFacturas([]);
          setLoadingTabla(false);
        })
        .catch(() => setLoadingTabla(false));
    } else {
      // Pendientes + vencidas
      const estadoParam = filtroEstado ? `&estado=${filtroEstado}` : "";
      Promise.all([
        fetch(`${API}/cobros/pendientes?limit=200${clienteParam}`).then(r => r.json()),
        fetch(`${API}/cobros/vencidas?limit=200${clienteParam}`).then(r => r.json()),
      ]).then(([p, v]) => {
        const pendientes: Factura[] = (p?.facturas || []).map((f: any) => ({ ...f, cliente_nombre: f.cliente || f.cliente_nombre, estado: f.estado || "pendiente" }));
        const vencidas: Factura[] = (v?.vencidas || []).map((f: any) => ({ ...f, cliente_nombre: f.cliente || f.cliente_nombre, estado: "vencida" }));

        // Merge: vencidas first, dedup pendientes que ya están en vencidas
        const ids = new Set(vencidas.map(f => f.id));
        const merged: Factura[] = [
          ...vencidas,
          ...pendientes.filter(f => !ids.has(f.id)),
        ];

        let resultado = merged;
        if (filtroEstado === "pendiente") resultado = merged.filter(f => f.estado !== "vencida");
        if (filtroEstado === "vencida")   resultado = merged.filter(f => f.estado === "vencida");

        setFacturas(resultado);
        setHistorial([]);
        setLoadingTabla(false);
      }).catch(() => setLoadingTabla(false));
    }
  }, [filtroEstado, filtroCliente]);

  // ── Cargar catálogos para modal ───────────────────────────────────────────

  const cargarCatalogos = useCallback(() => {
    fetch(`${API}/clientes?limit=200`)
      .then(r => r.json())
      .then(d => setClientes(d?.clientes || []))
      .catch(() => {});
    fetch(`${API}/productos`)
      .then(r => r.json())
      .then(d => setProductos(d?.productos || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargarStats();
    cargarHistorialReciente();
    cargarCatalogos();
  }, [cargarStats, cargarHistorialReciente, cargarCatalogos]);

  useEffect(() => {
    cargarTabla();
  }, [cargarTabla]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  const marcarPagado = async (id: number) => {
    setPagando(id);
    try {
      await fetch(`${API}/cobros/${id}/pagar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ metodo_pago: "transferencia" }),
      });
      cargarTabla();
      cargarStats();
      cargarHistorialReciente();
    } finally {
      setPagando(null);
    }
  };

  const descargarRecibo = async (id: number) => {
    setDescargando(id);
    try {
      const res = await fetch(`${API}/cobros/${id}/recibo`);
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencio
    } finally {
      setDescargando(null);
    }
  };

  const exportarCSV = async () => {
    try {
      const res = await fetch(`${API}/cobros/exportar-csv`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cobros.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencio
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const totalModal = items.reduce((s, it) => s + (it.cantidad || 0) * (it.precio_unitario || 0), 0);

  const agregarItem = () =>
    setItems(prev => [...prev, { producto_id: "", nombre: "", cantidad: 1, precio_unitario: 0 }]);

  const eliminarItem = (idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const actualizarItem = (idx: number, campo: keyof Item, valor: any) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, [campo]: valor };
      if (campo === "producto_id") {
        const prod = productos.find(p => p.id === Number(valor));
        if (prod) {
          updated.nombre = prod.nombre;
          updated.precio_unitario = prod.precio ?? prod.precio_venta ?? 0;
        }
      }
      return updated;
    }));
  };

  const crearFactura = async () => {
    if (!form.cliente_id || items.length === 0) return;
    setCreando(true);
    try {
      const body = {
        cliente_id: Number(form.cliente_id),
        fecha_vencimiento: form.fecha_vencimiento,
        notas: form.notas,
        items: items
          .filter(it => it.producto_id !== "" && it.cantidad > 0)
          .map(it => ({
            producto_id: Number(it.producto_id),
            cantidad: it.cantidad,
            precio_unitario: it.precio_unitario,
          })),
      };
      await fetch(`${API}/cobros/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setShowModal(false);
      setForm({ cliente_id: "", fecha_vencimiento: defaultVenc(), notas: "" });
      setItems([{ producto_id: "", nombre: "", cantidad: 1, precio_unitario: 0 }]);
      cargarTabla();
      cargarStats();
    } finally {
      setCreando(false);
    }
  };

  // ── Estilos compartidos ───────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 11px", borderRadius: 6, fontSize: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f7f8f8", outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 10, color: "#62666d", marginBottom: 4,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
  };

  const selectFilterStyle: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 7, fontSize: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#d0d6e0", outline: "none", cursor: "pointer",
  };

  // ── Pendientes o vencidas (tabla principal cuando no filtramos pagadas) ────

  const mostrandoHistorial = filtroEstado === "pagada";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1160 }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Cobros</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 5, marginBottom: 0 }}>Gestión de facturas y pagos</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={exportarCSV}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            <Download size={13} /> Exportar CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", background: "#7170ff", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={14} /> Nueva Factura
          </button>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard
          title="Cobrado este mes"
          value={fmt(stats?.cobrado_este_mes)}
          color="#10b981"
          icon={CheckCircle}
        />
        <StatCard
          title="Pendiente total"
          value={fmt(stats?.pendiente_total)}
          sub={stats?.pendiente_count != null ? `${stats.pendiente_count} facturas` : undefined}
          color="#f59e0b"
          icon={Clock}
        />
        <StatCard
          title="Vencido"
          value={fmt(stats?.vencido_total)}
          sub={stats?.vencido_count > 0 ? `${stats.vencido_count} en mora` : "Sin mora"}
          color="#ef4444"
          icon={AlertTriangle}
        />
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={selectFilterStyle}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencida">Vencida</option>
          <option value="pagada">Pagada</option>
        </select>

        <select
          value={filtroCliente}
          onChange={e => setFiltroCliente(e.target.value)}
          style={{ ...selectFilterStyle, minWidth: 180 }}
        >
          <option value="">Todos los clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.empresa_nombre ? `${c.empresa_nombre} (${c.nombre})` : c.nombre}
            </option>
          ))}
        </select>

        {(filtroEstado || filtroCliente) && (
          <button
            onClick={() => { setFiltroEstado(""); setFiltroCliente(""); }}
            style={{ padding: "7px 13px", borderRadius: 7, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#8a8f98", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            <X size={12} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla principal ───────────────────────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>
            {mostrandoHistorial ? "Historial de pagos" : "Facturas pendientes y vencidas"}
          </div>
          <div style={{ fontSize: 12, color: "#62666d" }}>
            {mostrandoHistorial ? historial.length : facturas.length} registros
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              {["#", "Cliente", "Monto", "Emisión", mostrandoHistorial ? "Fecha pago" : "Vencimiento", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loadingTabla ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>Cargando...</td></tr>
            ) : mostrandoHistorial ? (
              historial.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>
                  Sin pagos registrados
                </td></tr>
              ) : historial.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#62666d", fontWeight: 500 }}>#{p.id}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{p.cliente_nombre}</div>
                    {p.empresa_nombre && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>{p.empresa_nombre}</div>}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{fmt(p.total)}</div>
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#8a8f98" }}>
                    {fmtDate(p.fecha_emision)}
                  </td>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: "#8a8f98" }}>
                    {fmtDate(p.fecha_pago)}
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <EstadoBadge estado="pagada" />
                  </td>
                  <td style={{ padding: "13px 20px" }}>
                    <button
                      onClick={() => descargarRecibo(p.id)}
                      disabled={descargando === p.id}
                      title="Descargar recibo PDF"
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 9px", color: "#8a8f98", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <FileText size={13} /> {descargando === p.id ? "..." : "PDF"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              facturas.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#62666d", fontSize: 13 }}>
                  <CheckCircle size={20} color="#10b981" style={{ display: "block", margin: "0 auto 8px" }} />
                  Sin facturas pendientes
                </td></tr>
              ) : facturas.map((f) => {
                const esPendiente = f.estado !== "vencida";
                return (
                  <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "13px 20px", fontSize: 12, color: "#62666d", fontWeight: 500 }}>#{f.id}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{f.cliente_nombre}</div>
                      {f.empresa_nombre && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>{f.empresa_nombre}</div>}
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: f.estado === "vencida" ? "#ef4444" : "#f7f8f8" }}>{fmt(f.total)}</div>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 12, color: "#8a8f98" }}>
                      {fmtDate(f.fecha_emision)}
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 12, color: f.estado === "vencida" ? "#ef4444" : "#8a8f98" }}>
                      {fmtDate(f.fecha_vencimiento)}
                      {f.estado === "vencida" && <div style={{ fontSize: 10, color: "#ef4444", marginTop: 2, fontWeight: 700 }}>VENCIDA</div>}
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <EstadoBadge estado={f.estado} />
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          onClick={() => marcarPagado(f.id)}
                          disabled={pagando === f.id}
                          style={{ padding: "5px 12px", background: "#10b98120", color: "#10b981", border: "1px solid #10b98140", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          {pagando === f.id ? "..." : "Marcar pagado"}
                        </button>
                        <button
                          onClick={() => descargarRecibo(f.id)}
                          disabled={descargando === f.id}
                          title="Descargar recibo"
                          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 9px", color: "#8a8f98", cursor: "pointer", display: "flex", alignItems: "center" }}
                        >
                          <FileText size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Historial reciente (siempre visible) ──────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
          <CreditCard size={14} color="#7170ff" />
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Últimos pagos recibidos</div>
        </div>
        {historialReciente.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "#62666d" }}>Sin pagos recientes</div>
        ) : (
          <div style={{ padding: "8px 0" }}>
            {historialReciente.map((p: any) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "10px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{p.cliente_nombre}</div>
                  {p.empresa_nombre && <div style={{ fontSize: 11, color: "#62666d", marginTop: 1 }}>{p.empresa_nombre}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981", marginRight: 20 }}>{fmt(p.total)}</div>
                <div style={{ fontSize: 12, color: "#8a8f98", marginRight: 14 }}>{fmtDate(p.fecha_pago)}</div>
                <MetodoBadge metodo={p.metodo_pago} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Nueva Factura ───────────────────────────────────────────── */}
      {showModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div style={{ background: "#0f1012", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto" }}>

            {/* Header modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>Nueva Factura</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px 24px" }}>

              {/* Cliente */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Cliente *</label>
                <select
                  value={form.cliente_id}
                  onChange={e => setForm({ ...form, cliente_id: e.target.value })}
                  style={{ ...inputStyle }}
                >
                  <option value="">— Seleccionar cliente —</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.empresa_nombre ? `${c.empresa_nombre} — ${c.nombre}` : c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha vencimiento */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Fecha de vencimiento</label>
                <input
                  type="date"
                  value={form.fecha_vencimiento}
                  onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>

              {/* Notas */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Notas (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Detalles adicionales..."
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Ítems */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Ítems</label>
                  <button
                    onClick={agregarItem}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", background: "rgba(113,112,255,0.12)", border: "1px solid rgba(113,112,255,0.25)", borderRadius: 6, color: "#7170ff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                  >
                    <Plus size={12} /> Agregar ítem
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 90px 28px", gap: 6, marginBottom: 8, alignItems: "end" }}>
                    {/* Producto select */}
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, marginBottom: 3 }}>Producto</label>}
                      <select
                        value={it.producto_id}
                        onChange={e => actualizarItem(idx, "producto_id", e.target.value)}
                        style={{ ...inputStyle }}
                      >
                        <option value="">— Producto —</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre} ({fmt(p.precio ?? p.precio_venta ?? 0)})</option>
                        ))}
                      </select>
                    </div>
                    {/* Cantidad */}
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, marginBottom: 3 }}>Cant.</label>}
                      <input
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={e => actualizarItem(idx, "cantidad", Number(e.target.value))}
                        style={{ ...inputStyle }}
                      />
                    </div>
                    {/* Precio unitario */}
                    <div>
                      {idx === 0 && <label style={{ ...labelStyle, marginBottom: 3 }}>P. unitario</label>}
                      <input
                        type="number"
                        min={0}
                        value={it.precio_unitario}
                        onChange={e => actualizarItem(idx, "precio_unitario", Number(e.target.value))}
                        style={{ ...inputStyle }}
                      />
                    </div>
                    {/* Eliminar */}
                    <div style={{ display: "flex", alignItems: idx === 0 ? "flex-end" : "center", paddingBottom: idx === 0 ? 1 : 0 }}>
                      <button
                        onClick={() => eliminarItem(idx)}
                        style={{ background: "transparent", border: "none", color: "#62666d", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                        title="Eliminar ítem"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 12, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 12, color: "#8a8f98" }}>Total estimado:</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.3px" }}>{fmt(totalModal)}</span>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ padding: "9px 18px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, fontSize: 13, cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={crearFactura}
                  disabled={creando || !form.cliente_id || items.every(it => it.producto_id === "")}
                  style={{ padding: "9px 20px", background: "#7170ff", color: "white", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: creando || !form.cliente_id ? 0.6 : 1 }}
                >
                  {creando ? "Creando..." : "Crear Factura"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
