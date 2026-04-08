import { prisma } from "@ott/database";

export async function findAllProviders() {
  return prisma.provider.findMany({
    orderBy: [{ displayPriority: "asc" }, { name: "asc" }],
    select: { id: true, name: true, logoPath: true, displayPriority: true },
  });
}
