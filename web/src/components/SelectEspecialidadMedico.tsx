"use client";
/**
 * SelectEspecialidadMedico — Listas dependientes reutilizables
 *
 * Jerarquía: especialidad → médico (se refresca automáticamente)
 *
 * Consume el FiltrosClinicaContext (datos cargados UNA VEZ por toda la app).
 *
 * Uso:
 *   <SelectEspecialidadMedico
 *     onEspecialidadChange={(id) => setEsp(id)}
 *     onMedicoChange={(id) => setMed(id)}
 *     horizontal
 *     showLabels
 *   />
 */

import { useFiltrosClinica } from "../contexts/FiltrosClinicaContext";

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  marginTop: 4,
  background: "#0f1011",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#f7f8f8",
  fontSize: 13,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#62666d",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

interface Props {
  onEspecialidadChange?: (id: number | null) => void;
  onMedicoChange?: (id: number | null) => void;
  showLabels?: boolean;
  className?: string;
  /** Si true, renderiza ambos selects en grid 1fr 1fr horizontal */
  horizontal?: boolean;
}

export function SelectEspecialidadMedico({
  onEspecialidadChange,
  onMedicoChange,
  showLabels = true,
  className,
  horizontal = false,
}: Props) {
  const f = useFiltrosClinica();

  const wrapperStyle: React.CSSProperties = horizontal
    ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
    : { display: "flex", flexDirection: "column", gap: 12 };

  if (f.loading) {
    return <div style={{ padding: "10px 14px", fontSize: 13, color: "#62666d" }}>Cargando…</div>;
  }

  if (f.error) {
    return <div style={{ padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{f.error}</div>;
  }

  return (
    <div className={className} style={wrapperStyle}>
      {/* ── Especialidad ── */}
      <div>
        {showLabels && <label style={labelStyle}>Especialidad</label>}
        <select
          value={f.selectedEspecialidadId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            f.setEspecialidadId(val);
            onEspecialidadChange?.(val);
          }}
          style={selectStyle}
        >
          <option value="">Seleccionar…</option>
          {f.especialidades.map((esp) => (
            <option key={esp.id} value={esp.id}>
              {esp.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* ── Médico (dependiente de especialidad) ── */}
      <div>
        {showLabels && <label style={labelStyle}>Médico</label>}
        <select
          value={f.selectedMedicoId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            f.setMedicoId(val);
            onMedicoChange?.(val);
          }}
          style={{
            ...selectStyle,
            opacity: f.selectedEspecialidadId ? 1 : 0.5,
            cursor: f.selectedEspecialidadId ? "pointer" : "not-allowed",
          }}
          disabled={!f.selectedEspecialidadId}
        >
          {!f.selectedEspecialidadId ? (
            <option value="">Seleccionar especialidad primero…</option>
          ) : f.medicos.length === 0 ? (
            <option value="">Sin médicos en esta especialidad</option>
          ) : (
            <>
              <option value="">Seleccionar…</option>
              {f.medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  Dr/a. {m.nombre} {m.apellido}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
}

/**
 * SelectSoloEspecialidad — solo el select de especialidad sin médico
 * Para páginas que solo necesitan filtrar por especialidad.
 */
export function SelectSoloEspecialidad({
  onEspecialidadChange,
  showLabels = true,
  className,
}: {
  onEspecialidadChange?: (id: number | null) => void;
  showLabels?: boolean;
  className?: string;
}) {
  const f = useFiltrosClinica();

  if (f.loading) {
    return <div style={{ padding: "10px 14px", fontSize: 13, color: "#62666d" }}>Cargando…</div>;
  }

  return (
    <div className={className}>
      {showLabels && <label style={labelStyle}>Especialidad</label>}
      <select
        value={f.selectedEspecialidadId ?? ""}
        onChange={(e) => {
          const val = e.target.value ? parseInt(e.target.value) : null;
          f.setEspecialidadId(val);
          onEspecialidadChange?.(val);
        }}
        style={selectStyle}
      >
        <option value="">Seleccionar…</option>
        {f.especialidades.map((esp) => (
          <option key={esp.id} value={esp.id}>
            {esp.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
