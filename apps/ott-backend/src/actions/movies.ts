"use server";

import { prisma } from "@ott/database";
import { invalidateMovieCache } from "@/cache/helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

export type { ActionResult } from "./types";

interface MovieCreateData {
  id: number;
  internalId: string;
  title: string;
  originalTitle?: string;
  description?: string;
  releaseYear?: number;
  originalLanguage?: string;
  adult?: boolean;
}

interface MovieUpdateData {
  title?: string;
  originalTitle?: string;
  description?: string;
  releaseYear?: number;
  originalLanguage?: string;
  adult?: boolean;
  tagline?: string;
  status?: string;
  runtime?: number;
}

export interface MovieDetailsUpdate {
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  description: string | null;
  releaseYear: number | null;
  originalLanguage: string | null;
  adult: boolean;
  verifiedByTeam: boolean;
  status: string | null;
  keywords: string | null;
  budget: string | null;
  revenue: string | null;
  awards: string | null;
}

export async function createMovie(data: MovieCreateData): Promise<ActionResult> {
  try {
    await prisma.movie.create({ data });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "movie", entityId: String(data.id), entityName: data.title },
    });
    await invalidateMovieCache();
    revalidatePath("/admin/movies");
    return { success: true };
  } catch (err) {
    console.error(`Failed to create movie ${data.id}:`, err);
    return { success: false, error: "Failed to create movie" };
  }
}

export async function updateMovie(id: number, data: MovieUpdateData): Promise<ActionResult> {
  try {
    const movie = await prisma.movie.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "movie", entityId: String(id), entityName: movie.title },
    });
    await invalidateMovieCache();
    revalidatePath("/admin/movies");
    return { success: true };
  } catch (err) {
    console.error(`Failed to update movie ${id}:`, err);
    return { success: false, error: "Failed to update movie" };
  }
}

export async function deleteMovie(id: number): Promise<ActionResult> {
  try {
    const movie = await prisma.movie.findUnique({ where: { id }, select: { title: true } });
    await prisma.movie.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "movie", entityId: String(id), entityName: movie?.title ?? String(id) },
    });
    await invalidateMovieCache();
    revalidatePath("/admin/movies");
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete movie ${id}:`, err);
    return { success: false, error: "Failed to delete movie" };
  }
}

export async function updateMovieDetails(id: number, data: MovieDetailsUpdate): Promise<ActionResult> {
  try {
    await prisma.movie.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "movie", entityId: String(id), entityName: data.title },
    });
    await invalidateMovieCache();
    revalidatePath("/admin/movies");
    revalidatePath(`/admin/movies/${id}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update movie details ${id}:`, err);
    return { success: false, error: "Failed to update movie details" };
  }
}

export async function setMovieGenres(movieId: number, genreIds: number[]): Promise<ActionResult> {
  try {
    await prisma.genreOnMovie.deleteMany({ where: { movieId } });
    if (genreIds.length > 0) {
      await prisma.genreOnMovie.createMany({
        data: genreIds.map((genreId) => ({ movieId, genreId })),
      });
    }
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to set genres for movie ${movieId}:`, err);
    return { success: false, error: "Failed to update genres" };
  }
}

