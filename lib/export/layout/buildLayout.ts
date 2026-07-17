import {
  measureTextUnits,
  resolveFont,
  resolveFontRuns,
} from "@/lib/export/fonts/fontResolver";
import type {
  ExportNode,
  LayoutDocument,
  LayoutLine,
  LayoutPage,
  PageProfile,
} from "@/lib/export/types";

const PT_PER_IN = 72;

type LineGroup = {
  role: ExportNode["role"];
  lines: LayoutLine[];
  keepWithNext: boolean;
};

/**
 * Wrap by visual units: Latin ≈ 1 unit, CJK ≈ 2 (fullwidth).
 * maxUnits is always widthIn × charsPerInch (10-pitch); CJK weight is in measureTextUnits.
 */
function wrapText(text: string, maxUnits: number): string[] {
  if (maxUnits < 1) {
    return [text];
  }

  const tokens = text.split(/(\s+)/).filter((token) => token.length > 0);
  const lines: string[] = [];
  let current = "";
  let currentUnits = 0;

  function pushCurrent() {
    if (current) {
      lines.push(current.trimEnd());
      current = "";
      currentUnits = 0;
    }
  }

  for (const token of tokens) {
    const tokenUnits = measureTextUnits(token);

    if (tokenUnits > maxUnits) {
      pushCurrent();
      let chunk = "";
      let chunkUnits = 0;
      for (const char of token) {
        const charUnits = measureTextUnits(char);
        if (chunkUnits + charUnits > maxUnits && chunk) {
          lines.push(chunk);
          chunk = char;
          chunkUnits = charUnits;
        } else {
          chunk += char;
          chunkUnits += charUnits;
        }
      }
      if (chunk) {
        current = chunk;
        currentUnits = chunkUnits;
      }
      continue;
    }

    if (currentUnits + tokenUnits > maxUnits && current) {
      pushCurrent();
    }

    current += token;
    currentUnits += tokenUnits;
  }

  pushCurrent();
  return lines.length > 0 ? lines : [""];
}

