import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SetubalAI — Panel Maestro",
  description: "Administración de empresas cliente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
