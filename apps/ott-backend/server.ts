import { createServer } from "http";
import next from "next";
import { initRedis } from "@/cache/redis";
import { initSseManager } from "@/sse/manager";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    await initRedis();
    initSseManager();

    const port = parseInt(process.env.PORT ?? "3001", 10);
    const server = createServer(handle);
    server.on("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });
    server.listen(port, () => {
      console.log(`ott-backend ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize app:", err);
    process.exit(1);
  });
