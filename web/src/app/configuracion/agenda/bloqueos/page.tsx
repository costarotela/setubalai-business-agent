"use client";
import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: string[];
}

interface BloqueoGrilla {
  id: number;
  medico_id: number;
  fecha_desde: string;
  fecha_hasta: string;
  motivo: string;
  medico_nombre?: string;
  medico_apellido?: string;
}

export default function BloqueosPage() {
  const authFetch = useAuthFetch();
  const [bloqueos, setBloqueos] = useState<BloqueoGrilla[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resB, resM] = await Promise.all([
        authFetch("/configuracion-agenda/bloqueos-grilla/"),
        authFetch("/medicos/")
      ]);
      const dataB = await resB.json();
      const dataM = await resM.json();
      setBloqueos(Array.isArray(dataB) ? dataB : []);
      setMedicos(Array.isArray(dataM) ? dataM : []);
    } catch (err) {
      console.error("Error cargando bloqueos:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "32px 40px", color: "#62666d" }}>Cargando bloqueos...</div>;
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
          🚫 Bloqueos de Agenda
        </h2>
        <p style={{ fontSize: 13, color: "#62666d", margin: 0 }}>
          {bloqueos.length} {bloqueos.length === 1 ? "bloqueo registrado" : "bloqueos registrados"}
        </p>
      </div>

      {bloqueos.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d", fontSize: 14, margin: 0 }}>No hay bloqueos de agenda configurados.</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>PROFESIONAL</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>DESDE</th>
                <th style={{ padding: "14px 20px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>HASTA</th>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98" }}>MOTIVO</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => {
                const medico = medicos.find(m => m.id === b.medico_id);
                return (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#f7f8f8" }}>
                        Dr. {b.medico_apellido || medico?.apellido || ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#62666d", marginTop: 4 }}>
                        {medico?.especialidades?.[0] || "Sin especialidad"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ fontSize: 13, color: "#f7f8f8" }}>
                        {new Date(b.fecha_desde).toLocaleDateString("es-AR")}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center" }}>
                      <span style={{ fontSize: 13, color: "#f7f8f8" }}>
                        {new Date(b.fecha_hasta).toLocaleDateString("es-AR")}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: 13, color: "#f7f8f8" }}>{b.motivo}</span>
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
