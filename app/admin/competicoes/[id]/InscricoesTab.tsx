"use client";

import { useState } from "react";
import type { AgeDivisionCode, Belt, Gender } from "@/app/generated/prisma/client";
import { beltLabel, genderLabel, ageDivisionLabel } from "@/lib/labels";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistrationRow {
  id: string;
  name: string;
  belt: Belt;
  ageDivisionCode: AgeDivisionCode;
  weight: number;
  gender: "MASCULINO" | "FEMININO";
  age: number;
}

export interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  registrations: RegistrationRow[];
}

interface InscricoesTabProps {
  competitionId: string;
  groups: CategoryGroup[];
  totalRegistrations: number;
}

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

function AccordionItem({ group }: { group: CategoryGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <span className="font-medium text-sm text-black">{group.categoryName}</span>
          <span className="ml-3 text-xs text-gray-400">
            {group.registrations.length} atleta{group.registrations.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 overflow-x-auto">
          {group.registrations.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">Nenhum atleta inscrito.</p>
          ) : (
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-500">#</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Nome</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Faixa</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Divisão</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Peso</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Sexo</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Idade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.registrations.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-black">{r.name}</td>
                    <td className="px-4 py-2 text-gray-600">{beltLabel[r.belt]}</td>
                    <td className="px-4 py-2 text-gray-600">{ageDivisionLabel[r.ageDivisionCode]}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{r.weight} kg</td>
                    <td className="px-4 py-2 text-gray-600">{genderLabel[r.gender as Gender]}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{r.age} anos</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export buttons
// ---------------------------------------------------------------------------

function ExportButtons({ competitionId }: { competitionId: string }) {
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);

  async function handleExport(type: "excel" | "pdf") {
    setLoading(type);
    try {
      const res = await fetch(`/api/admin/competicoes/${competitionId}/export/${type}`);
      if (!res.ok) throw new Error("Falha na exportação.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = type === "excel" ? "inscricoes.xlsx" : "inscricoes.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao exportar.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => handleExport("excel")}
        disabled={loading !== null}
        className="border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-black text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        {loading === "excel" ? "Exportando..." : "⬇ Exportar Excel"}
      </button>
      <button
        type="button"
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className="border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-black text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        {loading === "pdf" ? "Exportando..." : "⬇ Exportar PDF"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InscricoesTab({
  competitionId,
  groups,
  totalRegistrations,
}: InscricoesTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-black">
            Inscrições{" "}
            <span className="text-gray-400 font-normal text-sm">({totalRegistrations})</span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Agrupadas por categoria.
          </p>
        </div>
        <ExportButtons competitionId={competitionId} />
      </div>

      {/* Accordion */}
      {groups.length === 0 ? (
        <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p>Nenhum atleta inscrito ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <AccordionItem key={group.categoryId} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
