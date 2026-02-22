import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { AgeDivisionCode, Gender, PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Age Divisions
// ---------------------------------------------------------------------------

const AGE_DIVISIONS: { code: AgeDivisionCode; minAge: number; maxAge: number }[] = [
  { code: "PRE_MIRIM",         minAge: 4,  maxAge: 5  }, // 4/5 anos
  { code: "MIRIM_1",           minAge: 6,  maxAge: 7  }, // 6/7 anos
  { code: "MIRIM_2",           minAge: 8,  maxAge: 9  }, // 8/9 anos
  { code: "INFANTIL_1",        minAge: 10, maxAge: 11 }, // 10/11 anos
  { code: "INFANTIL_2",        minAge: 12, maxAge: 12 }, // 12 anos
  { code: "INFANTO_JUVENIL_1", minAge: 13, maxAge: 13 }, // 13 anos
  { code: "INFANTO_JUVENIL_2", minAge: 14, maxAge: 14 }, // 14 anos
  { code: "INFANTO_JUVENIL_3", minAge: 15, maxAge: 15 }, // 15 anos
  { code: "JUVENIL",           minAge: 16, maxAge: 17 }, // 16 e 17 anos
  { code: "ADULTO",            minAge: 18, maxAge: 29 }, // +18 anos
  { code: "MASTER",            minAge: 30, maxAge: 120 },// +18 anos Masters
];

// ---------------------------------------------------------------------------
// Weight classes per division (from official CBJJO 2026 table)
// maxWeight: 9999 = open-ended (Pesadíssimo / Absoluto)
// ---------------------------------------------------------------------------

type WeightClassDef = { name: string; minWeight: number; maxWeight: number | 9999 };

const WEIGHT_CLASSES: Record<AgeDivisionCode, WeightClassDef[]> = {
  PRE_MIRIM: [
    { name: "Galo",        minWeight: 0,    maxWeight: 14.700 },
    { name: "Pluma",       minWeight: 14.7, maxWeight: 17.900 },
    { name: "Pena",        minWeight: 17.9, maxWeight: 20     },
    { name: "Leve",        minWeight: 20,   maxWeight: 24     },
    { name: "Médio",       minWeight: 24,   maxWeight: 26     },
    { name: "Meio-Pesado", minWeight: 26,   maxWeight: 29     },
    { name: "Pesado",      minWeight: 29,   maxWeight: 32     },
    { name: "Super-Pesado",minWeight: 32,   maxWeight: 35     },
    { name: "Pesadíssimo", minWeight: 35,   maxWeight: 9999   },
  ],
  MIRIM_1: [
    { name: "Galo",        minWeight: 0,    maxWeight: 18.900 },
    { name: "Pluma",       minWeight: 18.9, maxWeight: 21     },
    { name: "Pena",        minWeight: 21,   maxWeight: 24     },
    { name: "Leve",        minWeight: 24,   maxWeight: 27     },
    { name: "Médio",       minWeight: 27,   maxWeight: 30.200 },
    { name: "Meio-Pesado", minWeight: 30.2, maxWeight: 33.200 },
    { name: "Pesado",      minWeight: 33.2, maxWeight: 36.200 },
    { name: "Super-Pesado",minWeight: 36.2, maxWeight: 39.300 },
    { name: "Pesadíssimo", minWeight: 39.3, maxWeight: 9999   },
  ],
  MIRIM_2: [
    { name: "Galo",        minWeight: 0,    maxWeight: 24     },
    { name: "Pluma",       minWeight: 24,   maxWeight: 27     },
    { name: "Pena",        minWeight: 27,   maxWeight: 30.200 },
    { name: "Leve",        minWeight: 30.2, maxWeight: 33.200 },
    { name: "Médio",       minWeight: 33.2, maxWeight: 36.200 },
    { name: "Meio-Pesado", minWeight: 36.2, maxWeight: 39.300 },
    { name: "Pesado",      minWeight: 39.3, maxWeight: 42.300 },
    { name: "Super-Pesado",minWeight: 42.3, maxWeight: 45.300 },
    { name: "Pesadíssimo", minWeight: 45.3, maxWeight: 9999   },
  ],
  INFANTIL_1: [
    { name: "Ligeiro",     minWeight: 0,    maxWeight: 27     },
    { name: "Galo",        minWeight: 27,   maxWeight: 30.200 },
    { name: "Pluma",       minWeight: 30.2, maxWeight: 33.200 },
    { name: "Pena",        minWeight: 33.2, maxWeight: 36.200 },
    { name: "Leve",        minWeight: 36.2, maxWeight: 39.300 },
    { name: "Médio",       minWeight: 39.3, maxWeight: 42.300 },
    { name: "Meio-Pesado", minWeight: 42.3, maxWeight: 45.300 },
    { name: "Pesado",      minWeight: 45.3, maxWeight: 48.300 },
    { name: "Super-Pesado",minWeight: 48.3, maxWeight: 51.500 },
    { name: "Pesadíssimo", minWeight: 51.5, maxWeight: 9999   },
  ],
  INFANTIL_2: [
    { name: "Galo",        minWeight: 0,    maxWeight: 32.200 },
    { name: "Pluma",       minWeight: 32.2, maxWeight: 36.200 },
    { name: "Pena",        minWeight: 36.2, maxWeight: 39.300 },
    { name: "Leve",        minWeight: 39.3, maxWeight: 42.300 },
    { name: "Médio",       minWeight: 42.3, maxWeight: 45     },
    { name: "Meio-Pesado", minWeight: 45,   maxWeight: 48.300 },
    { name: "Pesado",      minWeight: 48.3, maxWeight: 52.500 },
    { name: "Super-Pesado",minWeight: 52.5, maxWeight: 56.500 },
    { name: "Pesadíssimo", minWeight: 56.5, maxWeight: 9999   },
  ],
  INFANTO_JUVENIL_1: [
    { name: "Galo",        minWeight: 0,    maxWeight: 36.200 },
    { name: "Pluma",       minWeight: 36.2, maxWeight: 40.300 },
    { name: "Pena",        minWeight: 40.3, maxWeight: 44.300 },
    { name: "Leve",        minWeight: 44.3, maxWeight: 48.300 },
    { name: "Médio",       minWeight: 48.3, maxWeight: 52.500 },
    { name: "Meio-Pesado", minWeight: 52.5, maxWeight: 56.500 },
    { name: "Pesado",      minWeight: 56.5, maxWeight: 60.500 },
    { name: "Super-Pesado",minWeight: 60.5, maxWeight: 65     },
    { name: "Pesadíssimo", minWeight: 65,   maxWeight: 9999   },
  ],
  INFANTO_JUVENIL_2: [
    { name: "Galo",        minWeight: 0,    maxWeight: 40.300 },
    { name: "Pluma",       minWeight: 40.3, maxWeight: 44.300 },
    { name: "Pena",        minWeight: 44.3, maxWeight: 48.300 },
    { name: "Leve",        minWeight: 48.3, maxWeight: 52.500 },
    { name: "Médio",       minWeight: 52.5, maxWeight: 56.500 },
    { name: "Meio-Pesado", minWeight: 56.5, maxWeight: 60.500 },
    { name: "Pesado",      minWeight: 60.5, maxWeight: 65     },
    { name: "Super-Pesado",minWeight: 65,   maxWeight: 69     },
    { name: "Pesadíssimo", minWeight: 69,   maxWeight: 9999   },
  ],
  INFANTO_JUVENIL_3: [
    { name: "Galo",        minWeight: 0,    maxWeight: 44.300 },
    { name: "Pluma",       minWeight: 44.3, maxWeight: 48.300 },
    { name: "Pena",        minWeight: 48.3, maxWeight: 52.500 },
    { name: "Leve",        minWeight: 52.5, maxWeight: 56.500 },
    { name: "Médio",       minWeight: 56.5, maxWeight: 60.500 },
    { name: "Meio-Pesado", minWeight: 60.5, maxWeight: 65     },
    { name: "Pesado",      minWeight: 65,   maxWeight: 69     },
    { name: "Super-Pesado",minWeight: 69,   maxWeight: 73     },
    { name: "Pesadíssimo", minWeight: 73,   maxWeight: 9999   },
  ],
  // JUVENIL — split by gender
  JUVENIL: [
    // Feminino
    { name: "Galo",        minWeight: 0,    maxWeight: 44.300 },
    { name: "Pluma",       minWeight: 44.3, maxWeight: 48.300 },
    { name: "Pena",        minWeight: 48.3, maxWeight: 52.500 },
    { name: "Leve",        minWeight: 52.5, maxWeight: 56.500 },
    { name: "Médio",       minWeight: 56.5, maxWeight: 60.500 },
    { name: "Meio-Pesado", minWeight: 60.5, maxWeight: 65     },
    { name: "Pesado",      minWeight: 65,   maxWeight: 69     },
    { name: "Super-Pesado",minWeight: 69,   maxWeight: 73     },
    { name: "Pesadíssimo", minWeight: 73,   maxWeight: 9999   },
    { name: "Absoluto",    minWeight: 0,    maxWeight: 60.500 },
  ],
  // ADULTO — split by gender (same defs, applied to both in loop)
  ADULTO: [
    // Masculino
    { name: "Ligeiro",     minWeight: 0,    maxWeight: 48.500 },
    { name: "Galo",        minWeight: 48.5, maxWeight: 53.500 },
    { name: "Pluma",       minWeight: 53.5, maxWeight: 58.500 },
    { name: "Pena",        minWeight: 58.5, maxWeight: 64     },
    { name: "Leve",        minWeight: 64,   maxWeight: 69     },
    { name: "Médio",       minWeight: 69,   maxWeight: 74     },
    { name: "Meio-Pesado", minWeight: 74,   maxWeight: 79.300 },
    { name: "Pesado",      minWeight: 79.3, maxWeight: 84.300 },
    { name: "Super-Pesado",minWeight: 84.3, maxWeight: 89.300 },
    { name: "Pesadíssimo", minWeight: 89.3, maxWeight: 9999   },
    { name: "Absoluto",    minWeight: 0,    maxWeight: 9999   },
  ],
  MASTER: [
    // Feminino
    { name: "Galo",        minWeight: 0,    maxWeight: 48.500 },
    { name: "Pluma",       minWeight: 48.5, maxWeight: 53.500 },
    { name: "Pena",        minWeight: 53.5, maxWeight: 58.500 },
    { name: "Leve",        minWeight: 58.5, maxWeight: 64     },
    { name: "Médio",       minWeight: 64,   maxWeight: 69     },
    { name: "Meio-Pesado", minWeight: 69,   maxWeight: 74     },
    { name: "Pesado",      minWeight: 74,   maxWeight: 79.300 },
    { name: "Super-Pesado",minWeight: 79.3, maxWeight: 84.300 },
    { name: "Pesadíssimo", minWeight: 84.3, maxWeight: 9999   },
    { name: "Absoluto",    minWeight: 0,    maxWeight: 9999   },
  ],
};

// Divisions below JUVENIL are MISTO; JUVENIL+ are split MASCULINO/FEMININO
const MISTO_DIVISIONS: AgeDivisionCode[] = [
  "PRE_MIRIM",
  "MIRIM_1",
  "MIRIM_2",
  "INFANTIL_1",
  "INFANTIL_2",
  "INFANTO_JUVENIL_1",
  "INFANTO_JUVENIL_2",
  "INFANTO_JUVENIL_3",
];

// JUVENIL Feminino has different weight ranges than Masculino
const JUVENIL_FEMININO: WeightClassDef[] = [
  { name: "Galo",        minWeight: 0,    maxWeight: 44.300 },
  { name: "Pluma",       minWeight: 44.3, maxWeight: 48.300 },
  { name: "Pena",        minWeight: 48.3, maxWeight: 52.500 },
  { name: "Leve",        minWeight: 52.5, maxWeight: 56.500 },
  { name: "Médio",       minWeight: 56.5, maxWeight: 60.500 },
  { name: "Meio-Pesado", minWeight: 60.5, maxWeight: 65     },
  { name: "Pesado",      minWeight: 65,   maxWeight: 69     },
  { name: "Super-Pesado",minWeight: 69,   maxWeight: 73     },
  { name: "Pesadíssimo", minWeight: 73,   maxWeight: 9999   },
  { name: "Absoluto",    minWeight: 0,    maxWeight: 60.500 },
];

const JUVENIL_MASCULINO: WeightClassDef[] = [
  { name: "Galo",        minWeight: 0,    maxWeight: 48.500 },
  { name: "Pluma",       minWeight: 48.5, maxWeight: 53.500 },
  { name: "Pena",        minWeight: 53.5, maxWeight: 58.500 },
  { name: "Leve",        minWeight: 58.5, maxWeight: 64     },
  { name: "Médio",       minWeight: 64,   maxWeight: 69     },
  { name: "Meio-Pesado", minWeight: 69,   maxWeight: 74     },
  { name: "Pesado",      minWeight: 74,   maxWeight: 79.300 },
  { name: "Super-Pesado",minWeight: 79.3, maxWeight: 84.300 },
  { name: "Pesadíssimo", minWeight: 84.3, maxWeight: 9999   },
  { name: "Absoluto",    minWeight: 0,    maxWeight: 74     },
];

const ADULTO_MASTER_FEMININO: WeightClassDef[] = [
  { name: "Galo",        minWeight: 0,    maxWeight: 48.500 },
  { name: "Pluma",       minWeight: 48.5, maxWeight: 53.500 },
  { name: "Pena",        minWeight: 53.5, maxWeight: 58.500 },
  { name: "Leve",        minWeight: 58.5, maxWeight: 64     },
  { name: "Médio",       minWeight: 64,   maxWeight: 69     },
  { name: "Meio-Pesado", minWeight: 69,   maxWeight: 74     },
  { name: "Pesado",      minWeight: 74,   maxWeight: 79.300 },
  { name: "Super-Pesado",minWeight: 79.3, maxWeight: 84.300 },
  { name: "Pesadíssimo", minWeight: 84.3, maxWeight: 9999   },
  { name: "Absoluto",    minWeight: 0,    maxWeight: 9999   },
];

function weightClassesForDivisionAndGender(
  code: AgeDivisionCode,
  gender: Gender
): WeightClassDef[] {
  if (code === "JUVENIL") {
    return gender === "FEMININO" ? JUVENIL_FEMININO : JUVENIL_MASCULINO;
  }
  if (code === "ADULTO" || code === "MASTER") {
    return gender === "FEMININO" ? ADULTO_MASTER_FEMININO : WEIGHT_CLASSES[code];
  }
  return WEIGHT_CLASSES[code];
}

function gendersForDivision(code: AgeDivisionCode): Gender[] {
  return MISTO_DIVISIONS.includes(code)
    ? ["MISTO"]
    : ["MASCULINO", "FEMININO"];
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("🌱 Starting seed...");

  // 1) Age Divisions --------------------------------------------------------
  console.log("  ↳ Upserting age divisions...");
  for (const division of AGE_DIVISIONS) {
    await prisma.ageDivision.upsert({
      where:  { code: division.code },
      update: { minAge: division.minAge, maxAge: division.maxAge },
      create: division,
    });
  }
  console.log(`  ✔ ${AGE_DIVISIONS.length} age divisions upserted.`);

  // 2) Weight Classes -------------------------------------------------------
  console.log("  ↳ Upserting weight classes...");
  const persistedDivisions = await prisma.ageDivision.findMany();
  let count = 0;

  for (const division of persistedDivisions) {
    const code = division.code as AgeDivisionCode;
    const genders = gendersForDivision(code);

    for (const gender of genders) {
      const classes = weightClassesForDivisionAndGender(code, gender);

      for (const wc of classes) {
        await prisma.weightClass.upsert({
          where: {
            name_gender_ageDivisionId: {
              name:          wc.name,
              gender,
              ageDivisionId: division.id,
            },
          },
          update: {
            minWeight: wc.minWeight,
            maxWeight: wc.maxWeight,
          },
          create: {
            name:          wc.name,
            minWeight:     wc.minWeight,
            maxWeight:     wc.maxWeight,
            gender,
            ageDivisionId: division.id,
          },
        });
        count++;
      }
    }
  }

  console.log(`  ✔ ${count} weight classes upserted.`);
  console.log("✅ Seed completed successfully.");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

main()
  .catch((err: unknown) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });