"use server";

import { prisma } from "@ott/database";
import { invalidateTvCache } from "@/cache/helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

export type { ActionResult } from "./types";

export async function deleteTvShow(id: number): Promise<ActionResult> {
  try {
    const show = await prisma.tvShow.findUnique({ where: { id }, select: { name: true } });
    await prisma.tvShow.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "tvShow", entityId: String(id), entityName: show?.name ?? String(id) },
    });
    await invalidateTvCache();
    revalidatePath("/admin/tv-shows");
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete TV show ${id}:`, err);
    return { success: false, error: "Failed to delete TV show" };
  }
}

export interface TvShowDetailsUpdate {
  name: string;
  originalName: string | null;
  tagline: string | null;
  description: string | null;
  originalLanguage: string | null;
  adult: boolean;
  verifiedByTeam: boolean;
  status: string | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
}

export interface SeasonUpdate {
  name: string;
  overview: string | null;
  airDate: string | null;
  episodeCount: number | null;
}

export interface EpisodeUpdate {
  name: string;
  overview: string | null;
  runtime: number | null;
  airDate: string | null;
}

export async function updateTvShowDetails(id: number, data: TvShowDetailsUpdate): Promise<ActionResult> {
  try {
    await prisma.tvShow.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "tvShow", entityId: String(id), entityName: data.name },
    });
    await invalidateTvCache();
    revalidatePath("/admin/tv-shows");
    revalidatePath(`/admin/tv-shows/${id}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update TV show details ${id}:`, err);
    return { success: false, error: "Failed to update TV show details" };
  }
}

export async function setTvShowGenres(tvShowId: number, genreIds: number[]): Promise<ActionResult> {
  try {
    await prisma.genreOnTvShow.deleteMany({ where: { tvShowId } });
    if (genreIds.length > 0) {
      await prisma.genreOnTvShow.createMany({
        data: genreIds.map((genreId) => ({ tvShowId, genreId })),
      });
    }
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to set genres for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update genres" };
  }
}

export async function updateSeason(seasonId: number, data: SeasonUpdate): Promise<ActionResult> {
  try {
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        name: data.name,
        overview: data.overview,
        airDate: data.airDate ? new Date(data.airDate) : null,
        episodeCount: data.episodeCount,
      },
    });
    await invalidateTvCache();
    return { success: true };
  } catch (err) {
    console.error(`Failed to update season ${seasonId}:`, err);
    return { success: false, error: "Failed to update season" };
  }
}

export async function updateEpisode(episodeId: number, data: EpisodeUpdate): Promise<ActionResult> {
  try {
    await prisma.episode.update({
      where: { id: episodeId },
      data: {
        name: data.name,
        overview: data.overview,
        runtime: data.runtime,
        airDate: data.airDate ? new Date(data.airDate) : null,
      },
    });
    await invalidateTvCache();
    return { success: true };
  } catch (err) {
    console.error(`Failed to update episode ${episodeId}:`, err);
    return { success: false, error: "Failed to update episode" };
  }
}

export interface TvCrewInput {
  name: string;
  job: string;
  originalName?: string | null;
  gender?: string | null;
  image?: string | null;
  bio?: string | null;
  birthName?: string | null;
  nickname?: string | null;
  height?: string | null;
  age?: number | null;
  family?: string | null;
  trademarks?: string | null;
  trivia?: string | null;
  quotes?: string | null;
  otherWorks?: string | null;
}

export async function addTvCrew(tvShowId: number, data: TvCrewInput): Promise<ActionResult> {
  try {
    await prisma.tvCrew.create({
      data: {
        tvShowId, crewId: 0,
        name: data.name,
        job: data.job,
        originalName: data.originalName ?? null,
        gender: data.gender ?? null,
        image: data.image ?? null,
        bio: data.bio ?? null,
        birthName: data.birthName ?? null,
        nickname: data.nickname ?? null,
        height: data.height ?? null,
        age: data.age ?? null,
        family: data.family ?? null,
        trademarks: data.trademarks ?? null,
        trivia: data.trivia ?? null,
        quotes: data.quotes ?? null,
        otherWorks: data.otherWorks ?? null,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add crew to TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to add crew member" };
  }
}

export async function updateTvCrew(id: number, tvShowId: number, data: TvCrewInput): Promise<ActionResult> {
  try {
    await prisma.tvCrew.update({
      where: { id },
      data: {
        name: data.name,
        job: data.job,
        originalName: data.originalName ?? null,
        gender: data.gender ?? null,
        image: data.image ?? null,
        bio: data.bio ?? null,
        birthName: data.birthName ?? null,
        nickname: data.nickname ?? null,
        height: data.height ?? null,
        age: data.age ?? null,
        family: data.family ?? null,
        trademarks: data.trademarks ?? null,
        trivia: data.trivia ?? null,
        quotes: data.quotes ?? null,
        otherWorks: data.otherWorks ?? null,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update crew ${id} on TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update crew member" };
  }
}

export async function deleteTvCrew(id: number, tvShowId: number): Promise<ActionResult> {
  try {
    await prisma.tvCrew.delete({ where: { id } });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete crew ${id} from TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to remove crew member" };
  }
}

export interface TvShowIdsUpdate {
  tmdbId: string | null;
  imdbId: string | null;
  jwId: string | null;
}

export interface TvReferenceInput {
  facebookId: string | null;
  instagramId: string | null;
  twitterId: string | null;
  tiktokId: string | null;
  youtubeId: string | null;
  wikidataId: string | null;
  wikipedia: string | null;
  wikipediaUrl: string | null;
  home: string | null;
  eidrId: string | null;
}

export async function updateTvShowIds(id: number, data: TvShowIdsUpdate): Promise<ActionResult> {
  try {
    await prisma.tvShow.update({ where: { id }, data });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${id}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update IDs for TV show ${id}:`, err);
    return { success: false, error: "Failed to update TV show IDs" };
  }
}

