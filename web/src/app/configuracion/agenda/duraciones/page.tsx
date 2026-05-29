"use client";

import { useState, useEffect } from "react";
import { useAuth, useAuthFetch } from "@/app/auth-context";

interface DuracionPrestacion {
  id: number;
  empresa_id: number;
  especialidad: string;
  duracion_minutos: number;
  sobre_turnos_permitidos: number;
}

export default function DuracionesPage() {
  const authFetch = useAuthFetch();
  const [duraciones, setDuraciones] = useState<DuracionPrestacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    duracion_minutos: 30,
    sobre_turnos_permitidos: 0,
  });

  useEffect(() => {
    loadDuraciones();
  }, []);

  const loadDuraciones = async () => {
    try {
      setLoading(true);
      const r = await authFetch("/configuracion-agenda/duracion-prestaciones/"); const data = await r.json();
      setDuraciones(data);
    } catch (error) {
      console.error("Error cargando duraciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (duracion: DuracionPrestacion) => {
    setEditando(duracion.id);
    setFormData({
      duracion_minutos: duracion.duracion_minutos,
      sobre_turnos_permitidos: duracion.sobre_turnos_permitidos,
    });
  };

  const handleSave = async (duracionId: number) => {
    try {
      await authFetch(`/configuracion-agenda/duracion-prestaciones/${duracionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      await loadDuraciones();
      setEditando(null);
    } catch (error: any) {
      alert(error.message || "Error al actualizar duración");
    }
  };

  const handleCancel = () => {
    setEditando(null);
    setFormData({
      duracion_minutos: 30,
      sobre_turnos_permitidos: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ⏱️ Duración de Turnos
        </h2>
        <p className="text-gray-600">
          Configurar tiempo de consulta y sobreturnos permitidos por especialidad
        </p>
      </div>

      {/* Lista de Duraciones */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {duraciones.map((duracion) => (
            <div
              key={duracion.id}
              className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-blue-400 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {duracion.especialidad}
              </h3>

              {editando === duracion.id ? (
                // Modo edición
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración del Turno (minutos)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      step="5"
                      value={formData.duracion_minutos}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duracion_minutos: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sobreturnos Permitidos
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.sobre_turnos_permitidos}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sobre_turnos_permitidos: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(duracion.id)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      💾 Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Duración del Turno
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {duracion.duracion_minutos} min
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Sobreturnos Permitidos
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {duracion.sobre_turnos_permitidos}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(duracion)}
                    className="w-full py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-medium transition-colors"
                  >
                    ✏️ Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-blue-900 mb-2">ℹ️ Información</h4>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>
            <strong>Duración del Turno:</strong> Tiempo asignado a cada consulta (típicamente 15-60 minutos)
          </li>
          <li>
            <strong>Sobreturnos:</strong> Cantidad de turnos extras permitidos por día para casos urgentes
          </li>
          <li>
            <strong>Nota:</strong> Los cambios se aplican a todos los turnos nuevos de esa especialidad
          </li>
        </ul>
      </div>
    </div>
  );
}
