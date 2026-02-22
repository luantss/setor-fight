"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

export type ActionResult = { success: false; error: string } | { success: true };

const createCompetitionSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  status: z.enum(["OPEN", "CLOSED"] as const, { message: "Status inválido." }),
  location: z.string().optional(),
});

export async function createCompetitionAction(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createCompetitionSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    status: formData.get("status"),
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const prisma = getPrismaClient();
  const competition = await prisma.competition.create({
    data: {
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      status: parsed.data.status,
      location: parsed.data.location ?? "",
    },
  });

  redirect(`/admin/competicoes/${competition.id}`);
}
