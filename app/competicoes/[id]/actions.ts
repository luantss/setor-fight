"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  enrollCompetitor,
  EnrollmentServiceError,
} from "@/services/enrollmentService";
import { AuthError } from "@/lib/auth";

export type EnrollActionResult =
  | { success: true }
  | { success: false; error: string };

export async function enrollAction(
  _: EnrollActionResult | null,
  formData: FormData,
): Promise<EnrollActionResult> {
  const competitionId = formData.get("competitionId");
  if (typeof competitionId !== "string" || !competitionId) {
    return { success: false, error: "ID da competição inválido." };
  }

  try {
    const user = await requireAuth();
    const prisma = getPrismaClient();
    await enrollCompetitor(user.id, competitionId, prisma);
  } catch (err) {
    if (err instanceof EnrollmentServiceError) {
      return { success: false, error: err.message };
    }
    if (err instanceof AuthError) {
      return { success: false, error: "Faça login para se inscrever." };
    }
    return { success: false, error: "Erro ao realizar inscrição. Tente novamente." };
  }

  redirect(`/competicoes/${competitionId}`);
}
