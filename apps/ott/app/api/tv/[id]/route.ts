import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL ?? "http://localhost:3001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const country = req.nextUrl.searchParams.get("country") ?? "IN";
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/tv/${id}/watch?country=${country}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}
