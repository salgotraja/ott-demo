import { NextResponse } from "next/server";
import { findAllGenres } from "@/lib/data/genres";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

const KEY = "public:genres:all";

export async function GET(): Promise<NextResponse> {
  const cached = await getCache(KEY);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const genres = await findAllGenres();

  const json = JSON.stringify(genres);
  await setCache(KEY, json);
  return NextResponse.json(genres);
}
