import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@ott/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MovieDetailsForm } from "@/components/admin/MovieDetailsForm";
import { GenresForm } from "@/components/admin/GenresForm";
import { ProvidersForm } from "@/components/admin/ProvidersForm";
import { ActorsForm } from "@/components/admin/ActorsForm";
import { CrewForm } from "@/components/admin/CrewForm";
import { IdsSourcesForm } from "@/components/admin/IdsSourcesForm";
import { ContentRatingsForm } from "@/components/admin/ContentRatingsForm";
import { LocalizedContentForm } from "@/components/admin/LocalizedContentForm";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MovieEditPage({ params }: Props) {
  const { id } = await params;
  const movieId = Number(id);

  if (isNaN(movieId)) notFound();

  const [movie, allGenres, allProviders] = await Promise.all([
    prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: { include: { genre: true } },
        providers: { include: { provider: true } },
        actors: { orderBy: { priority: "asc" } },
        crew: { orderBy: { job: "asc" } },
        contentRatings: { orderBy: [{ country: "asc" }, { type: "asc" }] },
        alternateTitles: { where: { type: "localized" }, orderBy: { id: "asc" } },
        references: true,
      },
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
    prisma.provider.findMany({ orderBy: [{ displayPriority: "asc" }, { name: "asc" }] }),
  ]);

  if (!movie) notFound();

  const currentGenreIds = movie.genres.map((g: { genreId: number }) => g.genreId);
  const linkedProviders = movie.providers.map((mp) => ({
    providerId: mp.providerId,
    type: mp.type,
    region: mp.region,
    url: mp.url,
    cost: mp.cost,
    quality: mp.quality,
    provider: mp.provider,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/movies">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Movies
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{movie.title}</h1>
        <span className="text-muted-foreground text-sm">#{movie.id}</span>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="localized">Localized</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="cast">Cast</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="ids">IDs & Sources</TabsTrigger>
          <TabsTrigger value="ratings">Content Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <MovieDetailsForm movie={movie} />
        </TabsContent>

        <TabsContent value="localized" className="mt-6">
          <LocalizedContentForm type="movie" contentId={movie.id} entries={movie.alternateTitles} />
        </TabsContent>

        <TabsContent value="genres" className="mt-6">
          <GenresForm type="movie" id={movie.id} allGenres={allGenres} currentGenreIds={currentGenreIds} />
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <ProvidersForm type="movie" id={movie.id} allProviders={allProviders} linkedProviders={linkedProviders} />
        </TabsContent>

        <TabsContent value="cast" className="mt-6">
          <ActorsForm type="movie" contentId={movie.id} actors={movie.actors} />
        </TabsContent>

        <TabsContent value="crew" className="mt-6">
          <CrewForm type="movie" contentId={movie.id} crew={movie.crew} />
        </TabsContent>

        <TabsContent value="ids" className="mt-6">
          <IdsSourcesForm
            type="movie"
            id={movie.id}
            tmdbId={movie.tmdbId}
            imdbId={movie.imdbId}
            jwId={movie.jwId}
            eidr={movie.eidr}
            reference={movie.references}
          />
        </TabsContent>

        <TabsContent value="ratings" className="mt-6">
          <ContentRatingsForm type="movie" contentId={movie.id} ratings={movie.contentRatings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
