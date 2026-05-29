"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, Phone, Plus, CheckCircle, XCircle,
  Zap, Users, DollarSign, Server, Database, Globe,
  ChevronDown, ChevronUp, Edit2, X, RefreshCw, Activity,
  BarChart3, CreditCard, Package, FileText, LogOut, Copy, KeyRound, ExternalLink,
} from "lucide-react";
import InfrastructureTab from "./InfrastructureTab";

const API = "/api";

// Fetch con auth
async function fetchAuth(url: string, options?: RequestInit) {
  const token = localStorage.getItem("admin_token");
  if (!token) throw new Error("No token");
  
  const headers = {
    ...(options?.headers || {}),
    "Authorization": `Bearer ${token}`,
  };
  
  return fetch(url, { ...options, headers });
}

/* ─── Types ─────────────────────────────────────────── */
interface EmpresaStats {
  clientes_count: number;
  facturas_count: number;
  cobrado_total: number;
  pendiente_total: number;
}
interface Empresa {
  id: number;
  nombre: string;
  rubro: string | null;
  email: string | null;
  telefono: string | null;
  moneda: string;
  estado: string;
  plan: string;
  created_at: string | null;
  stats: EmpresaStats;
}
interface DetailStats {
  cobrado_este_mes: number;
  cobrado_total: number;
  clientes_activos: number;
  facturas_pendientes: number;
  productos_count: number;
  ultimas_5_facturas: {
    numero: string; cliente: string; total: number;
    estado: string; fecha_emision: string | null;
  }[];
}

