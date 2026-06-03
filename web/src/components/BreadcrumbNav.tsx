"use client";
/**
 * BreadcrumbNav — Migas de pan para vistas de detalle.
 *
 * Uso:
 *   <BreadcrumbNav items={[
 *     { label: "Inicio", href: "/" },
 *     { label: "Pacientes", href: "/pacientes" },
 *     { label: "García, Juan", href: "/pacientes/123/historial" },
 *     { label: "Historial Clínico" },  // sin href = página actual
 *   ]} />
 */

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export default function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, fontSize: 12 }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Separator (excepto primero) */}
            {i > 0 && (
              <ChevronRight size={12} color="#62666d" style={{ flexShrink: 0 }} />
            )}

            {/* Link o texto */}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                style={{
                  color: "#8a8f98",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#c9cdd4"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#8a8f98"; }}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: isLast ? "#f7f8f8" : "#62666d",
                fontWeight: isLast ? 600 : 400,
              }}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
