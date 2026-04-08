import { NextResponse } from "next/server";
import { findAllProviders } from "@/lib/data/providers";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

const KEY = "public:providers:all";

export async function GET(): Promise<NextResponse> {
  const cached = await getCache(KEY);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const providers = await findAllProviders();

  const json = JSON.stringify(providers);
  await setCache(KEY, json);
  return NextResponse.json(providers);
}
