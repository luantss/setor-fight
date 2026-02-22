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

/** Category gender may be MISTO for divisions below JUVENIL. */
export type CategoryGender = "MASCULINO" | "FEMININO" | "MISTO";

export interface CompetitorInput {
  weight: number;
  belt: Belt;
  birthDate: Date;
  gender: CompetitorGender;
}

export interface AgeDivisionInput {
  id: string;
  minAge: number;
  maxAge: number;
}

export interface WeightClassInput {
  id: string;
  name: string;
  /** 0 = no lower limit. */
  minWeight: number;
  /** null or 9999 = open-ended (Pesadíssimo / Absoluto). */
  maxWeight: number | null;
  gender: CategoryGender;
}

export interface CategoryInput {
  id: string;
  belt: Belt;
  gender: CategoryGender;
  ageDivision: AgeDivisionInput;
  weightClass: WeightClassInput;
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
 * CBJJO uses the age the competitor turns during the competition calendar year.
 * Example: born Dec 2008, competition Nov 2026 → age = 17 (not yet 18).
 */
export function calculateCompetitorAge(birthDate: Date, competitionDate: Date): number {
  return competitionDate.getFullYear() - birthDate.getFullYear();
}

// ---------------------------------------------------------------------------
// Predicate helpers (pure, exported for unit testing)
// ---------------------------------------------------------------------------

export function matchesBelt(
  categoryBelt: Belt,
  competitorBelt: Belt,
): boolean {
  return categoryBelt === competitorBelt;
}

export function matchesAgeDivision(
  ageDivision: AgeDivisionInput,
  age: number,
): boolean {
  return age >= ageDivision.minAge && age <= ageDivision.maxAge;
}

/**
 * A category matches a competitor's gender when:
 *   - category.gender === competitor.gender  (exact match), or
 *   - category.gender === MISTO              (open to all genders, used below JUVENIL)
 */
export function matchesGender(
  categoryGender: CategoryGender,
  competitorGender: CompetitorGender,
): boolean {
  return categoryGender === competitorGender || categoryGender === "MISTO";
}

/**
 * Weight is inclusive on both bounds.
 * null / 9999 maxWeight means the class is open-ended (Pesadíssimo).
 */
export function matchesWeight(
  weightClass: WeightClassInput,
  weight: number,
): boolean {
  if (weight < weightClass.minWeight) return false;
  if (weightClass.maxWeight === null || weightClass.maxWeight >= 9999) return true;
  return weight <= weightClass.maxWeight;
}

/**
 * Absoluto is a supplementary enrollment — never assigned automatically.
 * Exclude it from the primary matching algorithm.
 */
function isAbsoluto(category: CategoryInput): boolean {
  return category.weightClass.name.toLowerCase() === "absoluto";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assigns exactly one category to a competitor.
 *
 * Matching order:
 *   1. Belt
 *   2. Age division (calculated from competition date)
 *   3. Gender (MISTO categories accept any competitor gender)
 *   4. Weight range
 *
 * Throws DomainError if no match or if multiple matches are found.
 */
export function matchCategory(
  competitor: CompetitorInput,
  competitionDate: Date,
  categories: CategoryInput[],
): CategoryInput {
  const age = calculateCompetitorAge(competitor.birthDate, competitionDate);

  const candidates = categories.filter((category) => {
    if (isAbsoluto(category)) return false;

    return (
      matchesBelt(category.belt, competitor.belt) &&
      matchesAgeDivision(category.ageDivision, age) &&
      matchesGender(category.gender, competitor.gender) &&
      matchesWeight(category.weightClass, competitor.weight)
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
      .map((c) => c.weightClass.name)
      .join(", ");

    throw new DomainError(
      `Múltiplas categorias encontradas para o competidor: ` +
        `faixa=${competitor.belt}, idade=${age}, peso=${competitor.weight}kg, gênero=${competitor.gender}. ` +
        `Categorias conflitantes: ${names}. Verifique as faixas de peso da competição.`,
    );
  }

  return candidates[0]!;
}
