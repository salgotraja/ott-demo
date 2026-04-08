import { prisma } from "@ott/database";
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

export const dynamic = "force-dynamic";

const ACTION_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
};

const ENTITY_LABELS: Record<string, string> = {
  movie: "Movie",
  tvShow: "TV Show",
  provider: "Provider",
};

const SYNC_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  success: "default",
  running: "secondary",
  failed: "destructive",
};

const SYNC_TYPE_LABELS: Record<string, string> = {
  all: "All",
  movies: "Movies",
  tv: "TV Shows",
};

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default async function ReportsPage() {
  const [
    movieCount,
    tvCount,
    providerCount,
    moviesWithStreaming,
    tvWithStreaming,
    moviesByLanguage,
    tvByLanguage,
    moviesNoProvider,
    tvNoProvider,
    moviesNoDescription,
    tvNoDescription,
    moviesNoGenre,
    tvNoGenre,
    moviesLowRating,
    recentJobs,
    auditLogs,
    topProviders,
  ] = await Promise.all([
    prisma.movie.count(),
    prisma.tvShow.count(),
    prisma.provider.count(),
    prisma.movie.count({ where: { providers: { some: { type: "flatrate", region: "IN" } } } }),
    prisma.tvShow.count({ where: { providers: { some: { type: "flatrate", region: "IN" } } } }),
    prisma.movie.groupBy({
      by: ["originalLanguage"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 15,
    }),
    prisma.tvShow.groupBy({
      by: ["originalLanguage"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 15,
    }),
    prisma.movie.count({ where: { providers: { none: {} } } }),
    prisma.tvShow.count({ where: { providers: { none: {} } } }),
    prisma.movie.count({ where: { OR: [{ description: null }, { description: "" }] } }),
    prisma.tvShow.count({ where: { OR: [{ description: null }, { description: "" }] } }),
    prisma.movie.count({ where: { genres: { none: {} } } }),
    prisma.tvShow.count({ where: { genres: { none: {} } } }),
    prisma.movie.count({ where: { voteAverage: { lt: 5, not: null } } }),
    prisma.syncJob.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { movies: true, tvShows: true } },
      },
      orderBy: { movies: { _count: "desc" } },
      take: 10,
    }),
  ]);

  // Merge language tables
  const languageMap = new Map<string, { movies: number; tv: number }>();
  for (const r of moviesByLanguage) {
    const key = r.originalLanguage ?? "unknown";
    languageMap.set(key, { movies: r._count.id, tv: 0 });
  }
  for (const r of tvByLanguage) {
    const key = r.originalLanguage ?? "unknown";
    const existing = languageMap.get(key) ?? { movies: 0, tv: 0 };
    languageMap.set(key, { ...existing, tv: r._count.id });
  }
  const languages = [...languageMap.entries()]
    .sort((a, b) => b[1].movies + b[1].tv - (a[1].movies + a[1].tv))
    .slice(0, 15);

  const dataQualityItems = [
    { label: "Movies — no streaming providers", value: moviesNoProvider, warn: moviesNoProvider > 20 },
    { label: "TV Shows — no streaming providers", value: tvNoProvider, warn: tvNoProvider > 10 },
    { label: "Movies — missing description", value: moviesNoDescription, warn: moviesNoDescription > 5 },
    { label: "TV Shows — missing description", value: tvNoDescription, warn: tvNoDescription > 5 },
    { label: "Movies — no genres tagged", value: moviesNoGenre, warn: moviesNoGenre > 0 },
    { label: "TV Shows — no genres tagged", value: tvNoGenre, warn: tvNoGenre > 0 },
    { label: "Movies — low rating (< 5.0)", value: moviesLowRating, warn: false },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* ── Overview ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Content Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total Movies" value={movieCount} />
          <StatCard title="Total TV Shows" value={tvCount} />
          <StatCard title="Total Providers" value={providerCount} />
          <StatCard
            title="Movies with Streaming"
            value={moviesWithStreaming}
            description={`${Math.round((moviesWithStreaming / (movieCount || 1)) * 100)}% coverage`}
          />
          <StatCard
            title="TV Shows with Streaming"
            value={tvWithStreaming}
            description={`${Math.round((tvWithStreaming / (tvCount || 1)) * 100)}% coverage`}
          />
        </div>
      </section>

      {/* ── Language breakdown ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content by Language</CardTitle>
            <CardDescription>Top 15 original languages across all content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Language</TableHead>
                  <TableHead className="text-right w-24">Movies</TableHead>
                  <TableHead className="text-right w-24">TV Shows</TableHead>
                  <TableHead className="text-right w-20">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {languages.map(([lang, counts]) => (
                  <TableRow key={lang}>
                    <TableCell className="font-medium uppercase">{lang}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{counts.movies}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{counts.tv}</TableCell>
                    <TableCell className="text-right font-medium">{counts.movies + counts.tv}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Provider coverage ── */}
        <Card>
          <CardHeader>
            <CardTitle>Top Providers by Content</CardTitle>
            <CardDescription>Providers with the most linked content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right w-24">Movies</TableHead>
                  <TableHead className="text-right w-24">TV Shows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProviders.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{p._count.movies}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{p._count.tvShows}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ── Data quality ── */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
          <CardDescription>Content items with incomplete or missing metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead className="text-right w-28">Count</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataQualityItems.map((item) => (
                <TableRow key={item.label}>
                  <TableCell>{item.label}</TableCell>
                  <TableCell className="text-right font-medium">{item.value}</TableCell>
                  <TableCell>
                    {item.value === 0 ? (
                      <Badge variant="default">OK</Badge>
                    ) : item.warn ? (
                      <Badge variant="destructive">Needs attention</Badge>
                    ) : (
                      <Badge variant="secondary">Info</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Sync history ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>Last 10 sync operations.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right w-20">Added</TableHead>
                <TableHead className="text-right w-20">Updated</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <Badge variant={SYNC_STATUS_VARIANT[j.status] ?? "secondary"}>{j.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {SYNC_TYPE_LABELS[j.syncType] ?? j.syncType}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {j.startedAt.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {j.completedAt?.toLocaleString() ?? "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{j.moviesAdded}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{j.moviesUpdated}</TableCell>
                  <TableCell className="text-destructive text-sm">
                    {j.errors.join(", ") || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Admin action log ── */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Action Log</CardTitle>
          <CardDescription>
            Last 50 create / update / delete operations performed by administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No actions recorded yet. Actions will appear here after you create, edit, or delete content.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.createdAt.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_BADGE_VARIANT[log.action] ?? "secondary"}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ENTITY_LABELS[log.entityType] ?? log.entityType}
                    </TableCell>
                    <TableCell className="font-medium">{log.entityName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
