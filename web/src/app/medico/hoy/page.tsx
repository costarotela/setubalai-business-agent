"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthFetch, useAuth } from "../../auth-context";
import { Clock, User, Activity, Calendar, ChevronRight } from "lucide-react";

type Turno = {
  id: number;
  paciente_id: number;
  medico_id: number;
  fecha_hora: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: string;
  tipo_visita: string;
  paciente_nombre: string;
  paciente_dni: string;
  obra_social: string;
  medico_nombre: string;
  especialidades: string[];
};

export default function MedicoHoyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const af = useAuthFetch();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function cargarTurnos() {
      try {
        setLoading(true);
        setError(null);

        // Traer timeline del día para este médico
        const [timelineRes, turnosRes] = await Promise.all([
          af(`/api/agenda/timeline?fecha=${today}`),
          af(`/api/turnos/?estado=pendiente`),
        ]);

        let timelineData: Turno[] = [];
        let turnosData: Turno[] = [];

        try {
          const td = await timelineRes.json();
          timelineData = td.turnos || [];
        } catch {}

        try {
          const td = await turnosRes.json();
          turnosData = Array.isArray(td) ? td : td.turnos || [];
        } catch {}

        // Combinar: mostrar todos los pendientes + los del día
        const allTurnos = [...timelineData, ...turnosData];
        // Deduplicar por id
        const seen = new Set<number>();
        const unicos = allTurnos.filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });

        // Ordenar por fecha/hora
        unicos.sort(
          (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
        );

        setTurnos(unicos);
      } catch (err) {
        console.error("Error cargando turnos:", err);
        setError("No se pudieron cargar los turnos");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      cargarTurnos();
    }
  }, [af, user, authLoading, today]);

  if (authLoading || loading) {
    return (
      <div style={{ padding: 32, color: "#8a8f98" }}>
        Cargando turnos del día...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "#ef4444" }}>
        ⚠️ {error}
      </div>
    );
  }

  // Separar turnos de HOY vs próximos
  const turnosHoy = turnos.filter((t) => t.fecha === today);
  const turnosProximos = turnos.filter((t) => t.fecha !== today);

  function renderTurnoCard(t: Turno, esHoy: boolean) {
    const esPendiente = t.estado === "pendiente";
    const estadoColor =
      t.estado === "completado"
        ? "#22c55e"
        : t.estado === "en-curso"
          ? "#f59e0b"
          : t.estado === "cancelado"
            ? "#ef4444"
            : "#3b82f6";

    return (
      <div
        key={t.id}
        onClick={() => {
          if (esPendiente) {
            router.push(`/medico/atender/${t.id}`);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 18px",
          background: "#131416",
          border: `1px solid ${esHoy && esPendiente ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 10,
          cursor: esPendiente ? "pointer" : "default",
          transition: "border-color 0.15s",
          opacity: esPendiente ? 1 : 0.6,
        }}
      >
        {/* Hora */}
        <div style={{ minWidth: 64, textAlign: "center" }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: esHoy && esPendiente ? "#f7f8f8" : "#8a8f98",
            }}
          >
            {t.hora}
          </div>
          {!esHoy && (
            <div
              style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}
            >
              {t.fecha}
            </div>
          )}
        </div>

        {/* Línea vertical */}
        <div
          style={{
            width: 3,
            borderRadius: 2,
            height: 40,
            background: estadoColor,
          }}
        />

        {/* Info paciente */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>
            {t.paciente_nombre}{" "}
            <span style={{ fontWeight: 400, color: "#8a8f98", fontSize: 13 }}>
              (DNI: {t.paciente_dni || "—"})
            </span>
          </div>
          <div
            style={{ fontSize: 12, color: "#62666d", marginTop: 3 }}
          >
            {t.obra_social || "Particular"} • {t.tipo_visita} •{" "}
            {t.motivo || ""}
          </div>
        </div>

        {/* Estado + botón */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: estadoColor + "20",
              color: estadoColor,
            }}
          >
            {t.estado === "pendiente"
              ? "Pendiente"
              : t.estado === "completado"
                ? "Completado"
                : t.estado}
          </div>
          {esPendiente && (
            <ChevronRight size={16} color="#5e6ad2" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f7f8f8",
            margin: 0,
          }}
        >
          📋 Agenda Médica
        </h1>
        <p style={{ fontSize: 13, color: "#8a8f98", margin: "6px 0 0" }}>
          {user?.nombre || "Médico"} •{" "}
          {turnosHoy.length > 0
            ? `${turnosHoy.filter((t) => t.estado === "pendiente").length} pendiente(s) hoy`
            : `Sin turnos para hoy (${today})`}
        </p>
      </div>

      {/* TURNOS HOY */}
      <div style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#c9cdd4",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Calendar size={16} />
          Hoy — {today}
        </h2>
        {turnosHoy.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#62666d",
              background: "#0f1011",
              borderRadius: 10,
            }}
          >
            No hay turnos programados para hoy
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {turnosHoy.map((t) => renderTurnoCard(t, true))}
          </div>
        )}
      </div>

      {/* PRÓXIMOS TURNOS */}
      {turnosProximos.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#c9cdd4",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Clock size={16} />
            Próximos turnos pendientes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {turnosProximos.slice(0, 15).map((t) => renderTurnoCard(t, false))}
          </div>
        </div>
      )}

      {turnos.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#62666d",
            background: "#0f1011",
            borderRadius: 10,
          }}
        >
          No hay turnos pendientes en tu agenda
        </div>
      )}
    </div>
  );
}
