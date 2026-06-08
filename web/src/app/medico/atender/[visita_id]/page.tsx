"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthFetch, useAuth } from "../../../auth-context";
import {
  Save,
  ArrowLeft,
  FileText,
  Pill,
  Activity,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";

type PacienteData = {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  obra_social: string;
};

type Historial = {
  paciente: any;
  historia_clinica: any;
  atenciones: any[];
  practicas: any[];
  turnos: any[];
  resumen: any;
};

type Medicamento = {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
};

type Estudio = {
  tipo_estudio: string;
  descripcion: string;
};

export default function AtenderPage({
  params,
}: {
  params: Promise<{ visita_id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const af = useAuthFetch();
  const visitaId = use(params).visita_id;

  const [paciente, setPaciente] = useState<PacienteData | null>(null);
  const [historial, setHistorial] = useState<Historial | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [atencionExistente, setAtencionExistente] = useState<number | null>(null); // ID de atención existente
  const [modoEdicion, setModoEdicion] = useState(false);

  // Form fields
  const [diagnostico, setDiagnostico] = useState("");
  const [evolucion, setEvolucion] = useState("");
  const [planTratamiento, setPlanTratamiento] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [examFisico, setExamFisico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [signos, setSignos] = useState({
    presion_arterial: "",
    temperatura: "",
    frecuencia_cardiaca: "",
    peso: "",
    altura: "",
  });

  // Receta
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    { medicamento: "", dosis: "", frecuencia: "", duracion: "" },
  ]);
  const [indicacionesReceta, setIndicacionesReceta] = useState("");

  // Estudios
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [nuevoEstudio, setNuevoEstudio] = useState({
    tipo_estudio: "",
    descripcion: "",
  });

  const ESTUDIO_TIPOS = [
    "Laboratorio",
    "Radiografía",
    "Ecografía",
    "Electrocardiograma",
    "Resonancia magnética",
    "Tomografía",
    "Hemograma completo",
    "Glucemia",
    "Perfil lipídico",
    "Urocultivo",
    "Otro",
  ];

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);

        // 1. Traer info de la visita directamente por ID
        const visitaRes = await af(`/api/turnos/${visitaId}`);
        if (!visitaRes.ok) {
          setError("No se encontró el turno especificado");
          return;
        }
        const visita = await visitaRes.json();

        // 2. Traer datos del paciente
        const paciRes = await af(`/api/pacientes/${visita.paciente_id}`);
        const paciData = await paciRes.json();
        setPaciente(paciData);

        // 3. Traer historial completo
        const histRes = await af(`/api/pacientes/${visita.paciente_id}/historial`);
        const histData = await histRes.json();
        
        // 403 = no tiene acceso al historial de OTRO médico — no es error
        if (histRes.ok) {
          setHistorial(histData);
          // Pre-llenar si ya tiene HC — DEFENSIVO: el campo puede ser string o array
          const hc = histData && histData.historia_clinica ? histData.historia_clinica : null;
          if (hc && hc.medicacion_habitual) {
            const med = hc.medicacion_habitual;
            if (Array.isArray(med)) {
              setAnamnesis(med.join("\n"));
            } else if (typeof med === "string") {
              setAnamnesis(med); // ya viene como string
            } else {
              setAnamnesis(String(med));
            }
          }
        }

        // 4. ¿Ya existe atención para esta visita? Si sí, cargarla para editar
        const atenCheckRes = await af(`/api/atenciones/visita/${visitaId}`);
        if (atenCheckRes.ok) {
          const atenCheck = await atenCheckRes.json();
          if (atenCheck?.exists && atenCheck?.atencion) {
            const aten = atenCheck.atencion;
            setAtencionExistente(aten.id);
            setModoEdicion(true);
            // Pre-llenar formulario con datos existentes
            if (aten.diagnostico) setDiagnostico(aten.diagnostico);
            if (aten.evolucion) setEvolucion(aten.evolucion);
            if (aten.plan_tratamiento) setPlanTratamiento(aten.plan_tratamiento);
            if (aten.anamnesis) setAnamnesis(aten.anamnesis);
            if (aten.examen_fisico) setExamFisico(aten.examen_fisico);
            if (aten.observaciones) setObservaciones(aten.observaciones);
            if (aten.presion_arterial) setSignos(prev => ({ ...prev, presion_arterial: aten.presion_arterial }));
            if (aten.temperatura) setSignos(prev => ({ ...prev, temperatura: String(aten.temperatura) }));
            if (aten.frecuencia_cardiaca) setSignos(prev => ({ ...prev, frecuencia_cardiaca: String(aten.frecuencia_cardiaca) }));
            if (aten.peso) setSignos(prev => ({ ...prev, peso: String(aten.peso) }));
            if (aten.altura) setSignos(prev => ({ ...prev, altura: String(aten.altura) }));
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("No se pudieron cargar los datos del paciente");
      } finally {
        setLoading(false);
      }
    }

    if (visitaId) {
      cargarDatos();
    }
  }, [visitaId, af]);

  function addMedicamento() {
    setMedicamentos([
      ...medicamentos,
      { medicamento: "", dosis: "", frecuencia: "", duracion: "" },
    ]);
  }

  function removeMedicamento(idx: number) {
    setMedicamentos(medicamentos.filter((_, i) => i !== idx));
  }

  function updateMedicamento(
    idx: number,
    field: keyof Medicamento,
    value: string
  ) {
    const updated = [...medicamentos];
    updated[idx] = { ...updated[idx], [field]: value };
    setMedicamentos(updated);
  }

  function addEstudio() {
    if (estudios.some((e) => e.tipo_estudio === nuevoEstudio.tipo_estudio)) {
      return; // no duplicar
    }
    setEstudios([...estudios, { ...nuevoEstudio }]);
    setNuevoEstudio({ tipo_estudio: "", descripcion: "" });
  }

  function removeEstudio(idx: number) {
    setEstudios(estudios.filter((_, i) => i !== idx));
  }

  async function guardarTodo() {
    if (!diagnostico.trim()) {
      alert("El diagnóstico es obligatorio");
      return;
    }

    const vid = parseInt(visitaId);
    setSaving(true);
    setError(null);

    try {
      const userMedicoId = (user as any)?.medico_id || null;
      if (!userMedicoId) {
        setError(
          "No se pudo identificar tu perfil de médico. Contactá al administrador."
        );
        setSaving(false);
        return;
      }

      // 1. Crear ATENCIÓN MÉDICA
      const atencionBody: Record<string, any> = {
        visita_id: vid,
        paciente_nuevo_id: paciente?.id,
        medico_id: userMedicoId,
        diagnostico: diagnostico.trim(),
        estado: "completado",
        fecha_hora_inicio: new Date().toISOString(),
      };
      if (evolucion.trim()) atencionBody.evolucion = evolucion.trim();
      if (planTratamiento.trim())
        atencionBody.plan_tratamiento = planTratamiento.trim();
      if (anamnesis.trim()) atencionBody.anamnesis = anamnesis.trim();
      if (examFisico.trim()) atencionBody.examen_fisico = examFisico.trim();
      if (observaciones.trim())
        atencionBody.observaciones = observaciones.trim();
      if (signos.presion_arterial)
        atencionBody.presion_arterial = signos.presion_arterial;
      if (signos.temperatura)
        atencionBody.temperatura = parseFloat(signos.temperatura);
      if (signos.frecuencia_cardiaca)
        atencionBody.frecuencia_cardiaca = parseInt(signos.frecuencia_cardiaca);
      if (signos.peso) atencionBody.peso = parseFloat(signos.peso);
      if (signos.altura) atencionBody.altura = parseFloat(signos.altura);

      // Si hay atención existente, editar con PUT. Si no, crear con POST
      // POST ahora hace upsert automático si ya existe
      const atenRes = modoEdicion && atencionExistente
        ? await af(`/api/atenciones/${atencionExistente}/`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atencionBody),
          })
        : await af("/api/atenciones/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(atencionBody),
          });

      let atencionId: number;

      if (!atenRes.ok) {
        const errData = await atenRes.json().catch(() => ({}));
        throw new Error(
          `Error guardando atención: ${errData.detail || atenRes.status}`
        );
      }

      const result = await atenRes.json();
      atencionId = result.id;

      // 2. Crear RECETA (si hay medicamentos válidos)
      const medsValidos = medicamentos.filter((m) => m.medicamento.trim());
      if (medsValidos.length > 0) {
        const recetaBody = {
          atencion_medica_id: atencionId,
          paciente_nuevo_id: paciente?.id,
          medico_id: userMedicoId,
          medicamentos: medsValidos,
          indicaciones: indicacionesReceta.trim() || undefined,
          valida_hasta: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
        };

        const recetaRes = await af("/api/recetas/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recetaBody),
        });

        if (!recetaRes.ok) {
          // No fatal - la atención ya se creó
          console.warn("Receta no creada:", await recetaRes.text());
        }
      }

      // 3. Crear ESTUDIOS (si hay)
      for (const est of estudios) {
        if (est.tipo_estudio) {
          const estBody = {
            paciente_nuevo_id: paciente?.id,
            tipo_estudio: est.tipo_estudio,
            descripcion: est.descripcion.trim() || undefined,
            fecha_estudio: new Date().toISOString().split("T")[0],
            archivo_nombre: "",
            archivo_url: "",
            archivo_tipo: "",
            archivo_tamano_bytes: 0,
          };

          await af("/api/estudios_adjuntos/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(estBody),
          }).catch((e) => console.warn("Estudio no creado:", e));
        }
      }

      // Éxito
      setSaveSuccess(true);
      setTimeout(() => {
        router.push("/medico/hoy");
      }, 1500);
    } catch (err: any) {
      console.error("Error guardando:", err);
      setError(err.message || "Error guardando la atención");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, color: "#8a8f98" }}>
        Cargando datos del paciente...
      </div>
    );
  }

  if (error && !saveSuccess) {
    return (
      <div style={{ padding: 32 }}>
        <div
          style={{
            padding: 16,
            background: "#1a0a0a",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10,
            color: "#ef4444",
          }}
        >
          ⚠️ {error}
        </div>
        <button
          onClick={() => router.push("/medico/hoy")}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            background: "none",
// force recompile

            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#8a8f98",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: "#22c55e",
        }}
      >
        <CheckCircle size={48} style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
          ✅ Atención guardada correctamente
        </h2>
        <p style={{ color: "#8a8f98", fontSize: 14 }}>
          Redirigiendo a la agenda...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => router.push("/medico/hoy")}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#8a8f98",
            cursor: "pointer",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1
            style={{ fontSize: 20, fontWeight: 700, color: "#f7f8f8", margin: 0 }}
          >
            Atender Paciente
          </h1>
          {paciente && (
            <p style={{ fontSize: 13, color: "#8a8f98", margin: "4px 0 0" }}>
              {paciente.nombre} {paciente.apellido} • DNI: {paciente.dni} •{" "}
              {paciente.obra_social || "Particular"}
              {modoEdicion && (
                <span style={{ color: "#f59e0b", marginLeft: 8 }}>
                  ✏️ Editando atención existente
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* HISTORIA CLÍNICA PREVIA */}
      {historial && historial.atenciones && historial.atenciones.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#0f1011",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#c9cdd4",
              margin: "0 0 10px",
            }}
          >
            📁 Últimas atenciones ({historial.atenciones.length} total)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {historial.atenciones
              .slice(-3)
              .reverse()
              .map((at: any, i: number) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    background: "#131416",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#8a8f98",
                  }}
                >
                  <span style={{ color: "#c9cdd4", fontWeight: 600 }}>
                    {at.fecha_hora?.slice(0, 10)}:
                  </span>{" "}
                  {at.diagnostico || "Sin diagnóstico"}
                  {at.presion_arterial && (
                    <span style={{ color: "#62666d", marginLeft: 8 }}>
                      PA: {at.presion_arterial}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* COLUMNA IZQUIERDA: Diagnóstico y Evolución */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Diagnóstico */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Activity size={14} />
              Diagnóstico *
            </label>
            <textarea
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Escribí el diagnóstico..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Evolución */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 8,
                display: "block",
              }}
            >
              Evolución de la consulta
            </label>
            <textarea
              value={evolucion}
              onChange={(e) => setEvolucion(e.target.value)}
              placeholder="Evolución, cambios desde la última visita..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Plan de tratamiento */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 8,
                display: "block",
              }}
            >
              Plan de tratamiento
            </label>
            <textarea
              value={planTratamiento}
              onChange={(e) => setPlanTratamiento(e.target.value)}
              placeholder="Plan a seguir, indicaciones..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 14,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Anamnesis + Examen físico */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 8,
                display: "block",
              }}
            >
              Anamnesis / Antecedentes
            </label>
            <textarea
              value={anamnesis}
              onChange={(e) => setAnamnesis(e.target.value)}
              placeholder="Antecedentes, alergias, medicación habitual..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
                marginBottom: 12,
              }}
            />

            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 8,
                display: "block",
              }}
            >
              Examen físico
            </label>
            <textarea
              value={examFisico}
              onChange={(e) => setExamFisico(e.target.value)}
              placeholder="Hallazgos del examen físico..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Signos vitales (opcional) */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 10,
                display: "block",
              }}
            >
              Signos vitales (opcional)
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {Object.entries({
                presion_arterial: "Presión arterial",
                temperatura: "Temp. °C",
                frecuencia_cardiaca: "FC (lpm)",
                peso: "Peso (kg)",
                altura: "Altura (m)",
              }).map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: "#62666d", marginBottom: 4 }}>
                    {label}
                  </div>
                  <input
                    value={(signos as any)[key]}
                    onChange={(e) =>
                      setSignos({ ...signos, [key]: e.target.value })
                    }
                    placeholder="—"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: "#0a0a0c",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#f7f8f8",
                      fontSize: 13,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Receta + Estudios */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* RECETA */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Pill size={14} />
              Receta Médica
            </div>

            {medicamentos.map((med, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: "#0a0a0c",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#62666d" }}>
                    Medicamento #{idx + 1}
                  </span>
                  {medicamentos.length > 1 && (
                    <button
                      onClick={() => removeMedicamento(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  value={med.medicamento}
                  onChange={(e) =>
                    updateMedicamento(idx, "medicamento", e.target.value)
                  }
                  placeholder="Nombre del medicamento"
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    background: "#131416",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    color: "#f7f8f8",
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                  }}
                >
                  <input
                    value={med.dosis}
                    onChange={(e) =>
                      updateMedicamento(idx, "dosis", e.target.value)
                    }
                    placeholder="Dosis (400mg)"
                    style={{
                      padding: "6px 8px",
                      background: "#131416",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#f7f8f8",
                      fontSize: 12,
                    }}
                  />
                  <input
                    value={med.frecuencia}
                    onChange={(e) =>
                      updateMedicamento(idx, "frecuencia", e.target.value)
                    }
                    placeholder="Frecuencia (cada 8h)"
                    style={{
                      padding: "6px 8px",
                      background: "#131416",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#f7f8f8",
                      fontSize: 12,
                    }}
                  />
                  <input
                    value={med.duracion}
                    onChange={(e) =>
                      updateMedicamento(idx, "duracion", e.target.value)
                    }
                    placeholder="Duración (7 días)"
                    style={{
                      padding: "6px 8px",
                      background: "#131416",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6,
                      color: "#f7f8f8",
                      fontSize: 12,
                      gridColumn: "span 2",
                    }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={addMedicamento}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                background: "rgba(94,106,210,0.15)",
                border: "1px solid rgba(94,106,210,0.3)",
                borderRadius: 6,
                color: "#7170ff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Plus size={14} /> Agregar medicamento
            </button>

            <div style={{ marginTop: 12 }}>
              <label
                style={{ fontSize: 12, color: "#62666d", marginBottom: 4, display: "block" }}
              >
                Indicaciones generales
              </label>
              <textarea
                value={indicacionesReceta}
                onChange={(e) => setIndicacionesReceta(e.target.value)}
                placeholder="Tomar con comida, en ayunas, etc."
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#0a0a0c",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#f7f8f8",
                  fontSize: 13,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* ESTUDIOS */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FileText size={14} />
              Estudios a indicar
            </div>

            {/* Lista de estudios ya agregados */}
            {estudios.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {estudios.map((e, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#0a0a0c",
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, color: "#f7f8f8", fontWeight: 600 }}>
                        {e.tipo_estudio}
                      </span>
                      {e.descripcion && (
                        <span style={{ fontSize: 12, color: "#62666d", marginLeft: 8 }}>
                          — {e.descripcion}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeEstudio(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar nuevo estudio */}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <select
                value={nuevoEstudio.tipo_estudio}
                onChange={(e) =>
                  setNuevoEstudio({
                    ...nuevoEstudio,
                    tipo_estudio: e.target.value,
                  })
                }
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  background: "#0a0a0c",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#f7f8f8",
                  fontSize: 13,
                }}
              >
                <option value="">Seleccionar tipo de estudio...</option>
                {ESTUDIO_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                value={nuevoEstudio.descripcion}
                onChange={(e) =>
                  setNuevoEstudio({
                    ...nuevoEstudio,
                    descripcion: e.target.value,
                  })
                }
                placeholder="Detalle (opcional)"
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  background: "#0a0a0c",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#f7f8f8",
                  fontSize: 13,
                }}
              />
              <button
                onClick={addEstudio}
                disabled={!nuevoEstudio.tipo_estudio}
                style={{
                  padding: "6px 10px",
                  background: nuevoEstudio.tipo_estudio
                    ? "rgba(94,106,210,0.15)"
                    : "transparent",
                  border: "1px solid rgba(94,106,210,0.3)",
                  borderRadius: 6,
                  color: nuevoEstudio.tipo_estudio ? "#7170ff" : "#62666d",
                  cursor: nuevoEstudio.tipo_estudio ? "pointer" : "default",
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Observaciones */}
          <div
            style={{
              padding: 16,
              background: "#131416",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c9cdd4",
                marginBottom: 8,
                display: "block",
              }}
            >
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#f7f8f8",
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <button
          onClick={() => router.push("/medico/hoy")}
          style={{
            padding: "10px 20px",
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#8a8f98",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={guardarTodo}
          disabled={saving || !diagnostico.trim()}
          style={{
            padding: "10px 24px",
            background:
              saving || !diagnostico.trim()
                ? "#3b3d42"
                : "linear-gradient(135deg, #5e6ad2, #7170ff)",
            border: "none",
            borderRadius: 8,
            color: saving || !diagnostico.trim() ? "#62666d" : "white",
            cursor: saving || !diagnostico.trim() ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Save size={16} />
          {modoEdicion ? "💾 Actualizar atención" : "💾 Guardar atención"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: "#1a0a0a",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
