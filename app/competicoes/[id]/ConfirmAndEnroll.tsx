"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { enrollAction, type EnrollActionResult } from "./actions";
import type { Belt, Gender } from "@/app/generated/prisma/client";

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const beltLabel: Record<Belt, string> = {
  BRANCA: "Branca",
  AZUL: "Azul",
  ROXA: "Roxa",
  MARROM: "Marrom",
  PRETA: "Preta",
};

const genderLabel: Record<"MASCULINO" | "FEMININO", string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
};

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-6 rounded-md transition-colors"
    >
      {pending ? "Inscrevendo..." : "Confirmar e Inscrever"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileSnapshot {
  name: string;
  birthDate: Date;
  gender: "MASCULINO" | "FEMININO";
  belt: Belt;
  weight: number;
}

interface ConfirmAndEnrollProps {
  competitionId: string;
  profile: ProfileSnapshot;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConfirmAndEnroll({
  competitionId,
  profile,
}: ConfirmAndEnrollProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action] = useActionState<EnrollActionResult | null, FormData>(
    enrollAction,
    null,
  );

  const formattedBirthDate = profile.birthDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!confirmed) {
    return (
      <div>
        <h2 className="text-lg font-bold text-black mb-1">
          Confirme seus dados antes de se inscrever
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Verifique se as informações abaixo estão corretas. Elas serão usadas para atribuir sua categoria.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <ProfileRow label="Nome" value={profile.name} />
          <ProfileRow label="Data de Nascimento" value={formattedBirthDate} />
          <ProfileRow label="Sexo" value={genderLabel[profile.gender]} />
          <ProfileRow label="Faixa" value={beltLabel[profile.belt]} />
          <ProfileRow label="Peso Atual" value={`${profile.weight} kg`} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/competidor/perfil"
            className="inline-block text-sm font-medium text-gray-700 border border-gray-300 hover:border-gray-400 py-2.5 px-5 rounded-md transition-colors"
          >
            Editar Perfil
          </Link>
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-6 rounded-md transition-colors"
          >
            Dados corretos — Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-black mb-1">Inscrição</h2>
      <p className="text-sm text-gray-500 mb-6">
        Ao confirmar, sua categoria será atribuída automaticamente com base no seu perfil.
      </p>

      {state && !state.success && (
        <p
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4"
        >
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
        >
          ← Voltar
        </button>
        <form action={action}>
          <input type="hidden" name="competitionId" value={competitionId} />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-black">{value}</p>
    </div>
  );
}
