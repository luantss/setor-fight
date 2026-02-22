import { z } from "zod";

export const competitorProfileSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres.")
    .max(100, "Nome deve ter no máximo 100 caracteres.")
    .trim(),

  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use o formato AAAA-MM-DD."),

  gender: z.enum(["MASCULINO", "FEMININO"] as const, {
    message: "Gênero inválido.",
  }),

  belt: z.enum(["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"] as const, {
    message: "Faixa inválida.",
  }),

  weight: z.coerce
    .number()
    .min(10, "Peso deve ser maior que 10 kg.")
    .max(300, "Peso deve ser menor que 300 kg."),
});

export type CompetitorProfileInput = z.infer<typeof competitorProfileSchema>;
