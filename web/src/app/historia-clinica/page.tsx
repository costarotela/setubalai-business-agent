"use client";
import { useAuthFetch } from "../auth-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ===== TYPES =====
interface PacienteBasic {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  obra_social?: string;
}

interface HistoriaBasic {
  id: number;
  paciente_id: number;
  paciente: string;
  dni_paciente: string;
  grupo_sanguineo?: string;
  alergias?: string;
  antecedentes_personales?: string;
  antecedentes_familiares?: string;
  notas?: string;
  medicacion_habitual?: string;
  ultima_actualizacion?: string;
}

interface HistorialFull {
  paciente: PacienteBasic;
  historia_clinica: HistoriaBasic | null;
  atenciones: {
    id: number; fecha: string; medico: string; especialidad: string;
    diagnostico: string; estado: string; presion_arterial: string;
    temperatura: number | null; peso: number | null;
  }[];
  practicas: {
    id: number; tipo: string; descripcion: string; codigo: string;
    medico: string; precio: number; coseguro: number; cobertura: number;
    estado_facturacion: string; requiere_autorizacion: boolean; fecha: string;
  }[];
  turnos: {
    id: number; fecha_hora: string; medico: string; tipo: string;
    motivo: string; estado: string;
  }[];
  resumen: { total_atenciones: number; total_practicas: number; total_turnos: number; };
}

const TABS = [
  { key: "historia", label: "Historia Clínica" },
  { key: "atenciones", label: "Atenciones" },
  { key: "practicas", label: "Prácticas" },
  { key: "turnos", label: "Turnos" },
];

