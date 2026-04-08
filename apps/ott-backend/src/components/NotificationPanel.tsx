"use client";

import { useEffect, useRef, useState } from "react";

interface SseEvent {
  event: string;
  jobId?: string;
  moviesAdded?: number;
  moviesUpdated?: number;
  errors?: string[];
  receivedAt: string;
}

export function NotificationPanel() {
  const [events, setEvents] = useState<SseEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/admin/notifications/stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as Omit<SseEvent, "receivedAt">;
        setEvents((prev) => [{ ...data, receivedAt: new Date().toISOString() }, ...prev].slice(0, 50));
      } catch {
        // ignore malformed events
      }
    };

    return () => es.close();
  }, []);

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-sm text-gray-400">{connected ? "Live" : "Disconnected"}</span>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-gray-600">No events yet.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev, i) => (
            <li key={i} className="bg-gray-900 rounded p-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-white">{ev.event}</span>
                <span className="text-gray-500 text-xs">{new Date(ev.receivedAt).toLocaleTimeString()}</span>
              </div>
              {ev.moviesAdded !== undefined && (
                <p className="text-gray-400 mt-1">
                  Added: {ev.moviesAdded} | Updated: {ev.moviesUpdated}
                </p>
              )}
              {ev.errors && ev.errors.length > 0 && (
                <p className="text-red-400 mt-1">{ev.errors.join("; ")}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
