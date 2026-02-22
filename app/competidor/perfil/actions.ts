"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  competitorProfileSchema,
  type CompetitorProfileInput,
} from "@/lib/validators/competitorProfile";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function saveCompetitorProfile(
  raw: CompetitorProfileInput,
): Promise<ActionResult> {
  const user = await requireAuth();
  const prisma = getPrismaClient();

  const parsed = competitorProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, birthDate, gender, belt, weight } = parsed.data;

  await prisma.competitorProfile.upsert({
    where: { userId: user.id },
    update: { name, birthDate: new Date(birthDate), gender, belt, weight },
    create: { userId: user.id, name, birthDate: new Date(birthDate), gender, belt, weight },
  });

  revalidatePath("/competidor/perfil");
  return { success: true, data: undefined };
}

export async function getCompetitorProfile() {
  const user = await requireAuth();
  const prisma = getPrismaClient();

  return prisma.competitorProfile.findUnique({ where: { userId: user.id } });
}
