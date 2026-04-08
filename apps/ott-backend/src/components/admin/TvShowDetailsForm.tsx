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
import { updateTvShowDetails } from "@/actions/tvShows";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  originalName: z.string().nullable(),
  tagline: z.string().nullable(),
  description: z.string().nullable(),
  originalLanguage: z.string().nullable(),
  adult: z.boolean(),
  verifiedByTeam: z.boolean(),
  status: z.string().nullable(),
  numberOfSeasons: z.coerce.number().int().nullable(),
  numberOfEpisodes: z.coerce.number().int().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface TvShow {
  id: number;
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
  voteAverage: number | null;
  popularity: number | null;
}

const READ_ONLY_LABEL = "text-xs text-muted-foreground mt-1";

export function TvShowDetailsForm({ show }: { show: TvShow }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: show.name,
      originalName: show.originalName,
      tagline: show.tagline,
      description: show.description,
      originalLanguage: show.originalLanguage,
      adult: show.adult,
      verifiedByTeam: show.verifiedByTeam,
      status: show.status,
      numberOfSeasons: show.numberOfSeasons,
      numberOfEpisodes: show.numberOfEpisodes,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await updateTvShowDetails(show.id, values);
      if (result.success) {
        toast.success("TV show updated");
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="originalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Name</FormLabel>
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
                  <Input {...field} value={field.value ?? ""} placeholder="Returning Series, Ended..." />
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
            name="numberOfSeasons"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Seasons</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numberOfEpisodes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Episodes</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Vote Average</p>
            <p className={READ_ONLY_LABEL}>{show.voteAverage ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Popularity</p>
            <p className={READ_ONLY_LABEL}>{show.popularity ?? "-"}</p>
          </div>
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
