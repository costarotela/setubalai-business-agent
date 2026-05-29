"use client";

export default function PrestacionesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          💊 Prestaciones y Nomenclador
        </h2>
        <p className="text-gray-600">
          Gestión de servicios médicos, códigos y precios
        </p>
      </div>

      {/* Placeholder */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Módulo en Desarrollo
        </h3>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          El ABM de prestaciones permitirá configurar:
        </p>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-900 mb-2">📋 Nomenclador</h4>
            <p className="text-gray-600 text-sm">
              Códigos de prestaciones, NABONS, servicios médicos
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-900 mb-2">💰 Precios</h4>
            <p className="text-gray-600 text-sm">
              Tarifas por obra social, coseguros, aranceles
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-900 mb-2">🏥 Obras Sociales</h4>
            <p className="text-gray-600 text-sm">
              Convenios, planes, autorizaciones
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h4 className="font-bold text-gray-900 mb-2">📊 Facturación</h4>
            <p className="text-gray-600 text-sm">
              Liquidación, auditoría, reportes
            </p>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-bold text-gray-900 mb-4">🗺️ Roadmap</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="font-medium text-gray-900">Fase A: Infraestructura (Completada)</div>
              <div className="text-sm text-gray-600">
                Grillas, bloqueos, duraciones → Sistema de turnos funcional
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Fase B: Slots Libres (Próxima)</div>
              <div className="text-sm text-gray-600">
                Calendario reactivo con disponibilidad en tiempo real
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Fase C: Prestaciones (Futura)</div>
              <div className="text-sm text-gray-600">
                Nomenclador, facturación, obras sociales
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
