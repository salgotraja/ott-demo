"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateSeason, updateEpisode } from "@/actions/tvShows";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  runtime: number | null;
  airDate: Date | null;
}

interface Season {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string | null;
  airDate: Date | null;
  episodeCount: number | null;
  episodes: Episode[];
}

function EpisodeRow({ episode }: { episode: Episode }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(episode.name);
  const [overview, setOverview] = useState(episode.overview ?? "");
  const [runtime, setRuntime] = useState(String(episode.runtime ?? ""));
  const [airDate, setAirDate] = useState(
    episode.airDate ? new Date(episode.airDate).toISOString().split("T")[0] : "",
  );

  function save() {
    startTransition(async () => {
      const result = await updateEpisode(episode.id, {
        name,
        overview: overview || null,
        runtime: runtime ? Number(runtime) : null,
        airDate: airDate || null,
      });
      if (result.success) {
        toast.success(`Episode ${episode.episodeNumber} updated`);
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between py-2 px-3 hover:bg-muted/30 rounded">
        <div className="flex-1 min-w-0">
          <span className="text-muted-foreground text-xs mr-2">E{episode.episodeNumber}</span>
          <span className="text-sm">{episode.name}</span>
          {episode.runtime && (
            <span className="ml-2 text-xs text-muted-foreground">{episode.runtime}m</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="py-3 px-3 space-y-3 bg-muted/20 rounded border">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Runtime (min)</label>
          <Input
            type="number"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Air Date</label>
          <Input
            type="date"
            value={airDate}
            onChange={(e) => setAirDate(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Overview</label>
        <Textarea
          value={overview}
          onChange={(e) => setOverview(e.target.value)}
          rows={2}
          className="text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SeasonCard({ season }: { season: Season }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(season.name);
  const [overview, setOverview] = useState(season.overview ?? "");
  const [airDate, setAirDate] = useState(
    season.airDate ? new Date(season.airDate).toISOString().split("T")[0] : "",
  );
  const [episodeCount, setEpisodeCount] = useState(String(season.episodeCount ?? ""));

  function saveSeason() {
    startTransition(async () => {
      const result = await updateSeason(season.id, {
        name,
        overview: overview || null,
        airDate: airDate || null,
        episodeCount: episodeCount ? Number(episodeCount) : null,
      });
      if (result.success) {
        toast.success(`Season ${season.seasonNumber} updated`);
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="border rounded-md">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">{season.name}</span>
          <Badge variant="secondary" className="ml-2 text-xs">
            S{season.seasonNumber}
          </Badge>
          {season.episodeCount != null && (
            <span className="ml-2 text-xs text-muted-foreground">{season.episodeCount} episodes</span>
          )}
          {season.airDate && (
            <span className="ml-2 text-xs text-muted-foreground">
              {new Date(season.airDate).getFullYear()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(!editing);
            setOpen(true);
          }}
        >
          {editing ? "Cancel Edit" : "Edit Season"}
        </Button>
      </div>

      {open && (
        <div className="border-t p-3 space-y-3">
          {editing && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Episode Count</label>
                  <Input
                    type="number"
                    value={episodeCount}
                    onChange={(e) => setEpisodeCount(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Air Date</label>
                  <Input
                    type="date"
                    value={airDate}
                    onChange={(e) => setAirDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Overview</label>
                <Textarea
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <Button size="sm" onClick={saveSeason} disabled={isPending}>
                {isPending ? "Saving..." : "Save Season"}
              </Button>
              <Separator />
            </>
          )}

          {season.episodes.length > 0 ? (
            <div className="space-y-1">
              {season.episodes.map((ep) => (
                <EpisodeRow key={ep.id} episode={ep} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No episodes loaded.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SeasonsView({ seasons }: { seasons: Season[] }) {
  if (seasons.length === 0) {
    return <p className="text-muted-foreground text-sm">No seasons found.</p>;
  }

  return (
    <div className="space-y-3">
      {seasons.map((season) => (
        <SeasonCard key={season.id} season={season} />
      ))}
    </div>
  );
}
