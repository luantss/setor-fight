"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveCompetitorProfile } from "./actions";

// ---------------------------------------------------------------------------
// Form-level schema (weight kept as string — coerced before server call)
// ---------------------------------------------------------------------------

const formSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter ao menos 3 caracteres."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida. Use AAAA-MM-DD."),
  gender: z.enum(["MASCULINO", "FEMININO"] as const, {
    message: "Selecione um sexo.",
  }),
  belt: z.enum(["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"] as const, {
    message: "Selecione uma faixa.",
  }),
  weight: z
    .string()
    .min(1, "Informe o peso.")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 10, "Peso mínimo: 10 kg.")
    .refine((v) => parseFloat(v) <= 300, "Peso máximo: 300 kg."),
});

type FormValues = z.infer<typeof formSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CompetitorProfileFormProps {
  defaultValues?: Partial<FormValues>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompetitorProfileForm({
  defaultValues,
}: CompetitorProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      gender: undefined,
      belt: undefined,
      weight: "",
      ...defaultValues,
    },
  });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await saveCompetitorProfile({
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        belt: data.belt,
        weight: parseFloat(data.weight),
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome completo
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome completo"
          {...register("name")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Data de nascimento */}
      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
          Data de nascimento
        </label>
        <input
          id="birthDate"
          type="date"
          {...register("birthDate")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {errors.birthDate && (
          <p className="mt-1 text-xs text-red-600">{errors.birthDate.message}</p>
        )}
      </div>

      {/* Sexo */}
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
          Sexo
        </label>
        <select
          id="gender"
          {...register("gender")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Selecione...</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMININO">Feminino</option>
        </select>
        {errors.gender && (
          <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
        )}
      </div>

      {/* Faixa */}
      <div>
        <label htmlFor="belt" className="block text-sm font-medium text-gray-700 mb-1">
          Faixa
        </label>
        <select
          id="belt"
          {...register("belt")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
        >
          <option value="">Selecione...</option>
          <option value="BRANCA">Branca</option>
          <option value="AZUL">Azul</option>
          <option value="ROXA">Roxa</option>
          <option value="MARROM">Marrom</option>
          <option value="PRETA">Preta</option>
        </select>
        {errors.belt && (
          <p className="mt-1 text-xs text-red-600">{errors.belt.message}</p>
        )}
      </div>

      {/* Peso */}
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
          Peso atual (kg)
        </label>
        <input
          id="weight"
          type="number"
          step="0.1"
          min="10"
          max="300"
          placeholder="Ex: 72.5"
          {...register("weight")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {errors.weight && (
          <p className="mt-1 text-xs text-red-600">{errors.weight.message}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <p
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
        >
          {serverError}
        </p>
      )}

      {/* Success */}
      {success && (
        <p
          role="status"
          className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2"
        >
          Perfil salvo com sucesso!
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors"
      >
        {isPending ? "Salvando..." : "Salvar Perfil"}
      </button>
    </form>
  );
}
