"use client";

import { useState, useEffect } from "react";
import { useAuthFetch } from "@/app/auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import Link from "next/link";

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: string[];
  duracion_turno_minutos: number;
  activo: boolean;
}

export default function ProfesionalesPage() {
  const authFetch = useAuthFetch();
  const { selectedEspecialidadId, especialidades } = useFiltrosClinica();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedicos();
  }, [selectedEspecialidadId]);

  const loadMedicos = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/medicos/");
      const data = await res.json();
      let allMedicos = Array.isArray(data) ? data : [];
      
      // Filtrar por especialidad si hay selección
      if (selectedEspecialidadId) {
        const esp = especialidades.find(e => e.id === selectedEspecialidadId);
        if (esp) {
          allMedicos = allMedicos.filter((m: Medico) =>
            m.especialidades.includes(esp.nombre)
          );
        }
      }
      
      setMedicos(allMedicos);
    } catch (err) {
      console.error("Error cargando médicos:", err);
      setMedicos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "32px 40px", color: "#62666d", fontSize: 14 }}>Cargando profesionales...</div>;
  }

  return (
    <div>
      {/* Header interno */}
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
              👨‍⚕️ Profesionales
            </h2>
            <p style={{ fontSize: 13, color: "#62666d", margin: "6px 0 0" }}>
              {medicos.length} {medicos.length === 1 ? "profesional" : "profesionales"}
              {selectedEspecialidadId && <span> — {especialidades.find(e => e.id === selectedEspecialidadId)?.nombre}</span>}
            </p>
          </div>
          <Link href="/medicos" style={{ textDecoration: "none" }}>
            <button style={{ background: "rgba(113,112,255,0.12)", border: "1px solid rgba(113,112,255,0.2)", color: "#7170ff", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              + Agregar profesional
            </button>
          </Link>
        </div>
      </div>

      {/* Lista */}
      {medicos.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
          <p style={{ color: "#62666d", fontSize: 14, margin: 0 }}>
            {selectedEspecialidadId ? "No hay profesionales en esta especialidad." : "No hay profesionales registrados aún."}
          </p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["PROFESIONAL", "ESPECIALIDADES", "DURACIÓN TURNO", "ESTADO"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#8a8f98", letterSpacing: "0.03em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {medicos.map((medico) => (
                <tr key={medico.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "#f7f8f8" }}>Dr. {medico.nombre} {medico.apellido}</div>
                    <div style={{ fontSize: 12, color: "#62666d", marginTop: 4 }}>ID: {medico.id}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(medico.especialidades || []).map((esp: string, idx: number) => (
                        <span key={idx} style={{ background: "rgba(113,112,255,0.12)", border: "1px solid rgba(113,112,255,0.2)", color: "#7170ff", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{esp}</span>
                      ))}
                      {(!medico.especialidades || medico.especialidades.length === 0) && <span style={{ fontSize: 12, color: "#62666d" }}>Sin especialidad</span>}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: 13, color: "#f7f8f8" }}>{medico.duracion_turno_minutos || 30} min</span>
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span style={{ background: medico.activo ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", border: medico.activo ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(239,68,68,0.2)", color: medico.activo ? "#10b981" : "#ef4444", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      {medico.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
