"use client";
import { useFiltrosClinica } from "@/contexts/FiltrosClinicaContext";

interface Props {
  onEspecialidadChange?: (id: number | null) => void;
  onMedicoChange?: (id: number | null) => void;
  showTodosMedicos?: boolean;
  className?: string;
}

/**
 * Selector cascada Especialidad → Médico
 * Usa FiltrosClinicaContext como fuente de datos.
 * Especialidad: SIEMPRE obligatoria (no hay config sin especialidad)
 * Médico: opcional — "TODOS" si no se selecciona uno
 */
export default function SelectorEspecialidadMedico({
  onEspecialidadChange,
  onMedicoChange,
  showTodosMedicos = true,
  className = "",
}: Props) {
  const {
    especialidades,
    medicosFiltrados,
    selectedEspecialidadId,
    selectedMedicoId,
    setEspecialidadId,
    setMedicoId,
  } = useFiltrosClinica();

  const handleEsp = (id: number | null) => {
    setEspecialidadId(id);
    onEspecialidadChange?.(id);
  };

  const handleMed = (val: string) => {
    const id = val === "TODOS" ? null : Number(val);
    setMedicoId(id);
    onMedicoChange?.(id);
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Especialidad — SIEMPLE requerido */}
      <div className="flex-1">
        <label className="block mb-1 text-xs font-semibold" style={{ color: "#8a8f98" }}>
          ESPECIALIDAD *
        </label>
        <select
          value={selectedEspecialidadId ?? ""}
          onChange={e => handleEsp(e.target.value ? Number(e.target.value) : null)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#27272a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#f7f8f8",
            fontSize: 14,
          }}
        >
          <option value="">Seleccionar especialidad...</option>
          {especialidades.map(e => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
        </select>
      </div>

      {/* Médico — habilitado solo con especialidad */}
      <div className="flex-1">
        <label className="block mb-1 text-xs font-semibold" style={{ color: "#8a8f98" }}>
          PROFESIONAL
        </label>
        <select
          value={selectedMedicoId ?? "TODOS"}
          onChange={e => handleMed(e.target.value)}
          disabled={!selectedEspecialidadId}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#27272a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#f7f8f8",
            fontSize: 14,
            opacity: !selectedEspecialidadId ? 0.5 : 1,
          }}
        >
          {showTodosMedicos && <option value="TODOS">Todos los profesionales</option>}
          {medicosFiltrados.map(m => (
            <option key={m.id} value={m.id}>
              {m.apellido}, {m.nombre}
            </option>
          ))}
          {selectedEspecialidadId && medicosFiltrados.length === 0 && (
            <option disabled>— sin médicos en esta especialidad —</option>
          )}
        </select>
        {!selectedEspecialidadId && (
          <p className="mt-1 text-xs" style={{ color: "#f59e0b" }}>
            ⚠ Seleccioná una especialidad primero
          </p>
        )}
      </div>
    </div>
  );
}
