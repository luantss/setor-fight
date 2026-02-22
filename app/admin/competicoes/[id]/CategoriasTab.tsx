"use client";

import { useState, useTransition } from "react";
import { generateCategoriesAction, type GenerateResult } from "./actions";
import type { AgeDivisionCode } from "@/app/generated/prisma/client";
import { ageDivisionLabel } from "@/lib/labels";

export interface DivisionBreakdown {
  code: AgeDivisionCode;
  count: number;
}

interface CategoriasTabProps {
  competitionId: string;
  totalCategories: number;
  breakdowns: DivisionBreakdown[];
}

export default function CategoriasTab({
  competitionId,
  totalCategories,
  breakdowns,
}: CategoriasTabProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateResult | null>(null);

  function handleGenerate() {
    setResult(null);
    startTransition(async () => {
      const r = await generateCategoriesAction(competitionId);
      setResult(r);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-black">Categorias CBJJO 2026</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Geração idempotente — pode ser executada múltiplas vezes com segurança.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-5 rounded-md transition-colors"
        >
          {isPending ? "Gerando..." : "Gerar Categorias CBJJO 2026"}
        </button>
      </div>

      {/* Feedback */}
      {result && (
        result.success ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-4 py-3">
            ✓ Categorias geradas com sucesso —{" "}
            <strong>{result.created}</strong> criadas,{" "}
            <strong>{result.skipped}</strong> já existiam.
          </div>
        ) : (
          <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-3">
            {result.error}
          </div>
        )
      )}

      {/* Stats */}
      {totalCategories > 0 ? (
        <>
          <div className="bg-black text-white rounded-xl p-6 inline-block">
            <p className="text-3xl font-bold">{totalCategories}</p>
            <p className="text-sm text-gray-300 mt-1">Total de categorias geradas</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Divisão de Idade</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Categorias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakdowns.map((b) => (
                  <tr key={b.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-black">{ageDivisionLabel[b.code]}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p>Nenhuma categoria gerada ainda.</p>
          <p className="text-sm mt-1">Clique em "Gerar Categorias CBJJO 2026" para criar todas as categorias.</p>
        </div>
      )}
    </div>
  );
}
