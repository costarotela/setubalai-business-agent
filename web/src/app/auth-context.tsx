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
  empresa?: Empresa;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Context = createContext<AuthCtx>({
  user: null, token: null, loading: true,
  login: async () => {}, logout: () => {},
});

const API = process.env.NEXT_PUBLIC_API_URL || "/api";
const TOKEN_KEY = "setubalai_token_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setLoading(false); return; }
    // Verify token still valid
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u) { setUser(u); setToken(stored); }
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
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

  return (
    <Context.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  return useContext(Context);
}

/** Hook para fetch autenticado — incluye el JWT automáticamente */
export function useAuthFetch() {
  const { token, logout } = useAuth();

  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(url, { ...options, headers });

    // Token expirado → logout automático
    if (r.status === 401) {
      logout();
      throw new Error("Sesión expirada. Por favor iniciá sesión de nuevo.");
    }
    return r;
  }, [token, logout]);
}
