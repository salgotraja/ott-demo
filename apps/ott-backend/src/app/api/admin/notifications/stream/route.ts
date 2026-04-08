import { NextResponse } from "next/server";
import { addSseStream, removeSseStream } from "@/sse/manager";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  let controller: ReadableStreamDefaultController<string>;

  const stream = new ReadableStream<string>({
    start(ctrl) {
      controller = ctrl;
      addSseStream(ctrl);
      ctrl.enqueue(": connected\n\n");
    },
    cancel() {
      removeSseStream(controller);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
