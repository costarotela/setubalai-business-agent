"use client";
import { useState, useEffect } from "react";
import { useAuthFetch, useAuth } from "../../auth-context";
import { Clock, Plus, Edit2, Trash2, X } from "lucide-react";

interface MiGrilla {
  id: number;
  dia_semana: number;
  dia_semana_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const HORARIOS_DEFAULT = [
  { dia: 0, inicio: "08:00", fin: "12:00" },  // Lunes
  { dia: 1, inicio: "08:00", fin: "12:00" },  // Martes
  { dia: 2, inicio: "08:00", fin: "12:00" },  // Miércoles
  { dia: 3, inicio: "08:00", fin: "12:00" },  // Jueves
  { dia: 4, inicio: "08:00", fin: "12:00" },  // Viernes
];

export default function MiGrillaPage() {
  const { user } = useAuth();
  const medicoId = (user as any)?.medico_id;
  const af = useAuthFetch();

  const [grillas, setGrillas] = useState<MiGrilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ dia_semana: "0", hora_inicio: "08:00", hora_fin: "12:00", activo: true });
  const [error, setError] = useState("");

  useEffect(() => {
    if (medicoId) loadData();
  }, [medicoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await af(`/configuracion-agenda/grillas-medicas/?medico_id=${medicoId}`);
      const data = await res.json();
      setGrillas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ dia_semana: "0", hora_inicio: "08:00", hora_fin: "12:00", activo: true });
    setError("");
    setShowModal(true);
  };

  const openEdit = (g: MiGrilla) => {
    setEditId(g.id);
    setForm({ dia_semana: String(g.dia_semana), hora_inicio: g.hora_inicio, hora_fin: g.hora_fin, activo: g.activo });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setError("");
    if (form.hora_inicio >= form.hora_fin) {
      setError("La hora de fin debe ser mayor a la de inicio");
      return;
    }
    const payload = {
      medico_id: Number(medicoId),
      dia_semana: Number(form.dia_semana),
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      activo: form.activo,
    };
    try {
      let res;
      if (editId) {
        res = await af(`/configuracion-agenda/grillas-medicas/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await af("/configuracion-agenda/grillas-medicas/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.detail || `Error ${res.status}`);
        return;
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Error de red");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este horario de tu grilla?")) return;
    try {
      const res = await af(`/configuracion-agenda/grillas-medicas/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => null);
        setError(err?.detail || "No se pudo eliminar");
        return;
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const quickAdd = async (dia: number, inicio: string, fin: string) => {
    // Check if slot already exists
    const exists = grillas.find((g) => g.dia_semana === dia && g.activo);
    if (exists) {
      setError(`Ya tienes un horario para ${DIAS[dia]}`);
      return;
    }
    const payload = {
      medico_id: Number(medicoId),
      dia_semana: dia,
      hora_inicio: inicio,
      hora_fin: fin,
      activo: true,
    };
    try {
      const res = await af("/configuracion-agenda/grillas-medicas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setError(err?.detail || `Error ${res.status}`);
        return;
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Agrupar por día
  const porDia: Record<number, MiGrilla[]> = {};
  for (const g of grillas) {
    if (!porDia[g.dia_semana]) porDia[g.dia_semana] = [];
    porDia[g.dia_semana].push(g);
  }

  if (!medicoId) {
    return (
      <div style={{ padding: 32, color: "#ef4444" }}>
        No se encontró tu perfil de médico. Contactá al administrador.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 32, color: "#8a8f98" }}>Cargando tu grilla horaria...</div>;
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
          🕐 Mi Grilla Horaria
        </h1>
        <p style={{ fontSize: 13, color: "#8a8f98", margin: "6px 0 0" }}>
          Personalizá tus días y horarios de atención — esto afecta qué turnos puede crear la recepción
        </p>
      </div>

      {grillas.length === 0 && (
        <div style={{
          padding: 32, background: "#131416", borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center", marginBottom: 24,
        }}>
          <p style={{ color: "#8a8f98", marginBottom: 16 }}>No tenés horarios configurados aún</p>
          <button onClick={() => quickAdd(0, "08:00", "14:00")} style={{
            background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 8, padding: "8px 16px", color: "#22c55e", fontSize: 13,
            fontWeight: 600, cursor: "pointer", marginBottom: 8,
          }}>
            ⚡ Cargar Lunes-Viernes 08:00-14:00
          </button>
          <br />
          <button onClick={openNew} style={{
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 8, padding: "8px 16px", color: "#3b82f6", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}>
            + Crear horarios manualmente
          </button>
        </div>
      )}

      {/* Vista por Día - Visual */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {DIAS.map((diaNombre, diaIdx) => {
          const slots = porDia[diaIdx] || [];
          const hasSlot = slots.some((s) => s.activo);

          return (
            <div
              key={diaIdx}
              style={{
                background: hasSlot ? "#131416" : "#0d0e0f",
                border: `1px solid ${hasSlot ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)"}`,
                borderRadius: 10, padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 16,
              }}
            >
              <div style={{ minWidth: 100, fontWeight: 600, fontSize: 14, color: hasSlot ? "#f7f8f8" : "#62666d" }}>
                {diaNombre}
              </div>
              <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {slots.length === 0 ? (
                  <span style={{ fontSize: 12, color: "#62666d" }}>Sin horario</span>
                ) : (
                  slots.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "4px 10px", borderRadius: 6, fontSize: 13,
                        background: g.activo ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${g.activo ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)"}`,
                      }}
                    >
                      <Clock size={12} color={g.activo ? "#22c55e" : "#62666d"} />
                      <span style={{ color: g.activo ? "#f7f8f8" : "#8a8f98" }}>
                        {g.hora_inicio} - {g.hora_fin}
                      </span>
                      <button onClick={() => openEdit(g)} style={{
                        background: "none", border: "none", cursor: "pointer", padding: 2,
                      }}>
                        <Edit2 size={12} color="#8a8f98" />
                      </button>
                      <button onClick={() => handleDelete(g.id)} style={{
                        background: "none", border: "none", cursor: "pointer", padding: 2,
                      }}>
                        <Trash2 size={12} color="#ef4444" />
                      </button>
                    </div>
                  ))
                )}
                {!hasSlot && (
                  <button onClick={() => quickAdd(diaIdx, "08:00", "14:00")} style={{
                    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 6, padding: "4px 10px", color: "#3b82f6", fontSize: 12,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Plus size={12} /> Agregar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: "10px 14px", background: "rgba(239,68,68,0.1)",
          borderRadius: 8, color: "#ef4444", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          ⚠️ {error}
          <button onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {/* Modal para crear/editar */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#18181b", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: 24, width: 400, maxWidth: "90vw",
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f7f8f8", marginBottom: 16 }}>
              {editId ? "Editar Horario" : "Nuevo Horario"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 13, color: "#8a8f98" }}>
                Día de la semana
                <select
                  value={form.dia_semana}
                  onChange={(e) => setForm({ ...form, dia_semana: e.target.value })}
                  style={{
                    width: "100%", marginTop: 4, padding: "8px 12px",
                    background: "#0f1011", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6, color: "#f7f8f8", fontSize: 14,
                  }}
                >
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </label>

              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ flex: 1, fontSize: 13, color: "#8a8f98" }}>
                  Inicio
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    style={{
                      width: "100%", marginTop: 4, padding: "8px 12px",
                      background: "#0f1011", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, color: "#f7f8f8", fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ flex: 1, fontSize: 13, color: "#8a8f98" }}>
                  Fin
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    style={{
                      width: "100%", marginTop: 4, padding: "8px 12px",
                      background: "#0f1011", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, color: "#f7f8f8", fontSize: 14,
                    }}
                  />
                </label>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8a8f98", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  style={{ accentColor: "#3b82f6" }}
                />
                Activo
              </label>
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>⚠️ {error}</p>}

            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: "8px 16px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                color: "#8a8f98", cursor: "pointer", fontSize: 13,
              }}>
                Cancelar
              </button>
              <button onClick={handleSave} style={{
                padding: "8px 16px", background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6,
                color: "#3b82f6", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
