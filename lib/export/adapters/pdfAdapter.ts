import { SCREENPLAY_FONT_FAMILY } from "@/lib/export/fonts/fontFamilies";
import { ensureScreenplayFonts } from "@/lib/export/fonts/loadScreenplayFonts";
import type {
  LayoutDocument,
  LayoutLine,
  LayoutTextRun,
  TitlePageLayout,
} from "@/lib/export/types";

type PdfMakeLike = {
  vfs?: Record<string, string>;
  fonts?: Record<
    string,
    {
      normal: string;
      bold: string;
      italics: string;
      bolditalics: string;
    }
  >;
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  addFonts?: (
    fonts: Record<
      string,
      {
        normal: string;
        bold: string;
        italics: string;
        bolditalics: string;
      }
    >,
  ) => void;
  createPdf: (def: unknown) => {
    getBlob: () => Promise<Blob>;
  };
};

type PdfTextSpan = {
  text: string;
  font?: string;
  fontSize?: number;
  italics?: boolean;
};

type PdfContentItem = {
  text?: string | PdfTextSpan[];
  stack?: PdfContentItem[];
  fontSize?: number;
  font?: string;
  italics?: boolean;
  alignment?: "left" | "center" | "right";
  margin?: [number, number, number, number];
  absolutePosition?: { x: number; y: number };
  pageBreak?: string;
  width?: number;
};

function resolveVfsModule(vfsFonts: unknown): Record<string, string> {
  if (!vfsFonts || typeof vfsFonts !== "object") {
    return {};
  }

  const candidate = vfsFonts as {
    pdfMake?: { vfs?: Record<string, string> };
    vfs?: Record<string, string>;
    default?: Record<string, string>;
  };

  if (candidate.pdfMake?.vfs) {
    return candidate.pdfMake.vfs;
  }
  if (candidate.vfs) {
    return candidate.vfs;
  }
  if (candidate.default && typeof candidate.default === "object") {
    return candidate.default;
  }

  return vfsFonts as Record<string, string>;
}

function runsToPdfText(
  runs: LayoutTextRun[],
  fallbackFont: string,
  fontSize: number,
  italic?: boolean,
): string | PdfTextSpan[] {
  if (runs.length === 0) {
    return "";
  }

  if (runs.length === 1 && !italic) {
    return runs[0]!.text;
  }

  return runs.map((run) => ({
    text: run.text,
    font: run.fontFamily || fallbackFont,
    fontSize,
    ...(italic ? { italics: true } : {}),
  }));
}

function lineToContent(
  line: LayoutLine,
  cursorY: number,
): { item: PdfContentItem | null; nextY: number } {
  const nextY = cursorY + line.spaceBeforePt;

  if (!line.text) {
    return {
      item: null,
      nextY: nextY + line.heightPt,
    };
  }

  const font = line.fontFamily || SCREENPLAY_FONT_FAMILY;
  const text = runsToPdfText(line.runs, font, line.fontSizePt, line.italic);

  return {
    item: {
      text: text === "" ? line.text : text,
      fontSize: line.fontSizePt,
      font,
      italics: line.italic || undefined,
      alignment: line.align,
      width: line.widthPt,
      margin: [0, 0, 0, 0],
      absolutePosition: {
        x: line.xPt,
        y: nextY,
      },
    },
    nextY: nextY + line.heightPt,
  };
}

/**
 * Title page uses a centered flow stack (not absolute X).
 * pdfmake honors alignment:"center" in normal flow; absolutePosition does not.
 */
function appendTitlePage(
  content: PdfContentItem[],
  titlePage: TitlePageLayout,
) {
  const stack: PdfContentItem[] = [];
  let previousBottom = 0;

  titlePage.lines.forEach((line, index) => {
    const font = line.fontFamily || SCREENPLAY_FONT_FAMILY;
    const text = runsToPdfText(line.runs, font, line.fontSizePt);
    const marginTop =
      index === 0
        ? line.yPt
        : Math.max(0, line.yPt - previousBottom);

    stack.push({
      text: text === "" ? line.text : text,
      fontSize: line.fontSizePt,
      font,
      alignment: "center",
      margin: [0, marginTop, 0, 0],
    });

    previousBottom = line.yPt + line.fontSizePt;
  });

  content.push({
    stack,
    width: titlePage.pageWidthPt,
  });
}

/**
 * Converts LayoutDocument → PDF Blob via pdfmake (client-side).
 * Optional title page is page 1 (no number); script pages keep 1-based numbering.
 */
export async function layoutToPdfBlob(layout: LayoutDocument): Promise<Blob> {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = (pdfMakeModule.default ??
    pdfMakeModule) as unknown as PdfMakeLike;
  const defaultVfs = resolveVfsModule(
    pdfFontsModule.default ?? pdfFontsModule,
  );

  if (Object.keys(defaultVfs).length > 0) {
    if (typeof pdfMake.addVirtualFileSystem === "function") {
      pdfMake.addVirtualFileSystem(defaultVfs);
    } else {
      pdfMake.vfs = {
        ...defaultVfs,
        ...(pdfMake.vfs ?? {}),
      };
    }
  }

  await ensureScreenplayFonts(pdfMake);

  const content: PdfContentItem[] = [];
  const pageNumberWidth = layout.pageNumberWidthPt;
  const pageNumberX = layout.pageWidthPt - pageNumberWidth - 72;
  let needsPageBreakBeforeScript = false;

  if (layout.titlePage) {
    appendTitlePage(content, layout.titlePage);
    needsPageBreakBeforeScript = true;
  }

  layout.pages.forEach((page, pageIndex) => {
    if (needsPageBreakBeforeScript || pageIndex > 0) {
      content.push({
        text: "",
        fontSize: 1,
        margin: [0, 0, 0, 0],
        pageBreak: "before",
      });
      needsPageBreakBeforeScript = false;
    }

    content.push({
      text: `${page.pageNumber}.`,
      fontSize: 12,
      font: SCREENPLAY_FONT_FAMILY,
      alignment: "right",
      margin: [0, 0, 0, 0],
      absolutePosition: {
        x: pageNumberX,
        y: layout.pageNumberTopPt,
      },
      width: pageNumberWidth,
    });

    let cursorY = layout.marginTopPt;
    for (const line of page.lines) {
      const { item, nextY } = lineToContent(line, cursorY);
      cursorY = nextY;
      if (item) {
        content.push(item);
      }
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
      title: layout.titlePage?.info.title ?? layout.title,
      author: layout.titlePage?.info.author || undefined,
      creator: "The Blue Book",
    },
    content,
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  return pdfDocGenerator.getBlob();
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
