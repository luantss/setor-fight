import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import { buildCategoryName, calculateAge } from "@/lib/labels";
import TabNav from "./TabNav";
import InscricoesTab, { type CategoryGroup, type RegistrationRow } from "./InscricoesTab";
import type { Belt, Gender } from "@/app/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Info tab (pure server render)
// ---------------------------------------------------------------------------

function InfoTab({
  competition,
}: {
  competition: {
    id: string;
    name: string;
    date: Date;
    location: string;
    status: "OPEN" | "CLOSED";
    createdAt: Date;
  };
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-base font-bold text-black">Informações da Competição</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow label="Nome" value={competition.name} />
        <InfoRow label="Data" value={formatDate(competition.date)} />
        <InfoRow
          label="Status"
          value={competition.status === "OPEN" ? "Inscrições Abertas" : "Inscrições Encerradas"}
        />
        {competition.location && (
          <InfoRow label="Local" value={competition.location} />
        )}
        <InfoRow
          label="Criada em"
          value={competition.createdAt.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-black">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminCompetitionPage({
  params,
  searchParams,
}: PageProps) {
  try {
    await requireAdmin();
  } catch {
    redirect("/competicoes");
  }

  const { id } = await params;
  const { tab = "info" } = await searchParams;

  const prisma = getPrismaClient();

  const competition = await prisma.competition.findUnique({ where: { id } });
  if (!competition) notFound();

  // ── Inscrições tab data ─────────────────────────────────────────────────
  let categoryGroups: CategoryGroup[] = [];
  let totalRegistrations = 0;

  if (tab === "inscricoes") {
    const registrations = await prisma.registration.findMany({
      where: { competitionId: id },
      include: {
        category: { include: { ageDivision: true, weightClass: true } },
        competitor: true,
      },
      orderBy: { competitor: { name: "asc" } },
    });

    totalRegistrations = registrations.length;

    const groupMap = new Map<string, CategoryGroup>();
    for (const reg of registrations) {
      const key = reg.categoryId;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          categoryId: key,
          categoryName: buildCategoryName(
            reg.category.belt,
            reg.category.gender,
            reg.category.ageDivision.code,
            reg.category.weightClass.name,
          ),
          registrations: [],
        });
      }

      const row: RegistrationRow = {
        id: reg.id,
        name: reg.competitor.name,
        belt: reg.competitor.belt,
        ageDivisionCode: reg.category.ageDivision.code,
        weightClassName: reg.category.weightClass.name,
        weight: reg.competitor.weight,
        gender: reg.competitor.gender as "MASCULINO" | "FEMININO",
        age: calculateAge(reg.competitor.birthDate, competition.date),
      };

      groupMap.get(key)!.registrations.push(row);
    }

    categoryGroups = Array.from(groupMap.values());
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-black transition-colors mb-6 inline-block"
        >
          ← Painel Administrativo
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-black">{competition.name}</h1>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                competition.status === "OPEN"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {competition.status === "OPEN" ? "Aberta" : "Encerrada"}
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(competition.date)}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <Suspense>
            <TabNav />
          </Suspense>

          {tab === "info" && (
            <InfoTab competition={competition} />
          )}

          {tab === "inscricoes" && (
            <InscricoesTab
              competitionId={id}
              groups={categoryGroups}
              totalRegistrations={totalRegistrations}
            />
          )}

          {tab !== "info" && tab !== "inscricoes" && (
            <InfoTab competition={competition} />
          )}
        </div>
      </div>
    </main>
  );
}
