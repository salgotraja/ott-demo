"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateMovieIds, upsertMovieReference, type MovieIdsUpdate, type MovieReferenceInput } from "@/actions/movies";
import { updateTvShowIds, upsertTvReference, type TvShowIdsUpdate, type TvReferenceInput } from "@/actions/tvShows";

const movieIdsSchema = z.object({
  tmdbId: z.string().nullable(),
  imdbId: z.string().nullable(),
  jwId: z.string().nullable(),
  eidr: z.string().nullable(),
});

const tvIdsSchema = z.object({
  tmdbId: z.string().nullable(),
  imdbId: z.string().nullable(),
  jwId: z.string().nullable(),
});

const refSchema = z.object({
  facebookId: z.string().nullable(),
  instagramId: z.string().nullable(),
  twitterId: z.string().nullable(),
  tiktokId: z.string().nullable(),
  youtubeId: z.string().nullable(),
  wikidataId: z.string().nullable(),
  wikipedia: z.string().nullable(),
  wikipediaUrl: z.string().nullable(),
  home: z.string().nullable(),
  eidrId: z.string().nullable(),
});

type MovieIdsForm = z.infer<typeof movieIdsSchema>;
type TvIdsForm = z.infer<typeof tvIdsSchema>;
type RefForm = z.infer<typeof refSchema>;

interface Reference {
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

type Props =
  | { type: "movie"; id: number; tmdbId: string | null; imdbId: string | null; jwId: string | null; eidr: string | null; reference: Reference | null }
  | { type: "tv"; id: number; tmdbId: string | null; imdbId: string | null; jwId: string | null; reference: Reference | null };

function n(s: string | null | undefined): string | null {
  return s?.trim() || null;
}

const REF_FIELDS: { name: keyof RefForm; label: string }[] = [
  { name: "home", label: "Homepage URL" },
  { name: "wikidataId", label: "Wikidata ID" },
  { name: "wikipedia", label: "Wikipedia" },
  { name: "wikipediaUrl", label: "Wikipedia URL" },
  { name: "facebookId", label: "Facebook ID" },
  { name: "instagramId", label: "Instagram ID" },
  { name: "twitterId", label: "Twitter/X ID" },
  { name: "tiktokId", label: "TikTok ID" },
  { name: "youtubeId", label: "YouTube ID" },
  { name: "eidrId", label: "EIDR ID" },
];

export function IdsSourcesForm(props: Props) {
  const [pendingIds, startIds] = useTransition();
  const [pendingRef, startRef] = useTransition();

  const idsForm = useForm<MovieIdsForm | TvIdsForm>({
    resolver: zodResolver(props.type === "movie" ? movieIdsSchema : tvIdsSchema),
    defaultValues:
      props.type === "movie"
        ? { tmdbId: props.tmdbId, imdbId: props.imdbId, jwId: props.jwId, eidr: props.eidr }
        : { tmdbId: props.tmdbId, imdbId: props.imdbId, jwId: props.jwId },
  });

  const refForm = useForm<RefForm>({
    resolver: zodResolver(refSchema),
    defaultValues: {
      facebookId: props.reference?.facebookId ?? null,
      instagramId: props.reference?.instagramId ?? null,
      twitterId: props.reference?.twitterId ?? null,
      tiktokId: props.reference?.tiktokId ?? null,
      youtubeId: props.reference?.youtubeId ?? null,
      wikidataId: props.reference?.wikidataId ?? null,
      wikipedia: props.reference?.wikipedia ?? null,
      wikipediaUrl: props.reference?.wikipediaUrl ?? null,
      home: props.reference?.home ?? null,
      eidrId: props.reference?.eidrId ?? null,
    },
  });

  function onSubmitIds(values: MovieIdsForm | TvIdsForm) {
    startIds(async () => {
      let result;
      if (props.type === "movie") {
        const v = values as MovieIdsForm;
        const data: MovieIdsUpdate = { tmdbId: n(v.tmdbId), imdbId: n(v.imdbId), jwId: n(v.jwId), eidr: n(v.eidr) };
        result = await updateMovieIds(props.id, data);
      } else {
        const v = values as TvIdsForm;
        const data: TvShowIdsUpdate = { tmdbId: n(v.tmdbId), imdbId: n(v.imdbId), jwId: n(v.jwId) };
        result = await updateTvShowIds(props.id, data);
      }
      if (result.success) {
        toast.success("IDs updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  function onSubmitRef(values: RefForm) {
    startRef(async () => {
      const data: MovieReferenceInput | TvReferenceInput = {
        facebookId: n(values.facebookId),
        instagramId: n(values.instagramId),
        twitterId: n(values.twitterId),
        tiktokId: n(values.tiktokId),
        youtubeId: n(values.youtubeId),
        wikidataId: n(values.wikidataId),
        wikipedia: n(values.wikipedia),
        wikipediaUrl: n(values.wikipediaUrl),
        home: n(values.home),
        eidrId: n(values.eidrId),
      };
      const result = props.type === "movie"
        ? await upsertMovieReference(props.id, data as MovieReferenceInput)
        : await upsertTvReference(props.id, data as TvReferenceInput);
      if (result.success) {
        toast.success("Sources updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  const idFields =
    props.type === "movie"
      ? [
          { name: "tmdbId", label: "TMDB ID" },
          { name: "imdbId", label: "IMDB ID" },
          { name: "jwId", label: "JustWatch ID" },
          { name: "eidr", label: "EIDR" },
        ]
      : [
          { name: "tmdbId", label: "TMDB ID" },
          { name: "imdbId", label: "IMDB ID" },
          { name: "jwId", label: "JustWatch ID" },
        ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold mb-4">IDs</h3>
        <Form {...idsForm}>
          <form onSubmit={idsForm.handleSubmit(onSubmitIds)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {idFields.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={idsForm.control}
                  name={name as keyof (MovieIdsForm & TvIdsForm)}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit" disabled={pendingIds}>
              {pendingIds ? "Saving..." : "Save IDs"}
            </Button>
          </form>
        </Form>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4">Sources & Social</h3>
        <Form {...refForm}>
          <form onSubmit={refForm.handleSubmit(onSubmitRef)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {REF_FIELDS.map(({ name, label }) => (
                <FormField
                  key={name}
                  control={refForm.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit" disabled={pendingRef}>
              {pendingRef ? "Saving..." : "Save Sources"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
