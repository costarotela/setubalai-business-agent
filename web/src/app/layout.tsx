import type { Metadata } from "next";
import "./globals.css";
import ShellProvider from "./shell";

export const metadata: Metadata = {
  title: "SetubalAI Business Agent",
  description: "Panel de gestión empresarial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif", background: "#08090a", color: "#f7f8f8" }}>
        <ShellProvider>{children}</ShellProvider>
      </body>
    </html>
  );
}
