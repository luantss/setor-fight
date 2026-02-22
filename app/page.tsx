import Link from "next/link";
import CategoryTableImage from "@/app/components/CategoryTableImage";

export const metadata = {
  title: "Jiu-Jitsu CBJJO 2026 | JJ",
  description:
    "Plataforma oficial de inscrições para competições de Jiu-Jitsu seguindo as regras CBJJO 2026. Categoria atribuída automaticamente.",
};

export default function HomePage() {
  return (
    <main className="bg-white text-black">
      {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
      <section className="bg-black text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Competições
            <br />
            <span className="text-red-500">Inscreva-se já</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto mb-8">
            Inscreva-se, confirme seu perfil e sua categoria será atribuída
            automaticamente com base nas regras oficiais da CBJJO.
          </p>
          <Link
            href="/competicoes"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm sm:text-base"
          >
            Ver Competições
          </Link>
        </div>
      </section>

      {/* ── Section 2: Tabela de Categorias ─────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-black mb-2 text-center">
            Tabela de Categorias CBJJO 2026
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Tabela oficial de categorias por idade, peso e faixa.
          </p>
          <div className="w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-80">
            <CategoryTableImage />
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            Tabela oficial de categorias por idade, peso e faixa.
          </p>
        </div>
      </section>

      {/* ── Section 3: Como Funciona ─────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-black text-center mb-10">
            Como Funciona
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <StepCard
              step="1"
              title="Crie sua conta"
              description="Registre-se com seus dados de atleta: nome, e-mail, faixa, peso e data de nascimento."
            />
            <StepCard
              step="2"
              title="Inscreva-se"
              description="Sua categoria será atribuída automaticamente de acordo com as regras CBJJO 2026."
            />
          </div>
        </div>
      </section>

      {/* ── Section 4: CTA Final ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Pronto para competir?
          </h2>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">
            Acesse as competições abertas e garanta sua vaga.
          </p>
          <Link
            href="/competicoes"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm sm:text-base"
          >
            Ver Competições Abertas
          </Link>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// StepCard
// ---------------------------------------------------------------------------

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
        {step}
      </div>
      <h3 className="font-bold text-black">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
