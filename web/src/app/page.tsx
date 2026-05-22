"use client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    cobradoMes: 0,
    pendiente: 0,
    clientesActivos: 0,
    ticketsAbiertos: 0,
  });
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = "/api";
    Promise.all([
      fetch(`${API}/cobros/stats`).then(r => r.json()),
      fetch(`${API}/cobros/pendientes`).then(r => r.json()),
      fetch(`${API}/clientes/`).then(r => r.json()),
    ]).then(([c, p, clientes]) => {
      setStats({
        cobradoMes: c.cobrado_este_mes || 0,
        pendiente: c.pendiente_total || 0,
        clientesActivos: clientes.total || 0,
        ticketsAbiertos: 0,
      });
      setFacturas(p.facturas?.slice(0, 5) || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card titulo="Cobrado este mes" valor={`$${stats.cobradoMes}`} color="green" />
        <Card titulo="Pendiente de cobro" valor={`$${stats.pendiente}`} color="yellow" />
        <Card titulo="Clientes activos" valor={stats.clientesActivos} color="blue" />
        <Card titulo="Tickets abiertos" valor={stats.ticketsAbiertos} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Facturas pendientes</h2>
          {facturas.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay facturas pendientes</p>
          ) : (
            <ul className="space-y-2">
              {facturas.map((f: any) => (
                <li key={f.id} className="flex justify-between text-sm border-b pb-2">
                  <span>{f.numero} - {f.cliente}</span>
                  <span className="font-semibold">${f.total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ titulo, valor, color }: any) {
  const colors: any = {
    green: "border-green-500",
    yellow: "border-yellow-500",
    blue: "border-blue-500",
    purple: "border-purple-500",
  };
  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colors[color]} p-5`}>
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{valor}</p>
    </div>
  );
}
