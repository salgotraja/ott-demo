/**
 * External ID Crawler
 *
 * Enriches Reference / TvReference rows with IDs from:
 *   1. YouTube   — extracts video ID from existing Video table URLs (no API call)
 *   2. Wikidata  — SPARQL query by TMDB ID (public endpoint, no auth)
 *   3. IMDb      — OMDb API fallback for missing imdbId (set OMDB_API_KEY in .env.local)
 *   4. EIDR      — EIDR REST API (set EIDR_USER_ID, EIDR_PARTY_ID, EIDR_PASSWORD in .env.local)
 *
 * Usage:
 *   npm run crawl:ids               — movies + tv, all sources
 *   npm run crawl:ids -- --type movie
 *   npm run crawl:ids -- --type tv
 *   npm run crawl:ids -- --source wikidata,imdb
 *   npm run crawl:ids -- --eidr      — enable EIDR (requires credentials)
 *   npm run crawl:ids -- --dry-run   — print without writing to DB
 */

import * as dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";
import { createHash } from "crypto";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const EIDR_USER_ID = process.env.EIDR_USER_ID;
const EIDR_PARTY_ID = process.env.EIDR_PARTY_ID;
const EIDR_PASSWORD = process.env.EIDR_PASSWORD;

const RATE_LIMIT_MS = 300;
const WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql";
const EIDR_BASE_URL = "https://registry1.eidr.org:443/EIDR";

const args = process.argv.slice(2);
const typeArg = args.find((a) => a.startsWith("--type="))?.split("=")[1] ?? "all";
const sourceArg = args.find((a) => a.startsWith("--source="))?.split("=")[1] ?? "youtube,wikidata,imdb";
const enableEidr = args.includes("--eidr");
const dryRun = args.includes("--dry-run");

