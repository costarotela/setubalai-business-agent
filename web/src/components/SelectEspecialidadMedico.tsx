"use client";
/**
 * SelectEspecialidadMedico — Selects dependientes de especialidad → médico.
 *
 * Two variants:
 *   variant="global" (default): Lee y escribe en FiltrosClinicaContext.
 *     Un cambio aquí se refleja en TODAS las páginas clínicas.
 *     Para usar en ClinicaFilterBar y filtros de páginas.
 *
 *   variant="local": Estado interno propio, NO toca el Context global.
 *     Devuelve callbacks onEspecialidadChange / onMedicoChange.
 *     Para formularios donde se necesita selección sin afectar la app.
 *
 * SelectSoloEspecialidad: solo el select de especialidad (mismas variantes).
 */

import { useState, useMemo, type ReactNode } from "react";
import { useFiltrosClinica } from "../contexts/FiltrosClinicaContext";

// ─── Shared styles ─────────────────────────────────────────────────

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

// ─── Common types ──────────────────────────────────────────────────

interface CommonProps {
  showLabels?: boolean;
  className?: string;
  horizontal?: boolean;
}

// ─── GLOBAL variant (reads/writes Context) ─────────────────────────

interface GlobalProps extends CommonProps {
  variant?: "global";
  onEspecialidadChange?: never;
  onMedicoChange?: never;
}

// ─── LOCAL variant (owns state, returns callbacks) ─────────────────

interface LocalProps extends CommonProps {
  variant: "local";
  onEspecialidadChange?: (id: number | null) => void;
  onMedicoChange?: (id: number | null) => void;
}

type SelectProps = GlobalProps | LocalProps;

// ─── EspecialidadMedico (especialidad + médico) ────────────────────

export function SelectEspecialidadMedico(props: SelectProps) {
  const { showLabels = true, className, horizontal = false } = props;

  if (props.variant === "local") {
    return <SelectLocal {...props} />;
  }

  return <SelectGlobal showLabels={showLabels} className={className} horizontal={horizontal} />;
}

// ─── SelectGlobal — reads/writes Context ───────────────────────────

function SelectGlobal({
  showLabels,
  className,
  horizontal,
}: CommonProps) {
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
      {/* Especialidad */}
      <div>
        {showLabels && <label style={labelStyle}>Especialidad</label>}
        <select
          value={f.selectedEspecialidadId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            f.setEspecialidadId(val);
          }}
          style={selectStyle}
        >
          <option value="">Seleccionar…</option>
          {f.especialidades.map((esp) => (
            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
          ))}
        </select>
      </div>

      {/* Médico (dependiente) */}
      <div>
        {showLabels && <label style={labelStyle}>Médico</label>}
        <select
          value={f.selectedMedicoId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            f.setMedicoId(val);
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
          ) : f.medicosFiltrados.length === 0 ? (
            <option value="">Sin médicos en esta especialidad</option>
          ) : (
            <>
              <option value="">Todos</option>
              {f.medicosFiltrados.map((m) => (
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

// ─── SelectLocal — own state, returns callbacks ────────────────────

function SelectLocal({
  showLabels = true,
  className,
  horizontal = false,
  onEspecialidadChange,
  onMedicoChange,
}: LocalProps) {
  const f = useFiltrosClinica();

  // State interno propio — NO toca el Context global
  const [localEspId, setLocalEspId] = useState<number | null>(null);
  const [localMedId, setLocalMedId] = useState<number | null>(null);

  const wrapperStyle: React.CSSProperties = horizontal
    ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
    : { display: "flex", flexDirection: "column", gap: 12 };

  const medicosFiltrados = useMemo(() => {
    if (!localEspId || f.medicos.length === 0) return f.medicos;
    const esp = f.especialidades.find(e => e.id === localEspId);
    if (!esp) return f.medicos;
    return f.medicos.filter(m => {
      if (m.especialidades.length === 0) return true;
      return m.especialidades.some(
        (es: string | { nombre?: string }) => {
          if (typeof es === "string") return es === esp.nombre;
          if (es.nombre) return es.nombre === esp.nombre;
          return false;
        }
      );
    });
  }, [f.medicos, f.especialidades, localEspId]);

  if (f.loading) {
    return <div style={{ padding: "10px 14px", fontSize: 13, color: "#62666d" }}>Cargando…</div>;
  }

  if (f.error) {
    return <div style={{ padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{f.error}</div>;
  }

  return (
    <div className={className} style={wrapperStyle}>
      {/* Especialidad */}
      <div>
        {showLabels && <label style={labelStyle}>Especialidad</label>}
        <select
          value={localEspId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            setLocalEspId(val);
            setLocalMedId(null); // Reset médico
            onEspecialidadChange?.(val);
          }}
          style={selectStyle}
        >
          <option value="">Seleccionar…</option>
          {f.especialidades.map((esp) => (
            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
          ))}
        </select>
      </div>

      {/* Médico */}
      <div>
        {showLabels && <label style={labelStyle}>Médico</label>}
        <select
          value={localMedId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            setLocalMedId(val);
            onMedicoChange?.(val);
          }}
          style={{
            ...selectStyle,
            opacity: localEspId ? 1 : 0.5,
            cursor: localEspId ? "pointer" : "not-allowed",
          }}
          disabled={!localEspId}
        >
          {!localEspId ? (
            <option value="">Seleccionar especialidad primero…</option>
          ) : medicosFiltrados.length === 0 ? (
            <option value="">Sin médicos en esta especialidad</option>
          ) : (
            <>
              <option value="">Todos</option>
              {medicosFiltrados.map((m) => (
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

// ─── SelectSoloEspecialidad — solo especialidad ─────────────────────

interface SoloProps {
  variant?: "global" | "local";
  onEspecialidadChange?: (id: number | null) => void;
  showLabels?: boolean;
  className?: string;
}

export function SelectSoloEspecialidad({
  variant = "global",
  onEspecialidadChange,
  showLabels = true,
  className,
}: SoloProps) {
  const f = useFiltrosClinica();

  if (variant === "local") {
    // Local state
    const [localEspId, setLocalEspId] = useState<number | null>(null);

    if (f.loading) {
      return <div style={{ padding: "10px 14px", fontSize: 13, color: "#62666d" }}>Cargando…</div>;
    }

    return (
      <div className={className}>
        {showLabels && <label style={labelStyle}>Especialidad</label>}
        <select
          value={localEspId ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : null;
            setLocalEspId(val);
            onEspecialidadChange?.(val);
          }}
          style={selectStyle}
        >
          <option value="">Seleccionar…</option>
          {f.especialidades.map((esp) => (
            <option key={esp.id} value={esp.id}>{esp.nombre}</option>
          ))}
        </select>
      </div>
    );
  }

  // Global — reads/writes Context
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
        }}
        style={selectStyle}
      >
        <option value="">Seleccionar…</option>
        {f.especialidades.map((esp) => (
          <option key={esp.id} value={esp.id}>{esp.nombre}</option>
        ))}
      </select>
    </div>
  );
}
