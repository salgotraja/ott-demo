/**
 * JustWatch Provider URL Sync
 *
 * For each Movie/TvShow in the DB:
 *   1. Search JustWatch GraphQL by title → validate match by TMDB ID
 *   2. Save jwId on the Movie/TvShow row
 *   3. Fetch offers for specified region(s) → actual provider deep links + quality + price
 *   4. Upsert MovieProvider / TvShowProvider rows with real url, quality, cost
 *
 * Usage:
 *   npm run sync:providers                  -- movies + tv, region IN
 *   npm run sync:providers -- --type movie
 *   npm run sync:providers -- --type tv
 *   npm run sync:providers -- --region US,IN,GB
 *   npm run sync:providers -- --dry-run
 *
 * Notes:
 *   - JustWatch is an unofficial API — no auth required, no published rate limit
 *   - 600ms delay between requests to avoid throttling
 *   - Quality deduplication: keeps best quality URL per provider+type (4K > HD > SD)
 *   - CINEMA monetizationType is skipped (not streaming/rent/buy)
 */

import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JW_GRAPHQL = "https://apis.justwatch.com/graphql";
const RATE_LIMIT_MS = 600;
const JW_USER_AGENT = "Mozilla/5.0 (compatible; ott-demo-sync/1.0)";

const args = process.argv.slice(2);
const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1] ?? "all";
const regionsArg = (args.find((a) => a.startsWith("--region="))?.split("=")[1] ?? "IN").split(",");
const dryRun = args.includes("--dry-run");

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Quality ranking: higher = better
// ---------------------------------------------------------------------------
const QUALITY_RANK: Record<string, number> = {
  _8K: 5, _4K: 4, HD: 3, SD: 2, UNKNOWN: 1,
};

function normalizeQuality(q: string): string {
  if (q === "_4K") return "4K";
  if (q === "_8K") return "8K";
  return q; // HD, SD
}

// ---------------------------------------------------------------------------
// JustWatch monetizationType → our DB type
// ---------------------------------------------------------------------------
const JW_TO_DB_TYPE: Record<string, string> = {
  FLATRATE: "flatrate",
  RENT: "rent",
  BUY: "buy",
  // ADS = ad-supported free; map to flatrate for now
  ADS: "flatrate",
};

// ---------------------------------------------------------------------------
// GraphQL helpers
// ---------------------------------------------------------------------------
async function jwQuery<T>(operationName: string, query: string, variables: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(JW_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": JW_USER_AGENT },
      body: JSON.stringify({ operationName, query, variables }),
    });
    if (!res.ok) {
      console.error(`  JW API error ${res.status}`);
      return null;
    }
    const data = await res.json() as { data: T; errors?: unknown[] };
    if (data.errors) {
      console.error("  JW GraphQL errors:", JSON.stringify(data.errors).slice(0, 200));
    }
    return data.data ?? null;
  } catch (e) {
    console.error("  JW fetch error:", e);
    return null;
  }
}

interface JwSearchResult {
  popularTitles: {
    edges: Array<{
      node: {
        id: string;
        content: { title: string; externalIds: { tmdbId: string | null } };
      };
    }>;
  };
}

async function searchJustWatch(title: string, objectType: "MOVIE" | "SHOW"): Promise<Array<{ jwId: string; tmdbId: string | null }>> {
  const data = await jwQuery<JwSearchResult>(
    "SearchTitle",
    `query SearchTitle($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
      popularTitles(country: $country, first: $first, filter: $filter) {
        edges { node {
          id
          content(country: $country, language: $language) {
            title externalIds { tmdbId }
          }
        }}
      }
    }`,
    { country: "IN", language: "en", first: 5, filter: { searchQuery: title, objectTypes: [objectType] } }
  );

  return (data?.popularTitles?.edges ?? []).map((e) => ({
    jwId: e.node.id,
    tmdbId: e.node.content.externalIds?.tmdbId ?? null,
  }));
}

interface JwOffer {
  monetizationType: string;
  presentationType: string;
  standardWebURL: string;
  retailPrice: string | null;
  package: { clearName: string; technicalName: string };
}

interface JwOffersResult {
  node: {
    offers: JwOffer[];
  } | null;
}

