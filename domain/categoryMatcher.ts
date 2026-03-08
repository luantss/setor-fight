/**
 * CORE DOMAIN — Category Matching Engine
 *
 * Pure, framework-independent module.
 * No DB calls. No framework imports. Fully unit-testable.
 *
 * Implements CBJJO 2026 category assignment rules.
 */

// ---------------------------------------------------------------------------
// Domain types (mirror Prisma enums — no Prisma dependency)
// ---------------------------------------------------------------------------

export type Belt = "BRANCA" | "AZUL" | "ROXA" | "MARROM" | "PRETA";

/** Competitor gender is always MASCULINO or FEMININO — never MISTO. */
export type CompetitorGender = "MASCULINO" | "FEMININO";

/** Weight class gender may be MISTO for divisions below JUVENIL. */
export type CategoryGender = "MASCULINO" | "FEMININO" | "MISTO";

export interface CompetitorInput {
  weight: number;
  belt: Belt;
  birthDate: Date;
  gender: CompetitorGender;
}

export interface AgeDivisionInput {
  id: string;
  code: string;
  minAge: number;
  maxAge: number;
}

export interface WeightClassWithDivisionInput {
  id: string;
  name: string;
  /** 0 = no lower limit. */
  minWeight: number;
  /** null or 9999 = open-ended (Pesadíssimo / Absoluto). */
  maxWeight: number | null;
  gender: CategoryGender;
  ageDivision: AgeDivisionInput;
}

// ---------------------------------------------------------------------------
// Domain error
// ---------------------------------------------------------------------------

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

// ---------------------------------------------------------------------------
// Age calculation
// ---------------------------------------------------------------------------

/**
 * Calculates exact age using UTC dates.
 * Subtracts 1 year if the birthday has not yet occurred in the competition year.
 */
export function calculateCompetitorAge(birthDate: Date, competitionDate: Date): number {
  const years = competitionDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayOccurred =
    competitionDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (competitionDate.getUTCMonth() === birthDate.getUTCMonth() &&
      competitionDate.getUTCDate() >= birthDate.getUTCDate());
  return hasBirthdayOccurred ? years : years - 1;
}

// ---------------------------------------------------------------------------
// Predicate helpers (pure, exported for unit testing)
// ---------------------------------------------------------------------------

export function matchesAgeDivision(
  ageDivision: AgeDivisionInput,
  age: number,
): boolean {
  return age >= ageDivision.minAge && age <= ageDivision.maxAge;
}

/**
 * A weight class matches a competitor's gender when:
 *   - weightClass.gender === competitor.gender  (exact match), or
 *   - weightClass.gender === MISTO              (open to all genders, used below JUVENIL)
 */
export function matchesGender(
  wcGender: CategoryGender,
  competitorGender: CompetitorGender,
): boolean {
  return wcGender === competitorGender || wcGender === "MISTO";
}

/**
 * Weight is inclusive on both bounds.
 * null / 9999 maxWeight means the class is open-ended (Pesadíssimo).
 */
export function matchesWeight(
  weightClass: WeightClassWithDivisionInput,
  weight: number,
): boolean {
  if (weight < weightClass.minWeight) return false;
  if (weightClass.maxWeight === null || weightClass.maxWeight >= 9999) return true;
  return weight <= weightClass.maxWeight;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assigns exactly one WeightClass (with its AgeDivision) to a competitor.
 *
 * Belt is NOT a filter here — it comes from the competitor profile and is
 * stored directly on Registration by the caller (enrollmentService).
 *
 * Matching rules:
 *   1. Age division (exact birthday calculation using UTC dates)
 *   2. Gender (MISTO weight classes accept any competitor gender)
 *   3. Weight range (inclusive; 9999 = open-ended)
 *
 * "Absoluto" weight classes are excluded from automatic matching.
 *
 * Throws DomainError if no match or if multiple matches are found.
 */
export function matchCategory(
  competitor: CompetitorInput,
  competitionDate: Date,
  weightClasses: WeightClassWithDivisionInput[],
): WeightClassWithDivisionInput {
  const age = calculateCompetitorAge(competitor.birthDate, competitionDate);

  const candidates = weightClasses.filter((wc) => {
    if (wc.name.toLowerCase() === "absoluto") return false;

    return (
      matchesAgeDivision(wc.ageDivision, age) &&
      matchesGender(wc.gender, competitor.gender) &&
      matchesWeight(wc, competitor.weight)
    );
  });

  if (candidates.length === 0) {
    throw new DomainError(
      `Nenhuma categoria encontrada para o competidor: ` +
        `faixa=${competitor.belt}, idade=${age}, peso=${competitor.weight}kg, gênero=${competitor.gender}.`,
    );
  }

  if (candidates.length > 1) {
    const names = candidates
      .map((wc) => wc.name)
      .join(", ");

    throw new DomainError(
      `Múltiplas categorias encontradas para o competidor: ` +
        `faixa=${competitor.belt}, idade=${age}, peso=${competitor.weight}kg, gênero=${competitor.gender}. ` +
        `Categorias conflitantes: ${names}. Verifique as faixas de peso da competição.`,
    );
  }

  return candidates[0]!;
}
