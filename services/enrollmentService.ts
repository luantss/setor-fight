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
  type WeightClassWithDivisionInput,
  type CompetitorInput,
  type CategoryGender,
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
  });

  if (existingRegistration) {
    throw new EnrollmentServiceError(
      "DUPLICATE_ENROLLMENT",
      "Você já está inscrito nesta competição.",
    );
  }

  // 4) Fetch all weight classes for matching --------------------------------
  const dbWeightClasses = await prisma.weightClass.findMany({
    include: { ageDivision: true },
  });

  // Map DB rows to domain types
  const domainWeightClasses: WeightClassWithDivisionInput[] = dbWeightClasses.map((wc) => ({
    id: wc.id,
    name: wc.name,
    minWeight: wc.minWeight,
    maxWeight: wc.maxWeight,
    gender: wc.gender as CategoryGender,
    ageDivision: {
      id: wc.ageDivision.id,
      code: wc.ageDivision.code,
      minAge: wc.ageDivision.minAge,
      maxAge: wc.ageDivision.maxAge,
    },
  }));

  const competitorInput: CompetitorInput = {
    weight: profile.weight,
    belt: profile.belt as CompetitorInput["belt"],
    birthDate: profile.birthDate,
    gender: profile.gender as "MASCULINO" | "FEMININO",
  };

  // 5) Run category matching engine -----------------------------------------
  let matched: WeightClassWithDivisionInput;
  try {
    matched = matchCategory(
      competitorInput,
      competition.date,
      domainWeightClasses,
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
        competitorId:  profile.id,
        belt:          profile.belt,
        ageDivisionId: matched.ageDivision.id,
        weightClassId: matched.id,
      },
    });
  });

  return {
    registration,
    category: {
      belt:                 profile.belt,
      gender:               matched.gender,
      ageDivisionCode:      matched.ageDivision.code,
      ageDivisionMinAge:    matched.ageDivision.minAge,
      ageDivisionMaxAge:    matched.ageDivision.maxAge,
      weightClassName:      matched.name,
      weightClassMinWeight: matched.minWeight,
      weightClassMaxWeight: matched.maxWeight ?? 9999,
    },
  };
}