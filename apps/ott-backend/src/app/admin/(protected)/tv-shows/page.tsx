import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@ott/database";
import { deleteTvShow } from "@/actions/tvShows";
import { DeleteButton } from "@/components/DeleteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/admin/SearchInput";
import { RatingFilterInput } from "@/components/admin/RatingFilterInput";
import { PaginationControl } from "@/components/admin/PaginationControl";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ q?: string; page?: string; rating?: string }>;
}

export default async function TvShowsPage({ searchParams }: Props) {
  const { q, page, rating } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { originalName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(rating
      ? { contentRatings: { some: { code: { contains: rating, mode: "insensitive" as const } } } }
      : {}),
  };

  const [shows, total] = await Promise.all([
    prisma.tvShow.findMany({
      where,
      orderBy: { popularity: "desc" },
      select: {
        id: true,
        name: true,
        originalLanguage: true,
        firstAirDate: true,
        numberOfSeasons: true,
        voteAverage: true,
      },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.tvShow.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>TV Shows</CardTitle>
            <CardDescription>Manage the TV show catalog.</CardDescription>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Suspense>
            <SearchInput placeholder="Search TV shows..." />
          </Suspense>
          <Suspense>
            <RatingFilterInput />
          </Suspense>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Language</TableHead>
              <TableHead className="w-24">First Air</TableHead>
              <TableHead className="w-20">Seasons</TableHead>
              <TableHead className="w-20">Rating</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">{s.id}</TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.originalLanguage}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.firstAirDate ? new Date(s.firstAirDate).getFullYear() : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.numberOfSeasons ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{s.voteAverage?.toFixed(1) ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/tv-shows/${s.id}`}>Edit</Link>
                    </Button>
                    <DeleteButton
                      message={`Delete "${s.name}"? This cannot be undone.`}
                      action={async () => {
                        "use server";
                        return deleteTvShow(s.id);
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          basePath="/admin/tv-shows"
          searchQuery={q}
          extraParams={rating ? { rating } : undefined}
        />
      </CardContent>
    </Card>
  );
}
