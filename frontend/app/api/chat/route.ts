import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://backend:8000";

// Proxy opcional hacia el backend (por si querés llamarlo desde el server
// en lugar de exponer la URL pública del backend al navegador).
export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
