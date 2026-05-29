"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, CheckCircle, Clock, ArrowUpRight } from "lucide-react";

const API = "/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

function KPICard({ title, value, sub, trend, color, icon: Icon }: any) {
  const up = trend > 0;
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "20px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#62666d", fontWeight: 500, marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.5px" }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "#8a8f98", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4 }}>
          {up ? <TrendingUp size={13} color="#10b981" /> : <TrendingDown size={13} color="#ef4444" />}
          <span style={{ fontSize: 12, color: up ? "#10b981" : "#ef4444" }}>
            {up ? "+" : ""}{trend?.toFixed(1)}% vs mes anterior
          </span>
        </div>
      )}
    </div>
  );
}

const ESTADO_COLOR: Record<string, string> = {
  activo: "#10b981", moroso: "#ef4444", prospecto: "#f59e0b", inactivo: "#62666d",
};
const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo", moroso: "Moroso", prospecto: "Prospecto", inactivo: "Inactivo",
};

export default function DashboardPage() {
  const router = useRouter();
  const [dash, setDash] = useState<any>(null);
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("setubalai_token_v2");
    if (!token) {
      router.push("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/reportes/dashboard`, { headers }).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/cobros/pendientes`, { headers }).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`${API}/clientes`, { headers }).then(r => r.ok ? r.json() : Promise.reject()),
    ]).then(([d, p, c]) => {
      setDash(d);
      setPendientes(p?.facturas?.slice(0, 5) || []);
      setClientes(c?.clientes?.slice(0, 5) || []);
      setLoading(false);
    }).catch(() => {
      localStorage.removeItem("setubalai_token_v2");
      router.push("/login");
    });
  }, [router]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ color: "#62666d", fontSize: 14 }}>Cargando...</div>
    </div>
  );

  const maxBar = Math.max(dash?.cobrado_este_mes || 1, dash?.pendiente_cobro || 1, 1);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#62666d", marginTop: 4 }}>Resumen del negocio en tiempo real</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        <KPICard
          title="Cobrado este mes"
          value={fmt(dash?.cobrado_este_mes)}
          trend={dash?.variacion_pct}
          color="#10b981"
          icon={DollarSign}
        />
        <KPICard
          title="Pendiente de cobro"
          value={fmt(dash?.pendiente_cobro)}
          sub={`${pendientes.length} facturas`}
          color="#f59e0b"
          icon={Clock}
        />
        <KPICard
          title="Clientes activos"
          value={dash?.clientes_activos ?? "—"}
          sub="Total en CRM"
          color="#7170ff"
          icon={Users}
        />
        <KPICard
          title="Tasa de cobro"
          value={dash?.cobrado_este_mes && dash?.pendiente_cobro
            ? `${Math.round(dash.cobrado_este_mes / (dash.cobrado_este_mes + dash.pendiente_cobro) * 100)}%`
            : "—"}
          sub="vs total facturado"
          color="#5e6ad2"
          icon={CheckCircle}
        />
      </div>

      {/* Gráfico + Pendientes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Mini chart */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0", marginBottom: 20 }}>Flujo de caja</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 100 }}>
            {[
              { label: "Cobrado", value: dash?.cobrado_este_mes || 0, color: "#10b981" },
              { label: "Pendiente", value: dash?.pendiente_cobro || 0, color: "#f59e0b" },
              { label: "Mes ant.", value: dash?.cobrado_mes_pasado || 0, color: "#5e6ad2" },
            ].map((bar) => (
              <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 10, color: "#62666d" }}>{fmt(bar.value)}</div>
                <div style={{
                  width: "100%", borderRadius: 4,
                  height: Math.max(8, (bar.value / maxBar) * 80),
                  background: bar.color, opacity: 0.85,
                }} />
                <div style={{ fontSize: 11, color: "#8a8f98" }}>{bar.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cobros pendientes */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Cobros pendientes</div>
            <AlertCircle size={14} color="#f59e0b" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendientes.length === 0 && <div style={{ fontSize: 12, color: "#62666d" }}>Sin facturas pendientes</div>}
            {pendientes.map((f: any) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#d0d6e0" }}>{f.cliente_nombre}</div>
                  <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>Fac. #{f.id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{fmt(f.total)}</div>
                  <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>{f.fecha_vencimiento?.slice(0,10)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientes recientes */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>Clientes</div>
          <a href="/clientes" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#7170ff" }}>
            Ver todos <ArrowUpRight size={12} />
          </a>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Cliente", "Empresa", "Estado", "Valor total"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "0 0 10px", fontSize: 11, color: "#62666d", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "12px 0", fontSize: 13, color: "#d0d6e0", fontWeight: 500 }}>{c.nombre}</td>
                <td style={{ padding: "12px 0", fontSize: 12, color: "#62666d" }}>{c.empresa_nombre || "—"}</td>
                <td style={{ padding: "12px 0" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 999,
                    background: `${ESTADO_COLOR[c.estado] || "#62666d"}18`,
                    color: ESTADO_COLOR[c.estado] || "#62666d",
                    border: `1px solid ${ESTADO_COLOR[c.estado] || "#62666d"}30`,
                  }}>
                    {ESTADO_LABEL[c.estado] || c.estado}
                  </span>
                </td>
                <td style={{ padding: "12px 0", fontSize: 13, color: "#f7f8f8", fontWeight: 600 }}>{fmt(c.valor_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
