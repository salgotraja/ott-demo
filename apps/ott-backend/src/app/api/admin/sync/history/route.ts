import { NextResponse } from "next/server";
import { prisma } from "@ott/database";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const jobs = await prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const result = jobs.map((j) => ({
    id: j.id,
    status: j.status,
    startedAt: j.startedAt.toISOString(),
    completedAt: j.completedAt?.toISOString() ?? null,
    moviesAdded: j.moviesAdded,
    moviesUpdated: j.moviesUpdated,
    errors: j.errors,
  }));

  return NextResponse.json(result);
}
