"use client";
/**
 * MedicoLink — Link clicable a cualquier nombre de médico.
 * Hace: clic → filtra Context por médico y navega a /agenda/slots-libres
 *        (para ver los slots disponibles de ese médico)
 *
 * Uso:
 *   <MedicoLink id={t.medico_id} nombre={t.medico_nombre} />
 */

import { useRouter } from "next/navigation";
import { useFiltrosClinica } from "../contexts/FiltrosClinicaContext";

interface MedicoLinkProps {
  id: number | string;
  nombre: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function MedicoLink({
  id,
  nombre,
  className,
  style,
}: MedicoLinkProps) {
  const router = useRouter();
  const f = useFiltrosClinica();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Set médico en Context global y navegar a agenda
    const medicoId = typeof id === "string" ? parseInt(id) : id;
    f.setMedicoId(medicoId);
    router.push("/agenda/slots-libres");
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={className}
      style={{
        color: "#10b981",
        textDecoration: "none",
        borderBottom: "1px dotted rgba(16,185,129,0.4)",
        cursor: "pointer",
        transition: "color 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#34d399"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#10b981"; }}
    >
      {nombre}
    </a>
  );
}
