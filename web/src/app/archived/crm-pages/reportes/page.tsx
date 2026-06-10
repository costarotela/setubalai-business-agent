"use client";
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, BarChart2, Users, DollarSign,
  AlertCircle, Calendar, Download, Package, Trophy
} from "lucide-react";

const API = "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
};

const MES_NAMES: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

// ─── KPI Card ───────────────────────────────────────────────────────────────
function KPI({ title, value, sub, trend, icon: Icon, color }: any) {
  const up = trend >= 0;
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "20px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.6px" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "#8a8f98", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 5, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {up ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
          <span style={{ fontSize: 12, color: up ? "#10b981" : "#ef4444", fontWeight: 500 }}>
            {up ? "+" : ""}{trend?.toFixed(1)}% vs mes anterior
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Barra Horizontal ───────────────────────────────────────────────────────
function BarraHorizontal({ label, value, max, color }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#d0d6e0" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8" }}>{fmt(value)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Gráfico de barras verticales SVG ───────────────────────────────────────
function GraficoEvolucion({ data }: { data: any[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 10 }}>
        <BarChart2 size={32} color="#2a2d35" />
        <span style={{ color: "#62666d", fontSize: 13 }}>Datos no disponibles</span>
        <span style={{ color: "#3a3d45", fontSize: 11 }}>El endpoint de evolución mensual aún no está activo</span>
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap(d => [d.cobrado || 0, d.pendiente || 0]), 1);
  const chartH = 160;
  const barW = 28;
  const gap = 16;
  const totalW = data.length * (barW * 2 + gap + 12);
  const padL = 52;
  const padB = 36;
  const padT = 16;

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={Math.max(totalW + padL + 20, 500)}
        height={chartH + padB + padT}
        style={{ display: "block" }}
      >
        {/* Eje Y ticks */}
        {yTicks.map((t, i) => {
          const y = padT + chartH - t * chartH;
          return (
            <g key={i}>
              <line
                x1={padL - 4} y1={y}
                x2={padL + totalW} y2={y}
                stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={9} fill="#62666d">
                {fmtShort(t * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Eje X línea base */}
        <line
          x1={padL} y1={padT + chartH}
          x2={padL + totalW} y2={padT + chartH}
          stroke="rgba(255,255,255,0.08)" strokeWidth={1}
        />

        {/* Barras */}
        {data.map((d, i) => {
          const x = padL + i * (barW * 2 + gap + 12);
          const hCob = ((d.cobrado || 0) / maxVal) * chartH;
          const hPen = ((d.pendiente || 0) / maxVal) * chartH;
          const label = d.mes
            ? MES_NAMES[d.mes.split("-")[1]] || d.mes
            : `M${i + 1}`;
          return (
            <g key={i}>
              {/* Barra cobrado (verde) */}
              <rect
                x={x} y={padT + chartH - hCob}
                width={barW} height={Math.max(hCob, 2)}
                rx={3} fill="#10b981" fillOpacity={0.85}
              />
              {/* Tooltip value cobrado */}
              {hCob > 18 && (
                <text x={x + barW / 2} y={padT + chartH - hCob - 4} textAnchor="middle" fontSize={8} fill="#10b981">
                  {fmtShort(d.cobrado || 0)}
                </text>
              )}

              {/* Barra pendiente (amarilla) */}
              <rect
                x={x + barW + 4} y={padT + chartH - hPen}
                width={barW} height={Math.max(hPen, 2)}
                rx={3} fill="#f59e0b" fillOpacity={0.75}
              />
              {hPen > 18 && (
                <text x={x + barW + 4 + barW / 2} y={padT + chartH - hPen - 4} textAnchor="middle" fontSize={8} fill="#f59e0b">
                  {fmtShort(d.pendiente || 0)}
                </text>
              )}

              {/* Label mes eje X */}
              <text
                x={x + barW + 2} y={padT + chartH + 16}
                textAnchor="middle" fontSize={10} fill="#8a8f98"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Leyenda */}
        <g transform={`translate(${padL}, ${padT + chartH + 28})`}>
          <rect width={10} height={10} rx={2} fill="#10b981" fillOpacity={0.85} />
          <text x={14} y={9} fontSize={10} fill="#8a8f98">Cobrado</text>
          <rect x={72} width={10} height={10} rx={2} fill="#f59e0b" fillOpacity={0.75} />
          <text x={86} y={9} fontSize={10} fill="#8a8f98">Pendiente</text>
        </g>
      </svg>
    </div>
  );
}

// ─── Productos más vendidos ──────────────────────────────────────────────────
const BADGE_COLORS: Record<number, { bg: string; color: string; label: string }> = {
  0: { bg: "rgba(255,196,0,0.15)", color: "#ffc400", label: "🥇" },
  1: { bg: "rgba(168,168,168,0.15)", color: "#a8a8a8", label: "🥈" },
  2: { bg: "rgba(176,107,41,0.15)", color: "#b06b29", label: "🥉" },
};

function ProductosTop({ data }: { data: any[] | null }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
        <Package size={28} color="#2a2d35" />
        <span style={{ color: "#62666d", fontSize: 13 }}>Sin datos de productos</span>
        <span style={{ color: "#3a3d45", fontSize: 11 }}>El endpoint de productos aún no está activo</span>
      </div>
    );
  }

  return (
    <div>
      {data.map((p, i) => {
        const badge = BADGE_COLORS[i];
        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 0",
            borderBottom: i < data.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          }}>
            {/* Rank badge */}
            <div style={{
              minWidth: 32, height: 32, borderRadius: 8,
              background: badge ? badge.bg : "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: badge ? 16 : 12,
              color: badge ? badge.color : "#62666d",
              fontWeight: 700,
            }}>
              {badge ? badge.label : `#${i + 1}`}
            </div>

            {/* Nombre */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#d0d6e0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.nombre || p.producto || "Sin nombre"}
              </div>
              <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>
                {p.cantidad || p.qty || 0} unidades vendidas
              </div>
            </div>

            {/* Monto */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8", flexShrink: 0 }}>
              {fmt(p.monto_total || p.total || p.valor || 0)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ReportesPage() {
  const [dash, setDash] = useState<any>(null);
  const [semanal, setSemanal] = useState<any>(null);
  const [top, setTop] = useState<any[]>([]);
  const [evolucion, setEvolucion] = useState<any[] | null>(null);
  const [productos, setProductos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    // Fetches principales (críticos)
    const fetchMain = Promise.all([
      fetch(`${API}/reportes/dashboard`).then(r => r.json()),
      fetch(`${API}/reportes/resumen-semanal`).then(r => r.json()).catch(() => null),
      fetch(`${API}/reportes/top-clientes`).then(r => r.json()).catch(() => ({ top: [] })),
    ]).then(([d, s, t]) => {
      setDash(d);
      setSemanal(s);
      setTop(t?.top || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fetches opcionales (no críticos — errores manejados individualmente)
    fetch(`${API}/reportes/evolucion-mensual?meses=6`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const arr = data?.evolucion || data?.data || data?.meses || (Array.isArray(data) ? data : null);
        setEvolucion(arr);
      })
      .catch(() => setEvolucion(null));

    fetch(`${API}/reportes/productos-top?limit=5`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        const arr = data?.productos || data?.top || data?.items || (Array.isArray(data) ? data : null);
        setProductos(arr);
      })
      .catch(() => setProductos(null));

    void fetchMain;
  }, []);

  const handleExportar = useCallback(async () => {
    if (exportando) return;
    setExportando(true);
    try {
      const resp = await fetch(`${API}/cobros/exportar-csv`);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "facturas.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando CSV:", err);
      alert("No se pudo exportar el archivo. Intenta nuevamente.");
    } finally {
      setExportando(false);
    }
  }, [exportando]);

  if (loading || !dash) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(113,112,255,0.2)", borderTopColor: "#7170ff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: "#62666d", fontSize: 14 }}>Cargando reportes...</div>
        </div>
      </div>
    );
  }

  const maxTop = top[0]?.valor_total || 1;
  const periodoLabel = dash.periodo
    ? new Date(dash.periodo + (dash.periodo.length === 7 ? "-01" : ""))
        .toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>
            Reportes y KPIs
          </h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 6, marginBottom: 0 }}>
            Período: <span style={{ color: "#8a8f98", textTransform: "capitalize" }}>{periodoLabel}</span>
          </p>
        </div>

        <button
          onClick={handleExportar}
          disabled={exportando}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px",
            background: exportando ? "rgba(113,112,255,0.1)" : "rgba(113,112,255,0.12)",
            border: "1px solid rgba(113,112,255,0.3)",
            borderRadius: 8,
            color: exportando ? "#62666d" : "#7170ff",
            fontSize: 13, fontWeight: 600,
            cursor: exportando ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          <Download size={15} />
          {exportando ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <KPI
          title="Cobrado este mes"
          value={fmt(dash.cobrado_este_mes)}
          sub="ingresos confirmados"
          trend={dash.variacion_pct}
          icon={DollarSign}
          color="#10b981"
        />
        <KPI
          title="Pendiente de cobro"
          value={fmt(dash.pendiente_cobro)}
          sub="en curso"
          icon={AlertCircle}
          color="#f59e0b"
        />
        <KPI
          title="Clientes activos"
          value={dash.clientes_activos}
          sub={`${dash.clientes_nuevos_mes ?? 0} nuevos este mes`}
          icon={Users}
          color="#7170ff"
        />
        <KPI
          title="Mes anterior"
          value={fmt(dash.cobrado_mes_pasado)}
          sub="referencia"
          icon={Calendar}
          color="#62666d"
        />
      </div>

      {/* ── Gráfico evolución mensual ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <BarChart2 size={16} color="#7170ff" />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
            Evolución mensual (últimos 6 meses)
          </h2>
        </div>
        <GraficoEvolucion data={evolucion} />
      </div>

      {/* ── Top Clientes + Productos más vendidos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* Top clientes */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Users size={16} color="#7170ff" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>Top clientes por valor</h2>
          </div>
          {top.length === 0 ? (
            <p style={{ color: "#62666d", fontSize: 13 }}>Sin datos disponibles</p>
          ) : (
            top.slice(0, 5).map((c, i) => (
              <BarraHorizontal
                key={i}
                label={c.nombre}
                value={c.valor_total}
                max={maxTop}
                color={["#7170ff", "#10b981", "#f59e0b", "#5e6ad2", "#ef4444"][i] || "#7170ff"}
              />
            ))
          )}
        </div>

        {/* Productos más vendidos */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Trophy size={16} color="#7170ff" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>Productos más vendidos</h2>
          </div>
          <ProductosTop data={productos} />
        </div>
      </div>

      {/* ── Resumen semanal ── */}
      {semanal && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Calendar size={16} color="#7170ff" />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>Resumen últimos 7 días</h2>
            {semanal.periodo && (
              <span style={{ fontSize: 11, color: "#62666d", marginLeft: "auto" }}>{semanal.periodo}</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[
              { label: "Cobrado", value: fmt(semanal.cobrado), color: "#10b981" },
              { label: "Facturas emitidas", value: semanal.facturas_emitidas, color: "#7170ff" },
              { label: "Clientes nuevos", value: semanal.clientes_nuevos, color: "#f59e0b" },
              { label: "Facturas vencidas", value: semanal.facturas_vencidas, color: "#ef4444" },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: "-0.4px" }}>
                  {item.value ?? "—"}
                </div>
                <div style={{ fontSize: 11, color: "#62666d", marginTop: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
