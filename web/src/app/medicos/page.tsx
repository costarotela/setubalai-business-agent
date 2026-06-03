"use client";
import { useAuthFetch } from "../auth-context";
import { useFiltrosClinica } from "../../contexts/FiltrosClinicaContext";
import BreadcrumbNav from "../../components/BreadcrumbNav";
import MedicoLink from "../../components/MedicoLink";
import { useState, useEffect, useMemo } from "react";

interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export default function MedicosPage() {
  const af = useAuthFetch();
  const f = useFiltrosClinica();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    af("/api/medicos/")
      .then(r => r.json())
      .then(setMedicos)
      .catch(err => console.error("Error cargando médicos:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filtrar por especialidad global
  const medicosFiltrados = useMemo(() => {
    if (!f.selectedEspecialidadId) return medicos;
    const esp = f.especialidades.find(e => e.id === f.selectedEspecialidadId);
    if (!esp) return medicos;
    return medicos.filter(m => {
      if (!m.especialidad || m.especialidad === "") return true;
      return m.especialidad === esp.nombre;
    });
  }, [medicos, f.selectedEspecialidadId, f.especialidades]);

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando médicos...</div>;

  return (
    <div style={{padding: "32px"}}>
      <BreadcrumbNav items={[{ label: "Profesionales" }]} />

      <div style={{marginBottom: 16}}>
        <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>Equipo Médico</h1>
        <p style={{color: "#62666d", margin: "4px 0 0"}}>
          {medicosFiltrados.length} profesional{medicosFiltrados.length !== 1 ? "es" : ""}
          {f.selectedEspecialidadId && ` en ${f.especialidades.find(e => e.id === f.selectedEspecialidadId)?.nombre || ""}`}
        </p>
      </div>

      {/* Filtro rápido */}
      <div style={{
        background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 20px", marginBottom: 24,
      }}>
        <span style={{ fontSize: 12, color: "#62666d", marginBottom: 8, display: "block" }}>Filtrar por especialidad:</span>
        <div style={{display: "flex", gap: 6, flexWrap: "wrap"}}>
          <button onClick={() => f.setEspecialidadId(null)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12,
            background: !f.selectedEspecialidadId ? "rgba(94,106,210,0.2)" : "#141517",
            color: !f.selectedEspecialidadId ? "#7170ff" : "#62666d",
            border: !f.selectedEspecialidadId ? "1px solid rgba(113,112,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer",
          }}>Todos</button>
          {f.especialidades.map(esp => (
            <button key={esp.id} onClick={() => f.setEspecialidadId(esp.id)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12,
              background: f.selectedEspecialidadId === esp.id ? "rgba(94,106,210,0.2)" : "#141517",
              color: f.selectedEspecialidadId === esp.id ? "#7170ff" : "#62666d",
              border: f.selectedEspecialidadId === esp.id ? "1px solid rgba(113,112,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}>{esp.nombre}</button>
          ))}
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16}}>
        {medicosFiltrados.map(m => (
          <div key={m.id} style={{
            background: "#111214", borderRadius: 10, padding: 20,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 12}}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(94,106,210,0.15)", border: "1px solid rgba(94,106,210,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#7170ff",
              }}>
                {m.nombre[0]}{m.apellido[0]}
              </div>
              <div>
                <div style={{fontSize: 14, fontWeight: 600}}>Dr/a. {m.nombre} {m.apellido}</div>
                <div style={{fontSize: 12, color: "#7170ff"}}>{m.especialidad || "Sin especialidad"}</div>
              </div>
            </div>
            <div style={{fontSize: 12, color: "#62666d"}}>
              <div>Matrícula: {m.matricula || "N/A"}</div>
              {m.email && <div>Email: {m.email}</div>}
              {m.telefono && <div>Tel: {m.telefono}</div>}
            </div>
          </div>
        ))}
        {medicosFiltrados.length === 0 && (
          <div style={{padding: "40px", textAlign: "center", color: "#62666d", gridColumn: "1 / -1"}}>No hay médicos registrados</div>
        )}
      </div>
    </div>
  );
}
