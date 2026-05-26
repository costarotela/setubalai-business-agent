"use client";
import { useAuthFetch } from "../auth-context";
import { useState, useEffect } from "react";

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
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    af("/api/medicos/")
      .then(r => r.json())
      .then(setMedicos)
      .catch(err => console.error("Error cargando médicos:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando médicos...</div>;

  return (
    <div style={{padding: "32px"}}>
      <div style={{marginBottom: 24}}>
        <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>Equipo Médico</h1>
        <p style={{color: "#62666d", margin: "4px 0 0"}}>Médicos y profesionales activos</p>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16}}>
        {medicos.map(m => (
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
        {medicos.length === 0 && (
          <div style={{padding: "40px", textAlign: "center", color: "#62666d", gridColumn: "1 / -1"}}>No hay médicos registrados</div>
        )}
      </div>
    </div>
  );
}
