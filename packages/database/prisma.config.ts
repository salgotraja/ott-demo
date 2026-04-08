import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "path";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL("../../", import.meta.url));
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
