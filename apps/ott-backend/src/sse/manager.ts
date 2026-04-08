import { getRedis } from "@/cache/redis";

type SseController = ReadableStreamDefaultController<string>;

const streams = new Set<SseController>();

export function initSseManager(): void {
  const subscriber = getRedis().duplicate();
  subscriber.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });
  subscriber.subscribe("ott:admin:notifications", (err) => {
    if (err) console.error("SSE subscribe error:", err);
  });

  subscriber.on("message", (_channel: string, message: string) => {
    for (const ctrl of streams) {
      try {
        ctrl.enqueue(`data: ${message}\n\n`);
      } catch {
        streams.delete(ctrl);
      }
    }
  });
}

export function addSseStream(ctrl: SseController): void {
  streams.add(ctrl);
}

export function removeSseStream(ctrl: SseController): void {
  streams.delete(ctrl);
}
