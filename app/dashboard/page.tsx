import Link from "next/link";
import { getPrismaClient } from "@/lib/prisma";

export const metadata = {
  title: "Competições | JJ Platform",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DashboardPage() {
  const prisma = getPrismaClient();
  const competitions = await prisma.competition.findMany({
    where: { status: "OPEN" },
    orderBy: { date: "asc" },
  });

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-black mb-1">Competições Abertas</h1>
        <p className="text-sm text-gray-500 mb-8">
          Inscreva-se nas competições disponíveis abaixo.
        </p>

        {competitions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma competição aberta no momento.</p>
            <p className="text-sm mt-2">Volte em breve para novas competições.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-xl shadow border border-gray-200 p-6 flex flex-col gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Aberta
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-black leading-tight">{comp.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(comp.date)}</p>
                  {comp.location && (
                    <p className="text-sm text-gray-400 mt-0.5">{comp.location}</p>
                  )}
                </div>

                <Link
                  href={`/competicoes/${comp.id}`}
                  className="mt-auto inline-block text-center bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Ver Detalhes
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
