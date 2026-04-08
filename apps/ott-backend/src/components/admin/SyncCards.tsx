"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  isRunning: boolean;
  syncAll: () => Promise<void>;
  syncMovies: () => Promise<void>;
  syncTv: () => Promise<void>;
}

export function SyncCards({ isRunning, syncAll, syncMovies, syncTv }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const disabled = isRunning || pending;

  // Auto-refresh every 5s while sync is in progress so status + history update automatically
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [isRunning, router]);

  function handle(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sync All</CardTitle>
            <CardDescription>Syncs movies and TV shows from TMDB.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handle(syncAll)} disabled={disabled} className="w-full">
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sync All
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Movies</CardTitle>
            <CardDescription>60 Indian-origin + 40 popular in India.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handle(syncMovies)}
              disabled={disabled}
              variant="outline"
              className="w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sync Movies
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync TV Shows</CardTitle>
            <CardDescription>40 Indian-origin + 20 popular in India.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handle(syncTv)}
              disabled={disabled}
              variant="outline"
              className="w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sync TV Shows
            </Button>
          </CardContent>
        </Card>
      </div>

      {disabled && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {pending
            ? "Starting sync…"
            : "Sync in progress — page refreshes automatically every 5 s"}
        </p>
      )}
    </div>
  );
}
