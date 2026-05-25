"use client";
import { useState, useEffect } from "react";
import { Building2, Plus, Search, Phone, Mail, Globe, CreditCard } from "lucide-react";

const API = "/api";

const CAT_COLOR: Record<string, string> = {
  "Computadoras": "#06b6d4", "Electrodomesticos": "#10b981", "Gaming": "#ef4444",
  "Audio": "#f59e0b", "Celulares": "#5e6ad2", "default": "#7170ff",
};

function getCatColor(cat: string): string {
  const key = Object.keys(CAT_COLOR).find(k => (cat || "").includes(k));
  return key ? CAT_COLOR[key] : CAT_COLOR.default;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", contacto_nombre: "", email: "", telefono: "", cuit: "", cbu: "", alias_cbu: "", banco: "", condiciones_pago: "", categoria: "", descuento_pct: 0, notas: "" });

  const cargar = (buscar = "") => {
    setLoading(true);
    const url = buscar ? `${API}/proveedores?buscar=${encodeURIComponent(buscar)}` : `${API}/proveedores`;
    fetch(url).then(r => r.json()).then(d => { setProveedores(d.proveedores || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    await fetch(`${API}/proveedores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, empresa_id: 1 }) });
    setSaving(false); setShowForm(false);
    setForm({ nombre: "", contacto_nombre: "", email: "", telefono: "", cuit: "", cbu: "", alias_cbu: "", banco: "", condiciones_pago: "", categoria: "", descuento_pct: 0, notas: "" });
    cargar();
  };

  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 6, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f7f8f8", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block" as const, fontSize: 11, color: "#62666d", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#f7f8f8", letterSpacing: "-0.4px", margin: 0 }}>Proveedores</h1>
          <p style={{ fontSize: 13, color: "#62666d", marginTop: 6, margin: "6px 0 0" }}>{proveedores.length} proveedores activos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Nuevo proveedor
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={14} color="#62666d" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={busqueda} onChange={e => { setBusqueda(e.target.value); cargar(e.target.value); }} placeholder="Buscar por nombre, CUIT, contacto..." style={{ ...inputStyle, paddingLeft: 36, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }} />
      </div>

      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(113,112,255,0.25)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#d0d6e0", marginBottom: 16 }}>Nuevo proveedor</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[{ key: "nombre", label: "Empresa *", ph: "Apple Argentina SA" }, { key: "contacto_nombre", label: "Contacto", ph: "Juan Pérez" }, { key: "email", label: "Email", ph: "ventas@empresa.com" }, { key: "telefono", label: "Teléfono", ph: "+54 11 ..." }].map(f => (
              <div key={f.key}><label style={labelStyle}>{f.label}</label><input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputStyle} /></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[{ key: "cuit", label: "CUIT", ph: "30-12345678-9" }, { key: "cbu", label: "CBU", ph: "0110..." }, { key: "alias_cbu", label: "Alias CBU", ph: "EMPRESA.ALIAS" }, { key: "banco", label: "Banco", ph: "Banco Nación" }].map(f => (
              <div key={f.key}><label style={labelStyle}>{f.label}</label><input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputStyle} /></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[{ key: "categoria", label: "Categoría", ph: "Computadoras" }, { key: "condiciones_pago", label: "Condiciones pago", ph: "Net 30 días" }].map(f => (
              <div key={f.key}><label style={labelStyle}>{f.label}</label><input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} style={inputStyle} /></div>
            ))}
            <div><label style={labelStyle}>Descuento %</label><input type="number" value={form.descuento_pct} onChange={e => setForm({ ...form, descuento_pct: Number(e.target.value) })} placeholder="0" style={inputStyle} /></div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={guardar} disabled={saving || !form.nombre} style={{ padding: "9px 20px", background: "#5e6ad2", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !form.nombre ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar"}</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 16px", background: "transparent", color: "#8a8f98", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: seleccionado ? "1fr 360px" : "1fr 1fr", gap: 16 }}>
        {!seleccionado && proveedores.map(p => {
          const color = getCatColor(p.categoria);
          const initials = p.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={p.id} onClick={() => setSeleccionado(p)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20, cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f7f8f8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</h3>
                    {p.categoria && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 600, flexShrink: 0 }}>{p.categoria}</span>}
                  </div>
                  {p.contacto_nombre && <p style={{ fontSize: 12, color: "#8a8f98", margin: "0 0 8px" }}>{p.contacto_nombre}</p>}
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {p.email && <span style={{ fontSize: 11, color: "#62666d", display: "flex", alignItems: "center", gap: 4 }}><Mail size={10} />{p.email}</span>}
                    {p.telefono && <span style={{ fontSize: 11, color: "#62666d", display: "flex", alignItems: "center", gap: 4 }}><Phone size={10} />{p.telefono}</span>}
                  </div>
                  {(p.cuit || p.condiciones_pago) && (
                    <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                      {p.cuit && <span style={{ fontSize: 11, color: "#8a8f98", fontFamily: "monospace", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 4 }}>CUIT: {p.cuit}</span>}
                      {p.condiciones_pago && <span style={{ fontSize: 11, color: "#f59e0b" }}>{p.condiciones_pago}</span>}
                      {p.descuento_pct > 0 && <span style={{ fontSize: 11, color: "#10b981" }}>{p.descuento_pct}% dto.</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {seleccionado && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {proveedores.map(p => {
                const color = getCatColor(p.categoria);
                const initials = p.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={p.id} onClick={() => setSeleccionado(seleccionado?.id === p.id ? null : p)} style={{ background: seleccionado?.id === p.id ? "rgba(113,112,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${seleccionado?.id === p.id ? "rgba(113,112,255,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{initials}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f7f8f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: "#62666d" }}>{p.categoria || "Proveedor"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 24, height: "fit-content" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${getCatColor(seleccionado.categoria)}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: getCatColor(seleccionado.categoria), marginBottom: 10 }}>
                    {seleccionado.nombre.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>{seleccionado.nombre}</h3>
                  {seleccionado.categoria && <p style={{ fontSize: 12, color: "#8a8f98", margin: "3px 0 0" }}>{seleccionado.categoria}</p>}
                </div>
                <button onClick={() => setSeleccionado(null)} style={{ background: "none", border: "none", color: "#62666d", cursor: "pointer", fontSize: 18 }}>×</button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Contacto</div>
                {[{ label: "Contacto", val: seleccionado.contacto_nombre }, { label: "Email", val: seleccionado.email }, { label: "Teléfono", val: seleccionado.telefono }, { label: "Web", val: seleccionado.web }].filter(f => f.val).map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#62666d" }}>{f.label}</span>
                    <span style={{ fontSize: 12, color: "#d0d6e0" }}>{f.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#62666d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Datos Bancarios</div>
                {[{ label: "CUIT", val: seleccionado.cuit, mono: true }, { label: "CBU", val: seleccionado.cbu, mono: true }, { label: "Alias CBU", val: seleccionado.alias_cbu, mono: true }, { label: "Banco", val: seleccionado.banco }].filter(f => f.val).map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, color: "#62666d" }}>{f.label}</span>
                    <span style={{ fontSize: 11, color: "#d0d6e0", fontFamily: f.mono ? "monospace" : "inherit" }}>{f.val}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "12px 14px", display: "flex", gap: 16 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{seleccionado.descuento_pct}%</div>
                  <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>Descuento</div>
                </div>
                <div style={{ flex: 2, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>{seleccionado.condiciones_pago || "—"}</div>
                  <div style={{ fontSize: 10, color: "#62666d", marginTop: 2 }}>Condiciones pago</div>
                </div>
              </div>

              {seleccionado.notas && <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 12, color: "#8a8f98", lineHeight: 1.5 }}>{seleccionado.notas}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