export interface CrewInput {
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

export async function addMovieCrew(movieId: number, data: CrewInput): Promise<ActionResult> {
  try {
    await prisma.crew.create({
      data: {
        movieId, crewId: 0,
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
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add crew to movie ${movieId}:`, err);
    return { success: false, error: "Failed to add crew member" };
  }
}

export async function updateMovieCrew(id: number, movieId: number, data: CrewInput): Promise<ActionResult> {
  try {
    await prisma.crew.update({
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
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update crew ${id} on movie ${movieId}:`, err);
    return { success: false, error: "Failed to update crew member" };
  }
}

export async function deleteMovieCrew(id: number, movieId: number): Promise<ActionResult> {
  try {
    await prisma.crew.delete({ where: { id } });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete crew ${id} from movie ${movieId}:`, err);
    return { success: false, error: "Failed to remove crew member" };
  }
}

export interface MovieIdsUpdate {
  tmdbId: string | null;
  imdbId: string | null;
  jwId: string | null;
  eidr: string | null;
}

export interface MovieReferenceInput {
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

export async function updateMovieIds(id: number, data: MovieIdsUpdate): Promise<ActionResult> {
  try {
    await prisma.movie.update({ where: { id }, data });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${id}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update IDs for movie ${id}:`, err);
    return { success: false, error: "Failed to update movie IDs" };
  }
}

export async function upsertMovieReference(movieId: number, data: MovieReferenceInput): Promise<ActionResult> {
  try {
    await prisma.reference.upsert({
      where: { movieId },
      update: data,
      create: { movieId, ...data },
    });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to upsert reference for movie ${movieId}:`, err);
    return { success: false, error: "Failed to update movie references" };
  }
}

export interface ContentRatingInput {
  country: string;
  code: string;
  type: string;
  releaseDate: string | null;
  note: string | null;
  language: string | null;
}

export async function addMovieContentRating(movieId: number, data: ContentRatingInput): Promise<ActionResult> {
  try {
    await prisma.contentRating.create({
      data: {
        movieId, country: data.country, code: data.code, type: data.type,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        note: data.note, language: data.language,
      },
    });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add content rating for movie ${movieId}:`, err);
    return { success: false, error: "Failed to add content rating" };
  }
}

export async function updateMovieContentRating(id: number, movieId: number, data: ContentRatingInput): Promise<ActionResult> {
  try {
    await prisma.contentRating.update({
      where: { id },
      data: {
        country: data.country, code: data.code, type: data.type,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        note: data.note, language: data.language,
      },
    });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update content rating ${id} for movie ${movieId}:`, err);
    return { success: false, error: "Failed to update content rating" };
  }
}

export async function deleteMovieContentRating(id: number, movieId: number): Promise<ActionResult> {
  try {
    await prisma.contentRating.delete({ where: { id } });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete content rating ${id} from movie ${movieId}:`, err);
    return { success: false, error: "Failed to remove content rating" };
  }
}

export interface ActorInput {
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

export async function addMovieActor(movieId: number, data: ActorInput): Promise<ActionResult> {
  try {
    await prisma.actor.create({
      data: {
        movieId, actorId: 0,
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
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add actor to movie ${movieId}:`, err);
    return { success: false, error: "Failed to add actor" };
  }
}

export async function updateMovieActor(id: number, movieId: number, data: ActorInput): Promise<ActionResult> {
  try {
    await prisma.actor.update({
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
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update actor ${id} on movie ${movieId}:`, err);
    return { success: false, error: "Failed to update actor" };
  }
}

export async function deleteMovieActor(id: number, movieId: number): Promise<ActionResult> {
  try {
    await prisma.actor.delete({ where: { id } });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete actor ${id} from movie ${movieId}:`, err);
    return { success: false, error: "Failed to remove actor" };
  }
}

export interface LocalizedTitleInput {
  language: string;
  title: string;
  description: string | null;
}

export async function addMovieLocalizedTitle(movieId: number, data: LocalizedTitleInput): Promise<ActionResult> {
  try {
    await prisma.alternateTitle.create({
      data: { movieId, country: "", title: data.title, type: "localized", language: data.language, description: data.description },
    });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to add localized title for movie ${movieId}:`, err);
    return { success: false, error: "Failed to add localized title" };
  }
}

export async function updateMovieLocalizedTitle(id: number, movieId: number, data: LocalizedTitleInput): Promise<ActionResult> {
  try {
    await prisma.alternateTitle.update({
      where: { id },
      data: { title: data.title, language: data.language, description: data.description },
    });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to update localized title ${id} for movie ${movieId}:`, err);
    return { success: false, error: "Failed to update localized title" };
  }
}

export async function deleteMovieLocalizedTitle(id: number, movieId: number): Promise<ActionResult> {
  try {
    await prisma.alternateTitle.delete({ where: { id } });
    await invalidateMovieCache();
    revalidatePath(`/admin/movies/${movieId}`);
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete localized title ${id} from movie ${movieId}:`, err);
    return { success: false, error: "Failed to remove localized title" };
  }
}
