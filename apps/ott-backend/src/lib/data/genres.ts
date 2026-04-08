import { prisma } from "@ott/database";

export async function findAllGenres() {
  return prisma.genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
