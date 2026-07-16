import {
  ensureScreenplayFonts,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/loadScreenplayFonts";
import type { LayoutDocument, LayoutLine } from "@/lib/export/types";

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

type PdfContentItem = {
  text: string;
  fontSize: number;
  font?: string;
  alignment?: "left" | "center" | "right";
  margin: [number, number, number, number];
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

  return {
    item: {
      text: line.text,
      fontSize: line.fontSizePt,
      font: line.fontFamily || SCREENPLAY_FONT_FAMILY,
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
 * Converts LayoutDocument → PDF Blob via pdfmake (client-side).
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

  layout.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      content.push({
        text: "",
        fontSize: 1,
        margin: [0, 0, 0, 0],
        pageBreak: "before",
      });
    }

    content.push({
      text: `${page.pageNumber}.`,
      fontSize: 12,
      font: SCREENPLAY_FONT_FAMILY,
      alignment: "right",
      margin: [0, 0, 0, 0],
      absolutePosition: {
        x: layout.pageWidthPt - 108,
        y: 36,
      },
      width: 72,
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
      title: layout.title,
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
