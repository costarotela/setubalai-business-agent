"use client";
import { useState } from "react";

export default function NuevoCliente() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    dominio: "",
    plan: "starter",
    telegram: "",
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Creando entorno para " + form.nombre + "...");
    
    // En producción: llamar API de Hetzner para crear VPS
    // Por ahora: simular la creación
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus(`✅ ${form.nombre} creado exitosamente!`);
      setForm({ nombre: "", email: "", telefono: "", dominio: "", plan: "starter", telegram: "" });
    } catch {
      setStatus("❌ Error al crear cliente");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nuevo Cliente</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la empresa *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ferretería López"
                className="w-full border rounded p-2 text-sm"
                value={form.nombre}
                onChange={e => setForm({...form, nombre: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contacto *
              </label>
              <input
                type="email"
                required
                placeholder="contacto@empresa.com"
                className="w-full border rounded p-2 text-sm"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                placeholder="+54 9 123 456 789"
                className="w-full border rounded p-2 text-sm"
                value={form.telefono}
                onChange={e => setForm({...form, telefono: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telegram Bot (opcional)
              </label>
              <input
                type="text"
                placeholder="@TuBot"
                className="w-full border rounded p-2 text-sm"
                value={form.telegram}
                onChange={e => setForm({...form, telegram: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan *
              </label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={form.plan}
                onChange={e => setForm({...form, plan: e.target.value})}
              >
                <option value="starter">Starter ($99/mes)</option>
                <option value="business">Business ($249/mes)</option>
                <option value="enterprise">Enterprise ($499/mes)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdominio
              </label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="empresa"
                  className="flex-1 border rounded-l p-2 text-sm"
                  value={form.dominio}
                  onChange={e => setForm({...form, dominio: e.target.value})}
                />
                <span className="bg-gray-100 border rounded-r p-2 text-sm text-gray-500">
                  .setubalai.org
                </span>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Crear Cliente
          </button>

          {status && (
            <div className={`p-3 rounded text-sm ${
              status.startsWith('✅') ? 'bg-green-100 text-green-700' : 
              status.startsWith('❌') ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {status}
            </div>
          )}
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="font-semibold text-blue-700 mb-2">¿Qué sucede al crear un cliente?</h2>
        <ol className="list-decimal ml-6 text-sm text-blue-600 space-y-1">
          <li>Se crea un VPS nuevo en Hetzner automáticamente</li>
          <li>Se instala el agente con docker compose</li>
          <li>Se configura el subdominio con Cloudflare</li>
          <li>Se conecta el bot de Telegram</li>
          <li>El cliente recibe acceso a su dashboard</li>
        </ol>
        <p className="text-xs text-blue-500 mt-3">
          Tiempo estimado: ~3 minutos desde la creación hasta que el cliente puede usar su agente
        </p>
      </div>
    </div>
  );
}
