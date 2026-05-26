"use client";
import { useAuthFetch } from "../auth-context";
import { useState, useEffect } from "react";

export default function NomencladoresPage() {
  const af = useAuthFetch();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    af("/api/nomenclador_practicas/")
      .then(r => r.json())
      .then(setItems)
      .catch(err => console.error("Error cargando nomencladores:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: "40px", color: "#62666d"}}>Cargando nomencladores...</div>;

  return (
    <div style={{padding: "32px"}}>
      <div style={{marginBottom: 24}}>
        <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>Nomencladores</h1>
        <p style={{color: "#62666d", margin: "4px 0 0"}}>Nomenclador federal de prácticas médicas (NABON)</p>
      </div>

      <div style={{
        background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
              {["Código", "Nombre", "Descripción"].map(h => (
                <th key={h} style={{textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{borderBottom: "1px solid rgba(255,255,255,0.04)"}}>
                <td style={{padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "#7170ff"}}>{item.codigo_nabon || "-"}</td>
                <td style={{padding: "10px 16px", fontSize: 13}}>{item.nombre}</td>
                <td style={{padding: "10px 16px", fontSize: 12, color: "#8a8f98"}}>{item.descripcion || "-"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} style={{padding: "40px", textAlign: "center", color: "#62666d"}}>No hay nomencladores configurados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
