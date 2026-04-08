export function MovieCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-zinc-800" />
      <div className="mt-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-zinc-800" />
        <div className="h-4 w-1/2 rounded bg-zinc-800" />
        <div className="h-4 w-1/3 rounded bg-zinc-800" />
        <div className="flex gap-1.5">
          <div className="h-6 w-16 rounded-full bg-zinc-800" />
          <div className="h-6 w-16 rounded-full bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
