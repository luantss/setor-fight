"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { generateCategoriesFromTemplate } from "@/services/categoryGenerator";

export type GenerateResult =
  | { success: true; created: number; skipped: number }
  | { success: false; error: string };

export async function generateCategoriesAction(
  competitionId: string,
): Promise<GenerateResult> {
  await requireAdmin();

  const prisma = getPrismaClient();

  try {
    const result = await generateCategoriesFromTemplate(competitionId, prisma);
    revalidatePath(`/admin/competicoes/${competitionId}`);
    return {
      success: true,
      created: result.categoriesCreated,
      skipped: result.categoriesSkipped,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao gerar categorias.",
    };
  }
}
