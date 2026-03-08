/**
 * Simulation script — 1 campeonato de teste + 100 inscritos.
 *
 * Requer que o seed já tenha sido rodado (age divisions + weight classes).
 *
 * Usage:
 *   pnpm simulate
 *
 * O script é idempotente: re-executar apenas pula inscrições duplicadas.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { enrollCompetitor, EnrollmentServiceError } from "../services/enrollmentService";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Campeonato de teste
// ---------------------------------------------------------------------------

const COMPETITION = {
  name:     "Campeonato de Teste - Simulação",
  date:     new Date("2026-09-13"),   // futuro, para garantir status OPEN
  location: "Ginásio Municipal",
};

// ---------------------------------------------------------------------------
// Pools de nomes
// ---------------------------------------------------------------------------

const NOMES_M = ["Lucas","Pedro","Matheus","João","Gabriel","Rafael","Felipe","Bruno","Diego","André","Carlos","Henrique","Gustavo","Rodrigo","Thiago","Leonardo","Eduardo","Vinicius","Alexandre","Daniel","Enzo","Miguel","Arthur","Luan","Igor"];
const NOMES_F = ["Ana","Julia","Beatriz","Fernanda","Larissa","Camila","Mariana","Leticia","Patricia","Aline","Sabrina","Renata","Amanda","Vanessa","Gabriela","Melissa","Carolina","Natalia","Vitoria","Isabela","Sofia","Luiza","Clara","Helena","Alice"];
const SOBRENOMES = ["Silva","Souza","Costa","Ferreira","Oliveira","Lima","Pereira","Santos","Alves","Rodrigues","Nascimento","Barbosa","Moreira","Carvalho","Gomes","Martins","Araujo","Melo","Cruz","Dias"];

type Gender = "MASCULINO" | "FEMININO";
type Belt   = "BRANCA" | "AZUL" | "ROXA" | "MARROM" | "PRETA";

function nome(gender: Gender, idx: number): string {
  const pool  = gender === "MASCULINO" ? NOMES_M : NOMES_F;
  return `${pool[idx % pool.length]} ${SOBRENOMES[idx % SOBRENOMES.length]}`;
}

// ---------------------------------------------------------------------------
// Data de nascimento: gera birthDate tal que a idade na competição (2026-09-13)
// seja exatamente `age` anos. O parâmetro `offset` espalha os aniversários.
// ---------------------------------------------------------------------------

const COMP_DATE = new Date("2026-09-13");

function birthDate(age: number, offset: number): Date {
  const d = new Date(COMP_DATE);
  d.setUTCFullYear(d.getUTCFullYear() - age);
  // recua alguns dias para garantir que o aniversário já passou
  d.setUTCDate(d.getUTCDate() - 1 - (offset % 150));
  return d;
}

function lerp(min: number, max: number, t: number): number {
  return +(min + (max - min) * t).toFixed(1);
}

// ---------------------------------------------------------------------------
// Definição dos buckets
// Cada bucket descreve um grupo de competidores com características similares.
// Total: 4+3+4+3+4+3+4+3+3+2+5+4+5+4+15+10+15+9 = 100
// ---------------------------------------------------------------------------

interface Bucket {
  count:     number;
  gender:    Gender;
  ageMin:    number;
  ageMax:    number;
  weightMin: number;
  weightMax: number;
  belts:     Belt[];
}

const BUCKETS: Bucket[] = [
  // PRE_MIRIM (4–5 anos)
  { count: 4,  gender: "MASCULINO", ageMin: 4,  ageMax: 5,  weightMin: 12,  weightMax: 25,   belts: ["BRANCA"] },
  { count: 3,  gender: "FEMININO",  ageMin: 4,  ageMax: 5,  weightMin: 12,  weightMax: 22,   belts: ["BRANCA"] },

  // MIRIM_1 (6–7 anos)
  { count: 4,  gender: "MASCULINO", ageMin: 6,  ageMax: 7,  weightMin: 17,  weightMax: 38,   belts: ["BRANCA"] },
  { count: 3,  gender: "FEMININO",  ageMin: 6,  ageMax: 7,  weightMin: 16,  weightMax: 32,   belts: ["BRANCA"] },

  // MIRIM_2 (8–9 anos)
  { count: 4,  gender: "MASCULINO", ageMin: 8,  ageMax: 9,  weightMin: 22,  weightMax: 44,   belts: ["BRANCA", "AZUL"] },
  { count: 3,  gender: "FEMININO",  ageMin: 8,  ageMax: 9,  weightMin: 20,  weightMax: 40,   belts: ["BRANCA"] },

  // INFANTIL_1 (10–11 anos)
  { count: 4,  gender: "MASCULINO", ageMin: 10, ageMax: 11, weightMin: 26,  weightMax: 52,   belts: ["BRANCA", "AZUL"] },
  { count: 3,  gender: "FEMININO",  ageMin: 10, ageMax: 11, weightMin: 24,  weightMax: 46,   belts: ["BRANCA", "AZUL"] },

  // INFANTIL_2 (12 anos)
  { count: 3,  gender: "MASCULINO", ageMin: 12, ageMax: 12, weightMin: 30,  weightMax: 58,   belts: ["BRANCA", "AZUL"] },
  { count: 2,  gender: "FEMININO",  ageMin: 12, ageMax: 12, weightMin: 28,  weightMax: 50,   belts: ["BRANCA", "AZUL"] },

  // INFANTO_JUVENIL 1/2/3 (13–15 anos)
  { count: 5,  gender: "MASCULINO", ageMin: 13, ageMax: 15, weightMin: 35,  weightMax: 72,   belts: ["BRANCA", "AZUL", "ROXA"] },
  { count: 4,  gender: "FEMININO",  ageMin: 13, ageMax: 15, weightMin: 30,  weightMax: 62,   belts: ["BRANCA", "AZUL"] },

  // JUVENIL (16–17 anos)
  { count: 5,  gender: "MASCULINO", ageMin: 16, ageMax: 17, weightMin: 48,  weightMax: 90,   belts: ["BRANCA", "AZUL", "ROXA"] },
  { count: 4,  gender: "FEMININO",  ageMin: 16, ageMax: 17, weightMin: 40,  weightMax: 73,   belts: ["BRANCA", "AZUL", "ROXA"] },

  // ADULTO MASCULINO (18–29 anos)
  { count: 15, gender: "MASCULINO", ageMin: 18, ageMax: 29, weightMin: 55,  weightMax: 102,  belts: ["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"] },

  // ADULTO FEMININO (18–29 anos)
  { count: 10, gender: "FEMININO",  ageMin: 18, ageMax: 29, weightMin: 46,  weightMax: 86,   belts: ["BRANCA", "AZUL", "ROXA", "MARROM"] },

  // MASTER MASCULINO (30+ anos)
  { count: 15, gender: "MASCULINO", ageMin: 30, ageMax: 55, weightMin: 57,  weightMax: 100,  belts: ["AZUL", "ROXA", "MARROM", "PRETA"] },

  // MASTER FEMININO (30+ anos)
  { count: 9,  gender: "FEMININO",  ageMin: 30, ageMax: 55, weightMin: 48,  weightMax: 85,   belts: ["AZUL", "ROXA", "MARROM"] },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const total = BUCKETS.reduce((s, b) => s + b.count, 0);
  console.log(`\n🥋  Setor Fight — Simulação (${total} competidores)\n`);

  // 1) Upsert campeonato ----------------------------------------------------
  console.log("  ↳ Criando campeonato de teste...");
  let competition = await prisma.competition.findFirst({
    where: { name: COMPETITION.name },
  });

  if (!competition) {
    competition = await prisma.competition.create({
      data: { ...COMPETITION, status: "OPEN" },
    });
    console.log(`  ✔ Campeonato criado: "${competition.name}"`);
  } else {
    competition = await prisma.competition.update({
      where: { id: competition.id },
      data:  { status: "OPEN" },
    });
    console.log(`  ✔ Campeonato já existia, reutilizando: "${competition.name}"`);
  }
  console.log(`     ID: ${competition.id}\n`);

  // 2) Criar perfis e inscrever ----------------------------------------------
  const stats: Record<string, number> = {};
  let enrolled = 0;
  let skipped  = 0;
  let failed   = 0;
  let seq      = 0;

  for (const bucket of BUCKETS) {
    for (let i = 0; i < bucket.count; i++) {
      seq++;

      const age    = Math.round(bucket.ageMin + (bucket.ageMax - bucket.ageMin) * (i / Math.max(bucket.count - 1, 1)));
      const weight = lerp(bucket.weightMin, bucket.weightMax, i / Math.max(bucket.count - 1, 1));
      const belt   = bucket.belts[i % bucket.belts.length]!;
      const email  = `simulado.${seq}@setor-fight.test`;
      const name   = nome(bucket.gender, seq);

      // Upsert user
      const user = await prisma.user.upsert({
        where:  { email },
        update: {},
        create: { email, role: "COMPETITOR" },
      });

      // Upsert perfil
      await prisma.competitorProfile.upsert({
        where:  { userId: user.id },
        update: { name, weight, belt, birthDate: birthDate(age, i), gender: bucket.gender },
        create: { userId: user.id, name, weight, belt, birthDate: birthDate(age, i), gender: bucket.gender },
      });

      // Inscrever
      try {
        const result = await enrollCompetitor(user.id, competition.id, prisma);
        const key = [
          result.category.ageDivisionCode,
          result.category.gender,
          result.category.weightClassName,
          result.category.belt,
        ].join(" | ");
        stats[key] = (stats[key] ?? 0) + 1;
        enrolled++;
      } catch (err) {
        if (err instanceof EnrollmentServiceError && err.code === "DUPLICATE_ENROLLMENT") {
          skipped++;
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`  ⚠  [${seq}] ${name} — idade ${age}, ${weight}kg, ${bucket.gender}: ${msg}`);
          failed++;
        }
      }
    }
  }

  // 3) Resumo ---------------------------------------------------------------
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Distribuição por categoria (divisão | gênero | peso | faixa)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const [cat, n] of Object.entries(stats).sort()) {
    console.log(`  ${String(n).padStart(3)}×  ${cat}`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ✅  Inscritos:  ${enrolled}`);
  if (skipped) console.log(`  ⏭   Já inscritos (pulados): ${skipped}`);
  if (failed)  console.log(`  ❌  Falhas:    ${failed}`);
  console.log(`  🏆  Campeonato ID: ${competition.id}\n`);
}

main()
  .catch((err: unknown) => {
    console.error("❌ Simulação falhou:", err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
