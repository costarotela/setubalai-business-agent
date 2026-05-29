"use client";
import { useState, useEffect } from "react";
import { Server, Database, Cpu, HardDrive, RefreshCw, Terminal, Key, ExternalLink } from "lucide-react";

const INFRA_API = "/infra-api/api";

interface Service {
  name: string;
  active: string;
  sub: string;
  description: string;
}

interface Container {
  Names: string;
  Status: string;
  Ports: string;
}

interface PCResources {
  output: string;
}

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export default function InfrastructureTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [pcStatus, setPCStatus] = useState({ connected: false, response: "" });
  const [pcResources, setPCResources] = useState<PCResources | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const loadData = async () => {
    setLoading(true);
    try {
      // VPS Services
      const svcRes = await fetch(`${INFRA_API}/vps/services`);
      const svcData = await svcRes.json();
      setServices(svcData.services || []);

      // Docker Containers
      const contRes = await fetch(`${INFRA_API}/vps/containers`);
      const contData = await contRes.json();
      setContainers(contData.containers || []);

      // PC Local Status
      const pcRes = await fetch(`${INFRA_API}/pc/status`);
      const pcData = await pcRes.json();
      setPCStatus(pcData);

      if (pcData.connected) {
        // PC Resources
        const pcResourcesRes = await fetch(`${INFRA_API}/pc/resources`);
        const pcResourcesData = await pcResourcesRes.json();
        setPCResources(pcResourcesData);

        // Ollama Models
        const ollamaRes = await fetch(`${INFRA_API}/pc/ollama/models`);
        const ollamaData = await ollamaRes.json();
        setOllamaModels(ollamaData.models || []);
      }
    } catch (error) {
      console.error("Error loading infrastructure data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#62666d" }}>
        <RefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: 15 }}>Cargando infraestructura...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 30, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f7f8f8", marginBottom: 8 }}>
            🗺️ Infraestructura SetubalAI
          </h2>
          <p style={{ color: "#62666d", fontSize: 13 }}>
            Mapa completo del ecosistema: VPS + PC Local via Tailscale
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            background: "#7170ff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 25, flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Vista General" },
          { id: "services", label: "Servicios VPS" },
          { id: "docker", label: "Docker" },
          { id: "pc", label: "PC Local" },
          { id: "database", label: "Base de Datos" },
          { id: "credentials", label: "Credenciales" },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            style={{
              background: activeSection === section.id ? "rgba(113, 112, 255, 0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeSection === section.id ? "#7170ff" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 8,
              padding: "8px 16px",
              color: activeSection === section.id ? "#7170ff" : "#8a8f98",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {activeSection === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {/* VPS Card */}
          <Card title="🖥️ VPS Hetzner" icon={<Server size={20} />}>
            <InfoRow label="Tailscale IP" value="100.72.101.29" />
            <InfoRow label="Servicios activos" value={`${services.length} servicios`} />
            <InfoRow label="Contenedores" value={`${containers.length} contenedores`} />
            <InfoRow label="PostgreSQL" value="business DB (25 tablas)" />
          </Card>

          {/* PC Local Card */}
          <Card title="💻 PC Local" icon={<Cpu size={20} />}>
            <InfoRow
              label="Estado"
              value={pcStatus.connected ? "✅ Conectado" : "❌ Desconectado"}
              color={pcStatus.connected ? "#10b981" : "#ef4444"}
            />
            <InfoRow label="Tailscale IP" value="100.81.134.102" />
            <InfoRow label="GPU" value="RTX 4050 6GB" />
            <InfoRow label="Ollama" value={`${ollamaModels.length} modelos`} />
          </Card>

          {/* Database Card */}
          <Card title="💾 Base de Datos" icon={<Database size={20} />}>
            <InfoRow label="Engine" value="PostgreSQL 17" />
            <InfoRow label="Container" value="paperclip-db" />
            <InfoRow label="Database" value="business" />
            <InfoRow label="Schema" value="setubalai (25 tablas)" />
          </Card>
        </div>
      )}

      {activeSection === "services" && (
        <div>
          <h3 style={{ color: "#f7f8f8", marginBottom: 15, fontSize: 16 }}>Servicios Systemd (VPS)</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {services.map((svc, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: 15,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#f7f8f8", fontSize: 13 }}>{svc.name}</strong>
                    <p style={{ color: "#62666d", fontSize: 12, marginTop: 4 }}>{svc.description}</p>
                  </div>
                  <Badge text={svc.active} color={svc.active === "active" ? "#10b981" : "#ef4444"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "docker" && (
        <div>
          <h3 style={{ color: "#f7f8f8", marginBottom: 15, fontSize: 16 }}>Contenedores Docker</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {containers.map((cont, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: 15,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#f7f8f8", fontSize: 13 }}>{cont.Names}</strong>
                    <p style={{ color: "#62666d", fontSize: 12, marginTop: 4 }}>
                      {cont.Ports || "No ports exposed"}
                    </p>
                  </div>
                  <Badge
                    text={cont.Status.includes("Up") ? "Running" : "Stopped"}
                    color={cont.Status.includes("Up") ? "#10b981" : "#6b7280"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === "pc" && (
        <div>
          <h3 style={{ color: "#f7f8f8", marginBottom: 15, fontSize: 16 }}>PC Local (Tailscale)</h3>
          {pcStatus.connected ? (
            <>
              <Card title="Recursos" icon={<HardDrive size={18} />}>
                <pre
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 11,
                    color: "#8a8f98",
                    overflow: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {pcResources?.output || "Cargando..."}
                </pre>
              </Card>

              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: "#f7f8f8", marginBottom: 12, fontSize: 14 }}>Modelos Ollama</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  {ollamaModels.map((model, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#f7f8f8", fontSize: 12 }}>{model.name}</span>
                      <span style={{ color: "#62666d", fontSize: 11 }}>
                        {(model.size / 1024 / 1024 / 1024).toFixed(2)} GB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 8,
                padding: 20,
                textAlign: "center",
                color: "#ef4444",
              }}
            >
              ❌ PC Local desconectado via Tailscale
            </div>
          )}
        </div>
      )}

      {activeSection === "credentials" && (
        <div style={{ display: "grid", gap: 20 }}>
          <CredentialCard
            title="👑 Superadmin"
            items={[
              { label: "Email", value: "pcostarotela@gmail.com" },
              { label: "Password", value: "Pablo2024!" },
              { label: "Panel", value: "admin.setubalai.org" },
              { label: "Rol", value: "superadmin" },
            ]}
          />

          <CredentialCard
            title="💾 Base de Datos"
            items={[
              { label: "Container", value: "paperclip-db" },
              { label: "Host", value: "localhost:5432" },
              { label: "Database", value: "business" },
              { label: "Schema", value: "setubalai" },
              { label: "User", value: "paperclip" },
            ]}
          />

          <CredentialCard
            title="💻 PC Local SSH"
            items={[
              { label: "SSH", value: "pablo@100.81.134.102 -p 2222" },
              { label: "Password", value: "eoescp1441" },
              { label: "GPU", value: "RTX 4050 6GB" },
            ]}
          />

          <CredentialCard
            title="🔑 APIs Externas"
            items={[
              { label: "Jina Search", value: "jina_aa5b1f3a9fe248da9beff492537585424u0q5Mpj_c-WoRyPNM2RU_WWPlHw" },
              { label: "Cloudflare", value: "pcostarotela@gmail.com / Pablo2024!" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

// Components
function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 15 }}>
        {icon}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#f7f8f8" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ color: "#62666d", fontSize: 12 }}>{label}</span>
      <span style={{ color: color || "#f7f8f8", fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
}

function CredentialCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div
      style={{
        background: "rgba(139, 92, 246, 0.05)",
        border: "1px solid rgba(139, 92, 246, 0.2)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 15 }}>{title}</h3>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: i < items.length - 1 ? "1px solid rgba(139, 92, 246, 0.1)" : "none",
          }}
        >
          <span style={{ color: "#8a8f98", fontSize: 12 }}>{item.label}</span>
          <span
            style={{
              color: "#f7f8f8",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "monospace",
              background: "rgba(0,0,0,0.3)",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
