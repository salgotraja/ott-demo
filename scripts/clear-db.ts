import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  console.log("Clearing database...");

  await prisma.movieProvider.deleteMany({});
  await prisma.genreOnMovie.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.genre.deleteMany({});

  console.log("Database cleared successfully");
}

clearDatabase()
  .catch((error) => {
    console.error("Failed to clear database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
