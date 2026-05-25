"use client";
import { useState, useEffect } from "react";
import { Search, UserPlus, Building2, User, CreditCard, MapPin, Tag } from "lucide-react";

const API = "/api";
const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

const ESTADO_COLOR: Record<string, string> = {
  activo: "#10b981", moroso: "#ef4444", prospecto: "#f59e0b", inactivo: "#62666d",
};
const ESTADO_LABEL: Record<string, string> = {
  activo: "Activo", moroso: "Moroso", prospecto: "Prospecto", inactivo: "Inactivo",
};

interface Cliente {
  id: number; nombre: string; empresa_nombre: string; email: string; telefono: string;
  estado: string; tipo: string; valor_total: number; notas: string;
  cuit: string; cbu: string; alias_cbu: string; banco: string;
  contacto_nombre: string; ciudad: string; web: string; instagram: string;
  limite_credito: number; descuento_pct: number;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre: "", empresa_nombre: "", email: "", telefono: "",
    tipo: "empresa", estado: "activo", ciudad: "",
    cuit: "", cbu: "", alias_cbu: "", banco: "",
    contacto_nombre: "", web: "", instagram: "",
    limite_credito: 0, descuento_pct: 0,
  });
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({ total: 0, activos: 0, morosos: 0, prospectos: 0, valor_total: 0 });

  const cargar = (buscar = "", estado = "", tipo = "") => {
    setLoading(true);
    let url = `${API}/clientes?limit=200`;
    if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
    if (estado) url += `&estado=${estado}`;
    if (tipo) url += `&tipo=${tipo}`;
    
    const token = localStorage.getItem("setubalai_token_v2");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    Promise.all([
      fetch(url, { headers }).then(r => r.json()),
      fetch(`${API}/clientes/stats`, { headers }).then(r => r.json()),
    ]).then(([d, s]) => {
      setClientes(d.clientes || []);
      setTotal(d.total || 0);
      setStats(s || { total: 0, activos: 0, morosos: 0, prospectos: 0, valor_total: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    const token = localStorage.getItem("setubalai_token_v2");
    await fetch(`${API}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...form, empresa_id: 1 }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ nombre: "", empresa_nombre: "", email: "", telefono: "", tipo: "empresa", estado: "activo", ciudad: "", cuit: "", cbu: "", alias_cbu: "", banco: "", contacto_nombre: "", web: "", instagram: "", limite_credito: 0, descuento_pct: 0 });
    cargar(busqueda, estadoFiltro, tipoFiltro);
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#f7f8f8", outline: "none", boxSizing: "border-box" as const,
  };
  const labelStyle = { display: "block" as const, fontSize: 11, color: "#62666d", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div style={{ padding: "28px 36px", maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Clientes</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 5, margin: 0 }}>{stats.total} clientes en CRM · Facturado total {fmt(stats.valor_total)}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <UserPlus size={14} /> Nuevo cliente
        </button>
      </div>

      {/* Stats chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Activos", val: stats.activos, color: "#10b981", estado: "activo" },
          { label: "Morosos", val: stats.morosos, color: "#ef4444", estado: "moroso" },
          { label: "Prospectos", val: stats.prospectos, color: "#f59e0b", estado: "prospecto" },
        ].map(s => (
          <button key={s.label} onClick={() => { const ne = estadoFiltro === s.estado ? "" : s.estado; setEstadoFiltro(ne); cargar(busqueda, ne, tipoFiltro); }} style={{ padding: "8px 16px", borderRadius: 8, background: estadoFiltro === s.estado ? `${s.color}20` : `${s.color}10`, border: `1px solid ${estadoFiltro === s.estado ? s.color : s.color + "30"}`, display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: 12, color: "#8a8f98" }}>{s.label}</span>
          </button>
        ))}
        {["empresa", "persona"].map(t => (
          <button key={t} onClick={() => { const nt = tipoFiltro === t ? "" : t; setTipoFiltro(nt); cargar(busqueda, estadoFiltro, nt); }} style={{ padding: "8px 14px", borderRadius: 8, background: tipoFiltro === t ? "rgba(113,112,255,0.15)" : "transparent", border: `1px solid ${tipoFiltro === t ? "#7170ff" : "rgba(255,255,255,0.08)"}`, color: tipoFiltro === t ? "#7170ff" : "#8a8f98", fontSize: 12, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
            {t === "empresa" ? <Building2 size={12} /> : <User size={12} />} {t === "empresa" ? "Empresas" : "Personas"}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); cargar(e.target.value, estadoFiltro, tipoFiltro); }}
          placeholder="Buscar por nombre, empresa, email, CUIT..."
          style={{ ...inputStyle, paddingLeft: 36, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </div>

      {/* Form nuevo cliente */}
      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(113,112,255,0.25)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#d0d6e0", marginBottom: 18 }}>Nuevo cliente</div>
          {/* Fila 1: datos básicos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { key: "nombre", label: "Nombre *", placeholder: "Juan García" },
              { key: "empresa_nombre", label: "Empresa", placeholder: "Tech SRL" },
              { key: "contacto_nombre", label: "Contacto", placeholder: "Juan García" },
              { key: "ciudad", label: "Ciudad", placeholder: "Buenos Aires" },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          {/* Fila 2: contacto */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { key: "email", label: "Email", placeholder: "juan@empresa.com" },
              { key: "telefono", label: "Teléfono", placeholder: "+54 9 11 ..." },
              { key: "web", label: "Web", placeholder: "www.empresa.com" },
              { key: "instagram", label: "Instagram", placeholder: "@empresa" },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          {/* Fila 3: datos fiscales y bancarios */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[
              { key: "cuit", label: "CUIT", placeholder: "20-12345678-9" },
              { key: "cbu", label: "CBU", placeholder: "0110..." },
              { key: "alias_cbu", label: "Alias CBU", placeholder: "EMPRESA.ALIAS" },
              { key: "banco", label: "Banco", placeholder: "Banco Nación" },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          {/* Fila 4: tipo, estado, crédito */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ ...inputStyle }}>
                <option value="empresa">Empresa</option>
                <option value="persona">Persona</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={{ ...inputStyle }}>
                <option value="activo">Activo</option>
                <option value="prospecto">Prospecto</option>
                <option value="moroso">Moroso</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Límite crédito (USD)</label>
              <input type="number" value={form.limite_credito} onChange={e => setForm({ ...form, limite_credito: Number(e.target.value) })} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Descuento %</label>
              <input type="number" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: Number(e.target.value) })} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={guardar} disabled={saving || !form.nombre} style={{ padding: "9px 20px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving || !form.nombre ? 0.6 : 1 }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 20px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Layout: tabla + detalle */}
      <div style={{ display: "grid", gridTemplateColumns: seleccionado ? "1fr 380px" : "1fr", gap: 20 }}>

        {/* Tabla */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                {["Cliente", "Empresa", "CUIT", "Ciudad", "Contacto", "Estado", "Facturado"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "11px 16px", fontSize: 11, color: "#62666d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#62666d", fontSize: 13 }}>Cargando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#62666d", fontSize: 13 }}>Sin resultados</td></tr>
              ) : clientes.map((c) => (
                <tr key={c.id} onClick={() => setSeleccionado(seleccionado?.id === c.id ? null : c)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: seleccionado?.id === c.id ? "rgba(113,112,255,0.06)" : "transparent" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(113,112,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#7170ff", flexShrink: 0 }}>
                        {c.nombre[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#d0d6e0" }}>{c.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#8a8f98" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {c.empresa_nombre ? <Building2 size={11} color="#62666d" /> : <User size={11} color="#62666d" />}
                      {c.empresa_nombre || "Persona"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#8a8f98", fontFamily: "monospace" }}>{c.cuit || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#8a8f98" }}>
                    {c.ciudad ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} color="#62666d" />{c.ciudad}</span> : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "#d0d6e0" }}>{c.email}</div>
                    <div style={{ fontSize: 11, color: "#62666d", marginTop: 2 }}>{c.telefono}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 999, background: `${ESTADO_COLOR[c.estado] || "#62666d"}15`, color: ESTADO_COLOR[c.estado] || "#62666d", border: `1px solid ${ESTADO_COLOR[c.estado] || "#62666d"}30` }}>
                      {ESTADO_LABEL[c.estado] || c.estado}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#f7f8f8" }}>{fmt(c.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Panel de detalle */}
        {seleccionado && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(113,112,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#7170ff", marginBottom: 10 }}>
                  {seleccionado.nombre[0].toUpperCase()}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>{seleccionado.nombre}</h3>
                {seleccionado.empresa_nombre && <p style={{ fontSize: 12, color: "#8a8f98", margin: "3px 0 0" }}>{seleccionado.empresa_nombre}</p>}
              </div>
              <button onClick={() => setSeleccionado(null)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            {/* Datos de contacto */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Contacto</div>
              {[
                { label: "Email", val: seleccionado.email },
                { label: "Teléfono", val: seleccionado.telefono },
                { label: "Ciudad", val: seleccionado.ciudad },
                { label: "Web", val: seleccionado.web },
                { label: "Instagram", val: seleccionado.instagram },
              ].filter(f => f.val).map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 12, color: "#62666d" }}>{f.label}</span>
                  <span style={{ fontSize: 12, color: "#d0d6e0", maxWidth: 200, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.val}</span>
                </div>
              ))}
            </div>

            {/* Datos fiscales/bancarios */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Datos Fiscales y Bancarios</div>
              {[
                { label: "CUIT", val: seleccionado.cuit, mono: true },
                { label: "CBU", val: seleccionado.cbu, mono: true },
                { label: "Alias CBU", val: seleccionado.alias_cbu, mono: true },
                { label: "Banco", val: seleccionado.banco },
              ].filter(f => f.val).map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 12, color: "#62666d" }}>{f.label}</span>
                  <span style={{ fontSize: 11, color: "#d0d6e0", fontFamily: f.mono ? "monospace" : "inherit" }}>{f.val}</span>
                </div>
              ))}
            </div>

            {/* Condiciones comerciales */}
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 16 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8" }}>{fmt(seleccionado.valor_total)}</div>
                <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>Facturado</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#7170ff" }}>{seleccionado.descuento_pct}%</div>
                <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>Descuento</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{fmt(seleccionado.limite_credito)}</div>
                <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>Crédito</div>
              </div>
            </div>

            {seleccionado.notas && (
              <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 12, color: "#8a8f98", lineHeight: 1.5 }}>
                {seleccionado.notas}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