async function fetchOffers(jwId: string, country: string): Promise<JwOffer[]> {
  const data = await jwQuery<JwOffersResult>(
    "GetOffers",
    `query GetOffers($nodeId: ID!, $country: Country!, $language: Language!) {
      node(id: $nodeId) {
        ... on Movie { offers(country: $country, platform: WEB) {
          monetizationType presentationType standardWebURL
          retailPrice(language: $language)
          package { clearName technicalName }
        }}
        ... on Show { offers(country: $country, platform: WEB) {
          monetizationType presentationType standardWebURL
          retailPrice(language: $language)
          package { clearName technicalName }
        }}
      }
    }`,
    { nodeId: jwId, country, language: "en" }
  );
  return data?.node?.offers ?? [];
}

// ---------------------------------------------------------------------------
// Normalise offer list: deduplicate by provider+type keeping best quality
// ---------------------------------------------------------------------------
interface NormalisedOffer {
  providerName: string;
  type: string;
  url: string;
  quality: string;
  cost: string | null;
}

function deduplicateOffers(offers: JwOffer[]): NormalisedOffer[] {
  const map = new Map<string, NormalisedOffer>();

  for (const offer of offers) {
    const dbType = JW_TO_DB_TYPE[offer.monetizationType];
    if (!dbType) continue; // skip CINEMA, THEATER, etc.

    const key = `${offer.package.clearName}::${dbType}`;
    const existing = map.get(key);

    if (!existing || QUALITY_RANK[offer.presentationType] > QUALITY_RANK[existing.quality]) {
      map.set(key, {
        providerName: offer.package.clearName,
        type: dbType,
        url: offer.standardWebURL,
        quality: offer.presentationType,
        cost: offer.retailPrice ?? null,
      });
    } else if (existing.quality === offer.presentationType && !existing.cost && offer.retailPrice) {
      // same quality but now we have a price
      existing.cost = offer.retailPrice;
    }
  }

  return Array.from(map.values()).map((o) => ({
    ...o,
    quality: normalizeQuality(o.quality),
  }));
}

