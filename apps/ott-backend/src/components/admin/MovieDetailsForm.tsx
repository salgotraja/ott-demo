"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateMovieDetails } from "@/actions/movies";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  originalTitle: z.string().nullable(),
  tagline: z.string().nullable(),
  description: z.string().nullable(),
  releaseYear: z.coerce.number().int().nullable(),
  originalLanguage: z.string().nullable(),
  adult: z.boolean(),
  verifiedByTeam: z.boolean(),
  status: z.string().nullable(),
  keywords: z.string().nullable(),
  budget: z.string().nullable(),
  revenue: z.string().nullable(),
  awards: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Movie {
  id: number;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  description: string | null;
  releaseYear: number | null;
  originalLanguage: string | null;
  adult: boolean;
  verifiedByTeam: boolean;
  status: string | null;
  runtime: number | null;
  keywords: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  popularity: number | null;
  budget: string | null;
  revenue: string | null;
  awards: string | null;
}

const READ_ONLY_LABEL = "text-xs text-muted-foreground mt-1";

export function MovieDetailsForm({ movie }: { movie: Movie }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: movie.title,
      originalTitle: movie.originalTitle,
      tagline: movie.tagline,
      description: movie.description,
      releaseYear: movie.releaseYear,
      originalLanguage: movie.originalLanguage,
      adult: movie.adult,
      verifiedByTeam: movie.verifiedByTeam,
      status: movie.status,
      keywords: movie.keywords,
      budget: movie.budget,
      revenue: movie.revenue,
      awards: movie.awards,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateMovieDetails(movie.id, values);
      if (result.success) {
        toast.success("Movie updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Title</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="Released, Post Production..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Language</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="hi, en, te..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="releaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Year</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Runtime (minutes)</p>
            <p className={READ_ONLY_LABEL}>{movie.runtime ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Vote Average</p>
            <p className={READ_ONLY_LABEL}>{movie.voteAverage ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Vote Count</p>
            <p className={READ_ONLY_LABEL}>{movie.voteCount ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Popularity</p>
            <p className={READ_ONLY_LABEL}>{movie.popularity ?? "-"}</p>
          </div>
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Comma-separated keywords" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="awards"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Awards</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="adult"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0">Adult content</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verifiedByTeam"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div>
                <FormLabel className="!mt-0">Verified By Team</FormLabel>
                {field.value && (
                  <p className="text-xs text-amber-500 mt-0.5">Sync will skip this content</p>
                )}
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
