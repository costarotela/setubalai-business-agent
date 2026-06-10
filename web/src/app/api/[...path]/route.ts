import { NextRequest, NextResponse } from "next/server";

// Use env var for local dev pointing to VPS via Tailscale
// In production: http://127.0.0.1:3010
// In local dev: http://100.72.101.29:3010
const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:3010";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  return proxy(req, p);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  return proxy(req, p);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  return proxy(req, p);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  return proxy(req, p);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const pathStr = params.path.join("/").replace(/\/+$/, ""); // strip trailing slashes
  const search = req.nextUrl.search || "";
  const url = `${API_BASE}/${pathStr}${search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const authorization = req.headers.get("authorization");
  if (authorization) headers["Authorization"] = authorization;
  const xEmpresa = req.headers.get("x-empresa-id");
  if (xEmpresa) headers["X-Empresa-ID"] = xEmpresa;

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(url, init);

  // Follow 307/308 redirects from backend
  if (res.status === 307 || res.status === 308) {
    const loc = res.headers.get("location");
    if (loc) {
      const fullUrl = loc.startsWith("http") ? loc : `${API_BASE}${loc}`;
      const res2 = await fetch(fullUrl, init);
      const data2 = await res2.text();
      return new NextResponse(data2, {
        status: res2.status,
        headers: { "Content-Type": res2.headers.get("content-type") || "application/json" },
      });
    }
  }

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
  });
}
