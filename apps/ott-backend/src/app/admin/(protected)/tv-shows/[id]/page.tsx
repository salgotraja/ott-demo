import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@ott/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TvShowDetailsForm } from "@/components/admin/TvShowDetailsForm";
import { GenresForm } from "@/components/admin/GenresForm";
import { ProvidersForm } from "@/components/admin/ProvidersForm";
import { ActorsForm } from "@/components/admin/ActorsForm";
import { SeasonsView } from "@/components/admin/SeasonsView";
import { CrewForm } from "@/components/admin/CrewForm";
import { IdsSourcesForm } from "@/components/admin/IdsSourcesForm";
import { ContentRatingsForm } from "@/components/admin/ContentRatingsForm";
import { LocalizedContentForm } from "@/components/admin/LocalizedContentForm";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TvShowEditPage({ params }: Props) {
  const { id } = await params;
  const showId = Number(id);

  if (isNaN(showId)) notFound();

  const [show, allGenres, allProviders] = await Promise.all([
    prisma.tvShow.findUnique({
      where: { id: showId },
      include: {
        genres: { include: { genre: true } },
        providers: { include: { provider: true } },
        actors: { orderBy: { priority: "asc" } },
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: { episodes: { orderBy: { episodeNumber: "asc" } } },
        },
        crew: { orderBy: { job: "asc" } },
        contentRatings: { orderBy: [{ country: "asc" }, { type: "asc" }] },
        alternateTitles: { where: { type: "localized" }, orderBy: { id: "asc" } },
        references: true,
      },
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" } }),
    prisma.provider.findMany({ orderBy: [{ displayPriority: "asc" }, { name: "asc" }] }),
  ]);

  if (!show) notFound();

  const currentGenreIds = show.genres.map((g) => g.genreId);
  const linkedProviders = show.providers.map((sp) => ({
    providerId: sp.providerId,
    type: sp.type,
    region: sp.region,
    url: sp.url,
    cost: sp.cost,
    quality: sp.quality,
    provider: sp.provider,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/tv-shows">
            <ChevronLeft className="h-4 w-4 mr-1" />
            TV Shows
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{show.name}</h1>
        <span className="text-muted-foreground text-sm">#{show.id}</span>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="localized">Localized</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
          <TabsTrigger value="cast">Cast</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="ids">IDs & Sources</TabsTrigger>
          <TabsTrigger value="ratings">Content Ratings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <TvShowDetailsForm show={show} />
        </TabsContent>

        <TabsContent value="localized" className="mt-6">
          <LocalizedContentForm type="tv" contentId={show.id} entries={show.alternateTitles} />
        </TabsContent>

        <TabsContent value="genres" className="mt-6">
          <GenresForm type="tv" id={show.id} allGenres={allGenres} currentGenreIds={currentGenreIds} />
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <ProvidersForm type="tv" id={show.id} allProviders={allProviders} linkedProviders={linkedProviders} />
        </TabsContent>

        <TabsContent value="seasons" className="mt-6">
          <SeasonsView seasons={show.seasons} />
        </TabsContent>

        <TabsContent value="cast" className="mt-6">
          <ActorsForm type="tv" contentId={show.id} actors={show.actors} />
        </TabsContent>

        <TabsContent value="crew" className="mt-6">
          <CrewForm type="tv" contentId={show.id} crew={show.crew} />
        </TabsContent>

        <TabsContent value="ids" className="mt-6">
          <IdsSourcesForm
            type="tv"
            id={show.id}
            tmdbId={show.tmdbId}
            imdbId={show.imdbId}
            jwId={show.jwId}
            reference={show.references}
          />
        </TabsContent>

        <TabsContent value="ratings" className="mt-6">
          <ContentRatingsForm type="tv" contentId={show.id} ratings={show.contentRatings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
