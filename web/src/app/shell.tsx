"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users, DollarSign,
  LayoutDashboard, Zap,
  Stethoscope, Calendar, ClipboardList
} from "lucide-react";
import { AuthProvider, useAuth } from "./auth-context";
import { FiltrosClinicaProvider } from "../contexts/FiltrosClinicaContext";

// === MENÚ CLÍNICA MULTIESPECIALIDAD ===
const CLINICA_MENU = [
  { name: "Agenda del Día",  path: "/agenda/slots-libres",                 icon: Calendar       },
  { name: "Dashboard",      path: "/dashboard",                 icon: LayoutDashboard },
  { name: "Pacientes",      path: "/pacientes",                 icon: Users            },
  { name: "Turnos",         path: "/turnos",                    icon: ClipboardList    },
  { name: "Calendario",     path: "/turnos/calendario",          icon: Calendar         },
  { name: "Profesionales",  path: "/medicos",                   icon: Stethoscope      },
] as const;

const CONFIG_MENU = [
  { name: "Especialidades",  path: "/configuracion/especialidades", icon: Stethoscope },
  { name: "Agenda",          path: "/configuracion/agenda",         icon: Calendar    },
  { name: "Obras Sociales",  path: "/obras-sociales",               icon: DollarSign  },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated
  if (!loading && !user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#08090a", color: "#f7f8f8" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, minWidth: 220,
        background: "#0f1011",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, overflowY: "auto",
      }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8" }}>
                {user?.nombre || "Usuario"}
              </div>
              <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>
                {user?.empresa?.nombre || "Empresa"}
              </div>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column" }}>
          {CLINICA_MENU.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path || (item.path === "/dashboard" && (pathname === "/" || pathname === "/dashboard"));
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 6, marginBottom: 1,
                  background: active ? "rgba(94,106,210,0.15)" : "transparent",
                  color: active ? "#7170ff" : "#8a8f98",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  cursor: "pointer",
                  border: active ? "1px solid rgba(113,112,255,0.2)" : "1px solid transparent",
                }}>
                  <Icon size={15} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Config section */}
        <div style={{ padding: "0 10px 8px" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#c9cdd4",
            letterSpacing: "0.06em", textTransform: "uppercase", padding: "8px 10px 6px",
            borderTop: "2px solid rgba(94,106,210,0.3)", marginTop: 8,
          }}>
            Configuración
          </div>
          {CONFIG_MENU.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 10px", borderRadius: 6, marginBottom: 1,
                  background: active ? "rgba(94,106,210,0.10)" : "transparent",
                  color: active ? "#7170ff" : "#62666d",
                  fontSize: 12, fontWeight: active ? 500 : 400,
                  cursor: "pointer",
                  border: active ? "1px solid rgba(113,112,255,0.15)" : "1px solid transparent",
                }}>
                  <Icon size={14} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "#62666d" }}>
          <button onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.clear();
              window.location.href = "/login";
            }
          }} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", fontSize: 11 }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: "100vh", background: "#08090a" }}>
        {children}
      </main>
    </div>
  );
}

export default function ShellProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FiltrosClinicaProvider>
        <AppShell>{children}</AppShell>
      </FiltrosClinicaProvider>
    </AuthProvider>
  );
}
