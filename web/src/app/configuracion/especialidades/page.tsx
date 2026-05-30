"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../auth-context";

interface Especialidad {
  id: number;
  nombre: string;
  codigo: string;
  duracion_turno_default: number;
  color_hex: string;
  activa: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function EspecialidadesPage() {
  const { token, user } = useAuth();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    duracion_turno_default: 30,
    color_hex: "#5e6ad2",
    activa: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchEspecialidades = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/especialidades/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
      });
      if (!res.ok) throw new Error("Error al cargar especialidades");
      const data = await res.json();
      setEspecialidades(data.especialidades || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, user, showToast]);

  useEffect(() => {
    fetchEspecialidades();
  }, [fetchEspecialidades]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.codigo.trim()) newErrors.codigo = "El código es requerido";
    if (formData.duracion_turno_default < 5 || formData.duracion_turno_default > 240)
      newErrors.duracion_turno_default = "Duración debe estar entre 5 y 240 minutos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = editingId
        ? `${API}/especialidades/${editingId}`
        : `${API}/especialidades/`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al guardar");
      }

      showToast(
        editingId ? "Especialidad actualizada exitosamente" : "Especialidad creada exitosamente",
        "success"
      );
      setShowModal(false);
      resetForm();
      fetchEspecialidades();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (esp: Especialidad) => {
    setEditingId(esp.id);
    setFormData({
      nombre: esp.nombre,
      codigo: esp.codigo,
      duracion_turno_default: esp.duracion_turno_default,
      color_hex: esp.color_hex,
      activa: esp.activa,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar esta especialidad?")) return;

    try {
      const res = await fetch(`${API}/especialidades/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
      });

      if (!res.ok) throw new Error("Error al eliminar");
      showToast("Especialidad eliminada exitosamente", "success");
      fetchEspecialidades();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      codigo: "",
      duracion_turno_default: 30,
      color_hex: "#5e6ad2",
      activa: true,
    });
    setEditingId(null);
    setErrors({});
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#08090a", padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
            Especialidades Médicas
          </h1>
          <button
            onClick={openNewModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, #5e6ad2, #7170ff)",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(94,106,210,0.3)",
            }}
          >
            <Plus size={18} />
            Nueva Especialidad
          </button>
        </div>
        <p style={{ fontSize: 14, color: "#8a8f98", margin: 0 }}>
          Gestiona las especialidades disponibles en tu clínica
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 1000,
            background: toast.type === "success" ? "#0f5132" : "#842029",
            border: `1px solid ${toast.type === "success" ? "#198754" : "#dc3545"}`,
            borderRadius: 8,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            maxWidth: 400,
          }}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} color="#75b798" />
          ) : (
            <AlertCircle size={20} color="#ea868f" />
          )}
          <span style={{ fontSize: 14, color: "#f7f8f8" }}>{toast.message}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={32} color="#5e6ad2" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div style={{
          background: "#0f1011",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Nombre
                </th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Código
                </th>
                <th style={{ padding: "14px 18px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Duración
                </th>
                <th style={{ padding: "14px 18px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Color
                </th>
                <th style={{ padding: "14px 18px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Estado
                </th>
                <th style={{ padding: "14px 18px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {especialidades.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px 0", textAlign: "center", fontSize: 14, color: "#62666d" }}>
                    No hay especialidades registradas. Haz click en "Nueva Especialidad" para comenzar.
                  </td>
                </tr>
              ) : (
                especialidades.map((esp) => (
                  <tr key={esp.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "16px 18px", fontSize: 14, color: "#f7f8f8", fontWeight: 500 }}>
                      {esp.nombre}
                    </td>
                    <td style={{ padding: "16px 18px", fontSize: 13, color: "#8a8f98", fontFamily: "monospace" }}>
                      {esp.codigo}
                    </td>
                    <td style={{ padding: "16px 18px", textAlign: "center", fontSize: 13, color: "#8a8f98" }}>
                      {esp.duracion_turno_default} min
                    </td>
                    <td style={{ padding: "16px 18px", textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: esp.color_hex,
                          border: "2px solid rgba(255,255,255,0.1)",
                        }} />
                        <span style={{ fontSize: 12, color: "#8a8f98", fontFamily: "monospace" }}>
                          {esp.color_hex}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 18px", textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: esp.activa ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: esp.activa ? "#4ade80" : "#f87171",
                        border: `1px solid ${esp.activa ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {esp.activa ? "ACTIVA" : "INACTIVA"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 18px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleEdit(esp)}
                          style={{
                            background: "rgba(94,106,210,0.1)",
                            border: "1px solid rgba(94,106,210,0.3)",
                            borderRadius: 6,
                            padding: "6px 10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#7170ff",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <Edit size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(esp.id)}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 6,
                            padding: "6px 10px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#f87171",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#0f1011",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", margin: 0 }}>
                {editingId ? "Editar Especialidad" : "Nueva Especialidad"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#8a8f98",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "24px" }}>
                {/* Nombre */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
                    Nombre de la Especialidad *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#08090a",
                      border: `1px solid ${errors.nombre ? "#dc3545" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8,
                      fontSize: 14,
                      color: "#f7f8f8",
                      outline: "none",
                    }}
                    placeholder="Ej: Cardiología"
                  />
                  {errors.nombre && (
                    <span style={{ display: "block", fontSize: 12, color: "#dc3545", marginTop: 4 }}>
                      {errors.nombre}
                    </span>
                  )}
                </div>

                {/* Código */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#08090a",
                      border: `1px solid ${errors.codigo ? "#dc3545" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8,
                      fontSize: 14,
                      color: "#f7f8f8",
                      outline: "none",
                      fontFamily: "monospace",
                    }}
                    placeholder="Ej: CARDIO"
                  />
                  {errors.codigo && (
                    <span style={{ display: "block", fontSize: 12, color: "#dc3545", marginTop: 4 }}>
                      {errors.codigo}
                    </span>
                  )}
                </div>

                {/* Duración */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
                    Duración Default (minutos) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={formData.duracion_turno_default}
                    onChange={(e) => setFormData({ ...formData, duracion_turno_default: parseInt(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#08090a",
                      border: `1px solid ${errors.duracion_turno_default ? "#dc3545" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 8,
                      fontSize: 14,
                      color: "#f7f8f8",
                      outline: "none",
                    }}
                  />
                  {errors.duracion_turno_default && (
                    <span style={{ display: "block", fontSize: 12, color: "#dc3545", marginTop: 4 }}>
                      {errors.duracion_turno_default}
                    </span>
                  )}
                </div>

                {/* Color */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
                    Color
                  </label>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      style={{
                        width: 50,
                        height: 40,
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: "#08090a",
                      }}
                    />
                    <input
                      type="text"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        background: "#08090a",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#f7f8f8",
                        outline: "none",
                        fontFamily: "monospace",
                      }}
                      placeholder="#5e6ad2"
                    />
                  </div>
                </div>

                {/* Activa */}
                <div style={{ marginBottom: 0 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      style={{
                        width: 18,
                        height: 18,
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#f7f8f8" }}>
                      Especialidad activa
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "16px 24px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "9px 18px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#8a8f98",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "9px 18px",
                    background: submitting ? "#4a4f5a" : "linear-gradient(135deg, #5e6ad2, #7170ff)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "white",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />}
                  {submitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
