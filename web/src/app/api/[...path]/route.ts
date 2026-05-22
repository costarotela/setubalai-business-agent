import { NextRequest, NextResponse } from "next/server";

const API_BASE = "http://127.0.0.1:3010";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const search = req.nextUrl.search || "";
  const url = `${API_BASE}/${pathStr}${search}`;

  // Construir headers — pasar Authorization y Content-Type del request original
  const headers: Record<string, string> = {};

  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const authorization = req.headers.get("authorization");
  if (authorization) headers["Authorization"] = authorization;

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(url, init);
  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/json",
    },
  });
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;
export const PATCH  = handler;