/* ─── Helpers ────────────────────────────────────────── */
function fmtMoney(n: number, moneda = "USD") {
  return `${moneda} ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PLAN_CONFIG: Record<string, { label: string; color: string }> = {
  basico:     { label: "Básico",     color: "#3b82f6" },
  pro:        { label: "Pro",        color: "#a855f7" },
  enterprise: { label: "Enterprise", color: "#f59e0b" },
};

const ESTADO_CONFIG: Record<string, { label: string; color: string }> = {
  activa:   { label: "Activa",   color: "#10b981" },
  inactiva: { label: "Inactiva", color: "#6b7280" },
};

const FACTURA_ESTADO: Record<string, { color: string }> = {
  pagada:    { color: "#10b981" },
  pendiente: { color: "#f59e0b" },
  enviada:   { color: "#3b82f6" },
  vencida:   { color: "#ef4444" },
  cancelada: { color: "#6b7280" },
};

/* ─── Badge ──────────────────────────────────────────── */
function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 20,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em",
      background: `${color}18`, color, border: `1px solid ${color}35`,
      textTransform: "uppercase",
    }}>{text}</span>
  );
}

/* ─── Tabs ───────────────────────────────────────────── */
type TabId = "empresas" | "nueva" | "sistema" | "infraestructura";

function Tabs({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "empresas", label: "Empresas clientes" },
    { id: "nueva",    label: "Agregar empresa" },
    { id: "sistema",  label: "Sistema" },
    { id: "infraestructura", label: "Infraestructura" },
  ];
  return (
    <div style={{
      display: "flex", gap: 4, marginBottom: 28,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: 4, width: "fit-content",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: active === t.id ? "#7170ff" : "transparent",
          border: "none", borderRadius: 8,
          padding: "8px 16px", fontSize: 13, fontWeight: 600,
          color: active === t.id ? "#fff" : "#8a8f98",
          cursor: "pointer", transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Input / Select ────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
  padding: "9px 12px", color: "#f7f8f8", fontSize: 13,
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#62666d", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};

/* ─── EmpresaCard ────────────────────────────────────── */
function EmpresaCard({
  empresa, onEdit, onRefresh,
}: {
  empresa: Empresa;
  onEdit: (e: Empresa) => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<DetailStats | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hovered, setHovered] = useState(false);

  const loadDetail = async () => {
    if (detail) { setExpanded(v => !v); return; }
    setLoadingDetail(true);
    try {
      const r = await fetchAuth(`${API}/empresas/${empresa.id}/stats`);
      const d = await r.json();
      setDetail(d);
      setExpanded(true);
    } catch {/* ignore */}
    setLoadingDetail(false);
  };

  const planCfg  = PLAN_CONFIG[empresa.plan]  || PLAN_CONFIG.basico;
  const estadoCfg = ESTADO_CONFIG[empresa.estado] || ESTADO_CONFIG.activa;
  const initials = empresa.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.02)",
        border: hovered
          ? "1px solid rgba(113,112,255,0.35)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: 22,
        transition: "border-color 0.2s",
        display: "flex", flexDirection: "column", gap: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: "rgba(113,112,255,0.15)",
          border: "1px solid rgba(113,112,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#7170ff" }}>{initials}</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {empresa.nombre}
            </h3>
            <Badge text={planCfg.label} color={planCfg.color} />
            <Badge text={estadoCfg.label} color={estadoCfg.color} />
          </div>

          {empresa.rubro && (
            <p style={{ fontSize: 12, color: "#8a8f98", margin: "0 0 6px" }}>{empresa.rubro}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {empresa.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={11} color="#62666d" />
                <span style={{ fontSize: 12, color: "#8a8f98" }}>{empresa.email}</span>
              </div>
            )}
            {empresa.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={11} color="#62666d" />
                <span style={{ fontSize: 12, color: "#8a8f98" }}>{empresa.telefono}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10,
        marginTop: 16, paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        {[
          { label: "Clientes", value: empresa.stats.clientes_count, icon: Users, color: "#10b981" },
          { label: "Facturas", value: empresa.stats.facturas_count, icon: FileText, color: "#3b82f6" },
          { label: `Cobrado (${empresa.moneda})`, value: fmtMoney(empresa.stats.cobrado_total, empresa.moneda), icon: DollarSign, color: "#f59e0b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8" }}>{value}</div>
            <div style={{ fontSize: 10, color: "#62666d", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && detail && (
        <div style={{
          marginTop: 16, paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#7170ff", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Detalles del mes
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Cobrado este mes", value: fmtMoney(detail.cobrado_este_mes, empresa.moneda) },
              { label: "Clientes activos", value: detail.clientes_activos },
              { label: "Facturas pendientes", value: detail.facturas_pendientes },
              { label: "Productos activos", value: detail.productos_count },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 8,
                padding: "10px 12px", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8" }}>{value}</div>
                <div style={{ fontSize: 10, color: "#62666d", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>

          {detail.ultimas_5_facturas.length > 0 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                Últimas facturas
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {detail.ultimas_5_facturas.map((f, i) => {
                  const ec = FACTURA_ESTADO[f.estado] || { color: "#6b7280" };
                  return (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 10px", borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#f7f8f8" }}>{f.numero}</span>
                        {f.cliente && <span style={{ fontSize: 11, color: "#8a8f98", marginLeft: 8 }}>{f.cliente}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8" }}>{fmtMoney(f.total, empresa.moneda)}</span>
                        <Badge text={f.estado} color={ec.color} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={loadDetail}
          disabled={loadingDetail}
          style={{
            flex: 1, background: "rgba(113,112,255,0.1)",
            border: "1px solid rgba(113,112,255,0.25)", borderRadius: 8,
            padding: "8px 12px", fontSize: 12, fontWeight: 600,
            color: "#a5a4ff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            opacity: loadingDetail ? 0.6 : 1,
          }}
        >
          {loadingDetail ? (
            <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
          ) : expanded ? (
            <><ChevronUp size={12} /> Ocultar</>
          ) : (
            <><ChevronDown size={12} /> Ver detalles</>
          )}
        </button>
        <button
          onClick={() => onEdit(empresa)}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8,
            padding: "8px 14px", fontSize: 12, fontWeight: 600,
            color: "#8a8f98", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <Edit2 size={12} /> Editar
        </button>
      </div>
    </div>
  );
}

/* ─── EditModal ──────────────────────────────────────── */
function EditModal({
  empresa, onClose, onSaved,
}: {
  empresa: Empresa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AnyStringMap>({
    nombre: empresa.nombre,
    rubro: empresa.rubro || "",
    email: empresa.email || "",
    telefono: empresa.telefono || "",
    moneda: empresa.moneda,
    plan: empresa.plan,
    estado: empresa.estado,
  });
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    await fetchAuth(`${API}/empresas/${empresa.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "#111215", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 480,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>Editar empresa</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#62666d" }}>
            <X size={18} />
          </button>
        </div>
        <FormFields form={form} setForm={setForm} showEstado />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={guardar} disabled={saving || !form.nombre}
            style={{
              flex: 1, background: "#7170ff", color: "white", border: "none",
              borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", opacity: saving || !form.nombre ? 0.6 : 1,
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", color: "#8a8f98",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
            padding: "10px 16px", fontSize: 13, cursor: "pointer",
          }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FormFields (shared) ────────────────────────────── */
type AnyStringMap = { [key: string]: string };

function FormFields({
  form, setForm, showEstado = false,
}: {
  form: AnyStringMap;
  setForm: (f: AnyStringMap) => void;
  showEstado?: boolean;
}) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div style={{ gridColumn: "1/-1" }}>
        <label style={labelStyle}>Nombre de la empresa *</label>
        <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Empresa XYZ" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Rubro</label>
        <input value={form.rubro} onChange={e => set("rubro", e.target.value)} placeholder="Ej: Tecnología" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="contacto@empresa.com" type="email" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Teléfono</label>
        <input value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+54 11 ..." style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Moneda</label>
        <select value={form.moneda} onChange={e => set("moneda", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
          <option value="USD">USD — Dólar</option>
          <option value="ARS">ARS — Peso Arg.</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Plan</label>
        <select value={form.plan} onChange={e => set("plan", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
          <option value="basico">Básico</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      {showEstado && (
        <div>
          <label style={labelStyle}>Estado</label>
          <select value={form.estado} onChange={e => set("estado", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>
      )}
    </div>
  );
}

interface AdminCredentials {
  email: string;
  password_temporal: string;
  login_url: string;
}

/* ─── NuevaEmpresaForm ───────────────────────────────── */
function NuevaEmpresaForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<AnyStringMap>({ nombre: "", rubro: "", email: "", telefono: "", moneda: "USD", plan: "basico" });
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const crear = async () => {
    if (!form.nombre) return;
    setSaving(true); setError(""); setCredentials(null);
    try {
      const res = await fetchAuth(`${API}/empresas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al crear empresa");
      setCredentials(data.admin_credentials || null);
      setForm({ nombre: "", rubro: "", email: "", telefono: "", moneda: "USD", plan: "basico" } as AnyStringMap);
      onCreated();
    } catch (err: any) {
      setError(err.message || "Error al crear la empresa. Verifica los datos e intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `🔑 Credenciales SetubalAI Business Agent\n\nEmpresa: ${form.nombre || "Nueva empresa"}\nEmail: ${credentials.email}\nPassword: ${credentials.password_temporal}\nLogin: ${credentials.login_url}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: "rgba(113,112,255,0.04)", border: "1px solid rgba(113,112,255,0.2)",
      borderRadius: 16, padding: 28, maxWidth: 560,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(113,112,255,0.15)", border: "1px solid rgba(113,112,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Building2 size={18} color="#7170ff" />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>Nueva empresa cliente</h3>
          <p style={{ fontSize: 12, color: "#62666d", margin: 0 }}>Agrega una nueva empresa al sistema multi-tenant</p>
        </div>
      </div>

      <FormFields form={form} setForm={setForm} />

      {error && (
        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 8,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <XCircle size={14} /> {error}
        </div>
      )}

      <button
        onClick={crear} disabled={saving || !form.nombre}
        style={{
          marginTop: 18, background: "#7170ff", color: "white", border: "none",
          borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700,
          cursor: "pointer", opacity: saving || !form.nombre ? 0.6 : 1,
          display: "flex", alignItems: "center", gap: 8,
        }}
      >
        <Plus size={15} /> {saving ? "Creando..." : "Crear empresa"}
      </button>

      {/* ── Credenciales modal ───────────────────────────────── */}
      {credentials && (
        <div style={{
          marginTop: 24, padding: 24, borderRadius: 14,
          background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <CheckCircle size={20} color="#10b981" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#10b981", margin: 0 }}>Empresa creada exitosamente</h3>
              <p style={{ fontSize: 12, color: "#62666d", margin: 0 }}>Credenciales del administrador</p>
            </div>
          </div>

          {/* Email */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Mail size={13} color="#62666d" />
              <span style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email de acceso</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f7f8f8", fontFamily: "monospace" }}>
              {credentials.email}
            </div>
          </div>

          {/* Password */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <KeyRound size={13} color="#f59e0b" />
              <span style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contraseña temporal</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace", letterSpacing: "0.08em" }}>
              {credentials.password_temporal}
            </div>
          </div>

          {/* Login URL */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 18,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <ExternalLink size={13} color="#7170ff" />
              <span style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>URL de acceso</span>
            </div>
            <div style={{ fontSize: 12, color: "#7170ff", fontWeight: 600 }}>
              {credentials.login_url}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={copyCredentials}
              style={{
                flex: 1, background: copied ? "#10b981" : "rgba(113,112,255,0.15)",
                border: `1px solid ${copied ? "#10b981" : "rgba(113,112,255,0.3)"}`,
                borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700,
                color: copied ? "#fff" : "#a5a4ff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.2s",
              }}
            >
              {copied ? <><CheckCircle size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar credenciales</>}
            </button>
          </div>

          <p style={{
            fontSize: 10.5, color: "#62666d", marginTop: 12, marginBottom: 0,
            fontStyle: "italic", textAlign: "center",
          }}>
            ⚠️ Enviá estas credenciales al cliente. Deberá cambiar la contraseña al primer inicio de sesión.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── SystemStatus ───────────────────────────────────── */
function SystemStatus({ empresas }: { empresas: Empresa[] }) {
  type SvcState = "checking" | "online" | "offline";

  const [apiStatus,  setApiStatus]  = useState<SvcState>("checking");
  const [dbStatus,   setDbStatus]   = useState<SvcState>("checking");

  useEffect(() => {
    fetchAuth(`${API}/health`, { signal: AbortSignal.timeout(4000) })
      .then(r => { setApiStatus(r.ok ? "online" : "offline"); setDbStatus("online"); })
      .catch(() => { setApiStatus("offline"); setDbStatus("offline"); });
  }, []);

  const services = [
    { nombre: "API Backend (FastAPI)", status: apiStatus, puerto: "3010", desc: "Motor de negocio y base de datos", icon: Server },
    { nombre: "Base de datos (PostgreSQL)", status: dbStatus, puerto: "5432", desc: "Schema setubalai, 16 tablas", icon: Database },
    { nombre: "Frontend Web (Next.js)", status: "online" as SvcState, puerto: "3011", desc: "Interfaz de usuario — estás aquí", icon: Globe },
  ];

  const statusColor = (s: SvcState) =>
    s === "online" ? "#10b981" : s === "offline" ? "#ef4444" : "#f59e0b";
  const statusLabel = (s: SvcState) =>
    s === "online" ? "Online" : s === "offline" ? "Offline" : "Verificando...";

  const totalActivas = empresas.filter(e => e.estado === "activa").length;
  const totalClientes = empresas.reduce((a, e) => a + e.stats.clientes_count, 0);
  const totalCobrado = empresas.reduce((a, e) => a + e.stats.cobrado_total, 0);

  return (
    <div>
      {/* Servicios */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
        Servicios del sistema
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {services.map(svc => (
          <div key={svc.nombre} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(113,112,255,0.1)", border: "1px solid rgba(113,112,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svc.icon size={17} color="#7170ff" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: statusColor(svc.status),
                  boxShadow: `0 0 8px ${statusColor(svc.status)}90`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(svc.status), textTransform: "uppercase" }}>
                  {statusLabel(svc.status)}
                </span>
              </div>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#f7f8f8", margin: "0 0 4px" }}>{svc.nombre}</h4>
            <p style={{ fontSize: 11, color: "#62666d", margin: "0 0 8px" }}>{svc.desc}</p>
            <div style={{ fontSize: 11, color: "#4a5161", fontFamily: "monospace", fontWeight: 600 }}>:{svc.puerto}</div>
          </div>
        ))}
      </div>

      {/* Resumen global */}
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#62666d", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px" }}>
        Resumen global del sistema
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "Empresas activas", value: totalActivas, icon: Building2, color: "#7170ff" },
          { label: "Total clientes", value: totalClientes, icon: Users, color: "#10b981" },
          { label: "Total facturado", value: `$${(totalCobrado / 1000).toFixed(1)}K`, icon: DollarSign, color: "#f59e0b" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "20px 24px",
            display: "flex", gap: 16, alignItems: "center",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${color}18`, border: `1px solid ${color}25`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#f7f8f8", letterSpacing: "-0.5px" }}>{value}</div>
              <div style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function PanelMaestro() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("empresas");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAuth(`${API}/empresas`);
      if (!r.ok) {
        console.error("Error cargando empresas:", r.status, r.statusText);
        return;
      }
      const d = await r.json();
      setEmpresas(d.empresas || []);
    } catch (err) {
      console.error("Error cargando empresas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleNuevaEmpresaCreated = () => {
    cargar();
    setTab("empresas");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/login");
  };

  return (
    <>
      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "32px 40px", maxWidth: 1100, minHeight: "100vh", background: "#08090a" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 23, fontWeight: 700, color: "#f7f8f8", letterSpacing: "-0.5px", margin: 0 }}>
                Panel Maestro SetubalAI
              </h1>
              <p style={{ fontSize: 13, color: "#62666d", marginTop: 2, marginBottom: 0 }}>
                Gestión de empresas cliente
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setTab("nueva")}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#7170ff", color: "white", border: "none",
                borderRadius: 9, padding: "9px 17px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 16px rgba(113,112,255,0.35)",
              }}
            >
              <Plus size={15} /> Nueva Empresa
            </button>
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.05)", color: "#8a8f98",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
                padding: "9px 14px", fontSize: 13, cursor: "pointer",
              }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs active={tab} onChange={setTab} />

        {/* Tab: Empresas */}
        {tab === "empresas" && (
          loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#62666d", fontSize: 14 }}>
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                Cargando empresas...
              </div>
            </div>
          ) : empresas.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#62666d" }}>
              <Building2 size={36} style={{ marginBottom: 14, opacity: 0.4 }} />
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>No hay empresas cargadas</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                <button
                  onClick={() => setTab("nueva")}
                  style={{ background: "none", border: "none", color: "#7170ff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Agregar la primera empresa →
                </button>
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {empresas.map(e => (
                <EmpresaCard
                  key={e.id}
                  empresa={e}
                  onEdit={setEditingEmpresa}
                  onRefresh={cargar}
                />
              ))}
            </div>
          )
        )}

        {/* Tab: Nueva empresa */}
        {tab === "nueva" && (
          <NuevaEmpresaForm onCreated={handleNuevaEmpresaCreated} />
        )}

        {/* Tab: Sistema */}
        {tab === "sistema" && <SystemStatus empresas={empresas} />}

        {/* Tab: Infraestructura */}
        {tab === "infraestructura" && <InfrastructureTab />}

        {/* Edit modal */}
        {editingEmpresa && (
          <EditModal
            empresa={editingEmpresa}
            onClose={() => setEditingEmpresa(null)}
            onSaved={cargar}
          />
        )}
      </div>
    </>
  );
}
