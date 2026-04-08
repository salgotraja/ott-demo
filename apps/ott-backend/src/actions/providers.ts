"use server";

import { prisma } from "@ott/database";
import { invalidateProviderCache } from "@/cache/helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";

export type { ActionResult } from "./types";

interface ProviderCreateData {
  id: number;
  name: string;
  logoPath?: string;
  displayPriority?: number;
}

interface ProviderUpdateData {
  name?: string;
  logoPath?: string | null;
  displayPriority?: number | null;
}

export async function createProvider(data: ProviderCreateData): Promise<ActionResult> {
  try {
    await prisma.provider.create({ data });
    await prisma.auditLog.create({
      data: { action: "create", entityType: "provider", entityId: String(data.id), entityName: data.name },
    });
    await invalidateProviderCache();
    revalidatePath("/admin/providers");
    return { success: true };
  } catch (err) {
    console.error(`Failed to create provider ${data.id}:`, err);
    return { success: false, error: "Failed to create provider" };
  }
}

export async function updateProvider(id: number, data: ProviderUpdateData): Promise<ActionResult> {
  try {
    const provider = await prisma.provider.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { action: "update", entityType: "provider", entityId: String(id), entityName: provider.name },
    });
    await invalidateProviderCache();
    revalidatePath("/admin/providers");
    return { success: true };
  } catch (err) {
    console.error(`Failed to update provider ${id}:`, err);
    return { success: false, error: "Failed to update provider" };
  }
}

export async function deleteProvider(id: number): Promise<ActionResult> {
  try {
    const provider = await prisma.provider.findUnique({ where: { id }, select: { name: true } });
    await prisma.provider.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { action: "delete", entityType: "provider", entityId: String(id), entityName: provider?.name ?? String(id) },
    });
    await invalidateProviderCache();
    revalidatePath("/admin/providers");
    return { success: true };
  } catch (err) {
    console.error(`Failed to delete provider ${id}:`, err);
    return { success: false, error: "Failed to delete provider" };
  }
}
