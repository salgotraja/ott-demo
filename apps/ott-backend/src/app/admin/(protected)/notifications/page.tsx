import { prisma } from "@ott/database";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const jobs = await prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Notification Log</h1>
      <p className="text-sm text-gray-400 mb-4">Shows all past sync job events from the database.</p>
      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="bg-gray-900 rounded p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  j.status === "success"
                    ? "bg-green-900 text-green-400"
                    : j.status === "running"
                      ? "bg-blue-900 text-blue-400"
                      : "bg-red-900 text-red-400"
                }`}
              >
                {j.status}
              </span>
              <span className="text-xs text-gray-500">{j.startedAt.toLocaleString()}</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Added: {j.moviesAdded} | Updated: {j.moviesUpdated}
              {j.completedAt && (
                <span className="ml-4">
                  Duration:{" "}
                  {Math.round((j.completedAt.getTime() - j.startedAt.getTime()) / 1000)}s
                </span>
              )}
            </div>
            {j.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-400">{j.errors.join("; ")}</div>
            )}
          </div>
        ))}
        {jobs.length === 0 && <p className="text-sm text-gray-600">No sync jobs recorded yet.</p>}
      </div>
    </div>
  );
}