function roleGeometry(role: ExportNode["role"], profile: PageProfile) {
  const dialogueX = profile.dialogueLeftIn * PT_PER_IN;
  const dialogueWidth = profile.dialogueWidthIn * PT_PER_IN;
  // Pitch base is Courier 10 cpi; CJK fullwidth counted as 2 units in wrap.
  const maxUnitsForWidth = (widthIn: number) =>
    Math.floor(widthIn * profile.charsPerInch);

  switch (role) {
    case "scene_heading":
    case "action":
      return {
        xPt: profile.marginLeftPt,
        widthPt: profile.actionWidthIn * PT_PER_IN,
        align: "left" as const,
        maxUnits: maxUnitsForWidth(profile.actionWidthIn),
        spaceBeforePt:
          role === "scene_heading" ? profile.spaceBeforeScenePt : 0,
        spaceAfterPt:
          role === "scene_heading"
            ? profile.spaceAfterScenePt
            : profile.spaceAfterActionPt,
      };
    case "character":
      // Column band only — per-line X is computed from cue width (see below).
      return {
        xPt: dialogueX,
        widthPt: dialogueWidth,
        align: "left" as const,
        maxUnits: maxUnitsForWidth(profile.dialogueWidthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterCharacterPt,
      };
    case "dialogue":
      return {
        xPt: dialogueX,
        widthPt: dialogueWidth,
        align: "left" as const,
        maxUnits: maxUnitsForWidth(profile.dialogueWidthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterDialoguePt,
      };
  }
}

/**
 * Center a character cue over the dialogue column by placing its left edge
 * from measured text width. pdfmake ignores alignment with absolutePosition,
 * so we cannot rely on align:"center".
 */
function centeredCharacterBox(
  text: string,
  profile: PageProfile,
): { xPt: number; widthPt: number } {
  const dialogueLeftPt = profile.dialogueLeftIn * PT_PER_IN;
  const dialogueWidthPt = profile.dialogueWidthIn * PT_PER_IN;
  const centerPt = dialogueLeftPt + dialogueWidthPt / 2;
  const widthPt = Math.max(
    (measureTextUnits(text) / profile.charsPerInch) * PT_PER_IN,
    PT_PER_IN * 0.5,
  );
  return {
    xPt: centerPt - widthPt / 2,
    widthPt,
  };
}

function nodeToGroup(node: ExportNode, profile: PageProfile): LineGroup {
  const geometry = roleGeometry(node.role, profile);
  // Honor authored line breaks, then wrap each paragraph to column width.
  const wrapped = node.text
    .split(/\r?\n/)
    .flatMap((paragraph) => wrapText(paragraph, geometry.maxUnits));
  const lines: LayoutLine[] = [];

  wrapped.forEach((text, index) => {
    const runs = resolveFontRuns(text, node.language);
    const box =
      node.role === "character"
        ? centeredCharacterBox(text, profile)
        : { xPt: geometry.xPt, widthPt: geometry.widthPt };

    lines.push({
      role: node.role,
      text,
      xPt: box.xPt,
      widthPt: box.widthPt,
      align: geometry.align,
      fontSizePt: node.fontSize ?? profile.fontSizePt,
      heightPt: profile.lineHeightPt,
      spaceBeforePt: index === 0 ? geometry.spaceBeforePt : 0,
      fontFamily: runs[0]?.fontFamily ?? resolveFont(text, node.language),
      runs,
    });
  });

  if (geometry.spaceAfterPt > 0) {
    const spacerFont = profile.fontFamily;
    lines.push({
      role: node.role,
      text: "",
      xPt: geometry.xPt,
      widthPt: geometry.widthPt,
      align: geometry.align,
      fontSizePt: profile.fontSizePt,
      heightPt: geometry.spaceAfterPt,
      spaceBeforePt: 0,
      fontFamily: spacerFont,
      runs: [],
    });
  }

  return {
    role: node.role,
    lines,
    keepWithNext: false,
  };
}

function groupHeight(group: LineGroup): number {
  return group.lines.reduce(
    (sum, line) => sum + line.spaceBeforePt + line.heightPt,
    0,
  );
}

/**
 * Builds a paginated LayoutDocument from ExportNodes + page profile.
 * Keeps character cues with following dialogue when possible.
 * Page numbers are header metadata — body Y always starts at marginTopPt.
 */
export function buildLayout(
  title: string,
  nodes: ExportNode[],
  profile: PageProfile,
): LayoutDocument {
  const contentHeight =
    profile.pageHeightPt - profile.marginTopPt - profile.marginBottomPt;

  const groups = nodes.map((node) => nodeToGroup(node, profile));

  for (let i = 0; i < groups.length - 1; i += 1) {
    if (groups[i].role === "character" && groups[i + 1].role === "dialogue") {
      groups[i].keepWithNext = true;
    }
  }

  const pages: LayoutPage[] = [];
  let currentLines: LayoutLine[] = [];
  let usedHeight = 0;
  let pageNumber = 1;

  function pushPage() {
    pages.push({ pageNumber, lines: currentLines });
    pageNumber += 1;
    currentLines = [];
    usedHeight = 0;
  }

  function appendGroup(group: LineGroup) {
    for (const line of group.lines) {
      currentLines.push(line);
      usedHeight += line.spaceBeforePt + line.heightPt;
    }
  }

  for (let i = 0; i < groups.length; i += 1) {
    const group = groups[i];
    let blockHeight = groupHeight(group);

    if (group.keepWithNext && i + 1 < groups.length) {
      blockHeight += groupHeight(groups[i + 1]);
    }

    if (usedHeight + blockHeight > contentHeight && currentLines.length > 0) {
      pushPage();
    }

    appendGroup(group);
  }

  if (currentLines.length > 0 || pages.length === 0) {
    pushPage();
  }

  return {
    title,
    mode: profile.mode,
    profileId: profile.id,
    pageSize: profile.pageSize,
    pageWidthPt: profile.pageWidthPt,
    pageHeightPt: profile.pageHeightPt,
    marginTopPt: profile.marginTopPt,
    marginBottomPt: profile.marginBottomPt,
    pageNumberTopPt: profile.pageNumberTopPt,
    pageNumberWidthPt: profile.pageNumberWidthPt,
    pages,
  };
}
