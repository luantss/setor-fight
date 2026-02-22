/**
 * Enrollment Service
 *
 * Orchestrates the full enrollment flow:
 *  1. Validate competition is OPEN
 *  2. Validate competitor profile is complete
 *  3. Prevent duplicate registration
 *  4. Run category matching engine (pure domain)
 *  5. Persist registration transactionally
 *
 * Framework-independent: PrismaClient is injected by the caller.
 */

import type { PrismaClient, Registration } from "@/app/generated/prisma/client";
import {
  matchCategory,
  DomainError,
  type CategoryInput,
  type CompetitorInput,
} from "@/domain/categoryMatcher";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export type EnrollmentErrorCode =
  | "COMPETITION_NOT_FOUND"
  | "COMPETITION_CLOSED"
  | "INCOMPLETE_PROFILE"
  | "DUPLICATE_ENROLLMENT"
  | "NO_CATEGORY_MATCH"
  | "MULTIPLE_CATEGORY_MATCHES";

export class EnrollmentServiceError extends Error {
  constructor(
    public readonly code: EnrollmentErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EnrollmentServiceError";
  }
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface EnrollmentResult {
  registration: Registration;
  category: {
    id: string;
    belt: string;
    gender: string;
    ageDivisionCode: string;
    ageDivisionMinAge: number;
    ageDivisionMaxAge: number;
    weightClassName: string;
    weightClassMinWeight: number;
    weightClassMaxWeight: number;
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enrolls a competitor (identified by userId) in a competition.
 * Throws EnrollmentServiceError on any business rule violation.
 */
export async function enrollCompetitor(
  userId: string,
  competitionId: string,
  prisma: PrismaClient,
): Promise<EnrollmentResult> {
  // 1) Validate competition ------------------------------------------------
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) {
    throw new EnrollmentServiceError(
      "COMPETITION_NOT_FOUND",
      "Competição não encontrada.",
    );
  }

  if (competition.status !== "OPEN") {
    throw new EnrollmentServiceError(
      "COMPETITION_CLOSED",
      "As inscrições desta competição estão encerradas.",
    );
  }

  // 2) Validate profile -----------------------------------------------------
  const profile = await prisma.competitorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new EnrollmentServiceError(
      "INCOMPLETE_PROFILE",
      "Você precisa completar seu perfil antes de se inscrever.",
    );
  }

  // 3) Check duplicate enrollment ------------------------------------------
  const existingRegistration = await prisma.registration.findUnique({
    where: {
      competitionId_competitorId: {
        competitionId,
        competitorId: profile.id,
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

  if (existingRegistration) {
    throw new EnrollmentServiceError(
      "DUPLICATE_ENROLLMENT",
      "Você já está inscrito nesta competição.",
    );
  }

  // 4) Fetch categories for matching ----------------------------------------
  const dbCategories = await prisma.category.findMany({
    where: { competitionId },
    include: {
      ageDivision: true,
      weightClass: true,
    },
  });

  // Map DB rows to domain types
  const domainCategories: CategoryInput[] = dbCategories.map((cat) => ({
    id: cat.id,
    belt: cat.belt as CategoryInput["belt"],
    gender: cat.gender as CategoryInput["gender"],
    ageDivision: {
      id: cat.ageDivision.id,
      minAge: cat.ageDivision.minAge,
      maxAge: cat.ageDivision.maxAge,
    },
    weightClass: {
      id: cat.weightClass.id,
      name: cat.weightClass.name,
      minWeight: cat.weightClass.minWeight,
      maxWeight: cat.weightClass.maxWeight,
      gender: cat.weightClass.gender as CategoryInput["gender"],
    },
  }));

  const competitorInput: CompetitorInput = {
    weight: profile.weight,
    belt: profile.belt as CompetitorInput["belt"],
    birthDate: profile.birthDate,
    gender: profile.gender as "MASCULINO" | "FEMININO",
  };

  // 5) Run category matching engine -----------------------------------------
  let matchedCategory: CategoryInput;
  try {
    matchedCategory = matchCategory(
      competitorInput,
      competition.date,
      domainCategories,
    );
  } catch (err) {
    if (err instanceof DomainError) {
      throw new EnrollmentServiceError("NO_CATEGORY_MATCH", err.message);
    }
    throw err;
  }

  // 6) Persist transactionally (double-check inside tx for race condition) ---
  const registration = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.registration.findUnique({
      where: {
        competitionId_competitorId: {
          competitionId,
          competitorId: profile.id,
        },
      },
    });

    if (duplicate) {
      throw new EnrollmentServiceError(
        "DUPLICATE_ENROLLMENT",
        "Você já está inscrito nesta competição.",
      );
    }

    return tx.registration.create({
      data: {
        competitionId,
        competitorId: profile.id,
        categoryId: matchedCategory.id,
      },
    });
  });

  // Fetch matched category details for the result
  const dbMatchedCategory = dbCategories.find((c) => c.id === matchedCategory.id)!;

  return {
    registration,
    category: {
      id: dbMatchedCategory.id,
      belt: dbMatchedCategory.belt,
      gender: dbMatchedCategory.gender,
      ageDivisionCode: dbMatchedCategory.ageDivision.code,
      ageDivisionMinAge: dbMatchedCategory.ageDivision.minAge,
      ageDivisionMaxAge: dbMatchedCategory.ageDivision.maxAge,
      weightClassName: dbMatchedCategory.weightClass.name,
      weightClassMinWeight: dbMatchedCategory.weightClass.minWeight,
      weightClassMaxWeight: dbMatchedCategory.weightClass.maxWeight,
    },
  };
}
