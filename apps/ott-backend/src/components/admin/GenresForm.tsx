"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { setMovieGenres } from "@/actions/movies";
import { setTvShowGenres } from "@/actions/tvShows";

interface Genre {
  id: number;
  name: string;
}

interface Props {
  type: "movie" | "tv";
  id: number;
  allGenres: Genre[];
  currentGenreIds: number[];
}

export function GenresForm({ type, id, allGenres, currentGenreIds }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set(currentGenreIds));
  const [isPending, startTransition] = useTransition();

  function toggle(genreId: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(genreId)) {
        next.delete(genreId);
      } else {
        next.add(genreId);
      }
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = type === "movie"
        ? await setMovieGenres(id, Array.from(checked))
        : await setTvShowGenres(id, Array.from(checked));
      if (result.success) {
        toast.success("Genres updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {allGenres.map((genre) => (
          <div key={genre.id} className="flex items-center gap-2">
            <Checkbox
              id={`genre-${genre.id}`}
              checked={checked.has(genre.id)}
              onCheckedChange={() => toggle(genre.id)}
            />
            <Label htmlFor={`genre-${genre.id}`} className="cursor-pointer">
              {genre.name}
            </Label>
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={isPending}>
        {isPending ? "Saving..." : "Save Genres"}
      </Button>
    </div>
  );
}
