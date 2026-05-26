"use client";
import { useAuthFetch } from "../auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Practica {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  medico_id: number;
  medico_nombre: string;
  tipo_practica: string;
  codigo_nomenclador: string;
  descripcion_nomenclador: string;
  precio_practica: number;
  coseguro_paciente: number;
  cobertura_obra_social: number;
  estado_facturacion: string;
  requiere_autorizacion: boolean;
  atencion_medica_id: number;
  created_at: string;
}

export default function PracticasPage() {
  const af = useAuthFetch();
  const router = useRouter();
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todas");

  useEffect(() => {
    af("/api/practicas_medicas/")
      .then(r => r.json())
      .then((data: Practica[]) => setPracticas(data))
      .catch(err => console.error("Error cargando prácticas:", err))
      .finally(() => setLoading(false));
  }, [af]);

  // Unique values for filters
  const tipos = Array.from(new Set(practicas.map(p => p.tipo_practica).filter(Boolean)));
  const estados = ["todas", "pendiente", "facturado"];

  const filtered = practicas.filter(p => {
    if (busqueda && !p.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !p.codigo_nomenclador.toLowerCase().includes(busqueda.toLowerCase()) &&
        !p.descripcion_nomenclador.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroEstado !== "todas" && p.estado_facturacion !== filtroEstado) return false;
    if (filtroTipo !== "todas" && p.tipo_practica !== filtroTipo) return false;
    return true;
  });

  const totalCobrado = filtered.filter(p => p.estado_facturacion === "facturado").reduce((s, p) => s + p.precio_practica, 0);
  const totalPendiente = filtered.filter(p => p.estado_facturacion === "pendiente").reduce((s, p) => s + p.precio_practica, 0);

  if (loading) return <div style={{ padding: "40px", color: "#62666d" }}>Cargando prácticas médicas...</div>;

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Prácticas Médicas</h1>
        <p style={{ color: "#62666d", margin: "4px 0 0" }}>Estudios, laboratorios y procedimientos realizados</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "linear-gradient(135deg, #0d3320 0%, #111214 100%)", borderRadius: 10, padding: 16, border: "1px solid rgba(34,197,94,0.15)" }}>
          <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 4 }}>FACTURADO</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e" }}>${totalCobrado.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#62666d" }}>{filtered.filter(p => p.estado_facturacion === "facturado").length} prácticas</div>
        </div>
        <div style={{ flex: 1, background: "linear-gradient(135deg, #3d2e0d 0%, #111214 100%)", borderRadius: 10, padding: 16, border: "1px solid rgba(245,158,11,0.15)" }}>
          <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 4 }}>PENDIENTE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>${totalPendiente.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#62666d" }}>{filtered.filter(p => p.estado_facturacion === "pendiente").length} prácticas</div>
        </div>
        <div style={{ flex: 1, background: "linear-gradient(135deg, #1a1a2e 0%, #111214 100%)", borderRadius: 10, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4 }}>TOTAL</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{filtered.length}</div>
          <div style={{ fontSize: 11, color: "#62666d" }}>prácticas encontradas</div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="🔍 Buscar paciente, código o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            flex: "1 1 250px", padding: "10px 16px",
            background: "#111214", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, color: "#e4e4e7", fontSize: 14
          }}
        />
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{
          padding: "10px 14px", background: "#111214", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, color: "#e4e4e7", fontSize: 13
        }}>
          <option value="todas">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{
          padding: "10px 14px", background: "#111214", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, color: "#e4e4e7", fontSize: 13
        }}>
          {estados.map(e => <option key={e} value={e}>{e === "todas" ? "Todos los estados" : e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      {/* TABLE */}
      <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  "Paciente", "Profesional", "Tipo", "Código", "Descripción",
                  "Precio", "Coseguro", "Cobertura", "Estado"
                ].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "10px 12px", fontSize: 11,
                    fontWeight: 600, color: "#62666d", textTransform: "uppercase",
                    letterSpacing: "0.05em", whiteSpace: "nowrap"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/historia-clinica?id=${p.paciente_id}`)}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(113,112,255,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{p.paciente_nombre}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#8a8f98" }}>{p.medico_nombre}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 11,
                      background: p.tipo_practica === "Laboratorio" ? "rgba(139,92,246,0.15)" :
                        p.tipo_practica === "Estudio" ? "rgba(59,130,246,0.15)" :
                        p.tipo_practica === "Consulta" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                      color: p.tipo_practica === "Laboratorio" ? "#8b5cf6" :
                        p.tipo_practica === "Estudio" ? "#3b82f6" :
                        p.tipo_practica === "Consulta" ? "#22c55e" : "#8a8f98"
                    }}>{p.tipo_practica || "—"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: "#7170ff" }}>{p.codigo_nomenclador || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.descripcion_nomenclador || "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#22c55e", fontWeight: 600 }}>${p.precio_practica.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#8a8f98" }}>${p.coseguro_paciente.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontSize: 13, color: "#3b82f6" }}>${p.cobertura_obra_social.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: p.estado_facturacion === "facturado" ? "rgba(34,197,94,0.15)" :
                        p.estado_facturacion === "pendiente" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                      color: p.estado_facturacion === "facturado" ? "#22c55e" :
                        p.estado_facturacion === "pendiente" ? "#f59e0b" : "#8a8f98"
                    }}>{p.estado_facturacion}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#62666d" }}>
                  {practicas.length === 0 ? "No hay prácticas médicas registradas" : "Sin resultados para los filtros seleccionados"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
