/**
 * Phase 5.7 — generate sample PDFs for Screenplay / Stage Play / Interactive.
 * Run: npx tsx scripts/phase57-sample-pdfs.ts
 */
console.log("[phase57] starting");

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildExportPipeline } from "../lib/export/pipeline.ts";
import {
  SCREENPLAY_FONT_FAMILY,
  CJK_FONT_FAMILY,
} from "../lib/export/fonts/fontFamilies.ts";
import type {
  LayoutDocument,
  LayoutLine,
  WritingMode,
} from "../lib/export/types.ts";
import type { BlueBookDocument } from "../types/document.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const outDir = path.join(root, "tmp");

const sampleDocument: BlueBookDocument = {
  id: "phase57-sample",
  title: "The Blue Book — Mode Samples",
  blocks: [
    {
      id: "1",
      type: "scene_heading",
      content: "INT. CAMP - NIGHT",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "2",
      type: "action",
      content:
        "The wind moves across the battlefield. Embers drift from a dying fire.",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "3",
      type: "character",
      content: "JIN WEN GONG",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "4",
      type: "dialogue",
      content: "We cannot retreat.\n我们不能撤退。",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "5",
      type: "action",
      content: "She turns toward the ridge. Distant drums answer.",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "6",
      type: "character",
      content: "LI MEI",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
    {
      id: "7",
      type: "dialogue",
      content: "Then we hold the line until dawn.",
      language: "en",
      style: { font: "Courier", size: 12 },
      metadata: { export: true },
    },
  ],
};

type PdfMakeLike = {
  addVirtualFileSystem: (vfs: Record<string, string>) => void;
  addFonts: (
    fonts: Record<
      string,
      { normal: string; bold: string; italics: string; bolditalics: string }
    >,
  ) => void;
  createPdf: (def: unknown) => {
    getBuffer: () => Promise<Buffer>;
  };
};

function loadFonts(pdfMake: PdfMakeLike) {
  const fontsDir = path.join(root, "public", "fonts");
  const latinNames = [
    "CourierPrime-Regular.ttf",
    "CourierPrime-Bold.ttf",
    "CourierPrime-Italic.ttf",
    "CourierPrime-BoldItalic.ttf",
  ] as const;

  const latin: Record<string, string> = {};
  for (const name of latinNames) {
    const filePath = path.join(fontsDir, name);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing font: ${filePath}`);
    }
    latin[name] = fs.readFileSync(filePath).toString("base64");
  }

  const cjkCandidates = [
    "NotoSansSC-Regular.ttf",
    "NotoSansSC-Regular.otf",
  ];
  const cjkFile = cjkCandidates.find((name) =>
    fs.existsSync(path.join(fontsDir, name)),
  );
  if (!cjkFile) {
    throw new Error("Missing NotoSansSC Regular in public/fonts");
  }

  const cjkBoldCandidates = ["NotoSansSC-Bold.ttf", "NotoSansSC-Bold.otf"];
  const cjkBoldFile =
    cjkBoldCandidates.find((name) =>
      fs.existsSync(path.join(fontsDir, name)),
    ) ?? cjkFile;

  const cjk: Record<string, string> = {
    [cjkFile]: fs.readFileSync(path.join(fontsDir, cjkFile)).toString("base64"),
  };
  if (cjkBoldFile !== cjkFile) {
    cjk[cjkBoldFile] = fs
      .readFileSync(path.join(fontsDir, cjkBoldFile))
      .toString("base64");
  }

  pdfMake.addVirtualFileSystem({ ...latin, ...cjk });
  pdfMake.addFonts({
    [SCREENPLAY_FONT_FAMILY]: {
      normal: "CourierPrime-Regular.ttf",
      bold: "CourierPrime-Bold.ttf",
      italics: "CourierPrime-Italic.ttf",
      bolditalics: "CourierPrime-BoldItalic.ttf",
    },
    [CJK_FONT_FAMILY]: {
      normal: cjkFile,
      bold: cjkBoldFile,
      italics: cjkFile,
      bolditalics: cjkBoldFile,
    },
  });
}

function runsToPdfText(line: LayoutLine) {
  if (!line.runs.length) {
    return line.text;
  }
  if (line.runs.length === 1 && !line.italic) {
    return line.runs[0]!.text;
  }
  return line.runs.map((run) => ({
    text: run.text,
    font: run.fontFamily || SCREENPLAY_FONT_FAMILY,
    fontSize: line.fontSizePt,
    ...(line.italic ? { italics: true } : {}),
  }));
}

function layoutToPdfBuffer(
  pdfMake: PdfMakeLike,
  layout: LayoutDocument,
): Promise<Buffer> {
  const content: Record<string, unknown>[] = [];
  const pageNumberWidth = layout.pageNumberWidthPt;
  const pageNumberX = layout.pageWidthPt - pageNumberWidth - 72;

  layout.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      content.push({
        text: "",
        fontSize: 1,
        pageBreak: "before",
      });
    }

    content.push({
      text: `${page.pageNumber}.`,
      fontSize: 12,
      font: SCREENPLAY_FONT_FAMILY,
      alignment: "right",
      absolutePosition: {
        x: pageNumberX,
        y: layout.pageNumberTopPt,
      },
      width: pageNumberWidth,
    });

    let cursorY = layout.marginTopPt;
    for (const line of page.lines) {
      cursorY += line.spaceBeforePt;
      if (line.text) {
        content.push({
          text: runsToPdfText(line),
          fontSize: line.fontSizePt,
          font: line.fontFamily || SCREENPLAY_FONT_FAMILY,
          italics: line.italic || undefined,
          alignment: line.align,
          width: line.widthPt,
          absolutePosition: { x: line.xPt, y: cursorY },
        });
      }
      cursorY += line.heightPt;
    }
  });

  const docDefinition = {
    pageSize: "LETTER" as const,
    pageMargins: [0, 0, 0, 0] as [number, number, number, number],
    defaultStyle: {
      font: SCREENPLAY_FONT_FAMILY,
      fontSize: 12,
      lineHeight: 1,
    },
    info: {
      title: layout.title,
      creator: "The Blue Book",
    },
    content,
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}

const MODES: { mode: WritingMode; filename: string }[] = [
  { mode: "screenplay", filename: "phase57-screenplay.pdf" },
  { mode: "stage_play", filename: "phase57-stage-play.pdf" },
  { mode: "interactive", filename: "phase57-interactive.pdf" },
];

async function main() {
  console.log("[phase57] root", root);
  fs.mkdirSync(outDir, { recursive: true });

  const pdfMake = require("pdfmake/build/pdfmake") as PdfMakeLike;
  console.log("[phase57] loading fonts");
  loadFonts(pdfMake);

  for (const { mode, filename } of MODES) {
    console.log(`[phase57] building ${mode}`);
    const pipeline = buildExportPipeline(sampleDocument, mode);
    const buffer = await layoutToPdfBuffer(pdfMake, pipeline.layout);
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, buffer);

    const roles = [...new Set(pipeline.nodes.map((n) => n.role))].join(", ");
    const firstPage = pipeline.layout.pages[0];
    const sampleLines = (firstPage?.lines ?? [])
      .filter((l) => l.text)
      .slice(0, 6)
      .map(
        (l) =>
          `  ${l.role.padEnd(16)} x=${(l.xPt / 72).toFixed(2)}" align=${l.align}${l.italic ? " italic" : ""} "${l.text.slice(0, 40)}"`,
      )
      .join("\n");

    console.log(`Wrote ${outPath} (${buffer.length} bytes)`);
    console.log(`  mode=${mode} profile=${pipeline.layout.profileId}`);
    console.log(`  roles: ${roles}`);
    console.log(sampleLines);
  }
}

main()
  .then(() => {
    console.log("[phase57] done");
  })
  .catch((error) => {
    console.error("[phase57] failed", error);
    process.exitCode = 1;
  });
