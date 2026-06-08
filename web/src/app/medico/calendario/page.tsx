"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthFetch, useAuth } from "../../auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ChevronRight as ChevronR,
} from "lucide-react";

type Turno = {
  id: number;
  fecha_hora: string;
  fecha: string;
  hora: string;
  estado: string;
  tipo_visita: string;
  motivo: string;
  paciente_nombre: string;
  paciente_apellido: string;
  paciente_completo: string;
  paciente_dni: string;
  obra_social: string;
  medico_nombre: string;
  medico_apellido: string;
  medico_display: string;
  especialidades: string[];
};

export default function CalendarioMedicoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const af = useAuthFetch();
  const f = useFiltrosClinica();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendario state
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(
    now.toISOString().split("T")[0]
  );

  // Cargar turnos del mes
  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        setError(null);

        const mes = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

        let url = `/api/calendario?mes=${mes}`;
        if (f.selectedEspecialidadId) {
          url += `&especialidad_id=${f.selectedEspecialidadId}`;
        }

        const res = await af(url);
        if (!res.ok) {
          setError("No se pudieron cargar los turnos del mes");
          return;
        }

        const data = await res.json();
        setTurnos(data.turnos || []);
      } catch (err) {
        console.error("Error cargando calendario:", err);
        setError("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user && !f.loading) {
      cargar();
    }
  }, [af, user, authLoading, currentMonth, currentYear, f.selectedEspecialidadId, f.loading]);

  // Turnos de la fecha seleccionada
  const turnosDelDia = turnos.filter((t) => t.fecha === selectedDate);

  // Mapa de turnos por día para el mini-calendario
  const turnosPorDia: Record<string, Turno[]> = {};
  for (const t of turnos) {
    if (!turnosPorDia[t.fecha]) turnosPorDia[t.fecha] = [];
    turnosPorDia[t.fecha].push(t);
  }

  // Días del mes para la grilla
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dias: (number | null)[] = [];
  // Blank cells before first day (0=Sunday)
  for (let i = 0; i < firstDay; i++) dias.push(null);
  for (let d = 1; d <= daysInMonth; d++) dias.push(d);

  const MES_NOMBRES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const DIA_NOMBRES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToDay(day: number) {
    const d = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(d);
  }

  const today = new Date().toISOString().split("T")[0];

  // Stats de carga del mes
  const diasConTurnos = Object.keys(turnosPorDia).length;
  const maxTurnosEnUnDia = Math.max(0, ...Object.values(turnosPorDia).map((arr) => arr.length));
  const diaMasCargado = Object.entries(turnosPorDia).sort(
    (a, b) => b[1].length - a[1].length
  )[0]?.[0] || null;

  if (authLoading || loading || f.loading) {
    return (
      <div style={{ padding: 32, color: "#8a8f98" }}>Cargando calendario...</div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "#ef4444" }}>⚠️ {error}</div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
          📅 Calendario Médico
        </h1>
        <p style={{ fontSize: 13, color: "#8a8f98", margin: "6px 0 0" }}>
          Navegá por las semanas para ver tus pacientes — pasado, presente y futuro
        </p>
      </div>

      {/* Stats del mes */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap",
      }}>
        <div style={{
          padding: "10px 16px", background: "#131416", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "#8a8f98",
        }}>
          📊 <strong style={{ color: "#f7f8f8" }}>{turnos.length}</strong> turnos en el mes
        </div>
        {diasConTurnos > 0 && (
          <div style={{
            padding: "10px 16px", background: "#131416", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, color: "#8a8f98",
          }}>
            📆 <strong style={{ color: "#f7f8f8" }}>{diasConTurnos}</strong> días con turnos
          </div>
        )}
        {maxTurnosEnUnDia > 3 && (
          <div style={{
            padding: "10px 16px", background: "rgba(245,158,11,0.1)", borderRadius: 8,
            border: "1px solid rgba(245,158,11,0.3)", fontSize: 13, color: "#f59e0b",
          }}>
            ⚡ Día más cargado: {diaMasCargado} ({maxTurnosEnUnDia} turnos)
          </div>
        )}
        {maxTurnosEnUnDia > 6 && (
          <div style={{
            padding: "10px 16px", background: "rgba(239,68,68,0.1)", borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.3)", fontSize: 13, color: "#ef4444",
          }}>
            🚨 Semana sobrecargada — {maxTurnosEnUnDia} turnos en un día
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Mini calendario */}
        <div style={{
          minWidth: 300, background: "#131416", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)", padding: 16,
        }}>
          {/* Navegación mes */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
          }}>
            <button onClick={prevMonth} style={{
              background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6,
              padding: 6, cursor: "pointer", color: "#f7f8f8",
            }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>
              {MES_NOMBRES[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} style={{
              background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6,
              padding: 6, cursor: "pointer", color: "#f7f8f8",
            }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grilla de días */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, textAlign: "center" }}>
            {/* Day headers */}
            {DIA_NOMBRES.map((d) => (
              <div key={d} style={{ fontSize: 11, color: "#62666d", padding: "4px 0", fontWeight: 600 }}>{d}</div>
            ))}

            {/* Days */}
            {dias.map((d, idx) => {
              if (d === null) return <div key={`blank-${idx}`} />;
              const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === today;
              const count = turnosPorDia[dateKey]?.length || 0;
              const hasCompleted = turnosPorDia[dateKey]?.some((t) => t.estado === "completado");
              const isPast = dateKey < today;

              return (
                <div
                  key={dateKey}
                  onClick={() => goToDay(d)}
                  style={{
                    position: "relative",
                    padding: "6px 2px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : isToday ? 700 : 400,
                    color: isSelected ? "#f7f8f8" : isPast ? "#62666d" : "#c9cdd4",
                    background: isSelected
                      ? "rgba(59,130,246,0.2)"
                      : isToday
                        ? "rgba(59,130,246,0.1)"
                        : "transparent",
                    border: isSelected ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                  }}
                >
                  {d}
                  {count > 0 && (
                    <div style={{
                      position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                      width: count > 1 ? 16 : 6, height: 6, borderRadius: 3,
                      background: hasCompleted ? "#22c55e" : "#3b82f6",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de turnos del día seleccionado */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: "#f7f8f8", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Calendar size={20} color="#3b82f6" />
            {selectedDate === today ? "Hoy" : selectedDate}
            <span style={{ fontSize: 13, fontWeight: 400, color: "#8a8f98" }}>
              ({turnosDelDia.length} turno{turnosDelDia.length !== 1 ? "s" : ""})
            </span>
          </div>

          {turnosDelDia.length === 0 ? (
            <div style={{
              padding: 32, textAlign: "center", color: "#62666d",
              background: "#0f1011", borderRadius: 10, fontSize: 14,
            }}>
              No hay turnos para este día
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {turnosDelDia
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((t) => {
                  const estadoColor =
                    t.estado === "completado" ? "#22c55e"
                      : t.estado === "en-curso" ? "#f59e0b"
                        : t.estado === "cancelado" ? "#ef4444"
                          : "#3b82f6";
                  return (
                    <div
                      key={t.id}
                      onClick={() => router.push(`/medico/atender/${t.id}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px", background: "#131416",
                        border: `1px solid ${t.estado === "pendiente" ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10, cursor: "pointer",
                      }}
                    >
                      <div style={{ minWidth: 60, textAlign: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: "#f7f8f8" }}>
                          {t.hora}
                        </div>
                      </div>
                      <div style={{
                        width: 3, borderRadius: 2, height: 36, background: estadoColor,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 600, color: "#f7f8f8",
                        }}>
                          {t.paciente_completo}
                        </div>
                        <div style={{ fontSize: 12, color: "#62666d", marginTop: 3 }}>
                          {t.obra_social || "Particular"} • {t.tipo_visita}
                        </div>
                      </div>
                      <div style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11,
                        fontWeight: 600, background: estadoColor + "20", color: estadoColor,
                      }}>
                        {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                      </div>
                      {t.estado === "pendiente" && (
                        <ChevronR size={16} color="#5e6ad2" />
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
