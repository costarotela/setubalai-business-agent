"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: string[];
}

interface GrillaMedica {
  id: number;
  medico_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  medico_nombre?: string;
  medico_apellido?: string;
}

export default function GrillasPage() {
  const authFetch = useAuthFetch();
  const [grillas, setGrillas] = useState<GrillaMedica[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resG, resM] = await Promise.all([
        authFetch("/configuracion-agenda/grillas-medicas/"),
        authFetch("/medicos/")
      ]);
      const dataG = await resG.json();
      const dataM = await resM.json();
      setGrillas(Array.isArray(dataG) ? dataG : []);
      setMedicos(Array.isArray(dataM) ? dataM : []);
    } catch (err) {
      console.error("Error cargando grillas:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "32px 40px", color: "#62666d" }}>Cargando grillas...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
          📅 Grillas Horarias
        </h2>
        <p style={{ fontSize: 13, color: "#62666d", margin: 0 }}>
          {grillas.length} {grillas.length === 1 ? "horario configurado" : "horarios configurados"}
        </p>
      </div>

      {grillas.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d", fontSize: 14, margin: 0 }}>No hay grillas horarias configuradas.</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>PROFESIONAL</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DÍA</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>HORARIO</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {grillas.map((g) => {
                const medico = medicos.find(m => m.id === g.medico_id);
                return (
                  <tr key={g.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#f7f8f8" }}>
                        Dr. {g.medico_apellido || medico?.apellido || ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#62666d", marginTop: 4 }}>
                        {medico?.especialidades?.[0] || "Sin especialidad"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: 13, color: "#f7f8f8" }}>{DIAS[g.dia_semana]}</span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ fontSize: 13, color: "#f7f8f8" }}>
                        {g.hora_inicio} - {g.hora_fin}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{
                        background: g.activo ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        border: g.activo ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)",
                        color: g.activo ? "#10b981" : "#ef4444",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {g.activo ? "ACTIVO" : "INACTIVO"}
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
