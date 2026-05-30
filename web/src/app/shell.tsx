"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, DollarSign,
  LayoutDashboard, Zap,
  Stethoscope, Calendar, FileText, ClipboardList, UserCog, Building2, Settings
} from "lucide-react";
import { AuthProvider, useAuth } from "./auth-context";

// === INTERFAZ SALUD (Clínicas, diagnóstico por imágenes, etc) ===
const SALUD_MENU = [
  {
    label: "Atención",
    items: [
      { name: "Dashboard",   path: "/dashboard",   icon: LayoutDashboard },
      { name: "Pacientes",   path: "/pacientes",     icon: Users        },
      { name: "Médicos",     path: "/medicos",       icon: Stethoscope   },
    ],
  },
  {
    label: "Agenda",
    items: [
      { name: "Slots Libres",      path: "/agenda/slots-libres",  icon: Calendar      },
      { name: "Turnos",            path: "/turnos",               icon: ClipboardList },
    ],
  },
  {
    label: "Clínico",
    items: [
      { name: "Historia Clínica",  path: "/historia-clinica",  icon: FileText },
      { name: "Prácticas Médicas", path: "/practicas",         icon: ClipboardList },
    ],
  },
  {
    label: "Configuración",
    items: [
      { name: "Especialidades",     path: "/configuracion/especialidades", icon: Stethoscope },
      { name: "Config. Agenda",     path: "/configuracion/agenda",         icon: UserCog     },
      { name: "Nomencladores",      path: "/nomencladores",                icon: Building2   },
      { name: "Obras Sociales",     path: "/obras-sociales",               icon: DollarSign  },
    ],
  },
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
        position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50,
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

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {SALUD_MENU.map((group) => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#62666d",
                letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px 6px",
              }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path || (item.path === "/dashboard" && pathname === "/");
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
            </div>
          ))}
        </nav>

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
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
