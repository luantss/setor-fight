import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";
import CreateCompetitionForm from "./CreateCompetitionForm";

export const metadata = {
  title: "Painel Administrativo | JJ",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const prisma = getPrismaClient();
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { registrations: true } },
    },
  });

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-black">Painel Administrativo</h1>
          <CreateCompetitionForm />
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Gerencie Campeonatos, categorias e inscrições.
        </p>

        {competitions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Nenhuma competição cadastrada.</p>
            <p className="text-sm mt-2">Clique em "Criar Competição" para começar.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl shadow border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black text-white">
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium">Data</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Inscrições</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {competitions.map((comp) => (
                  <tr key={comp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-black">{comp.name}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(comp.date)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                          comp.status === "OPEN"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {comp.status === "OPEN" ? "Aberta" : "Encerrada"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {comp._count.registrations}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/competicoes/${comp.id}`}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Gerenciar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
