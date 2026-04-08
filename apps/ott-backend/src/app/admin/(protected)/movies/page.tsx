import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@ott/database";
import { deleteMovie } from "@/actions/movies";
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

export default async function MoviesPage({ searchParams }: Props) {
  const { q, page, rating } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where = {
    type: "movie" as const,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { originalTitle: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(rating
      ? { contentRatings: { some: { code: { contains: rating, mode: "insensitive" as const } } } }
      : {}),
  };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: { popularity: "desc" },
      select: { id: true, title: true, originalLanguage: true, releaseYear: true, voteAverage: true },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.movie.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Movies</CardTitle>
            <CardDescription>Manage the movie catalog.</CardDescription>
          </div>
          <Badge variant="secondary">{total} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Suspense>
            <SearchInput placeholder="Search movies..." />
          </Suspense>
          <Suspense>
            <RatingFilterInput />
          </Suspense>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Language</TableHead>
              <TableHead className="w-20">Year</TableHead>
              <TableHead className="w-20">Rating</TableHead>
              <TableHead className="w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movies.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-muted-foreground">{m.id}</TableCell>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell className="text-muted-foreground">{m.originalLanguage}</TableCell>
                <TableCell className="text-muted-foreground">{m.releaseYear}</TableCell>
                <TableCell className="text-muted-foreground">{m.voteAverage?.toFixed(1)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/movies/${m.id}`}>Edit</Link>
                    </Button>
                    <DeleteButton
                      message={`Delete "${m.title}"? This cannot be undone.`}
                      action={async () => {
                        "use server";
                        return deleteMovie(m.id);
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
          basePath="/admin/movies"
          searchQuery={q}
          extraParams={rating ? { rating } : undefined}
        />
      </CardContent>
    </Card>
  );
}
