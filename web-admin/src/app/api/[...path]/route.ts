import { NextRequest, NextResponse } from "next/server";

const API_BASE = "http://127.0.0.1:3010";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, { params });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, { params });
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, { params });
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, { params });
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, { params });
}

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join("/");
  const search = req.nextUrl.search || "";
  const url = `${API_BASE}/${pathStr}${search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const authorization = req.headers.get("authorization");
  if (authorization) headers["Authorization"] = authorization;

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const res = await fetch(url, init);

  // Handle 307 trailing-slash redirects without losing auth headers + body
  if (res.status === 307 || res.status === 308) {
    const loc = res.headers.get("location");
    if (loc) {
      const res2 = await fetch(loc, init);
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
