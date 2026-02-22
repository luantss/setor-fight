import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import ConfirmAndEnroll from "./ConfirmAndEnroll";
import type { AgeDivisionCode, Belt, Gender } from "@/app/generated/prisma/client";

// ---------------------------------------------------------------------------
// Label maps (PT-BR)
// ---------------------------------------------------------------------------

const beltLabel: Record<Belt, string> = {
  BRANCA: "Branca",
  AZUL: "Azul",
  ROXA: "Roxa",
  MARROM: "Marrom",
  PRETA: "Preta",
};

const genderLabel: Record<Gender, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  MISTO: "Misto",
};

const ageDivisionLabel: Record<AgeDivisionCode, string> = {
  PRE_MIRIM: "Pré-Mirim",
  MIRIM_1: "Mirim 1",
  MIRIM_2: "Mirim 2",
  INFANTIL_1: "Infantil 1",
  INFANTIL_2: "Infantil 2",
  INFANTO_JUVENIL_1: "Infanto-Juvenil 1",
  INFANTO_JUVENIL_2: "Infanto-Juvenil 2",
  INFANTO_JUVENIL_3: "Infanto-Juvenil 3",
  JUVENIL: "Juvenil",
  ADULTO: "Adulto",
  MASTER: "Master",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompetitionPage({ params }: PageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();

  const competition = await prisma.competition.findUnique({
    where: { id },
  });

  if (!competition) notFound();

  // Check if user is authenticated and already enrolled
  const user = await getUser();
  let profile: {
    id: string;
    name: string;
    birthDate: Date;
    gender: "MASCULINO" | "FEMININO";
    belt: Belt;
    weight: number;
  } | null = null;
  let registration: {
    category: {
      belt: Belt;
      gender: Gender;
      ageDivision: { code: AgeDivisionCode };
      weightClass: { name: string };
    };
  } | null = null;

  if (user) {
    const dbProfile = await prisma.competitorProfile.findUnique({
      where: { userId: user.id },
    });

    if (dbProfile) {
      profile = {
        id: dbProfile.id,
        name: dbProfile.name,
        birthDate: dbProfile.birthDate,
        gender: dbProfile.gender as "MASCULINO" | "FEMININO",
        belt: dbProfile.belt,
        weight: dbProfile.weight,
      };

      registration = await prisma.registration.findUnique({
        where: {
          competitionId_competitorId: {
            competitionId: id,
            competitorId: dbProfile.id,
          },
        },
        include: {
          category: {
            include: {
              ageDivision: true,
              weightClass: true,
            },
          },
        },
      });
    }
  }

  const isOpen = competition.status === "OPEN";

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <Link
          href="/competicoes"
          className="text-sm text-gray-500 hover:text-black transition-colors mb-6 inline-block"
        >
          ← Voltar para competições
        </Link>

        {/* Competition card */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${
                  isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {isOpen ? "Inscrições Abertas" : "Inscrições Encerradas"}
              </span>
              <h1 className="text-2xl font-bold text-black">{competition.name}</h1>
              <p className="text-gray-500 mt-1">{formatDate(competition.date)}</p>
              {competition.location && (
                <p className="text-gray-400 text-sm mt-0.5">{competition.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Enrollment section */}
        {registration ? (
          /* Already enrolled — show assigned category */
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-black mb-1">Inscrição Confirmada ✓</h2>
            <p className="text-sm text-gray-500 mb-6">
              Você está inscrito nesta competição. Sua categoria foi atribuída automaticamente.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <CategoryDetail label="Faixa" value={beltLabel[registration.category.belt]} />
              <CategoryDetail
                label="Divisão"
                value={ageDivisionLabel[registration.category.ageDivision.code]}
              />
              <CategoryDetail label="Peso" value={registration.category.weightClass.name} />
              <CategoryDetail label="Sexo" value={genderLabel[registration.category.gender]} />
            </div>
          </div>
        ) : session && profile ? (
          /* Authenticated with profile — show confirmation step */
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            {isOpen ? (
              <ConfirmAndEnroll competitionId={id} profile={profile} />
            ) : (
              <>
                <h2 className="text-lg font-bold text-black mb-1">Inscrição</h2>
                <p className="text-sm text-gray-500">
                  As inscrições para esta competição estão encerradas.
                </p>
              </>
            )}
          </div>
        ) : session && !profile ? (
          /* Authenticated but no profile */
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-black mb-1">Perfil incompleto</h2>
            <p className="text-sm text-gray-500 mb-4">
              Você precisa completar seu perfil antes de se inscrever.
            </p>
            <Link
              href="/competidor/perfil"
              className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-5 rounded-md transition-colors"
            >
              Completar Perfil
            </Link>
          </div>
        ) : (
          /* Not authenticated */
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            <h2 className="text-lg font-bold text-black mb-1">Inscrição</h2>
            <p className="text-sm text-gray-500 mb-4">
              Faça login para se inscrever nesta competição.
            </p>
            <Link
              href={`/login?redirectTo=/competicoes/${id}`}
              className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-6 rounded-md transition-colors"
            >
              Entrar / Criar Conta
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function CategoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-black">{value}</p>
    </div>
  );
}
