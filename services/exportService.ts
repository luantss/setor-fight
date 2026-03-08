/**
 * Export Service
 *
 * Generates Excel (ExcelJS) and PDF (PDFKit) files
 * grouping competitors by category, following CBJJO 2026 structure.
 *
 * Framework-independent — PrismaClient is injected by the caller.
 */

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type {
  PrismaClient,
  Belt,
  Gender,
  AgeDivisionCode,
} from "@/app/generated/prisma/client";
import {
  beltLabel,
  genderShort,
  ageDivisionLabel,
  buildCategoryName,
  calculateAge,
} from "@/lib/labels";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface CompetitorRow {
  name: string;
  belt: Belt;
  ageDivisionCode: AgeDivisionCode;
  weightClassName: string;
  weight: number;
  gender: "MASCULINO" | "FEMININO";
  age: number;
}

interface CategoryGroup {
  categoryName: string;
  rows: CompetitorRow[];
}

// ---------------------------------------------------------------------------
// Shared data fetcher
// ---------------------------------------------------------------------------

async function fetchData(competitionId: string, prisma: PrismaClient) {
  const competition = await prisma.competition.findUniqueOrThrow({
    where: { id: competitionId },
  });

  const registrations = await prisma.registration.findMany({
    where: { competitionId },
    include: {
      ageDivision: true,
      weightClass: true,
      competitor: true,
    },
    orderBy: { competitor: { name: "asc" } },
  });

  const groupMap = new Map<string, CategoryGroup>();

  for (const reg of registrations) {
    const key = `${reg.belt}|${reg.ageDivision.code}|${reg.weightClass.name}|${reg.weightClass.gender}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        categoryName: buildCategoryName(
          reg.belt,
          reg.weightClass.gender,
          reg.ageDivision.code,
          reg.weightClass.name,
        ),
        rows: [],
      });
    }

    groupMap.get(key)!.rows.push({
      name: reg.competitor.name,
      belt: reg.competitor.belt,
      ageDivisionCode: reg.ageDivision.code,
      weightClassName: reg.weightClass.name,
      weight: reg.competitor.weight,
      gender: reg.competitor.gender as "MASCULINO" | "FEMININO",
      age: calculateAge(reg.competitor.birthDate, competition.date),
    });
  }

  return { competition, groups: Array.from(groupMap.values()) };
}

// ---------------------------------------------------------------------------
// Excel export
// ---------------------------------------------------------------------------

export async function generateExcel(
  competitionId: string,
  prisma: PrismaClient,
): Promise<Buffer> {
  const { competition, groups } = await fetchData(competitionId, prisma);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JJ";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Inscrições");

  // Title
  sheet.mergeCells("A1:H1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = competition.name;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells("A2:H2");
  const dateCell = sheet.getCell("A2");
  dateCell.value = competition.date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  dateCell.alignment = { horizontal: "center" };
  dateCell.font = { size: 10, color: { argb: "FF666666" } };

  let rowIdx = 4;

  for (const group of groups) {
    // Category header
    sheet.mergeCells(rowIdx, 1, rowIdx, 8);
    const catCell = sheet.getCell(rowIdx, 1);
    catCell.value = `${group.categoryName} (${group.rows.length} atleta${group.rows.length !== 1 ? "s" : ""})`;
    catCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    catCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCC0000" } };
    catCell.alignment = { horizontal: "left", indent: 1 };
    rowIdx++;

    // Column headers
    const header = sheet.getRow(rowIdx);
    header.values = ["#", "Nome", "Faixa", "Divisão de Idade", "Categoria de Peso", "Peso (kg)", "Sexo", "Idade"];
    header.font = { bold: true };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    rowIdx++;

    group.rows.forEach((r, i) => {
      const row = sheet.getRow(rowIdx);
      row.values = [
        i + 1,
        r.name,
        beltLabel[r.belt],
        ageDivisionLabel[r.ageDivisionCode],
        r.weightClassName,
        r.weight,
        genderShort[r.gender],
        r.age,
      ];
      rowIdx++;
    });

    rowIdx++; // blank row between categories
  }

  // Column widths
  [5, 32, 12, 20, 18, 10, 8, 8].forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

const PDF_COLS = [
  { x: 40,  w: 20  }, // #
  { x: 62,  w: 130 }, // Nome
  { x: 194, w: 52  }, // Faixa
  { x: 248, w: 86  }, // Divisão de Idade
  { x: 336, w: 78  }, // Categoria de Peso
  { x: 416, w: 38  }, // Peso (kg)
  { x: 456, w: 36  }, // Sexo
  { x: 494, w: 30  }, // Idade
];

export async function generatePdf(
  competitionId: string,
  prisma: PrismaClient,
): Promise<Buffer> {
  const { competition, groups } = await fetchData(competitionId, prisma);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const CONTENT_W = doc.page.width - 80;
    const ROW_H = 14;

    function writeRow(cells: string[], bold = false) {
      const y = doc.y;
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
      PDF_COLS.forEach(({ x, w }, i) => {
        if (cells[i] !== undefined) {
          doc.text(cells[i], x, y, { width: w, lineBreak: false });
        }
      });
      doc.y = y + ROW_H;
    }

    function checkPage() {
      if (doc.y > doc.page.height - 70) doc.addPage();
    }

    // Title
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(competition.name, { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(competition.date.toLocaleDateString("pt-BR", { timeZone: "UTC" }), {
        align: "center",
      });
    doc.moveDown(1.5);

    for (const group of groups) {
      checkPage();

      // Category header (red bar)
      const headerY = doc.y;
      doc.rect(40, headerY, CONTENT_W, 16).fill("#CC0000");
      doc
        .fill("white")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(
          `${group.categoryName} — ${group.rows.length} atleta${group.rows.length !== 1 ? "s" : ""}`,
          44,
          headerY + 3,
          { width: CONTENT_W - 8, lineBreak: false },
        );
      doc.fill("black");
      doc.y = headerY + 22;

      // Column headers
      writeRow(["#", "Nome", "Faixa", "Divisão de Idade", "Categoria de Peso", "Peso", "Sexo", "Idade"], true);

      // Data rows
      group.rows.forEach((r, i) => {
        checkPage();
        writeRow([
          String(i + 1),
          r.name,
          beltLabel[r.belt],
          ageDivisionLabel[r.ageDivisionCode],
          r.weightClassName,
          `${r.weight}kg`,
          genderShort[r.gender],
          `${r.age}a`,
        ]);
      });

      doc.y += 10;
    }

    doc.end();
  });
}