// ---------------------------------------------------------------------------
// Match JustWatch clearName to our DB Provider by name (case-insensitive)
// ---------------------------------------------------------------------------
async function buildProviderNameMap(): Promise<Map<string, number>> {
  const providers = await prisma.provider.findMany({ select: { id: true, name: true } });
  const map = new Map<string, number>();
  for (const p of providers) {
    map.set(p.name.toLowerCase(), p.id);
    // common aliases
    const aliases: Record<string, string[]> = {
      "jiohotstar": ["hotstar", "disney+ hotstar", "jio hotstar"],
      "netflix": ["netflix basic with ads"],
      "prime video": ["amazon prime video", "amazon prime"],
      "apple tv+": ["apple tv plus"],
      "zee5": ["zee 5"],
      "sonyliv": ["sony liv", "sony"],
    };
    for (const [canonical, alts] of Object.entries(aliases)) {
      if (p.name.toLowerCase() === canonical || alts.includes(p.name.toLowerCase())) {
        for (const alt of alts) map.set(alt, p.id);
        map.set(canonical, p.id);
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Sync a single movie
// ---------------------------------------------------------------------------
async function syncMovie(
  movie: { id: number; tmdbId: string | null; title: string; releaseYear: number | null; jwId: string | null },
  regions: string[],
  providerMap: Map<string, number>
) {
  // Step 1: get or discover JustWatch ID
  let jwId = movie.jwId;

  if (!jwId) {
    const results = await searchJustWatch(movie.title, "MOVIE");
    await delay(RATE_LIMIT_MS);

    const match = results.find((r) => r.tmdbId === movie.tmdbId) ?? results[0];
    if (!match) {
      console.log(`  [movie ${movie.id}] ${movie.title} — not found on JustWatch`);
      return;
    }
    jwId = match.jwId;
    console.log(`  [movie ${movie.id}] ${movie.title} → jwId=${jwId}` + (match.tmdbId !== movie.tmdbId ? " (unverified)" : ""));

    if (!dryRun) {
      await prisma.movie.update({ where: { id: movie.id }, data: { jwId } });
    }
  }

  // Step 2: fetch and upsert offers per region
  for (const region of regions) {
    const offers = await fetchOffers(jwId, region);
    await delay(RATE_LIMIT_MS);

    const deduped = deduplicateOffers(offers);
    let upserted = 0;

    for (const offer of deduped) {
      const providerId = providerMap.get(offer.providerName.toLowerCase());
      if (!providerId) {
        // Provider not in our DB — skip
        continue;
      }

      if (!dryRun) {
        await prisma.movieProvider.upsert({
          where: {
            movieId_providerId_type_region: {
              movieId: movie.id,
              providerId,
              type: offer.type,
              region,
            },
          },
          create: {
            movieId: movie.id,
            providerId,
            type: offer.type,
            region,
            url: offer.url,
            quality: offer.quality,
            cost: offer.cost,
          },
          update: {
            url: offer.url,
            quality: offer.quality,
            cost: offer.cost,
          },
        });
      }
      upserted++;
    }

    if (dryRun) {
      console.log(`    [${region}] ${deduped.length} offers:`, deduped.map((o) => `${o.providerName}/${o.type}/${o.quality}`).join(", "));
    } else if (upserted > 0) {
      console.log(`    [${region}] ${upserted}/${deduped.length} provider offers synced`);
    }
  }
}

// ---------------------------------------------------------------------------
// Sync a single TV show
// ---------------------------------------------------------------------------
async function syncTvShow(
  show: { id: number; tmdbId: string | null; name: string; firstAirDate: Date | null; jwId: string | null },
  regions: string[],
  providerMap: Map<string, number>
) {
  let jwId = show.jwId;

  if (!jwId) {
    const results = await searchJustWatch(show.name, "SHOW");
    await delay(RATE_LIMIT_MS);

    const match = results.find((r) => r.tmdbId === show.tmdbId) ?? results[0];
    if (!match) {
      console.log(`  [tv ${show.id}] ${show.name} — not found on JustWatch`);
      return;
    }
    jwId = match.jwId;
    console.log(`  [tv ${show.id}] ${show.name} → jwId=${jwId}` + (match.tmdbId !== show.tmdbId ? " (unverified)" : ""));

    if (!dryRun) {
      await prisma.tvShow.update({ where: { id: show.id }, data: { jwId } });
    }
  }

  for (const region of regions) {
    const offers = await fetchOffers(jwId, region);
    await delay(RATE_LIMIT_MS);

    const deduped = deduplicateOffers(offers);
    let upserted = 0;

    for (const offer of deduped) {
      const providerId = providerMap.get(offer.providerName.toLowerCase());
      if (!providerId) continue;

      if (!dryRun) {
        await prisma.tvShowProvider.upsert({
          where: {
            tvShowId_providerId_type_region: {
              tvShowId: show.id,
              providerId,
              type: offer.type,
              region,
            },
          },
          create: {
            tvShowId: show.id,
            providerId,
            type: offer.type,
            region,
            url: offer.url,
            quality: offer.quality,
            cost: offer.cost,
          },
          update: {
            url: offer.url,
            quality: offer.quality,
            cost: offer.cost,
          },
        });
      }
      upserted++;
    }

    if (dryRun) {
      console.log(`    [${region}] ${deduped.length} offers:`, deduped.map((o) => `${o.providerName}/${o.type}/${o.quality}`).join(", "));
    } else if (upserted > 0) {
      console.log(`    [${region}] ${upserted}/${deduped.length} provider offers synced`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Starting JustWatch provider sync | type=${typeArg} | regions=${regionsArg.join(",")} | dry-run=${dryRun}`);

  const providerMap = await buildProviderNameMap();
  console.log(`  Loaded ${providerMap.size} provider name mappings`);

  if (typeArg === "all" || typeArg === "movie") {
    const movies = await prisma.movie.findMany({
      select: { id: true, tmdbId: true, title: true, releaseYear: true, jwId: true },
      orderBy: { popularity: "desc" },
    });
    console.log(`\nSyncing ${movies.length} movies...`);
    for (const movie of movies) {
      await syncMovie(movie, regionsArg, providerMap);
    }
  }

  if (typeArg === "all" || typeArg === "tv") {
    const shows = await prisma.tvShow.findMany({
      select: { id: true, tmdbId: true, name: true, firstAirDate: true, jwId: true },
      orderBy: { popularity: "desc" },
    });
    console.log(`\nSyncing ${shows.length} TV shows...`);
    for (const show of shows) {
      await syncTvShow(show, regionsArg, providerMap);
    }
  }

  console.log("\nDone.");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