export default function HistoriaClinicaPage() {
  const af = useAuthFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteId = searchParams?.get("id");

  const [historias, setHistorias] = useState<HistoriaBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [historial, setHistorial] = useState<HistorialFull | null>(null);
  const [cargandoHC, setCargandoHC] = useState(false);
  const [tabActiva, setTabActiva] = useState("historia");

  // Load list
  const cargarLista = useCallback(async () => {
    setLoading(true);
    try {
      const r = await af("/api/historia_clinica/");
      const data: HistoriaBasic[] = await r.json();
      setHistorias(data);
    } catch (e) {
      console.error("Error loading historias:", e);
    }
    setLoading(false);
  }, [af]);

  useEffect(() => { cargarLista(); }, [cargarLista]);

  // Load detail
  const cargarHistorial = useCallback(async (id: number) => {
    setCargandoHC(true);
    try {
      const r = await af(`/api/pacientes/${id}/historial`);
      const data: HistorialFull = await r.json();
      setHistorial(data);
    } catch (e) {
      console.error("Error loading historial:", e);
    }
    setCargandoHC(false);
  }, [af]);

  const filtered = historias.filter(h =>
    h.paciente.toLowerCase().includes(busqueda.toLowerCase()) ||
    h.dni_paciente.includes(busqueda)
  );

  // DETAIL VIEW
  if (historial) {
    const p = historial.paciente;
    const hc = historial.historia_clinica;
    return (
      <div style={{ padding: "32px", maxWidth: 960, margin: "0 auto" }}>
        <button onClick={() => { setHistorial(null); router.back(); }} style={{
          background: "none", border: "none", color: "#62666d", cursor: "pointer",
          fontSize: 14, marginBottom: 16, padding: 0
        }}>← Volver al listado</button>

        <div style={{
          background: "linear-gradient(135deg, #2d1f5e 0%, #1a1a2e 100%)",
          borderRadius: 12, padding: 20, marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>
            {p.nombre} {p.apellido}
          </h1>
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#8a8f98", flexWrap: "wrap" }}>
            <span>DNI: {p.dni}</span>
            {p.obra_social && <span>OS: {p.obra_social}</span>}
            {hc?.grupo_sanguineo && <span style={{ color: "#ef4444" }}>🩸 {hc.grupo_sanguineo}</span>}
            {hc?.alergias && <span style={{ color: "#f59e0b" }}>⚠️ {hc.alergias}</span>}
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 12, marginTop: 8, color: "#62666d" }}>
            <span>{historial.resumen.total_atenciones} atenciones</span>
            <span>{historial.resumen.total_practicas} prácticas</span>
            <span>{historial.resumen.total_turnos} turnos</span>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTabActiva(t.key)} style={{
              background: tabActiva === t.key ? "rgba(113,112,255,0.2)" : "transparent",
              border: "none", color: tabActiva === t.key ? "#7170ff" : "#62666d",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600
            }}>{t.label}</button>
          ))}
        </div>

        {cargandoHC && <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>Cargando...</div>}

        {/* TAB: Historia Clínica */}
        {tabActiva === "historia" && hc && (
          <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: 24, lineHeight: 1.8 }}>
            {hc.antecedentes_personales && <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#7170ff", marginTop: 0 }}>Antecedentes Personales</h3>
              <p style={{ color: "#c9cdd4", fontSize: 13, margin: "4px 0 16px" }}>{hc.antecedentes_personales}</p>
            </>}
            {hc.antecedentes_familiares && <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#7170ff" }}>Antecedentes Familiares</h3>
              <p style={{ color: "#c9cdd4", fontSize: 13, margin: "4px 0 16px" }}>{hc.antecedentes_familiares}</p>
            </>}
            {hc.notas && <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#7170ff" }}>Notas</h3>
              <p style={{ color: "#c9cdd4", fontSize: 13, margin: "4px 0 16px" }}>{hc.notas}</p>
            </>}
            {hc.medicacion_habitual && <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#7170ff" }}>Medicación Habitual</h3>
              <p style={{ color: "#c9cdd4", fontSize: 13, margin: "4px 0 0" }}>{hc.medicacion_habitual}</p>
            </>}
          </div>
        )}
        {tabActiva === "historia" && !hc && (
          <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>No hay historia clínica registrada</div>
        )}

        {/* TAB: Atenciones */}
        {tabActiva === "atenciones" && (
          <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            {historial.atenciones.map(a => (
              <div key={a.id} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{a.medico} <span style={{ fontWeight: 400, color: "#8a8f98" }}>({a.especialidad})</span></span>
                  <span style={{ fontSize: 12, color: "#8a8f98" }}>{a.fecha}</span>
                </div>
                {a.diagnostico && <div style={{ fontSize: 13, color: "#c9cdd4", marginBottom: 4 }}>📋 {a.diagnostico}</div>}
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#62666d", flexWrap: "wrap" }}>
                  {a.presion_arterial && <span>BP: {a.presion_arterial}</span>}
                  {a.temperatura && <span>Temp: {a.temperatura}°C</span>}
                  {a.peso && <span>Peso: {a.peso}kg</span>}
                  <span style={{
                    padding: "2px 8px", borderRadius: 4,
                    background: a.estado === "completado" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                    color: a.estado === "completado" ? "#22c55e" : "#8a8f98"
                  }}>{a.estado}</span>
                </div>
              </div>
            ))}
            {historial.atenciones.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>No hay atenciones registradas</div>
            )}
          </div>
        )}

        {/* TAB: Prácticas */}
        {tabActiva === "practicas" && (
          <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            {historial.practicas.map(pr => (
              <div key={pr.id} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{pr.descripcion || pr.tipo}</span>
                  <span style={{ fontSize: 13, color: "#22c55e" }}>${pr.precio.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#62666d", flexWrap: "wrap" }}>
                  <span>{pr.medico}</span>
                  {pr.codigo && <span style={{ fontFamily: "monospace", color: "#7170ff" }}>{pr.codigo}</span>}
                  <span>OS: ${pr.cobertura.toFixed(2)}</span>
                  <span>Coseguro: ${pr.coseguro.toFixed(2)}</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11,
                    background: pr.estado_facturacion === "facturado" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                    color: pr.estado_facturacion === "facturado" ? "#22c55e" : "#f59e0b"
                  }}>{pr.estado_facturacion}</span>
                  {pr.requiere_autorizacion && <span style={{ color: "#ef4444" }}>Requiere autorización</span>}
                </div>
              </div>
            ))}
            {historial.practicas.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>No hay prácticas registradas</div>
            )}
          </div>
        )}

        {/* TAB: Turnos */}
        {tabActiva === "turnos" && (
          <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            {historial.turnos.map(v => (
              <div key={v.id} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{v.medico}</span>
                  <span style={{ fontSize: 12, color: "#8a8f98" }}>{v.fecha_hora}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#62666d", flexWrap: "wrap" }}>
                  <span>{v.tipo}</span>
                  {v.motivo && <span>→ {v.motivo}</span>}
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11,
                    background: v.estado === "programado" ? "rgba(59,130,246,0.15)" :
                      v.estado === "completado" ? "rgba(34,197,94,0.15)" :
                      v.estado === "cancelado" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                    color: v.estado === "programado" ? "#3b82f6" :
                      v.estado === "completado" ? "#22c55e" :
                      v.estado === "cancelado" ? "#ef4444" : "#8a8f98"
                  }}>{v.estado}</span>
                </div>
              </div>
            ))}
            {historial.turnos.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#62666d" }}>No hay turnos registrados</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Historias Clínicas</h1>
        <p style={{ color: "#62666d", margin: "4px 0 0" }}>Seleccioná un paciente para ver su historial completo</p>
      </div>

      {/* BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar por nombre o DNI..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{
          width: "100%", maxWidth: 400, padding: "10px 16px", marginBottom: 20,
          background: "#111214", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, color: "#e4e4e7", fontSize: 14
        }}
      />

      <div style={{ background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Paciente", "DNI", "Sangre", "Alergias", "Actualizado"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(h => (
              <tr
                key={h.id}
                onClick={() => cargarHistorial(h.paciente_id)}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(113,112,255,0.04)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600 }}>{h.paciente}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#8a8f98", fontFamily: "monospace" }}>{h.dni_paciente}</td>
                <td style={{ padding: "10px 16px", fontSize: 13 }}>
                  {h.grupo_sanguineo ? (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{h.grupo_sanguineo}</span>
                  ) : "-"}
                </td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: h.alergias ? "#f59e0b" : "#62666d" }}>{h.alergias || "—"}</td>
                <td style={{ padding: "10px 16px", fontSize: 13, color: "#8a8f98" }}>{h.ultima_actualizacion ? new Date(h.ultima_actualizacion).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#62666d" }}>
                {loading ? "Cargando..." : "No se encontraron historias clínicas"}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
