"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";

export default function ConfiguracionAgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { especialidades, selectedEspecialidadId, setEspecialidadId } = useFiltrosClinica();

  const tabs = [
    { id: "profesionales", label: "👨‍⚕️ Profesionales", href: "/configuracion/agenda/profesionales" },
    { id: "grillas", label: "📅 Grillas", href: "/configuracion/agenda/grillas" },
    { id: "bloqueos", label: "🚫 Bloqueos", href: "/configuracion/agenda/bloqueos" },
    { id: "duraciones", label: "⏱️ Duraciones", href: "/configuracion/agenda/duraciones" },
    { id: "prestaciones", label: "💊 Prestaciones", href: "/configuracion/agenda/prestaciones" },
  ];

  const isSelected = !!selectedEspecialidadId;
  const espSeleccionada = especialidades.find(e => e.id === selectedEspecialidadId);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
              ⚙️ Configuración de Agenda Médica
            </h1>
            <p style={{ fontSize: 13, color: "#62666d", margin: "6px 0 0" }}>
              Gestión de horarios, bloqueos y prestaciones para el sistema de turnos
            </p>
          </div>
          {/* Selector de especialidad */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Filtrar por especialidad:
            </label>
            <select
              value={selectedEspecialidadId || ""}
              onChange={e => setEspecialidadId(e.target.value ? Number(e.target.value) : null)}
              style={{
                padding: "8px 14px", background: isSelected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, color: "#f7f8f8", fontSize: 13, cursor: "pointer",
                minWidth: 200,
              }}
            >
              <option value="">— Todas las especialidades —</option>
              {especialidades.map(esp => (
                <option key={esp.id} value={esp.id}>{esp.nombre}</option>
              ))}
            </select>
            {isSelected && espSeleccionada && (
              <button
                onClick={() => setEspecialidadId(null)}
                style={{
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 8, padding: "6px 12px", color: "#f87171", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <nav style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map((tab) => {
            const isActive = pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                style={{
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#818cf8" : "#62666d",
                  borderBottom: isActive ? "2px solid #818cf8" : "2px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget.style.color = "#c9cbcf"); }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget.style.color = "#62666d"); }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Indicador de filtro activo */}
      {isSelected && espSeleccionada && (
        <div style={{
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10,
          padding: "10px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        }}>
          <span style={{ color: "#818cf8", fontWeight: 600 }}>🔍 Filtrando por:</span>
          <span style={{ color: "#f7f8f8", fontWeight: 500 }}>{espSeleccionada.nombre}</span>
          <span style={{ color: "#62666d" }}>— mostramos solo datos de esta especialidad</span>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
}
