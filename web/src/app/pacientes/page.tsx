"use client";
import { useAuthFetch } from "../auth-context";
import { useFiltrosClinica } from "../../contexts/FiltrosClinicaContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BreadcrumbNav from "../../components/BreadcrumbNav";

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  obra_social?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  email?: string;
  empresa_id: number;
}

export default function PacientesPage() {
  const af = useAuthFetch();
  const f = useFiltrosClinica();
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    af("/api/pacientes")
      .then(r => r.json())
      .then(setPacientes)
      .catch(err => console.error("Error cargando pacientes:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pacientes.filter(p => {
    const q = search.toLowerCase();
    return p.nombre.toLowerCase().includes(q)
      || p.apellido.toLowerCase().includes(q)
      || p.dni.toLowerCase().includes(q);
  });

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando pacientes...</div>;

  return (
    <div style={{padding: "32px"}}>
      <BreadcrumbNav items={[{ label: "Pacientes" }]} />

      {/* Contexto clínico activo */}
      <div style={{
        background: "#0f1011", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12, padding: "16px 20px", marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: "#62666d", marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>Contexto clínico:</span>
          {f.selectedEspecialidadId && (
            <span style={{ color: "#7170ff", marginLeft: 8 }}>
              {f.especialidades.find(e => e.id === f.selectedEspecialidadId)?.nombre}
            </span>
          )}
          {f.selectedMedicoId && (
            <span style={{ color: "#10b981", marginLeft: 8 }}>
              → Dr/a. {f.medicosFiltrados.find(m => m.id === f.selectedMedicoId)?.nombre} {f.medicosFiltrados.find(m => m.id === f.selectedMedicoId)?.apellido}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase" }}>Especialidad</label>
            <select
              value={f.selectedEspecialidadId ?? ""}
              onChange={(e) => f.setEspecialidadId(e.target.value ? parseInt(e.target.value) : null)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, background: "#08090a", border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13 }}
            >
              <option value="">--</option>
              {f.especialidades.map(esp => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#62666d", textTransform: "uppercase" }}>Médico</label>
            <select
              value={f.selectedMedicoId ?? ""}
              onChange={(e) => f.setMedicoId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!f.selectedEspecialidadId}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 6, background: "#08090a",
                border: "1px solid rgba(255,255,255,0.08)", color: "#f7f8f8", fontSize: 13,
                opacity: f.selectedEspecialidadId ? 1 : 0.5,
              }}
            >
              <option value="">Todos</option>
              {f.medicosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre} {m.apellido}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <div>
          <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>Pacientes</h1>
          <p style={{color: "#62666d", margin: "4px 0 0"}}>Gestión de pacientes y datos clínicos</p>
        </div>
      </div>

      <input
        placeholder="Buscar por nombre, apellido o DNI..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 8,
          background: "#141517", border: "1px solid rgba(255,255,255,0.08)",
          color: "#f7f8f8", fontSize: 13, marginBottom: 16,
        }}
      />

      <div style={{
        background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
              {["Nombre", "DNI", "Obra Social", "Teléfono", "Email"].map(h => (
                <th key={h} style={{textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer"}}
                onClick={() => router.push(`/pacientes/${p.id}/historial`)}>
                <td style={{padding: "10px 16px", fontSize: 13}}>{p.nombre} {p.apellido}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{p.dni}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{p.obra_social || "-"}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{p.telefono || "-"}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{p.email || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{padding: "40px", textAlign: "center", color: "#62666d"}}>No se encontraron pacientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
