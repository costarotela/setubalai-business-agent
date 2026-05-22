"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Zap } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!r.ok) {
        setError("Credenciales inválidas");
        setLoading(false);
        return;
      }

      const data = await r.json();
      
      // Verificar que sea superadmin
      if (data.user?.rol !== "superadmin") {
        setError("Acceso restringido: solo superadmins");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/panel-maestro");
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#08090a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "#0f1011",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "36px 32px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 14,
          }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
            SetubalAI Panel Maestro
          </h1>
          <p style={{ fontSize: 12, color: "#62666d", marginTop: 6 }}>
            Acceso exclusivo para administradores
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 11, color: "#62666d", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@setubalai.com"
              required
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "10px 12px", color: "#f7f8f8", fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontSize: 11, color: "#62666d", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "10px 12px", color: "#f7f8f8", fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444", fontSize: 12, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: "#7170ff", color: "white", border: "none",
              borderRadius: 8, padding: "11px 20px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <LogIn size={15} />
            {loading ? "Verificando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
