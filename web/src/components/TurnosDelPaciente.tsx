"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, User, MapPin, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../app/auth-context";

interface Turno {
  id: number;
  fecha: string;
  hora: string;
  medico_nombre: string;
  especialidad: string;
  estado: "confirmado" | "pendiente" | "cancelado" | "completado";
  consultorio?: string;
}

interface TurnosDelPacienteProps {
  pacienteId: number;
  limite?: number;
  soloProximos?: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function TurnosDelPaciente({ 
  pacienteId, 
  limite, 
  soloProximos = true 
}: TurnosDelPacienteProps) {
  const { token, user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTurnos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (soloProximos) params.set("proximos", "true");
      if (limite) params.set("limite", String(limite));

      const res = await fetch(`${API}/pacientes/${pacienteId}/turnos?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
      });
      
      if (!res.ok) throw new Error("Error al cargar turnos");
      const data = await res.json();
      setTurnos(data.turnos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, token, user, soloProximos, limite]);

  useEffect(() => {
    fetchTurnos();
  }, [fetchTurnos]);

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return {
          bg: "rgba(34,197,94,0.15)",
          border: "rgba(34,197,94,0.3)",
          color: "#4ade80",
          label: "CONFIRMADO",
        };
      case "pendiente":
        return {
          bg: "rgba(234,179,8,0.15)",
          border: "rgba(234,179,8,0.3)",
          color: "#facc15",
          label: "PENDIENTE",
        };
      case "cancelado":
        return {
          bg: "rgba(239,68,68,0.15)",
          border: "rgba(239,68,68,0.3)",
          color: "#f87171",
          label: "CANCELADO",
        };
      case "completado":
        return {
          bg: "rgba(59,130,246,0.15)",
          border: "rgba(59,130,246,0.3)",
          color: "#60a5fa",
          label: "COMPLETADO",
        };
      default:
        return {
          bg: "rgba(255,255,255,0.05)",
          border: "rgba(255,255,255,0.1)",
          color: "#8a8f98",
          label: estado.toUpperCase(),
        };
    }
  };

  return (
    <div style={{
      background: "#0f1011",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "18px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Calendar size={18} color="#7170ff" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
            {soloProximos ? "Próximos Turnos" : "Turnos"}
          </h3>
          {!loading && !error && (
            <span style={{
              fontSize: 11,
              color: "#62666d",
              background: "rgba(255,255,255,0.05)",
              padding: "2px 8px",
              borderRadius: 4,
            }}>
              {turnos.length}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <Loader2 size={28} color="#5e6ad2" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
          }}>
            <AlertCircle size={18} color="#f87171" />
            <span style={{ fontSize: 14, color: "#f87171" }}>{error}</span>
          </div>
        )}

        {!loading && !error && turnos.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Calendar size={40} color="#62666d" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "#8a8f98", margin: 0 }}>
              {soloProximos 
                ? "No hay turnos próximos programados"
                : "No hay turnos registrados"}
            </p>
          </div>
        )}

        {!loading && !error && turnos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {turnos.map((turno) => {
              const estadoStyles = getEstadoStyles(turno.estado);
              const fechaObj = new Date(turno.fecha + "T" + turno.hora);
              const esProximo = fechaObj > new Date();
              
              return (
                <div
                  key={turno.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "14px 16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Barra lateral indicador */}
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: estadoStyles.color,
                  }} />

                  <div style={{ paddingLeft: 8 }}>
                    {/* Fecha y hora */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} color="#7170ff" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8" }}>
                          {new Date(turno.fecha + "T00:00:00").toLocaleDateString("es-ES", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={14} color="#8a8f98" />
                        <span style={{ fontSize: 14, color: "#8a8f98" }}>
                          {turno.hora.substring(0, 5)}
                        </span>
                      </div>
                      <span style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        fontWeight: 600,
                        color: estadoStyles.color,
                        background: estadoStyles.bg,
                        border: `1px solid ${estadoStyles.border}`,
                        padding: "3px 8px",
                        borderRadius: 5,
                      }}>
                        {estadoStyles.label}
                      </span>
                    </div>

                    {/* Médico y especialidad */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <User size={13} color="#8a8f98" />
                        <span style={{ fontSize: 13, color: "#f7f8f8", fontWeight: 500 }}>
                          {turno.medico_nombre}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#62666d", paddingLeft: 19 }}>
                        {turno.especialidad}
                      </div>
                    </div>

                    {/* Consultorio */}
                    {turno.consultorio && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={12} color="#62666d" />
                        <span style={{ fontSize: 12, color: "#62666d" }}>
                          {turno.consultorio}
                        </span>
                      </div>
                    )}

                    {/* Indicador si es próximo */}
                    {esProximo && turno.estado === "confirmado" && (
                      <div style={{
                        marginTop: 10,
                        padding: "6px 10px",
                        background: "rgba(34,197,94,0.1)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}>
                        <CheckCircle size={12} color="#4ade80" />
                        <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 500 }}>
                          Turno próximo - Recordar asistencia
                        </span>
                      </div>
                    )}
                  </div>
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
