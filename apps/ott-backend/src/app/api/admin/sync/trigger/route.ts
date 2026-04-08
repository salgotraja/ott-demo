import { NextRequest, NextResponse } from "next/server";
import { triggerSync, type SyncType } from "@/jobs/syncWorker";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const typeParam = req.nextUrl.searchParams.get("type") ?? "all";
  if (!["all", "movies", "tv"].includes(typeParam)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const type = typeParam as SyncType;
  const started = await triggerSync(type);
  if (!started) {
    return NextResponse.json({ error: "Sync already running" }, { status: 409 });
  }
  return NextResponse.json({ ok: true }, { status: 202 });
}
