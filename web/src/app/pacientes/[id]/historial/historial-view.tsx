"use client";
import { useAuthFetch } from "../../../auth-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface HistorialFull {
  paciente: { id: number; nombre: string; apellido: string; dni: string; obra_social?: string; telefono?: string; email?: string; fecha_nacimiento?: string; };
  historia_clinica: { grupo_sanguineo: string; alergias: string; medicacion_habitual: string; antecedentes_personales: string; antecedentes_familiares: string; notas: string; ultima_actualizacion?: string; } | null;
  atenciones: { id: number; fecha: string; medico: string; especialidad: string; diagnostico: string; estado: string; presion_arterial: string; temperatura: number | null; peso: number | null; }[];
  practicas: { id: number; tipo: string; descripcion: string; codigo: string; medico: string; precio: number; coseguro: number; cobertura: number; estado_facturacion: string; requiere_autorizacion: boolean; fecha: string; }[];
  turnos: { id: number; fecha_hora: string; medico: string; tipo: string; motivo: string; estado: string; }[];
  resumen: { total_atenciones: number; total_practicas: number; total_turnos: number; };
}

const TABS = [
  { key: "historia", label: "Historia Clínica" },
  { key: "atenciones", label: "Atenciones" },
  { key: "practicas", label: "Prácticas" },
  { key: "turnos", label: "Turnos" },
];

