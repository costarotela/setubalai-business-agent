"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfiguracionAgendaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/configuracion/agenda/profesionales");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando configuración...</p>
      </div>
    </div>
  );
}
