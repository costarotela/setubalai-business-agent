"use client";
import { useState } from "react";

const obrasSociales = [
  { nombre: "OSDE", tipo: "Privada", cobertura: "Amplan 210" },
  { nombre: "Swiss Medical", tipo: "Privada", cobertura: "Plan Premium" },
  { nombre: "PAMI", tipo: "Estatal", cobertura: "Jubilados" },
  { nombre: "IOMA", tipo: "Estatal", cobertura: "Provincia de Bs. As." },
  { nombre: "Galeno", tipo: "Privada", cobertura: "Plan Oro" },
];

export default function ObrasSocialesPage() {
  const [works] = useState(obrasSociales);

  return (
    <div style={{padding: "32px"}}>
      <div style={{marginBottom: 24}}>
        <h1 style={{fontSize: 22, fontWeight: 700, margin: 0}}>Obras Sociales</h1>
        <p style={{color: "#62666d", margin: "4px 0 0"}}>Obras sociales y prepagas con convenio</p>
      </div>

      <div style={{
        background: "#111214", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
              {["Obra Social", "Tipo", "Cobertura"].map(h => (
                <th key={h} style={{textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.05em"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {works.map(w => (
              <tr key={w.nombre} style={{borderBottom: "1px solid rgba(255,255,255,0.04)"}}>
                <td style={{padding: "10px 16px", fontSize: 13, fontWeight: 500}}>{w.nombre}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{w.tipo}</td>
                <td style={{padding: "10px 16px", fontSize: 13, color: "#8a8f98"}}>{w.cobertura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
