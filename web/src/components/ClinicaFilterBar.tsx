"use client";
/**
 * ClinicaFilterBar — Panel de filtros clínicos consistente para TODAS las páginas.
 *
 * Lee la selección global del FiltrosClinicaContext.
 * Contiene SelectEspecialidadMedico (global) + slots para filtros extra.
 *
 * Uso:
 *   <ClinicaFilterBar
 *     title="Filtros"
 *     subtitle="Selecciona especialidad y médico"
 *     activeFilters={filtroEstado ? ['pendiente'] : []}
 *     onClearFilters={() => {}}
 *   >
 *     {/* Filtros adicionales de la página *\/}
 *     <input type="date" ... />
 *   </ClinicaFilterBar>
 */

import { SelectEspecialidadMedico } from "../components/SelectEspecialidadMedico";
import { useFiltrosClinica } from "../contexts/FiltrosClinicaContext";
import { Filter, X } from "lucide-react";

interface ClinicaFilterBarProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** Filtros activos no clínicos (estado, fecha, etc.) */
  activeFilters?: string[];
  onClearFilters?: () => void;
}

export default function ClinicaFilterBar({
  title = "Filtros de Búsqueda",
  subtitle,
  children,
  activeFilters,
  onClearFilters,
}: ClinicaFilterBarProps) {
  const f = useFiltrosClinica();

  const hasFilters = f.selectedEspecialidadId || f.selectedMedicoId || (activeFilters && activeFilters.length > 0);

  // Nombre de especialidad seleccionada
  const nombreEspecialidad = f.selectedEspecialidadId
    ? f.especialidades.find(e => e.id === f.selectedEspecialidadId)?.nombre
    : null;

  const nombreMedico = f.selectedMedicoId
    ? f.medicosFiltrados.find(m => m.id === f.selectedMedicoId)
    : null;

  return (
    <div style={{
      background: "#0f1011",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "24px",
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Filter size={18} color="#7170ff" />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: 12, color: "#62666d", margin: "2px 0 0" }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Clear button */}
        {hasFilters && (activeFilters ? activeFilters.length > 0 : true) && (
          <button
            onClick={() => {
              f.setEspecialidadId(null);
              f.setMedicoId(null);
              onClearFilters?.();
            }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 6,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Selects de especialidad + médico */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <SelectEspecialidadMedico
            showLabels={true}
            horizontal={true}
          />
        </div>

        {/* Slot para filtros adicionales de la página */}
        {children}
      </div>

      {/* Resumen de filtros activos */}
      {(nombreEspecialidad || nombreMedico || (activeFilters && activeFilters.length > 0)) && (
        <div style={{
          marginTop: 16,
          padding: "10px 14px",
          background: "rgba(94,106,210,0.08)",
          border: "1px solid rgba(94,106,210,0.2)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "#8a8f98",
        }}>
          {nombreEspecialidad && (
            <>
              <div style={{
                width: 10, height: 10, borderRadius: 3,
                background: f.especialidades.find(e => e.nombre === nombreEspecialidad)?.color_hex || "#7170ff",
              }} />
              <strong style={{ color: "#f7f8f8" }}>{nombreEspecialidad}</strong>
            </>
          )}
          {nombreMedico && (
            <span>· Dr/a. {nombreMedico.nombre} {nombreMedico.apellido}</span>
          )}
          {activeFilters && activeFilters.length > 0 && (
            <span>· {activeFilters.join(", ")}</span>
          )}
        </div>
      )}
    </div>
  );
}
