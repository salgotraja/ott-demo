import { Suspense } from "react";
import { prisma } from "@ott/database";
import { triggerSync } from "@/jobs/syncWorker";
import { NotificationPanel } from "@/components/NotificationPanel";
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
import { SyncCards } from "@/components/admin/SyncCards";

export const dynamic = "force-dynamic";

async function triggerSyncAll() {
  "use server";
  await triggerSync("all");
}

async function triggerSyncMovies() {
  "use server";
  await triggerSync("movies");
}

async function triggerSyncTv() {
  "use server";
  await triggerSync("tv");
}

const SYNC_TYPE_LABELS: Record<string, string> = {
  all: "All",
  movies: "Movies",
  tv: "TV Shows",
};

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "success"
      ? "default"
      : status === "running"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
}

export default async function SyncPage() {
  const jobs = await prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  const isRunning = jobs.some((j) => j.status === "running");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">TMDB Sync</h1>

      <SyncCards
        isRunning={isRunning}
        syncAll={triggerSyncAll}
        syncMovies={triggerSyncMovies}
        syncTv={triggerSyncTv}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Last 20 sync jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="w-20">Added</TableHead>
                <TableHead className="w-20">Updated</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <StatusBadge status={j.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {SYNC_TYPE_LABELS[j.syncType] ?? j.syncType}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {j.startedAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {j.completedAt?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{j.moviesAdded}</TableCell>
                  <TableCell className="text-muted-foreground">{j.moviesUpdated}</TableCell>
                  <TableCell className="text-destructive text-sm">
                    {j.errors.join(", ") || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <NotificationPanel />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