export default function HistorialView({ id }: { id: string }) {
  const router = useRouter();
  const af = useAuthFetch();
  const [historial, setHistorial] = useState<HistorialFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("historia");

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const r = await af(`/api/pacientes/${id}/historial`);
      const data: HistorialFull = await r.json();
      setHistorial(data);
    } catch (e) {
      console.error("Error loading historial:", e);
    }
    setLoading(false);
  }, [af, id]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando historial...</div>;
  if (!historial) return <div style={{padding: "40px", color: "#e85d5d"}}>Paciente no encontrado</div>;

  const p = historial.paciente;
  const hc = historial.historia_clinica;

  return (
    <div style={{padding: "32px"}}>
      {/* Header con flecha de vuelta */}
      <button onClick={() => router.push("/pacientes")} style={{background: "none", border: "none", cursor: "pointer", color: "#6b8afd", fontSize: 13, marginBottom: 16, padding: 0}}>
        ← Volver a Pacientes
      </button>

      {/* Ficha del paciente */}
      <div style={{background: "#141517", borderRadius: 12, padding: "20px", marginBottom: 24, border: "1px solid rgba(107,138,253,0.2)"}}>
        <h1 style={{fontSize: 22, fontWeight: 700, margin: "0 0 12px", color: "#f7f8f8"}}>{p.nombre} {p.apellido}</h1>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, fontSize: 13, color: "#8a8f98"}}>
          <div>DNI: <span style={{color: "#f7f8f8"}}>{p.dni}</span></div>
          <div>Obra Social: <span style={{color: "#f7f8f8"}}>{p.obra_social || "Particular"}</span></div>
          <div>Teléfono: <span style={{color: "#f7f8f8"}}>{p.telefono || "-"}</span></div>
          <div>Nacimiento: <span style={{color: "#f7f8f8"}}>{p.fecha_nacimiento || "-"}</span></div>
          <div>Email: <span style={{color: "#f7f8f8"}}>{p.email || "-"}</span></div>
        </div>
        {/* Resumen */}
        <div style={{display: "flex", gap: 16, marginTop: 16}}>
          <div style={{background: "rgba(107,138,253,0.1)", padding: "8px 16px", borderRadius: 8, textAlign: "center"}}>
            <div style={{fontSize: 20, fontWeight: 700, color: "#6b8afd"}}>{historial.resumen.total_atenciones}</div>
            <div style={{fontSize: 11, color: "#8a8f98"}}>Atenciones</div>
          </div>
          <div style={{background: "rgba(74,158,106,0.1)", padding: "8px 16px", borderRadius: 8, textAlign: "center"}}>
            <div style={{fontSize: 20, fontWeight: 700, color: "#4a9e6a"}}>{historial.resumen.total_practicas}</div>
            <div style={{fontSize: 11, color: "#8a8f98"}}>Prácticas</div>
          </div>
          <div style={{background: "rgba(232,200,93,0.1)", padding: "8px 16px", borderRadius: 8, textAlign: "center"}}>
            <div style={{fontSize: 20, fontWeight: 700, color: "#e8c85d"}}>{historial.resumen.total_turnos}</div>
            <div style={{fontSize: 11, color: "#8a8f98"}}>Turnos</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTabActiva(t.key)} style={{
            padding: "10px 20px", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tabActiva === t.key ? "#1a1b1e" : "transparent",
            color: tabActiva === t.key ? "#6b8afd" : "#8a8f98",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Contenido */}
      {tabActiva === "historia" && (
        <div style={{background: "#141517", borderRadius: 10, padding: 20, border: "1px solid rgba(255,255,255,0.06)"}}>
          <h2 style={{fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#f7f8f8"}}>Historia Clínica</h2>
          {hc ? (
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16}}>
              <div><div style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Grupo Sanguíneo</div><div style={{fontSize: 14, color: "#f7f8f8"}}>{hc.grupo_sanguineo || "—"}</div></div>
              <div><div style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Alergias</div><div style={{fontSize: 14, color: "#e85d5d"}}>{hc.alergias || "—"}</div></div>
              <div><div style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Medicación Habitual</div><div style={{fontSize: 14, color: "#f7f8f8"}}>{hc.medicacion_habitual || "—"}</div></div>
              <div style={{gridColumn: "1 / -1"}}><div style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Antecedentes Personales</div><div style={{fontSize: 13, color: "#f7f8f8"}}>{hc.antecedentes_personales || "—"}</div></div>
              <div style={{gridColumn: "1 / -1"}}><div style={{fontSize: 11, color: "#62666d", textTransform: "uppercase"}}>Antecedentes Familiares</div><div style={{fontSize: 13, color: "#f7f8f8"}}>{hc.antecedentes_familiares || "—"}</div></div>
            </div>
          ) : (
            <div style={{color: "#62666d", padding: 20, textAlign: "center"}}>Sin historia clínica completa</div>
          )}
        </div>
      )}

      {tabActiva === "atenciones" && (
        <div style={{background: "#141517", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden"}}>
          {historial.atenciones.map(a => (
            <div key={a.id} style={{padding: 16, borderBottom: "1px solid rgba(255,255,255,0.04)"}}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                <span style={{fontSize: 14, fontWeight: 600, color: "#f7f8f8"}}>{a.medico} — {a.especialidad}</span>
                <span style={{fontSize: 12, color: "#62666d"}}>{a.fecha} · {a.estado}</span>
              </div>
              <div style={{fontSize: 13, color: "#8a8f98", marginBottom: 6}}><b style={{color: "#f7f8f8"}}>Diagnóstico:</b> {a.diagnostico || "—"}</div>
              {a.presion_arterial && <span style={{fontSize: 12, color: "#6b8afd", marginRight: 12}}>PA: {a.presion_arterial}</span>}
              {a.temperatura && <span style={{fontSize: 12, color: "#6b8afd", marginRight: 12}}>Temp: {a.temperatura}°C</span>}
              {a.peso && <span style={{fontSize: 12, color: "#6b8afd"}}>Peso: {a.peso} kg</span>}
            </div>
          ))}
          {historial.atenciones.length === 0 && <div style={{padding: 30, textAlign: "center", color: "#62666d"}}>Sin atenciones registradas</div>}
        </div>
      )}

      {tabActiva === "practicas" && (
        <div style={{background: "#141517", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden"}}>
          {historial.practicas.map(pr => (
            <div key={pr.id} style={{padding: 16, borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div>
                <div style={{fontSize: 14, fontWeight: 600, color: "#f7f8f8"}}>{pr.descripcion || pr.tipo}</div>
                <div style={{fontSize: 12, color: "#8a8f98"}}>{pr.medico} · {pr.fecha} · Código: {pr.codigo}</div>
                {pr.requiere_autorizacion && <span style={{fontSize: 11, color: "#e8c85d"}}>⚠ Requiere autorización</span>}
              </div>
              <div style={{textAlign: "right"}}>
                <div style={{fontSize: 14, fontWeight: 600, color: "#4a9e6a"}}>${parseFloat(String(pr.precio)).toLocaleString()}</div>
                <div style={{fontSize: 11, color: "#8a8f98"}}>Coseguro: ${parseFloat(String(pr.coseguro)).toLocaleString()}</div>
                <div style={{fontSize: 11, color: "#8a8f98"}}>Cobertura: ${parseFloat(String(pr.cobertura)).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {historial.practicas.length === 0 && <div style={{padding: 30, textAlign: "center", color: "#62666d"}}>Sin prácticas registradas</div>}
        </div>
      )}

      {tabActiva === "turnos" && (
        <div style={{background: "#141517", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden"}}>
          {historial.turnos.map(t => (
            <div key={t.id} style={{padding: 14, borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between"}}>
              <div>
                <div style={{fontSize: 14, color: "#f7f8f8"}}>{t.medico} — {t.tipo}</div>
                <div style={{fontSize: 12, color: "#8a8f98"}}>Motivo: {t.motivo || "—"}</div>
              </div>
              <div style={{textAlign: "right"}}>
                <div style={{fontSize: 13, color: "#6b8afd"}}>{t.fecha_hora}</div>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 12,
                  background: t.estado === "realizado" ? "rgba(74,158,106,0.2)" : t.estado === "cancelado" ? "rgba(232,93,93,0.2)" : "rgba(232,200,93,0.2)",
                  color: t.estado === "realizado" ? "#4a9e6a" : t.estado === "cancelado" ? "#e85d5d" : "#e8c85d",
                }}>{t.estado}</span>
              </div>
            </div>
          ))}
          {historial.turnos.length === 0 && <div style={{padding: 30, textAlign: "center", color: "#62666d"}}>Sin turnos registrados</div>}
        </div>
      )}
    </div>
  );
}
