"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPrismaClient } from "@/lib/prisma";
import { z } from "zod";

export type ActionResult = { success: false; error: string } | { success: true };

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

const cadastroSchema = z
  .object({
    // Auth
    email: z.string().email("E-mail inválido."),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
    confirmPassword: z.string(),
    // Profile
    name: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida."),
    gender: z.enum(["MASCULINO", "FEMININO"] as const, {
      message: "Selecione um sexo.",
    }),
    belt: z.enum(["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"] as const, {
      message: "Selecione uma faixa.",
    }),
    weight: z.coerce
      .number()
      .min(10, "Peso mínimo: 10 kg.")
      .max(300, "Peso máximo: 300 kg."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function loginAction(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        error: "Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
      };
    }
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Cadastro
// ---------------------------------------------------------------------------

export async function cadastroAction(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = cadastroSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name"),
    birthDate: formData.get("birthDate"),
    gender: formData.get("gender"),
    belt: formData.get("belt"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { success: false, error: "Este e-mail já está cadastrado." };
    }
    return { success: false, error: "Erro ao criar conta. Tente novamente." };
  }

  if (data.user) {
    const prisma = getPrismaClient();
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { id: data.user!.id },
        update: {},
        create: { id: data.user!.id, email: parsed.data.email, role: "COMPETITOR" },
      });

      await tx.competitorProfile.upsert({
        where: { userId: user.id },
        update: {
          name: parsed.data.name,
          birthDate: new Date(parsed.data.birthDate),
          gender: parsed.data.gender,
          belt: parsed.data.belt,
          weight: parsed.data.weight,
        },
        create: {
          userId: user.id,
          name: parsed.data.name,
          birthDate: new Date(parsed.data.birthDate),
          gender: parsed.data.gender,
          belt: parsed.data.belt,
          weight: parsed.data.weight,
        },
      });
    });

    // Auto-login after registration
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        // Supabase requires email confirmation — account created but not yet active
        return {
          success: false,
          error:
            "Conta criada! Confirme seu e-mail para ativar o acesso. Verifique sua caixa de entrada.",
        };
      }
      // Unexpected error — still redirect, user can log in manually
    }
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