export async function upsertTvReference(tvShowId: number, data: TvReferenceInput): Promise<ActionResult> {
  try {
    await prisma.tvReference.upsert({
      where: { tvShowId },
      update: data,
      create: { tvShowId, ...data },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to upsert reference for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update TV show references" };
  }
}

export interface TvContentRatingInput {
  country: string;
  code: string;
  type: string;
  releaseDate: string | null;
  note: string | null;
  language: string | null;
}

export async function addTvContentRating(tvShowId: number, data: TvContentRatingInput): Promise<ActionResult> {
  try {
    await prisma.tvContentRating.create({
      data: {
        tvShowId, country: data.country, code: data.code, type: data.type,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        note: data.note, language: data.language,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add content rating for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to add content rating" };
  }
}

export async function updateTvContentRating(id: number, tvShowId: number, data: TvContentRatingInput): Promise<ActionResult> {
  try {
    await prisma.tvContentRating.update({
      where: { id },
      data: {
        country: data.country, code: data.code, type: data.type,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        note: data.note, language: data.language,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update content rating ${id} for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update content rating" };
  }
}

export async function deleteTvContentRating(id: number, tvShowId: number): Promise<ActionResult> {
  try {
    await prisma.tvContentRating.delete({ where: { id } });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete content rating ${id} from TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to remove content rating" };
  }
}

export interface TvActorInput {
  name: string;
  characterName?: string | null;
  priority?: number | null;
  originalName?: string | null;
  image?: string | null;
  bio?: string | null;
  birthName?: string | null;
  nickname?: string | null;
  height?: string | null;
  age?: number | null;
  family?: string | null;
  trademarks?: string | null;
  trivia?: string | null;
  quotes?: string | null;
  otherWorks?: string | null;
}

export async function addTvActor(tvShowId: number, data: TvActorInput): Promise<ActionResult> {
  try {
    await prisma.tvActor.create({
      data: {
        tvShowId, actorId: 0,
        name: data.name,
        characterName: data.characterName ?? null,
        priority: data.priority ?? null,
        originalName: data.originalName ?? null,
        image: data.image ?? null,
        bio: data.bio ?? null,
        birthName: data.birthName ?? null,
        nickname: data.nickname ?? null,
        height: data.height ?? null,
        age: data.age ?? null,
        family: data.family ?? null,
        trademarks: data.trademarks ?? null,
        trivia: data.trivia ?? null,
        quotes: data.quotes ?? null,
        otherWorks: data.otherWorks ?? null,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add actor to TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to add actor" };
  }
}

export async function updateTvActor(id: number, tvShowId: number, data: TvActorInput): Promise<ActionResult> {
  try {
    await prisma.tvActor.update({
      where: { id },
      data: {
        name: data.name,
        characterName: data.characterName ?? null,
        priority: data.priority ?? null,
        originalName: data.originalName ?? null,
        image: data.image ?? null,
        bio: data.bio ?? null,
        birthName: data.birthName ?? null,
        nickname: data.nickname ?? null,
        height: data.height ?? null,
        age: data.age ?? null,
        family: data.family ?? null,
        trademarks: data.trademarks ?? null,
        trivia: data.trivia ?? null,
        quotes: data.quotes ?? null,
        otherWorks: data.otherWorks ?? null,
      },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update actor ${id} on TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update actor" };
  }
}

export async function deleteTvActor(id: number, tvShowId: number): Promise<ActionResult> {
  try {
    await prisma.tvActor.delete({ where: { id } });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete actor ${id} from TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to remove actor" };
  }
}

export interface LocalizedTitleInput {
  language: string;
  title: string;
  description: string | null;
}

export async function addTvLocalizedTitle(tvShowId: number, data: LocalizedTitleInput): Promise<ActionResult> {
  try {
    await prisma.tvAlternateTitle.create({
      data: { tvShowId, country: "", title: data.title, type: "localized", language: data.language, description: data.description },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add localized title for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to add localized title" };
  }
}

export async function updateTvLocalizedTitle(id: number, tvShowId: number, data: LocalizedTitleInput): Promise<ActionResult> {
  try {
    await prisma.tvAlternateTitle.update({
      where: { id },
      data: { title: data.title, language: data.language, description: data.description },
    });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update localized title ${id} for TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to update localized title" };
  }
}

export async function deleteTvLocalizedTitle(id: number, tvShowId: number): Promise<ActionResult> {
  try {
    await prisma.tvAlternateTitle.delete({ where: { id } });
    await invalidateTvCache();
    revalidatePath(`/admin/tv-shows/${tvShowId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete localized title ${id} from TV show ${tvShowId}:`, err);
    return { success: false, error: "Failed to remove localized title" };
  }
}
