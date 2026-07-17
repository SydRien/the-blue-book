import {
  measureTextUnits,
  resolveFont,
  resolveFontRuns,
} from "@/lib/export/fonts/fontResolver";
import type {
  ExportNode,
  ExportRole,
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

type RoleGeometry = {
  xPt: number;
  widthPt: number;
  align: "left" | "center";
  maxUnits: number;
  spaceBeforePt: number;
  spaceAfterPt: number;
  italic?: boolean;
  centerOverBand?: boolean;
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

function bodyBand(profile: PageProfile) {
  const leftIn = profile.bodyLeftIn ?? profile.marginLeftPt / PT_PER_IN;
  const widthIn = profile.bodyWidthIn ?? profile.actionWidthIn;
  return {
    xPt: leftIn * PT_PER_IN,
    widthPt: widthIn * PT_PER_IN,
    widthIn,
  };
}

function roleGeometry(role: ExportRole, profile: PageProfile): RoleGeometry {
  const dialogueX = profile.dialogueLeftIn * PT_PER_IN;
  const dialogueWidth = profile.dialogueWidthIn * PT_PER_IN;
  const maxUnitsForWidth = (widthIn: number) =>
    Math.floor(widthIn * profile.charsPerInch);
  const body = bodyBand(profile);

  switch (role) {
    case "scene_heading":
    case "scene":
      return {
        xPt: profile.marginLeftPt,
        widthPt: profile.actionWidthIn * PT_PER_IN,
        align: "left",
        maxUnits: maxUnitsForWidth(profile.actionWidthIn),
        spaceBeforePt: profile.spaceBeforeScenePt,
        spaceAfterPt: profile.spaceAfterScenePt,
      };
    case "action":
    case "narration":
      return {
        xPt: body.xPt,
        widthPt: body.widthPt,
        align: "left",
        maxUnits: maxUnitsForWidth(body.widthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterActionPt,
      };
    case "stage_direction":
      return {
        xPt: body.xPt,
        widthPt: body.widthPt,
        align: "left",
        maxUnits: maxUnitsForWidth(body.widthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterActionPt,
        italic: true,
      };
    case "character":
      return {
        xPt: dialogueX,
        widthPt: dialogueWidth,
        align: "left",
        maxUnits: maxUnitsForWidth(profile.dialogueWidthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterCharacterPt,
        centerOverBand: true,
      };
    case "dialogue":
      return {
        xPt: dialogueX,
        widthPt: dialogueWidth,
        align: profile.dialogueAlign,
        maxUnits: maxUnitsForWidth(profile.dialogueWidthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterDialoguePt,
        centerOverBand: profile.dialogueAlign === "center",
      };
    // Reserved interactive roles — sensible defaults until schema emits them.
    case "choice":
    case "trigger":
    case "interaction":
    case "system_note":
      return {
        xPt: body.xPt,
        widthPt: body.widthPt,
        align: "left",
        maxUnits: maxUnitsForWidth(body.widthIn),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterActionPt,
      };
  }
}

/**
 * Center text over the dialogue column by measured width.
 * pdfmake ignores alignment with absolutePosition.
 */
function centeredBandBox(
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
  const wrapped = node.text
    .split(/\r?\n/)
    .flatMap((paragraph) => wrapText(paragraph, geometry.maxUnits));
  const lines: LayoutLine[] = [];

  wrapped.forEach((text, index) => {
    const runs = resolveFontRuns(text, node.language);
    const box = geometry.centerOverBand
      ? centeredBandBox(text, profile)
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
      ...(geometry.italic ? { italic: true } : {}),
    });
  });

  if (geometry.spaceAfterPt > 0) {
    lines.push({
      role: node.role,
      text: "",
      xPt: geometry.xPt,
      widthPt: geometry.widthPt,
      align: geometry.align,
      fontSizePt: profile.fontSizePt,
      heightPt: geometry.spaceAfterPt,
      spaceBeforePt: 0,
      fontFamily: profile.fontFamily,
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
    marginLeftPt: profile.marginLeftPt,
    marginRightPt: profile.marginRightPt,
    marginTopPt: profile.marginTopPt,
    marginBottomPt: profile.marginBottomPt,
    pageNumberTopPt: profile.pageNumberTopPt,
    pageNumberWidthPt: profile.pageNumberWidthPt,
    pages,
  };
}
