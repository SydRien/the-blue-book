import {
  AlignmentType,
  Document,
  Header,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  convertInchesToTwip,
  type ISectionOptions,
  type ISpacingProperties,
} from "docx";
import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/fontFamilies";
import type {
  LayoutDocument,
  LayoutLine,
  LayoutTextRun,
  TitlePageLayout,
} from "@/lib/export/types";

const PT_TO_TWIP = 20;
/** Same face key as PDF (`SCREENPLAY_FONT_FAMILY`). No spaces — required for docx embed. */
const WORD_COURIER = SCREENPLAY_FONT_FAMILY; // "CourierPrime"
const WORD_CJK = "NotoSansSC";

function ptToTwip(pt: number): number {
  return Math.round(pt * PT_TO_TWIP);
}

/** Embed the same Courier Prime Regular TTF used by PDF export. */
async function loadCourierPrimeFonts(): Promise<
  { name: string; data: Uint8Array }[]
> {
  try {
    const response = await fetch("/fonts/CourierPrime-Regular.ttf");
    if (!response.ok) {
      return [];
    }
    return [
      {
        name: WORD_COURIER,
        data: new Uint8Array(await response.arrayBuffer()),
      },
    ];
  } catch {
    return [];
  }
}

function runFont(fontFamily: string) {
  const isCjk =
    fontFamily === CJK_FONT_FAMILY || fontFamily === "NotoSansSC";

  if (isCjk) {
    return {
      ascii: WORD_COURIER,
      hAnsi: WORD_COURIER,
      eastAsia: WORD_CJK,
      hint: "eastAsia" as const,
    };
  }

  return {
    ascii: WORD_COURIER,
    hAnsi: WORD_COURIER,
    eastAsia: WORD_CJK,
    hint: "default" as const,
  };
}

function textRunsFromLayout(
  runs: LayoutTextRun[],
  fallbackFont: string,
  fontSizePt: number,
  italic?: boolean,
): TextRun[] {
  const source =
    runs.length > 0
      ? runs
      : [{ text: "", fontFamily: fallbackFont || SCREENPLAY_FONT_FAMILY }];

  return source.map(
    (run) =>
      new TextRun({
        text: run.text,
        font: runFont(run.fontFamily || fallbackFont),
        size: Math.round(fontSizePt * 2),
        italics: italic || undefined,
      }),
  );
}

function lineIndents(line: LayoutLine, layout: LayoutDocument) {
  const left = Math.max(0, ptToTwip(line.xPt - layout.marginLeftPt));
  const right = Math.max(
    0,
    ptToTwip(
      layout.pageWidthPt - layout.marginRightPt - (line.xPt + line.widthPt),
    ),
  );
  return { left, right };
}

function paragraphSpacing(
  line: LayoutLine,
  lineHeightPt: number,
): ISpacingProperties {
  return {
    before: ptToTwip(line.spaceBeforePt),
    after: 0,
    line: ptToTwip(lineHeightPt),
    lineRule: LineRuleType.EXACT,
  };
}

function scriptLineToParagraph(
  line: LayoutLine,
  layout: LayoutDocument,
  lineHeightPt: number,
): Paragraph {
  if (!line.text) {
    return new Paragraph({
      spacing: {
        before: ptToTwip(line.spaceBeforePt),
        after: ptToTwip(line.heightPt),
        line: ptToTwip(Math.max(line.heightPt, 1)),
        lineRule: LineRuleType.EXACT,
      },
      children: [],
    });
  }

  const children = textRunsFromLayout(
    line.runs,
    line.fontFamily || SCREENPLAY_FONT_FAMILY,
    line.fontSizePt,
    line.italic,
  );

  const alignment =
    line.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;

  const needsBand =
    line.role === "character" ||
    line.role === "dialogue" ||
    line.role === "stage_direction" ||
    line.role === "narration" ||
    line.role === "action" ||
    Math.abs(line.xPt - layout.marginLeftPt) > 0.5;

  return new Paragraph({
    alignment,
    indent: needsBand ? lineIndents(line, layout) : undefined,
    spacing: paragraphSpacing(line, lineHeightPt),
    children,
  });
}

function titlePageParagraphs(
  titlePage: TitlePageLayout,
  marginTopPt: number,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let previousBottom = marginTopPt;

  titlePage.lines.forEach((line, index) => {
    // Layout yPt is from page top; DOCX spacing is inside the top margin box.
    const gapPt =
      index === 0
        ? Math.max(0, line.yPt - marginTopPt)
        : Math.max(0, line.yPt - previousBottom);

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: {
          before: ptToTwip(gapPt),
          after: 0,
          line: ptToTwip(line.fontSizePt * 1.2),
          lineRule: LineRuleType.AUTO,
        },
        children: textRunsFromLayout(
          line.runs,
          line.fontFamily || SCREENPLAY_FONT_FAMILY,
          line.fontSizePt,
        ),
      }),
    );

    previousBottom = line.yPt + line.fontSizePt;
  });

  return paragraphs;
}

function pageProperties(layout: LayoutDocument) {
  return {
    size: {
      width: ptToTwip(layout.pageWidthPt),
      height: ptToTwip(layout.pageHeightPt),
    },
    margin: {
      top: ptToTwip(layout.marginTopPt),
      bottom: ptToTwip(layout.marginBottomPt),
      left: ptToTwip(layout.marginLeftPt),
      right: ptToTwip(layout.marginRightPt),
      header: convertInchesToTwip(0.5),
    },
  };
}

function scriptHeader(): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: WORD_COURIER,
            size: 24,
          }),
          new TextRun({
            text: ".",
            font: WORD_COURIER,
            size: 24,
          }),
        ],
      }),
    ],
  });
}

/**
 * Converts LayoutDocument → DOCX Blob via docx.js (client-side).
 * English uses embedded CourierPrime — same face as PDF export.
 * Geometry comes from LayoutLine / PageProfile (shared across modes).
 */
export async function layoutToDocxBlob(layout: LayoutDocument): Promise<Blob> {
  const lineHeightPt = 12 * 1.2;
  const scriptParagraphs = layout.pages.flatMap((page) =>
    page.lines.map((line) =>
      scriptLineToParagraph(line, layout, lineHeightPt),
    ),
  );

  const sections: ISectionOptions[] = [];

  if (layout.titlePage) {
    sections.push({
      properties: {
        page: pageProperties(layout),
      },
      children: titlePageParagraphs(
        layout.titlePage,
        layout.marginTopPt,
      ),
    });
  }

  sections.push({
    properties: {
      page: {
        ...pageProperties(layout),
        pageNumbers: { start: 1 },
      },
    },
    headers: {
      default: scriptHeader(),
    },
    children:
      scriptParagraphs.length > 0
        ? scriptParagraphs
        : [new Paragraph({ children: [] })],
  });

  const courierFonts = await loadCourierPrimeFonts();

  const doc = new Document({
    creator: "The Blue Book",
    title: layout.titlePage?.info.title ?? layout.title,
    description: "The Blue Book export",
    ...(courierFonts.length > 0
      ? {
          fonts: courierFonts.map((font) => ({
            name: font.name,
            // docx types list Buffer; Uint8Array works in browser builds.
            data: font.data as unknown as Buffer,
          })),
        }
      : {}),
    sections,
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
