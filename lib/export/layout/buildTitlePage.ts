import {
  containsCjk,
  resolveFont,
  resolveFontRuns,
} from "@/lib/export/fonts/fontResolver";
import type {
  PageProfile,
  TitlePageInfo,
  TitlePageLayout,
  TitlePageLine,
} from "@/lib/export/types";

function centeredLine(
  text: string,
  yPt: number,
  profile: PageProfile,
  fontSizePt: number,
): TitlePageLine {
  const language = containsCjk(text) ? "zh" : "en";
  const runs = resolveFontRuns(text, language);

  return {
    text,
    // Full page width + center align — pdfmake centers within this band.
    xPt: 0,
    yPt,
    widthPt: profile.pageWidthPt,
    align: "center",
    fontSizePt,
    fontFamily: runs[0]?.fontFamily ?? resolveFont(text, language),
    runs,
  };
}

/**
 * Builds a professional screenplay title-page layout section.
 * All lines are horizontally centered on the page.
 */
export function buildTitlePageLayout(
  info: TitlePageInfo,
  profile: PageProfile,
): TitlePageLayout {
  const title = info.title.trim() || "Untitled";
  const author = info.author.trim();
  const date = info.date?.trim();
  const step = profile.lineHeightPt;

  const lines: TitlePageLine[] = [];
  let y = profile.pageHeightPt * 0.38;

  lines.push(centeredLine(title, y, profile, profile.fontSizePt));
  y += step * 4;

  if (author) {
    lines.push(centeredLine("Written by", y, profile, profile.fontSizePt));
    y += step * 2;
    lines.push(centeredLine(author, y, profile, profile.fontSizePt));
    y += step * 4;
  }

  if (date) {
    lines.push(centeredLine(date, y, profile, profile.fontSizePt));
  }

  return {
    info: {
      title,
      author,
      ...(date ? { date } : {}),
    },
    pageWidthPt: profile.pageWidthPt,
    pageHeightPt: profile.pageHeightPt,
    lines,
  };
}
