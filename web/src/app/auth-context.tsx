"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface Empresa {
  id: number;
  nombre: string;
  rubro?: string;
  email?: string;
  moneda?: string;
}

export interface AuthUser {
  id: number;
  empresa_id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  medico_id?: number | null;     // FK → medicos.id (presente si el usuario es médico)
  empresa?: Empresa;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  esMedico: boolean;             // derivado de user.medico_id != null
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Context = createContext<AuthCtx>({
  user: null, token: null, loading: true, esMedico: false,
  login: async () => {}, logout: () => {},
});

const API = process.env.NEXT_PUBLIC_API_URL || "/api";
const TOKEN_KEY="setubalai_token_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage — IMMEDIATE para evitar redirect loop
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem("setubalai_user_v2");
    
    // Cargar user guardado INMEDIATAMENTE para evitar redirect al login
    if (storedUser && stored) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setToken(stored);
      } catch {}
    }
    
    if (!stored) { setLoading(false); return; }
    
    // Background verify: si token expiró, se limpia
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u) { setUser(u); setToken(stored); localStorage.setItem("setubalai_user_v2", JSON.stringify(u)); }
        else { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem("setubalai_user_v2"); setUser(null); setToken(null); }
      })
      .catch(() => { /* mantener user cacheado, la próxima vez revalidar */ })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || "Error al iniciar sesión");
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const esMedico = user?.medico_id != null && user?.medico_id !== undefined;

  return (
    <Context.Provider value={{ user, token, loading, esMedico, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  return useContext(Context);
}

/** Hook para fetch autenticado — incluye el JWT + empresa_id automáticamente */
export function useAuthFetch() {
  const { token, logout, user } = useAuth();

  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (user?.empresa_id) headers["X-Empresa-Id"] = String(user.empresa_id);

    const targetUrl = url.startsWith("/") && !url.startsWith("/api") ? `${API}${url}` : url;
    const r = await fetch(targetUrl, { ...options, headers });

    // Token expirado → logout automático
    if (r.status === 401) {
      logout();
      throw new Error("Sesión expirada. Por favor iniciá sesión de nuevo.");
    }
    return r;
  }, [token, logout]);
}
