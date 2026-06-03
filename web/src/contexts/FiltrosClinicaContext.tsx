"use client";
/**
 * FiltrosClinicaContext — Datos de la clínica, cargados UNA VEZ al montar.
 *
 * Jerarquía sagrada:
 *   empresa_id → especialidades → médicos → slots/prácticas
 *
 * Este provider carga las especialidades y nomenclador de la clínica
 * al inicio, cachea todo, y expone un hook para que cualquier
 * componente consuma los datos sin refetch.
 *
 * Al cambiar la especialidad seleccionada → recarga médicos filtrados.
 *
 * Uso:
 *   <FiltrosClinicaProvider>
 *     <AppShell>{children}</AppShell>
 *   </FiltrosClinicaProvider>
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuthFetch } from "../app/auth-context";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Especialidad {
  id: number;
  nombre: string;
  codigo: string | null;
  color_hex: string | null;
  duracion_turno_default: number | null;
}

export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: string[];
}

export interface Practica {
  id: number;
  descripcion: string;
  tipo: string;       // "Consulta" | "Estudio"
  especialidad_requerida: string | null;
  precio_particular: number | null;
  requiere_autorizacion: boolean;
  activo: boolean;
}

interface FiltrosState {
  // Datos cargados UNA VEZ al montar
  especialidades: Especialidad[];
  practicas: Practica[];

  // Datos dependientes (se recargan al cambiar especialidad)
  medicos: Medico[];

  // Selecciones del usuario
  selectedEspecialidadId: number | null;
  selectedMedicoId: number | null;

  // Actions
  setEspecialidadId: (id: number | null) => void;
  setMedicoId: (id: number | null) => void;

  // Nomenclador filtrado por especialidad seleccionada
  practicasFiltradas: Practica[];

  // UI
  loading: boolean;
  error: string | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Context = createContext<FiltrosState | null>(null);

export function FiltrosClinicaProvider({ children }: { children: ReactNode }) {
  const af = useAuthFetch();

  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [practicas, setPracticas] = useState<Practica[]>([]);
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | null>(null);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Cargar especialidades + prácticas UNA VEZ al montar ──────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      af("/especialidades/", { cache: "no-store" }).then(r => r.json()),
      af("/nomenclador_practicas/", { cache: "no-store" }).then(r => r.json()),
    ])
      .then(([espData, pracData]) => {
        if (cancelled) return;

        // Especialidades: { total, especialidades: [...] }
        const espArr = espData?.especialidades || espData || [];
        const formattedEsps: Especialidad[] = espArr.map((e: any) => ({
          id: e.id,
          nombre: e.nombre,
          codigo: e.codigo || null,
          color_hex: e.color_hex || null,
          duracion_turno_default: e.duracion_turno_default || null,
        }));
        setEspecialidades(formattedEsps);

        // Prácticas (nomenclador): array directo
        const pracArr = Array.isArray(pracData) ? pracData : [];
        const formattedPrac: Practica[] = pracArr.map((p: any) => ({
          id: p.id,
          descripcion: p.descripcion || p.nombre || "",
          tipo: p.tipo || "Consulta",
          especialidad_requerida: p.especialidad_requerida || null,
          precio_particular: p.precio_particular || null,
          requiere_autorizacion: !!p.requiere_autorizacion,
          activo: p.activo !== false,
        }));
        setPracticas(formattedPrac);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("[FiltrosClinica] Error cargando datos:", err);
        setError(err.message || "Error cargando datos de la clínica");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [af]);

  // ── Cargar médicos al cambiar especialidad ───────────────────────────────
  useEffect(() => {
    if (!selectedEspecialidadId) {
      setMedicos([]);
      return;
    }

    let cancelled = false;

    af(`/medicos/?especialidad_id=${selectedEspecialidadId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const medArr = Array.isArray(data) ? data : [];
        const formattedMeds: Medico[] = medArr.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          apellido: m.apellido,
          especialidades: Array.isArray(m.especialidades) ? m.especialidades : [],
        }));
        setMedicos(formattedMeds);
      })
      .catch(err => {
        if (cancelled) return;
        console.error("[FiltrosClinica] Error cargando médicos:", err);
        setMedicos([]);
      });

    return () => { cancelled = true; };
  }, [selectedEspecialidadId, af]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const setEspecialidadId = useCallback((id: number | null) => {
    setSelectedEspecialidadId(id);
    setSelectedMedicoId(null); // reset médico al cambiar especialidad
  }, []);

  const setMedicoId = useCallback((id: number | null) => {
    setSelectedMedicoId(id);
  }, []);

  // ── Nomenclador filtrado por especialidad (memo) ────────────────────────
  const practicasFiltradas = useMemo(() => {
    if (!selectedEspecialidadId) return practicas;
    const esp = especialidades.find(e => e.id === selectedEspecialidadId);
    if (!esp) return practicas;

    return practicas.filter(p =>
      !p.especialidad_requerida || p.especialidad_requerida === esp.nombre
    );
  }, [practicas, selectedEspecialidadId, especialidades]);

  const value = useMemo<FiltrosState>(() => ({
    especialidades,
    practicas,
    medicos,
    selectedEspecialidadId,
    selectedMedicoId,
    setEspecialidadId,
    setMedicoId,
    practicasFiltradas,
    loading,
    error,
  }), [
    especialidades, medicos, practicas,
    selectedEspecialidadId, selectedMedicoId,
    setEspecialidadId, setMedicoId,
    practicasFiltradas, loading, error,
  ]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useFiltrosClinica(): FiltrosState {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useFiltrosClinica() must be used inside <FiltrosClinicaProvider>");
  }
  return ctx;
}
