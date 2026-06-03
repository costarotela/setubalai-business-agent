"use client";
/**
 * PatientLink — Link clicable a cualquier nombre de paciente.
 * Navega a /pacientes/[id]/historial
 *
 * Uso:
 *   <PatientLink id={t.paciente_id} nombre={t.paciente_nombre} />
 *   <PatientLink id={pac.id} nombre={`${pac.nombre} ${pac.apellido}`} />
 */

import Link from "next/link";

interface PatientLinkProps {
  id: number | string;
  nombre: string;
  className?: string;
  style?: React.CSSProperties;
  /** Si true, muestra "Ver historial →" como texto adicional */
  withAction?: boolean;
}

export default function PatientLink({
  id,
  nombre,
  className,
  style,
  withAction = false,
}: PatientLinkProps) {
  return (
    <Link
      href={`/pacientes/${id}/historial`}
      className={className}
      style={{
        color: "#7170ff",
        textDecoration: "none",
        borderBottom: "1px dotted rgba(113,112,255,0.4)",
        cursor: "pointer",
        transition: "color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#a5a4ff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#7170ff"; }}
    >
      {nombre}
      {withAction && <span style={{ fontSize: 10, opacity: 0.7 }}> →</span>}
    </Link>
  );
}
