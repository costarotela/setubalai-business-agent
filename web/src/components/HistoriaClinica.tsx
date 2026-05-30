"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText, Calendar, Stethoscope, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../app/auth-context";

interface Consulta {
  id: number;
  fecha: string;
  medico_nombre: string;
  especialidad: string;
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
}

interface HistoriaClinicaProps {
  pacienteId: number;
  modo?: "completo" | "resumen" | "mini";
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function HistoriaClinica({ pacienteId, modo = "completo" }: HistoriaClinicaProps) {
  const { token, user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchHistoria = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/pacientes/${pacienteId}/historia-clinica`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
      });
      
      if (!res.ok) throw new Error("Error al cargar historia clínica");
      const data = await res.json();
      setConsultas(data.consultas || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, token, user]);

  useEffect(() => {
    fetchHistoria();
  }, [fetchHistoria]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Modo MINI - solo contador
  if (modo === "mini") {
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        background: "rgba(94,106,210,0.1)",
        border: "1px solid rgba(94,106,210,0.3)",
        borderRadius: 6,
      }}>
        <FileText size={14} color="#7170ff" />
        <span style={{ fontSize: 13, color: "#f7f8f8", fontWeight: 500 }}>
          {loading ? "..." : consultas.length} {consultas.length === 1 ? "consulta" : "consultas"}
        </span>
      </div>
    );
  }

  // Modo RESUMEN - lista compacta
  if (modo === "resumen") {
    return (
      <div style={{
        background: "#0f1011",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <FileText size={16} color="#7170ff" />
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
            Historia Clínica
          </h4>
        </div>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <Loader2 size={20} color="#5e6ad2" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
            <AlertCircle size={16} color="#f87171" />
            <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
          </div>
        )}

        {!loading && !error && consultas.length === 0 && (
          <p style={{ fontSize: 13, color: "#62666d", margin: 0 }}>
            No hay consultas registradas
          </p>
        )}

        {!loading && !error && consultas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {consultas.slice(0, 3).map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "10px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ fontSize: 12, color: "#8a8f98", marginBottom: 4 }}>
                  {new Date(c.fecha).toLocaleDateString("es-ES")} - {c.medico_nombre}
                </div>
                <div style={{ fontSize: 13, color: "#f7f8f8", fontWeight: 500 }}>
                  {c.diagnostico}
                </div>
              </div>
            ))}
            {consultas.length > 3 && (
              <div style={{ fontSize: 12, color: "#62666d", textAlign: "center", marginTop: 4 }}>
                +{consultas.length - 3} consultas más
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modo COMPLETO - detalle total
  return (
    <div style={{
      background: "#0f1011",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={20} color="#7170ff" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
            Historia Clínica Completa
          </h3>
        </div>
        <p style={{ fontSize: 13, color: "#8a8f98", margin: "6px 0 0" }}>
          Registro detallado de todas las consultas del paciente
        </p>
      </div>

      <div style={{ padding: "24px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 size={32} color="#5e6ad2" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
          }}>
            <AlertCircle size={20} color="#f87171" />
            <span style={{ fontSize: 14, color: "#f87171" }}>{error}</span>
          </div>
        )}

        {!loading && !error && consultas.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <FileText size={48} color="#62666d" style={{ margin: "0 auto 16px" }} />
            <p style={{ fontSize: 15, color: "#8a8f98", margin: 0 }}>
              No hay consultas registradas para este paciente
            </p>
          </div>
        )}

        {!loading && !error && consultas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {consultas.map((consulta, idx) => {
              const isExpanded = expandedIds.has(consulta.id);
              
              return (
                <div
                  key={consulta.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <div
                    onClick={() => toggleExpand(consulta.id)}
                    style={{
                      padding: "16px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "white",
                        }}>
                          #{consultas.length - idx}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", marginBottom: 2 }}>
                            {consulta.diagnostico}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8a8f98" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={12} />
                              {new Date(consulta.fecha).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Stethoscope size={12} />
                              {consulta.medico_nombre} ({consulta.especialidad})
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#8a8f98" />
                      ) : (
                        <ChevronDown size={20} color="#8a8f98" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{
                      padding: "0 18px 18px",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                      paddingTop: 16,
                    }}>
                      <div style={{ marginBottom: 14 }}>
                        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a8f98", marginBottom: 6 }}>
                          TRATAMIENTO
                        </span>
                        <p style={{ fontSize: 14, color: "#f7f8f8", margin: 0, lineHeight: 1.6 }}>
                          {consulta.tratamiento}
                        </p>
                      </div>

                      {consulta.observaciones && (
                        <div>
                          <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#8a8f98", marginBottom: 6 }}>
                            OBSERVACIONES
                          </span>
                          <p style={{ fontSize: 14, color: "#f7f8f8", margin: 0, lineHeight: 1.6 }}>
                            {consulta.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
