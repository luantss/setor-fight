/**
 * Category Generator Service
 *
 * Reads the CBJJO 2026 template and generates all Category rows
 * for a given competition. Idempotent — safe to run multiple times.
 *
 * Steps:
 *  1. Parse template JSON
 *  2. Upsert AgeDivisions
 *  3. Upsert WeightClasses
 *  4. Generate Categories for all belts × genders × ageDivisions × weightClasses
 */

import type { Belt, Gender, PrismaClient } from "../app/generated/prisma/client";
import template from "../data/cbjjo-2026-template.json";

// ---------------------------------------------------------------------------
// Template types
// ---------------------------------------------------------------------------

type GenderRule = "MISTO" | "SPLIT";

interface WeightClassEntry {
  name: string;
  minWeight: number;
  maxWeight: number | null;
}

interface AgeDivisionEntry {
  code: string;
  minAge: number;
  maxAge: number;
  genderRule: GenderRule;
  weightClasses: {
    MISTO?: WeightClassEntry[];
    MASCULINO?: WeightClassEntry[];
    FEMININO?: WeightClassEntry[];
  };
}

interface CbjjoTemplate {
  version: string;
  ageDivisions: AgeDivisionEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_BELTS: Belt[] = ["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"];

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface GenerateCategoriesResult {
  ageDivisionsUpserted: number;
  weightClassesUpserted: number;
  categoriesCreated: number;
  categoriesSkipped: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates all CBJJO 2026 categories for the given competition.
 *
 * - Idempotent: existing categories are skipped (not duplicated).
 * - PrismaClient is injected so this service works in both server actions
 *   and API routes without instantiating its own connection.
 */
export async function generateCategoriesFromTemplate(
  competitionId: string,
  prisma: PrismaClient,
): Promise<GenerateCategoriesResult> {
  const data = template as CbjjoTemplate;

  let ageDivisionsUpserted = 0;
  let weightClassesUpserted = 0;
  let categoriesCreated = 0;
  let categoriesSkipped = 0;

  for (const division of data.ageDivisions) {
    // -----------------------------------------------------------------------
    // 1) Ensure AgeDivision exists
    // -----------------------------------------------------------------------
    const ageDivision = await prisma.ageDivision.upsert({
      where: { code: division.code as never },
      update: { minAge: division.minAge, maxAge: division.maxAge },
      create: {
        code: division.code as never,
        minAge: division.minAge,
        maxAge: division.maxAge,
      },
    });

    ageDivisionsUpserted++;

    // -----------------------------------------------------------------------
    // 2) Resolve gender entries from the template
    // -----------------------------------------------------------------------
    const genderEntries = resolveGenderEntries(division);

    for (const { gender, classes } of genderEntries) {
      for (const wc of classes) {
        // -------------------------------------------------------------------
        // 3) Ensure WeightClass exists
        // -------------------------------------------------------------------
        // null maxWeight in template means open-ended — stored as 9999 sentinel
        const maxWeight = wc.maxWeight ?? 9999;

        const weightClass = await prisma.weightClass.upsert({
          where: {
            name_gender_ageDivisionId: {
              name: wc.name,
              gender,
              ageDivisionId: ageDivision.id,
            },
          },
          update: {
            minWeight: wc.minWeight,
            maxWeight,
          },
          create: {
            name: wc.name,
            minWeight: wc.minWeight,
            maxWeight,
            gender,
            ageDivisionId: ageDivision.id,
          },
        });

        weightClassesUpserted++;

        // -------------------------------------------------------------------
        // 4) Generate one Category per belt for this slot
        // -------------------------------------------------------------------
        for (const belt of ALL_BELTS) {
          const existing = await prisma.category.findUnique({
            where: {
              competitionId_belt_gender_ageDivisionId_weightClassId: {
                competitionId,
                belt,
                gender,
                ageDivisionId: ageDivision.id,
                weightClassId: weightClass.id,
              },
            },
            select: { id: true },
          });

          if (existing) {
            categoriesSkipped++;
            continue;
          }

          await prisma.category.create({
            data: {
              competitionId,
              belt,
              gender,
              ageDivisionId: ageDivision.id,
              weightClassId: weightClass.id,
            },
          });

          categoriesCreated++;
        }
      }
    }
  }

  return {
    ageDivisionsUpserted,
    weightClassesUpserted,
    categoriesCreated,
    categoriesSkipped,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GenderEntry {
  gender: Gender;
  classes: WeightClassEntry[];
}

function resolveGenderEntries(division: AgeDivisionEntry): GenderEntry[] {
  if (division.genderRule === "MISTO") {
    const classes = division.weightClasses.MISTO;
    if (!classes || classes.length === 0) {
      throw new Error(
        `Template inválido: divisão ${division.code} tem genderRule=MISTO mas não tem weightClasses.MISTO.`,
      );
    }
    return [{ gender: "MISTO", classes }];
  }

  // SPLIT — must have both MASCULINO and FEMININO
  const masculino = division.weightClasses.MASCULINO;
  const feminino = division.weightClasses.FEMININO;

  if (!masculino || masculino.length === 0) {
    throw new Error(
      `Template inválido: divisão ${division.code} tem genderRule=SPLIT mas não tem weightClasses.MASCULINO.`,
    );
  }
  if (!feminino || feminino.length === 0) {
    throw new Error(
      `Template inválido: divisão ${division.code} tem genderRule=SPLIT mas não tem weightClasses.FEMININO.`,
    );
  }

  return [
    { gender: "MASCULINO", classes: masculino },
    { gender: "FEMININO", classes: feminino },
  ];
}
