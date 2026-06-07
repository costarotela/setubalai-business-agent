"use client";
/**
 * FiltrosClinicaContext — ÚNICA fuente de verdad para estado clínico global.
 *
 * Jerarquía:
 *   empresa_id → especialidades → médicos (todos cacheados) → prácticas
 *
 * Carga UNA VEZ al montar (post-login), cachea todo, expone selección
 * global persistente entre páginas.
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
import { useAuthFetch, useAuth } from "../app/auth-context";

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
  tipo: string;
  especialidad_requerida: string | null;
  precio_particular: number | null;
  requiere_autorizacion: boolean;
  activo: boolean;
}

export interface FiltrosState {
  // Datos cacheados (cargar UNA VEZ)
  especialidades: Especialidad[];
  medicos: Medico[];         // TODOS los médicos, no filtrados
  practicas: Practica[];

  // Selección global (persiste entre páginas)
  selectedEspecialidadId: number | null;
  selectedMedicoId: number | null;

  // Role info del usuario logueado
  usuarioMedicoId: number | null;  // medico_id del usuario (null si no es médico)
  contextoBloqueado: boolean;       // true = médico (no puede cambiar)

  // Actions mutables
  setEspecialidadId: (id: number | null) => void;
  setMedicoId: (id: number | null) => void;

  // Derived data (memoizados)
  medicosFiltrados: Medico[];      // filtrados por especialidad seleccionada
  practicasFiltradas: Practica[];  // filtradas por especialidad seleccionada
  // UI state
  loading: boolean;
  error: string | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Context = createContext<FiltrosState | null>(null);

// ─── Helpers de format ─────────────────────────────────────────────────

function formatEspecialidades(data: unknown): Especialidad[] {
  const arr = (data as any)?.especialidades || (data as any) || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((e: any) => ({
    id: e.id,
    nombre: e.nombre || "",
    codigo: e.codigo || null,
    color_hex: e.color_hex || null,
    duracion_turno_default: e.duracion_turno_default || null,
  }));
}

function formatMedicos(data: unknown): Medico[] {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((m: any) => ({
    id: m.id,
    nombre: m.nombre || "",
    apellido: m.apellido || "",
    especialidades: Array.isArray(m.especialidades) ? m.especialidades : [],
  }));
}

function formatPracticas(data: unknown): Practica[] {
  const arr = Array.isArray(data) ? data : [];
  return arr.map((p: any) => ({
    id: p.id,
    descripcion: p.descripcion || p.nombre || "",
    tipo: p.tipo || "Consulta",
    especialidad_requerida: p.especialidad_requerida || null,
    precio_particular: p.precio_particular || null,
    requiere_autorizacion: !!p.requiere_autorizacion,
    activo: p.activo !== false,
  }));
}

// ─── Provider ────────────────────────────────────────────────────────────

export function FiltrosClinicaProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { user } = useAuth();
  const af = useAuthFetch();

  // Datos raw
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [practicas, setPracticas] = useState<Practica[]>([]);

  // Selección global — SIEMPRE hay una seleccionada por defecto
  const [selectedEspecialidadId, setSelectedEspecialidadId] = useState<number | null>(null);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);

  // Detectar si el usuario es médico
  const usuarioMedicoId = (user as any)?.medico_id || null;
  const rol = user?.rol || "";
  const contextoBloqueado = !!usuarioMedicoId; // médico → bloqueado, admin/recep → libre

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset al cambiar token
  useEffect(() => {
    setEspecialidades([]);
    setMedicos([]);
    setPracticas([]);
    setSelectedEspecialidadId(null);
    setSelectedMedicoId(null);
    setLoading(true);
    setError(null);
  }, [token]);

  // ── Cargar especialidades, TODOS los médicos, y prácticas UNA VEZ ──
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      af("/especialidades/").then(r => r.json()),
      af("/medicos/").then(r => r.json()),
      af("/nomenclador_practicas/").then(r => r.json()),
    ])
      .then(([espData, medData, pracData]) => {
        if (cancelled) return;
        const espArr = formatEspecialidades(espData);
        const medArr = formatMedicos(medData);
        const pracArr = formatPracticas(pracData);
        setEspecialidades(espArr);
        setMedicos(medArr);
        setPracticas(pracArr);

        // ── AUTO-SELECCIÓN según ROL ──
        if (espArr.length > 0) {
          // Verificar si el usuario logueado es médico
          if (usuarioMedicoId) {
            // MÉDICO: seleccionar SU especialidad + ÉL MISMO
            const med = medArr.find(m => m.id === usuarioMedicoId);
            if (med) {
              // Buscar la especialidad del médico
              const medEspNombre = med.especialidades.find((es: string) => true);
              const esp = espArr.find(e => e.nombre === medEspNombre);
              if (esp) {
                setSelectedEspecialidadId(esp.id);
              }
              setSelectedMedicoId(med.id);
            }
          } else {
            // ADMIN/RECEPCIONISTA: primera especialidad + primer médico
            const firstEsp = espArr[0];
            setSelectedEspecialidadId(firstEsp.id);
            const firstMed = medArr.find(m =>
              m.especialidades.length === 0 ||
              m.especialidades.some((es: string | { nombre?: string }) => {
                if (typeof es === "string") return es === firstEsp.nombre;
                if (es.nombre) return es.nombre === firstEsp.nombre;
                return false;
              })
            );
            if (firstMed) {
              setSelectedMedicoId(firstMed.id);
            }
          }
        }
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
  }, [af, token, user, usuarioMedicoId]);

  // ── Actions — BLOQUEADAS si el usuario es médico ──
  const setEspecialidadId = useCallback((id: number | null) => {
    if (contextoBloqueado) return; // médico NO puede cambiar
    setSelectedEspecialidadId(id);
    setSelectedMedicoId(null);
  }, [contextoBloqueado]);

  const setMedicoId = useCallback((id: number | null) => {
    if (contextoBloqueado) return; // médico NO puede cambiar
    setSelectedMedicoId(id);
  }, [contextoBloqueado]);

  // ── Derived data (memoizados) ────────────────────────────────────────
  const medicosFiltrados = useMemo(() => {
    if (!selectedEspecialidadId || medicos.length === 0) return medicos;
    const esp = especialidades.find(e => e.id === selectedEspecialidadId);
    if (!esp) return medicos;
    // Filtrar médicos que tengan esta especialidad
    // Un médico puede tener especialidades como string[] o como {id, nombre}[]
    return medicos.filter(m => {
      if (m.especialidades.length === 0) return true; // sin especialidad asignada → mostrar siempre
      return m.especialidades.some(
        (es: string | { id?: number; nombre?: string }) => {
          if (typeof es === "string") return es === esp.nombre;
          if (es.nombre) return es.nombre === esp.nombre;
          if (es.id) return es.id === selectedEspecialidadId;
          return false;
        }
      );
    });
  }, [medicos, selectedEspecialidadId, especialidades]);

  const practicasFiltradas = useMemo(() => {
    if (!selectedEspecialidadId) return practicas;
    const esp = especialidades.find(e => e.id === selectedEspecialidadId);
    if (!esp) return practicas;
    return practicas.filter(p =>
      !p.especialidad_requerida || p.especialidad_requerida === esp.nombre
    );
  }, [practicas, selectedEspecialidadId, especialidades]);

  // ─── Value ────────────────────────────────────────────────────────────
  const value = useMemo<FiltrosState>(() => ({
    especialidades,
    medicos,
    practicas,
    selectedEspecialidadId,
    selectedMedicoId,
    setEspecialidadId,
    setMedicoId,
    medicosFiltrados,
    practicasFiltradas,
    usuarioMedicoId,
    contextoBloqueado,
    loading,
    error,
  }), [
    especialidades, medicos, practicas,
    selectedEspecialidadId, selectedMedicoId,
    setEspecialidadId, setMedicoId,
    medicosFiltrados, practicasFiltradas,
    usuarioMedicoId, contextoBloqueado,
    loading, error,
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
