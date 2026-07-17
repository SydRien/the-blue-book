import {
  CJK_FONT_FAMILY,
  SCREENPLAY_FONT_FAMILY,
} from "@/lib/export/fonts/fontFamilies";

export { CJK_FONT_FAMILY, SCREENPLAY_FONT_FAMILY };

const LATIN_FONT_FILES = {
  normal: "CourierPrime-Regular.ttf",
  bold: "CourierPrime-Bold.ttf",
  italics: "CourierPrime-Italic.ttf",
  bolditalics: "CourierPrime-BoldItalic.ttf",
} as const;

/** Local CJK faces (ttf preferred; otf fallback). */
const CJK_FONT_FILES = {
  normal: ["NotoSansSC-Regular.ttf", "NotoSansSC-Regular.otf"] as const,
  bold: ["NotoSansSC-Bold.ttf", "NotoSansSC-Bold.otf"] as const,
};

const LOCAL_FONT_BASE = "/fonts";

const LATIN_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/quoteunquoteapps/CourierPrime@master/fonts/ttf";

const CJK_CDN_URLS: Record<string, string> = {
  "NotoSansSC-Regular.otf":
    "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@Sans2.004/Sans/OTF/SimplifiedChinese/NotoSansSC-Regular.otf",
  "NotoSansSC-Bold.otf":
    "https://cdn.jsdelivr.net/gh/googlefonts/noto-cjk@Sans2.004/Sans/OTF/SimplifiedChinese/NotoSansSC-Bold.otf",
};

type FontFaceMap = {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
};

type PdfMakeFonts = {
  addVirtualFileSystem?: (vfs: Record<string, string>) => void;
  addFonts?: (fonts: Record<string, FontFaceMap>) => void;
  vfs?: Record<string, string>;
  fonts?: Record<string, FontFaceMap>;
};

type FontBundle = {
  vfs: Record<string, string>;
  fonts: Record<string, FontFaceMap>;
};

let fontsBundle: Promise<FontBundle> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Keep chunks small — large spreads exceed JS argument limits.
  const chunkSize = 0x2000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(
      null,
      chunk as unknown as number[],
    );
  }

  return btoa(binary);
}

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      return null;
    }
    return arrayBufferToBase64(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadLatinFonts(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.values(LATIN_FONT_FILES).map(async (fileName) => {
      const local = await fetchAsBase64(`${LOCAL_FONT_BASE}/${fileName}`);
      if (local) {
        return [fileName, local] as const;
      }
      const cdn = await fetchAsBase64(`${LATIN_CDN_BASE}/${fileName}`);
      if (!cdn) {
        throw new Error(
          `Failed to load screenplay font: ${fileName}. Place Courier Prime TTFs in public/fonts/.`,
        );
      }
      return [fileName, cdn] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function resolveFontFile(
  candidates: readonly string[],
): Promise<{ fileName: string; base64: string } | null> {
  for (const fileName of candidates) {
    const local = await fetchAsBase64(`${LOCAL_FONT_BASE}/${fileName}`);
    if (local) {
      return { fileName, base64: local };
    }
  }

  for (const fileName of candidates) {
    const url = CJK_CDN_URLS[fileName];
    if (!url) {
      continue;
    }
    const cdn = await fetchAsBase64(url);
    if (cdn) {
      return { fileName, base64: cdn };
    }
  }

  return null;
}

async function loadCjkFonts(): Promise<{
  vfs: Record<string, string>;
  faces: FontFaceMap;
}> {
  const regular = await resolveFontFile(CJK_FONT_FILES.normal);
  if (!regular) {
    throw new Error(
      "Failed to load CJK font. Place NotoSansSC-Regular.ttf in public/fonts/.",
    );
  }

  // Bold is optional — Regular alone is enough for screenplay body text.
  const bold = await resolveFontFile(CJK_FONT_FILES.bold);
  const boldFile = bold?.fileName ?? regular.fileName;

  const vfs: Record<string, string> = {
    [regular.fileName]: regular.base64,
  };
  if (bold && bold.fileName !== regular.fileName) {
    vfs[bold.fileName] = bold.base64;
  }

  return {
    vfs,
    faces: {
      normal: regular.fileName,
      bold: boldFile,
      italics: regular.fileName,
      bolditalics: boldFile,
    },
  };
}

function registerFonts(pdfMake: PdfMakeFonts, bundle: FontBundle) {
  if (typeof pdfMake.addVirtualFileSystem === "function") {
    pdfMake.addVirtualFileSystem(bundle.vfs);
  } else {
    pdfMake.vfs = {
      ...(pdfMake.vfs ?? {}),
      ...bundle.vfs,
    };
  }

  if (typeof pdfMake.addFonts === "function") {
    pdfMake.addFonts(bundle.fonts);
  } else {
    pdfMake.fonts = {
      ...(pdfMake.fonts ?? {}),
      ...bundle.fonts,
    };
  }
}

async function loadFontBundle(): Promise<FontBundle> {
  const [latinVfs, cjk] = await Promise.all([
    loadLatinFonts(),
    loadCjkFonts(),
  ]);

  return {
    vfs: {
      ...latinVfs,
      ...cjk.vfs,
    },
    fonts: {
      [SCREENPLAY_FONT_FAMILY]: {
        normal: LATIN_FONT_FILES.normal,
        bold: LATIN_FONT_FILES.bold,
        italics: LATIN_FONT_FILES.italics,
        bolditalics: LATIN_FONT_FILES.bolditalics,
      },
      [CJK_FONT_FAMILY]: cjk.faces,
    },
  };
}

/**
 * Embeds Courier Prime (Latin) + Noto Sans SC (CJK) into pdfmake.
 * Local public/fonts preferred; CDN fallback when missing.
 * Re-registers on every call so HMR / re-imports still see both faces.
 */
export async function ensureScreenplayFonts(
  pdfMake: PdfMakeFonts,
): Promise<void> {
  if (!fontsBundle) {
    fontsBundle = loadFontBundle().catch((error) => {
      fontsBundle = null;
      throw error;
    });
  }

  registerFonts(pdfMake, await fontsBundle);
}
