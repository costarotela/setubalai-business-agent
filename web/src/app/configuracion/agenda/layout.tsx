"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ConfiguracionAgendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { id: "profesionales", label: "👨‍⚕️ Profesionales", href: "/configuracion/agenda/profesionales" },
    { id: "grillas", label: "📅 Grillas Horarias", href: "/configuracion/agenda/grillas" },
    { id: "bloqueos", label: "🚫 Bloqueos", href: "/configuracion/agenda/bloqueos" },
    { id: "duraciones", label: "⏱️ Duraciones", href: "/configuracion/agenda/duraciones" },
    { id: "prestaciones", label: "💊 Prestaciones", href: "/configuracion/agenda/prestaciones" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ⚙️ Configuración de Agenda Médica
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión de horarios, bloqueos y prestaciones para el sistema de turnos
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`
                    whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