const sources = new Set(sourceArg.split(",").map((s) => s.trim()));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// YouTube — extract video ID from stored URL (no API needed)
// ---------------------------------------------------------------------------
function extractYoutubeId(url: string | null): string | null {
  if (!url) return null;
  // Handles: https://www.youtube.com/watch?v=ID, https://youtu.be/ID
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Wikidata SPARQL — find wikidata entity by TMDB movie/TV ID
// ---------------------------------------------------------------------------
async function fetchWikidataId(tmdbId: string, type: "movie" | "tv"): Promise<string | null> {
  // P4947 = TMDB movie ID, P4983 = TMDB TV series ID
  const prop = type === "movie" ? "P4947" : "P4983";
  const query = `SELECT ?item WHERE { ?item wdt:${prop} "${tmdbId}" } LIMIT 1`;

  try {
    const url = `${WIKIDATA_SPARQL_URL}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { "Accept": "application/sparql-results+json", "User-Agent": "ott-demo-crawler/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json() as { results: { bindings: { item: { value: string } }[] } };
    const binding = data.results.bindings[0];
    if (!binding) return null;
    // e.g. "http://www.wikidata.org/entity/Q12345" → "Q12345"
    return binding.item.value.replace("http://www.wikidata.org/entity/", "");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// OMDb — lookup IMDb ID by title + year (fallback when TMDB returns null)
// ---------------------------------------------------------------------------
async function fetchImdbIdFromOmdb(title: string, year: number | null): Promise<string | null> {
  if (!OMDB_API_KEY) return null;
  try {
    const params = new URLSearchParams({ t: title, apikey: OMDB_API_KEY });
    if (year) params.set("y", String(year));
    const res = await fetch(`https://www.omdbapi.com/?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { imdbID?: string; Response: string };
    return data.Response === "True" ? (data.imdbID ?? null) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// EIDR — search by title using Basic-style Eidr auth
// ---------------------------------------------------------------------------
function buildEidrAuthHeader(): string | null {
  if (!EIDR_USER_ID || !EIDR_PARTY_ID || !EIDR_PASSWORD) return null;
  const passwordShadow = Buffer.from(
    createHash("md5").update(EIDR_PASSWORD).digest()
  ).toString("base64");
  return `Eidr ${EIDR_USER_ID}:${EIDR_PARTY_ID}:${passwordShadow}`;
}

async function fetchEidrId(title: string, year: number | null): Promise<string | null> {
  const authHeader = buildEidrAuthHeader();
  if (!authHeader) return null;

  try {
    const yearClause = year ? `<ExactMatch><SimplePredicateType>ReleaseDate</SimplePredicateType><Value>${year}</Value></ExactMatch>` : "";
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="http://www.eidr.org/schema">
  <Operation>
    <Query>
      <Expression>
        <and>
          <ExactMatch><SimplePredicateType>StructuralType</SimplePredicateType><Value>Movie</Value></ExactMatch>
          <ExactMatch><SimplePredicateType>ResourceName</SimplePredicateType><Value>${title.replace(/&/g, "&amp;")}</Value></ExactMatch>
          ${yearClause}
        </and>
      </Expression>
      <PageNumber>1</PageNumber>
      <PageSize>1</PageSize>
    </Query>
  </Operation>
</Request>`;

    const res = await fetch(`${EIDR_BASE_URL}/query/`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "text/xml",
        "Accept": "text/xml",
      },
      body,
    });

    if (!res.ok) return null;
    const xml = await res.text();
    // Extract ID from <ID>10.5240/XXXX-...</ID>
    const match = xml.match(/<ID>(10\.5240\/[A-Z0-9-]+)<\/ID>/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Movie crawler
// ---------------------------------------------------------------------------
async function crawlMovies() {
  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      tmdbId: true,
      title: true,
      releaseYear: true,
      releaseDate: true,
      references: true,
      videos: {
        where: { type: { in: ["Trailer", "Teaser"] }, official: true },
        select: { url: true },
        orderBy: { id: "asc" },
        take: 1,
      },
    },
    orderBy: { popularity: "desc" },
  });

  console.log(`Processing ${movies.length} movies...`);
  let updated = 0;

  for (const movie of movies) {
    const ref = movie.references;
    const year = movie.releaseYear ?? (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : null);
    const changes: Record<string, string | null> = {};

    if (sources.has("youtube") && !ref?.youtubeId) {
      const videoUrl = movie.videos[0]?.url ?? null;
      const ytId = extractYoutubeId(videoUrl);
      if (ytId) changes.youtubeId = ytId;
    }

    if (sources.has("wikidata") && !ref?.wikidataId && movie.tmdbId) {
      const wdId = await fetchWikidataId(movie.tmdbId, "movie");
      if (wdId) changes.wikidataId = wdId;
      await delay(RATE_LIMIT_MS);
    }

    if (sources.has("imdb") && !ref?.imdbId) {
      const imdbId = await fetchImdbIdFromOmdb(movie.title, year);
      if (imdbId) changes.imdbId = imdbId;
      await delay(RATE_LIMIT_MS);
    }

    if (enableEidr && sources.has("eidr") && !ref?.eidrId) {
      const eidrId = await fetchEidrId(movie.title, year);
      if (eidrId) changes.eidrId = eidrId;
      await delay(RATE_LIMIT_MS);
    }

    if (Object.keys(changes).length === 0) continue;

    console.log(`  [movie ${movie.id}] ${movie.title}:`, changes);
    if (!dryRun) {
      await prisma.reference.upsert({
        where: { movieId: movie.id },
        create: { movieId: movie.id, ...changes },
        update: changes,
      });
      updated++;
    }
  }

  console.log(`Movies: ${updated} updated.`);
}

// ---------------------------------------------------------------------------
// TV show crawler
// ---------------------------------------------------------------------------
async function crawlTvShows() {
  const shows = await prisma.tvShow.findMany({
    select: {
      id: true,
      tmdbId: true,
      name: true,
      firstAirDate: true,
      references: true,
      videos: {
        where: { type: { in: ["Trailer", "Teaser"] }, official: true },
        select: { url: true },
        orderBy: { id: "asc" },
        take: 1,
      },
    },
    orderBy: { popularity: "desc" },
  });

  console.log(`Processing ${shows.length} TV shows...`);
  let updated = 0;

  for (const show of shows) {
    const ref = show.references;
    const year = show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : null;
    const changes: Record<string, string | null> = {};

    if (sources.has("youtube") && !ref?.youtubeId) {
      const videoUrl = show.videos[0]?.url ?? null;
      const ytId = extractYoutubeId(videoUrl);
      if (ytId) changes.youtubeId = ytId;
    }

    if (sources.has("wikidata") && !ref?.wikidataId && show.tmdbId) {
      const wdId = await fetchWikidataId(show.tmdbId, "tv");
      if (wdId) changes.wikidataId = wdId;
      await delay(RATE_LIMIT_MS);
    }

    if (sources.has("imdb") && !ref?.imdbId) {
      const imdbId = await fetchImdbIdFromOmdb(show.name, year);
      if (imdbId) changes.imdbId = imdbId;
      await delay(RATE_LIMIT_MS);
    }

    // EIDR covers movies primarily; TV support is limited but we try
    if (enableEidr && sources.has("eidr") && !ref?.eidrId) {
      const eidrId = await fetchEidrId(show.name, year);
      if (eidrId) changes.eidrId = eidrId;
      await delay(RATE_LIMIT_MS);
    }

    if (Object.keys(changes).length === 0) continue;

    console.log(`  [tv ${show.id}] ${show.name}:`, changes);
    if (!dryRun) {
      await prisma.tvReference.upsert({
        where: { tvShowId: show.id },
        create: { tvShowId: show.id, ...changes },
        update: changes,
      });
      updated++;
    }
  }

  console.log(`TV shows: ${updated} updated.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Starting crawler | type=${typeArg} | sources=${sourceArg} | eidr=${enableEidr} | dry-run=${dryRun}`);

  if (enableEidr && !buildEidrAuthHeader()) {
    console.warn("EIDR enabled but EIDR_USER_ID / EIDR_PARTY_ID / EIDR_PASSWORD not set in .env.local — skipping EIDR.");
  }

  if (sources.has("imdb") && !OMDB_API_KEY) {
    console.warn("OMDB_API_KEY not set — IMDb fallback disabled.");
  }

  if (typeArg === "all" || typeArg === "movie") await crawlMovies();
  if (typeArg === "all" || typeArg === "tv") await crawlTvShows();

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
