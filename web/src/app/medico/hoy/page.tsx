"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthFetch, useAuth } from "../../auth-context";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";
import { Clock, Calendar, ChevronRight } from "lucide-react";

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
  const f = useFiltrosClinica();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function cargarTurnos() {
      try {
        setLoading(true);
        setError(null);

        // Timeline del día — respeta medico_restriccion del backend
        const timelineRes = await af(`/api/agenda/timeline?fecha=${today}`);
        const td = await timelineRes.json();
        const timelineData: Turno[] = td.turnos || [];

        // Pendientes generales filtrados por especialidad del Context
        const params = new URLSearchParams();
        params.set("estado", "pendiente");
        if (f.selectedEspecialidadId) {
          params.set("especialidad_id", String(f.selectedEspecialidadId));
        }
        const turnosRes = await af(`/api/turnos/?${params}`);
        const turnosData: Turno[] = await turnosRes.json();

        // Combinar y deduplicar
        const allTurnos = [...timelineData, ...turnosData];
        const seen = new Set<number>();
        const unicos = allTurnos.filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
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

    if (!authLoading && user && !f.loading) {
      cargarTurnos();
    }
  }, [af, user, authLoading, today, f.loading, f.selectedEspecialidadId]);

  if (authLoading || loading || f.loading) {
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

  const turnosHoy = turnos.filter((t) => t.fecha === today);
  const turnosProximos = turnos.filter((t) => t.fecha !== today);

  function renderTurnoCard(t: Turno, esHoy: boolean) {
    const esPendiente = t.estado === "pendiente";
    const estadoColor =
      t.estado === "completado" ? "#22c55e"
        : t.estado === "en-curso" ? "#f59e0b"
          : t.estado === "cancelado" ? "#ef4444"
            : "#3b82f6";

    return (
      <div
        key={t.id}
        onClick={() => { router.push(`/medico/atender/${t.id}`); }}
        style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "14px 18px", background: "#131416",
          border: `1px solid ${esHoy && esPendiente ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 10, cursor: "pointer",
          transition: "border-color 0.15s", opacity: esPendiente ? 1 : 0.85,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; }}
        onMouseLeave={e => { if (!(esHoy && esPendiente)) e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
        <div style={{ minWidth: 64, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: esHoy && esPendiente ? "#f7f8f8" : "#8a8f98" }}>
            {t.hora}
          </div>
          {!esHoy && <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>{t.fecha}</div>}
        </div>
        <div style={{ width: 3, borderRadius: 2, height: 40, background: estadoColor }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>
            {t.paciente_nombre}{" "}
            <span style={{ fontWeight: 400, color: "#8a8f98", fontSize: 13 }}>(DNI: {t.paciente_dni || "—"})</span>
          </div>
          <div style={{ fontSize: 12, color: "#62666d", marginTop: 3 }}>
            {t.obra_social || "Particular"} • {t.tipo_visita} • {t.motivo || ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: estadoColor + "20", color: estadoColor }}>
            {t.estado === "pendiente" ? "Pendiente" : t.estado === "completado" ? "Completado" : t.estado}
          </div>
          {esPendiente && <ChevronRight size={16} color="#5e6ad2" />}
        </div>
      </div>
    );
  }

  // Info del contexto clínico activo
  const espActiva = f.selectedEspecialidadId
    ? f.especialidades.find(e => e.id === f.selectedEspecialidadId)?.nombre
    : null;
  const medActivo = f.selectedMedicoId
    ? f.medicos.find(m => m.id === f.selectedMedicoId)
    : null;
  const displayMedico = medActivo ? `Dr/a. ${medActivo.nombre} ${medActivo.apellido}` : user?.nombre || "Médico";
  const displayEsp = espActiva || "Todas las especialidades";

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header con contexto clínico */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Calendar size={16} color="#8a8f98" />
          <span style={{ fontSize: 12, color: "#8a8f98" }}>{displayEsp}</span>
          {medActivo && (
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 10,
              background: "rgba(59,130,246,0.15)", color: "#3b82f6",
            }}>
              {displayMedico}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
          📋 Agenda Médica
        </h1>
        <p style={{ fontSize: 13, color: "#8a8f98", margin: "6px 0 0" }}>
          {displayMedico} •{" "}
          {turnosHoy.length > 0
            ? `${turnosHoy.filter((t) => t.estado === "pendiente").length} pendiente(s) hoy`
            : `Sin turnos para hoy (${today})`}
        </p>
      </div>

      {/* TURNOS HOY */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#c9cdd4", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} />
          Hoy — {today}
        </h2>
        {turnosHoy.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#62666d", background: "#0f1011", borderRadius: 10 }}>
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
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#c9cdd4", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} />
            Próximos turnos pendientes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {turnosProximos.slice(0, 15).map((t) => renderTurnoCard(t, false))}
          </div>
        </div>
      )}

      {turnos.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#62666d", background: "#0f1011", borderRadius: 10 }}>
          No hay turnos pendientes en tu agenda
        </div>
      )}
    </div>
  );
}
