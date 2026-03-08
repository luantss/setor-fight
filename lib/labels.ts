import type { Belt, Gender, AgeDivisionCode } from "@/app/generated/prisma/client";

export const beltLabel: Record<Belt, string> = {
  BRANCA: "Branca",
  AZUL: "Azul",
  ROXA: "Roxa",
  MARROM: "Marrom",
  PRETA: "Preta",
};

export const genderLabel: Record<Gender, string> = {
  MASCULINO: "Masculino",
  FEMININO: "Feminino",
  MISTO: "Misto",
};

export const genderShort: Record<"MASCULINO" | "FEMININO", string> = {
  MASCULINO: "M",
  FEMININO: "F",
};

export const ageDivisionLabel: Record<AgeDivisionCode, string> = {
  PRE_MIRIM: "Pré-Mirim",
  MIRIM_1: "Mirim 1",
  MIRIM_2: "Mirim 2",
  INFANTIL_1: "Infantil 1",
  INFANTIL_2: "Infantil 2",
  INFANTO_JUVENIL_1: "Infanto-Juvenil 1",
  INFANTO_JUVENIL_2: "Infanto-Juvenil 2",
  INFANTO_JUVENIL_3: "Infanto-Juvenil 3",
  JUVENIL_MASCULINO: "Juvenil Masculino",
  JUVENIL_FEMININO: "Juvenil Feminino",
  ADULTO_MASCULINO: "Adulto Masculino",
  ADULTO_FEMININO: "Adulto Feminino",
  MASTER_MASCULINO: "Master Masculino",
  MASTER_FEMININO: "Master Feminino",
};

export function buildCategoryName(
  belt: Belt,
  gender: Gender,
  divisionCode: AgeDivisionCode,
  weightClassName: string,
): string {
  const g = gender === "MISTO" ? "Misto" : genderLabel[gender];
  return `${beltLabel[belt]} | ${ageDivisionLabel[divisionCode]} | ${weightClassName} | ${g}`;
}

export function calculateAge(birthDate: Date, competitionDate: Date): number {
  const years =
    competitionDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayOccurred =
    competitionDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (competitionDate.getUTCMonth() === birthDate.getUTCMonth() &&
      competitionDate.getUTCDate() >= birthDate.getUTCDate());
  return hasBirthdayOccurred ? years : years - 1;
}
