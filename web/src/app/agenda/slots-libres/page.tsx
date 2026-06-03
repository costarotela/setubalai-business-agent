"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Clock, User, CheckCircle, AlertCircle, Loader2, Filter } from "lucide-react";
import { useAuth } from "../../auth-context";
import { useFiltrosClinica } from "../../../contexts/FiltrosClinicaContext";
import { SelectEspecialidadMedico } from "../../../components/SelectEspecialidadMedico";

interface Slot {
  medico_id: number;
  medico_nombre: string;
  especialidad: string;
  fecha: string;
  hora: string;
  disponible: boolean;
  duracion_minutos: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function SlotsLibresPage() {
  const { token, user } = useAuth();
  const f = useFiltrosClinica();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    return future.toISOString().split('T')[0];
  });

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Cargar slots (lee directamente del Context global)
  const fetchSlots = useCallback(async () => {
    if (!f.selectedEspecialidadId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        empresa_id: String(user?.empresa_id || ""),
        especialidad_id: String(f.selectedEspecialidadId),
        fecha_desde: fechaInicio,
        fecha_hasta: fechaFin,
        ...(f.selectedMedicoId ? { medico_id: String(f.selectedMedicoId) } : {}),
      });
      
      const res = await fetch(`${API}/agenda/slots-libres?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Empresa-Id": String(user?.empresa_id || ""),
        },
      });
      
      if (!res.ok) throw new Error("Error al cargar slots");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [f.selectedEspecialidadId, f.selectedMedicoId, fechaInicio, fechaFin, token, user?.empresa_id, showToast]);

  useEffect(() => {
    if (f.selectedEspecialidadId) {
      fetchSlots();
    }
  }, [f.selectedEspecialidadId, f.selectedMedicoId, fechaInicio, fechaFin]);

  const handleReservar = (slot: Slot) => {
    setSelectedSlot(slot);
    setShowConfirmModal(true);
  };

  const confirmarReserva = () => {
    showToast(`Turno reservado para ${selectedSlot?.medico_nombre} el ${selectedSlot?.fecha} a las ${selectedSlot?.hora}`, "success");
    setShowConfirmModal(false);
    setSelectedSlot(null);
    // Aquí integrarías con el endpoint de creación de turnos
  };

  // Agrupar slots por fecha
  const slotsPorFecha = slots.reduce((acc, slot) => {
    if (!acc[slot.fecha]) acc[slot.fecha] = [];
    acc[slot.fecha].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  const fechasOrdenadas = Object.keys(slotsPorFecha).sort();

  const especialidadSeleccionada = f.selectedEspecialidadId
    ? f.especialidades.find(e => e.id === f.selectedEspecialidadId)
    : undefined;

  return (
    <div style={{ minHeight: "100vh", background: "#08090a", padding: "24px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f7f8f8", margin: 0, marginBottom: 8 }}>
          Agenda - Slots Libres
        </h1>
        <p style={{ fontSize: 14, color: "#8a8f98", margin: 0 }}>
          Visualiza y reserva turnos disponibles por especialidad
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

      {/* Filtros */}
      <div style={{
        background: "#0f1011",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "24px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <Filter size={18} color="#7170ff" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f7f8f8", margin: 0 }}>
            Filtros de Búsqueda
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {/* Especialidad + Médico (dependientes via Context Provider) */}
          <div style={{ gridColumn: "1 / 4" }}>
          <SelectEspecialidadMedico
            showLabels={true}
            horizontal={true}
          />
          </div>

          {/* Fecha Inicio */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#08090a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 14,
                color: "#f7f8f8",
                outline: "none",
              }}
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#f7f8f8", marginBottom: 8 }}>
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#08090a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 14,
                color: "#f7f8f8",
                outline: "none",
              }}
            />
          </div>
        </div>

        {especialidadSeleccionada && (
          <div style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "rgba(94,106,210,0.08)",
            border: "1px solid rgba(94,106,210,0.2)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: especialidadSeleccionada.color_hex || "#7170ff",
            }} />
            <span style={{ fontSize: 13, color: "#8a8f98" }}>
              Mostrando turnos para <strong style={{ color: "#f7f8f8" }}>{especialidadSeleccionada.nombre}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={32} color="#5e6ad2" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Grilla de Slots */}
      {!loading && !f.loading && (
        <div>
          {fechasOrdenadas.length === 0 ? (
            <div style={{
              background: "#0f1011",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "60px 24px",
              textAlign: "center",
            }}>
              <Calendar size={48} color="#62666d" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#f7f8f8", margin: "0 0 8px" }}>
                No hay slots disponibles
              </h3>
              <p style={{ fontSize: 14, color: "#8a8f98", margin: 0 }}>
                {f.selectedEspecialidadId 
                  ? "No se encontraron turnos disponibles para los filtros seleccionados."
                  : "Selecciona una especialidad para ver los turnos disponibles."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {fechasOrdenadas.map((fecha) => {
                const slotsDelDia = slotsPorFecha[fecha];
                const fechaObj = new Date(fecha + "T00:00:00");
                const opciones: Intl.DateTimeFormatOptions = { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                };
                const fechaFormateada = fechaObj.toLocaleDateString("es-ES", opciones);

                return (
                  <div key={fecha}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                      paddingBottom: 10,
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <Calendar size={18} color="#7170ff" />
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f7f8f8", margin: 0, textTransform: "capitalize" }}>
                        {fechaFormateada}
                      </h3>
                      <span style={{
                        fontSize: 12,
                        color: "#62666d",
                        background: "rgba(255,255,255,0.03)",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}>
                        {slotsDelDia.length} {slotsDelDia.length === 1 ? "turno" : "turnos"}
                      </span>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 12,
                    }}>
                      {slotsDelDia.map((slot, idx) => {
                        const horaFin = new Date(`2000-01-01T${slot.hora}`);
                        horaFin.setMinutes(horaFin.getMinutes() + slot.duracion_minutos);
                        const horaFinStr = horaFin.toTimeString().substring(0, 5);
                        
                        return (
                        <div
                          key={`${slot.medico_id}-${slot.fecha}-${slot.hora}-${idx}`}
                          style={{
                            background: "#0f1011",
                            border: slot.disponible 
                              ? "1px solid rgba(34,197,94,0.3)" 
                              : "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 10,
                            padding: "16px",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* Indicador de estado */}
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: 3,
                            background: slot.disponible 
                              ? "linear-gradient(90deg, #22c55e, #4ade80)" 
                              : "linear-gradient(90deg, #62666d, #8a8f98)",
                          }} />

                          <div style={{ marginTop: 4 }}>
                            {/* Hora */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <Clock size={16} color="#7170ff" />
                              <span style={{ fontSize: 16, fontWeight: 700, color: "#f7f8f8" }}>
                                {slot.hora} - {horaFinStr}
                              </span>
                            </div>

                            {/* Médico */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                              <User size={14} color="#8a8f98" />
                              <span style={{ fontSize: 13, color: "#8a8f98" }}>
                                {slot.medico_nombre}
                              </span>
                            </div>

                            {/* Botón */}
                            <button
                              onClick={() => handleReservar(slot)}
                              disabled={!slot.disponible}
                              style={{
                                width: "100%",
                                padding: "9px 16px",
                                background: slot.disponible 
                                  ? "linear-gradient(135deg, #22c55e, #4ade80)" 
                                  : "#1a1b1e",
                                border: "none",
                                borderRadius: 7,
                                fontSize: 13,
                                fontWeight: 600,
                                color: slot.disponible ? "white" : "#62666d",
                                cursor: slot.disponible ? "pointer" : "not-allowed",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                              }}
                            >
                              {slot.disponible ? (
                                <>
                                  <CheckCircle size={16} />
                                  Reservar Turno
                                </>
                              ) : (
                                "No Disponible"
                              )}
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmación */}
      {showConfirmModal && selectedSlot && (
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
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              background: "#0f1011",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              maxWidth: 460,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "24px" }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #22c55e, #4ade80)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <CheckCircle size={24} color="white" />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", margin: "0 0 8px" }}>
                Confirmar Reserva
              </h2>
              <p style={{ fontSize: 14, color: "#8a8f98", margin: "0 0 20px" }}>
                ¿Deseas confirmar este turno?
              </p>

              <div style={{
                background: "rgba(94,106,210,0.08)",
                border: "1px solid rgba(94,106,210,0.2)",
                borderRadius: 8,
                padding: "16px",
                marginBottom: 20,
              }}>
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#62666d", display: "block", marginBottom: 4 }}>
                    Fecha y Hora
                  </span>
                  <span style={{ fontSize: 15, color: "#f7f8f8", fontWeight: 600 }}>
                    {new Date(selectedSlot.fecha + "T00:00:00").toLocaleDateString("es-ES", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </span>
                  <br />
                  <span style={{ fontSize: 15, color: "#f7f8f8", fontWeight: 600 }}>
                    {selectedSlot.hora} ({selectedSlot.duracion_minutos} min)
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: "#62666d", display: "block", marginBottom: 4 }}>
                    Profesional
                  </span>
                  <span style={{ fontSize: 15, color: "#f7f8f8", fontWeight: 600 }}>
                    {selectedSlot.medico_nombre}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
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
                  onClick={confirmarReserva}
                  style={{
                    flex: 1,
                    padding: "11px 16px",
                    background: "linear-gradient(135deg, #22c55e, #4ade80)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Confirmar
                </button>
              </div>
            </div>
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
