"use client";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!email || !password) {
      setError("Completá email y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }).toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Credenciales incorrectas.");
        return;
      }

      localStorage.setItem("setubalai_token_v2", data.access_token);
      window.location.href = "/dashboard";

    } catch (err) {
      setError("Error de conexión. Verificá que la API esté activa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0b0e",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 400, padding: "40px 36px",
        background: "#111214", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#5e6ad2,#7170ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f7f8f8" }}>
            SetubalAI Business
          </h1>
          <p style={{ margin: "8px 0 0", color: "#62666d", fontSize: 14 }}>
            Ingresá con tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#62666d", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 }}>
              EMAIL
            </label>
            <input
              name="email"
              type="text"
              defaultValue=""
              placeholder="tucorreo@empresa.com"
              autoComplete="email"
              autoFocus
              style={{
                width:"100%", boxSizing:"border-box",
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.12)", borderRadius:9,
                padding:"11px 14px", color:"#f7f8f8", fontSize:14, outline:"none",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#62666d", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 }}>
              CONTRASEÑA
            </label>
            <input
              name="password"
              type="password"
              defaultValue=""
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width:"100%", boxSizing:"border-box",
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.12)", borderRadius:9,
                padding:"11px 14px", color:"#f7f8f8", fontSize:14, outline:"none",
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom:16, padding:"10px 14px", borderRadius:9,
              background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
              color:"#f87171", fontSize:13,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%", padding:"12px 24px",
              background: loading ? "rgba(113,112,255,0.5)" : "#7170ff",
              color:"white", border:"none", borderRadius:10,
              fontSize:14, fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>
        </form>

        <p style={{ textAlign:"center", fontSize:12, color:"#3a4050", marginTop:24 }}>
          SetubalAI Business Agent © 2026
        </p>
      </div>
    </div>
  );
}
