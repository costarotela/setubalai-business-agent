"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3, Users, DollarSign, Package,
  LayoutDashboard, Zap, Wrench, Building2, LogOut, Settings,
  Stethoscope, Calendar, FileText, ClipboardList, UserCog
} from "lucide-react";
import { AuthProvider, useAuth } from "./auth-context";

// === INTERFAZ PRODUCTOS (Comercio general) ===
const PRODUCTOS_MENU = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard",  path: "/dashboard",  icon: LayoutDashboard },
      { name: "Clientes",   path: "/clientes",   icon: Users     },
      { name: "Cobros",    path: "/cobros",     icon: DollarSign },
      { name: "Reportes",  path: "/reportes",   icon: BarChart3  },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { name: "Productos",    path: "/productos",    icon: Package   },
    ],
  },
  {
    label: "Administración",
    items: [
      { name: "Proveedores",    path: "/proveedores",    icon: Building2 },
      { name: "Configuración",  path: "/configuracion",  icon: Settings  },
    ],
  },
];

// === INTERFAZ SALUD (Clínicas, diagnóstico por imágenes, etc) ===
const SALUD_MENU = [
  {
    label: "Atención",
    items: [
      { name: "Dashboard",   path: "/dashboard",   icon: LayoutDashboard },
      { name: "Pacientes",   path: "/pacientes",     icon: Users        },
      { name: "Médicos",     path: "/medicos",       icon: Stethoscope   },
      { name: "Turnos",      path: "/turnos",        icon: Calendar      },
    ],
  },
  {
    label: "Clínico",
    items: [
      { name: "Historia Clínica",  path: "/historia-clinica",  icon: ClipboardList },
      { name: "Prácticas Médicas", path: "/practicas",         icon: FileText       },
    ],
  },
  {
    label: "Administración",
    items: [
      { name: "Nomencladores",    path: "/nomencladores",      icon: Building2 },
      { name: "Obras Sociales",   path: "/obras-sociales",     icon: DollarSign },
      { name: "Config. Agenda",   path: "/configuracion/agenda", icon: UserCog   },
      { name: "Configuración",    path: "/configuracion",      icon: Settings   },
    ],
  },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, loading, logout } = useAuth();

  // Detectar vertical por rubro
  const rubroLower  = (user?.empresa?.rubro || "").toLowerCase();
  const esSalud     = rubroLower === "salud" || rubroLower === "médico" || rubroLower === "clínica" || rubroLower === "clinica";
  const menuGroups  = esSalud ? SALUD_MENU : PRODUCTOS_MENU;

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#0a0b0e",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#62666d", fontSize: 14,
    }}>
      Cargando...
    </div>
  );

  if (!user) {
    return <>{children}</>;
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
              <div style={{ fontWeight: 600, fontSize: 14, color: "#f7f8f8", letterSpacing: "-0.2px" }}>
                {user.empresa?.nombre || "Business Agent"}
              </div>
              <div style={{ fontSize: 11, color: "#62666d", marginTop: 1 }}>
                {user.empresa?.rubro || "Gestión Inteligente"}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {menuGroups.map((group) => (
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

        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(113,112,255,0.2)", border: "1px solid rgba(113,112,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#7170ff", flexShrink: 0,
            }}>
              {user.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f7f8f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.nombre.split(" ")[0]}
              </div>
              <div style={{ fontSize: 10, color: "#62666d", textTransform: "capitalize" }}>{user.rol}</div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", background: "transparent",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7,
              padding: "7px 10px", fontSize: 12, color: "#62666d",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <LogOut size={12} /> Cerrar sesión
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
