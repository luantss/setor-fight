import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCompetitorProfile } from "./actions";
import CompetitorProfileForm from "./CompetitorProfileForm";

export const metadata = {
  title: "Meu Perfil | JJ Platform",
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function PerfilPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/login?redirectTo=/competidor/perfil");
  }

  void user; // userId was only needed for the requireAuth check; getCompetitorProfile reads from session

  const profile = await getCompetitorProfile();

  const defaultValues = profile
    ? {
        name: profile.name,
        birthDate: formatDate(profile.birthDate),
        gender: profile.gender as "MASCULINO" | "FEMININO",
        belt: profile.belt as "BRANCA" | "AZUL" | "ROXA" | "MARROM" | "PRETA",
        weight: profile.weight.toString(),
      }
    : undefined;

  return (
    <main className="min-h-screen bg-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold text-black mb-1">Meu Perfil</h1>
          <p className="text-sm text-gray-500 mb-6">
            Mantenha seu perfil atualizado para garantir a inscrição correta nas categorias.
          </p>

          {!profile && (
            <div
              role="alert"
              className="mb-6 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded px-4 py-3"
            >
              ⚠️ Seu perfil está incompleto. Preencha os dados abaixo antes de se inscrever em uma competição.
            </div>
          )}

          <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
            <CompetitorProfileForm defaultValues={defaultValues} />
          </div>
        </div>
      </div>
    </main>
  );
}
