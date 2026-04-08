"use server";

import { prisma } from "@ott/database";
import { invalidateMovieCache, invalidateTvCache } from "@/cache/helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

export type { ActionResult } from "./types";

export async function linkProviderToMovie(
  movieId: number,
  providerId: number,
  type: string,
  region = "IN",
  url?: string,
  cost?: string,
  quality?: string,
): Promise<ActionResult> {
  try {
    await prisma.movieProvider.upsert({
      where: { movieId_providerId_type_region: { movieId, providerId, type, region } },
      update: { url: url ?? null, cost: cost ?? null, quality: quality ?? null },
      create: { movieId, providerId, type, region, url: url ?? null, cost: cost ?? null, quality: quality ?? null },
    });
    await invalidateMovieCache(movieId);
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to link provider ${providerId} to movie ${movieId}:`, err);
    return { success: false, error: "Failed to link provider to movie" };
  }
}

export async function unlinkProviderFromMovie(
  movieId: number,
  providerId: number,
  type: string,
  region = "IN",
): Promise<ActionResult> {
  try {
    await prisma.movieProvider.delete({
      where: { movieId_providerId_type_region: { movieId, providerId, type, region } },
    });
    await invalidateMovieCache(movieId);
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to unlink provider ${providerId} from movie ${movieId}:`, err);
    return { success: false, error: "Failed to unlink provider from movie" };
  }
}

export async function linkProviderToTvShow(
  tvShowId: number,
  providerId: number,
  type: string,
  region = "IN",
  url?: string,
  cost?: string,
  quality?: string,
): Promise<ActionResult> {
  try {
    await prisma.tvShowProvider.upsert({
      where: { tvShowId_providerId_type_region: { tvShowId, providerId, type, region } },
      update: { url: url ?? null, cost: cost ?? null, quality: quality ?? null },
      create: { tvShowId, providerId, type, region, url: url ?? null, cost: cost ?? null, quality: quality ?? null },
    });
    await invalidateTvCache(tvShowId);
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to link provider ${providerId} to TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to link provider to TV show" };
  }
}

export async function unlinkProviderFromTvShow(
  tvShowId: number,
  providerId: number,
  type: string,
  region = "IN",
): Promise<ActionResult> {
  try {
    await prisma.tvShowProvider.delete({
      where: { tvShowId_providerId_type_region: { tvShowId, providerId, type, region } },
    });
    await invalidateTvCache(tvShowId);
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to unlink provider ${providerId} from TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to unlink provider from TV show" };
  }
}
