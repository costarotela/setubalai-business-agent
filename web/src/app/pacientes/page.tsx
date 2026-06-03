"use client";
import { useAuthFetch } from "../auth-context";
import { useFiltrosClinica } from "../../contexts/FiltrosClinicaContext";
import ClinicaFilterBar from "../../components/ClinicaFilterBar";
import { useState, useEffect, useCallback } from "react";
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

  // Cargar pacientes — refresca AUTOMÁTICAMENTE al cambiar especialidad o médico
  const cargarPacientes = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/pacientes";
      const params = new URLSearchParams();
      if (f.selectedEspecialidadId) params.set("especialidad_id", String(f.selectedEspecialidadId));
      if (f.selectedMedicoId) params.set("medico_id", String(f.selectedMedicoId));
      if (params.toString()) url += `?${params.toString()}`;
      const r = await af(url);
      const data = await r.json();
      setPacientes(Array.isArray(data) ? data : data.pacientes || data.results || []);
    } catch (err) {
      console.error("Error cargando pacientes:", err);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [af, f.selectedEspecialidadId, f.selectedMedicoId]);

  useEffect(() => {
    if (f.especialidades.length > 0) {
      cargarPacientes();
    }
  }, [f.especialidades.length, cargarPacientes]);

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

      <ClinicaFilterBar
        title="Contexto Clínico"
        subtitle="Pacientes se filtran por especialidad y médico seleccionados"
        onClearFilters={() => setSearch("")}
      />

      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24}}>
        <div>
          <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>
            Pacientes
            {f.selectedMedicoId && (
              <span style={{fontSize: 13, fontWeight: 400, color: "#62666d", marginLeft: 10}}>
                · {f.medicosFiltrados.find(m => m.id === f.selectedMedicoId)?.nombre} {f.medicosFiltrados.find(m => m.id === f.selectedMedicoId)?.apellido}
              </span>
            )}
          </h1>
          <p style={{color: "#62666d", margin: "4px 0 0"}}>{pacientes.length} pacientes encontrados</p>
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
