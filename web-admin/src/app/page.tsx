"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      router.replace("/panel-maestro");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0b0e",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#62666d", fontSize: 14,
    }}>
      Redirigiendo...
    </div>
  );
}
