import type {
  ExportNode,
  LayoutDocument,
  LayoutLine,
  LayoutPage,
  PageProfile,
} from "@/lib/export/types";

const PT_PER_IN = 72;
const CJK_CHAR_PATTERN = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

type LineGroup = {
  role: ExportNode["role"];
  lines: LayoutLine[];
  keepWithNext: boolean;
};

function usesCjkFont(node: ExportNode): boolean {
  return node.language === "zh" || CJK_CHAR_PATTERN.test(node.text);
}

function measureUnits(text: string): number {
  let units = 0;
  for (const char of text) {
    units += CJK_CHAR_PATTERN.test(char) ? 2 : 1;
  }
  return units;
}

/**
 * Wrap by visual units: Latin ≈ 1 unit, CJK ≈ 2 (fullwidth).
 */
function wrapText(text: string, maxUnits: number): string[] {
  if (maxUnits < 1) {
    return [text];
  }

  // Prefer wrapping on spaces for Latin; fall back to per-char for CJK runs.
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
    const tokenUnits = measureUnits(token);

    if (tokenUnits > maxUnits) {
      pushCurrent();
      let chunk = "";
      let chunkUnits = 0;
      for (const char of token) {
        const charUnits = measureUnits(char);
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

function roleGeometry(
  role: ExportNode["role"],
  profile: PageProfile,
  cjk: boolean,
) {
  const charsPerInch = cjk ? profile.cjkCharsPerInch : profile.charsPerInch;
  const dialogueX = profile.dialogueLeftIn * PT_PER_IN;
  const dialogueWidth = profile.dialogueWidthIn * PT_PER_IN;
  const characterX = profile.characterLeftIn * PT_PER_IN;
  // Character column spans from 3.7" to dialogue right edge so cue sits over dialogue.
  const characterWidth = dialogueX + dialogueWidth - characterX;

  switch (role) {
    case "scene_heading":
    case "action":
      return {
        xPt: profile.marginLeftPt,
        widthPt: profile.actionWidthIn * PT_PER_IN,
        align: "left" as const,
        maxUnits: Math.floor(profile.actionWidthIn * charsPerInch),
        spaceBeforePt:
          role === "scene_heading" ? profile.spaceBeforeScenePt : 0,
        spaceAfterPt:
          role === "scene_heading"
            ? profile.spaceAfterScenePt
            : profile.lineHeightPt,
      };
    case "character":
      return {
        xPt: characterX,
        widthPt: Math.max(characterWidth, 1.5 * PT_PER_IN),
        align: "left" as const,
        maxUnits: Math.floor(
          Math.max(profile.dialogueWidthIn - 1.2, 2) * charsPerInch,
        ),
        spaceBeforePt: profile.spaceBeforeCharacterPt,
        spaceAfterPt: 0,
      };
    case "dialogue":
      return {
        xPt: dialogueX,
        widthPt: dialogueWidth,
        align: "left" as const,
        maxUnits: Math.floor(profile.dialogueWidthIn * charsPerInch),
        spaceBeforePt: 0,
        spaceAfterPt: profile.spaceAfterDialoguePt,
      };
  }
}

function nodeToGroup(node: ExportNode, profile: PageProfile): LineGroup {
  const cjk = usesCjkFont(node);
  const fontFamily = cjk ? profile.cjkFontFamily : profile.fontFamily;
  const geometry = roleGeometry(node.role, profile, cjk);
  const wrapped = wrapText(node.text, geometry.maxUnits);
  const lines: LayoutLine[] = [];

  wrapped.forEach((text, index) => {
    lines.push({
      role: node.role,
      text,
      xPt: geometry.xPt,
      widthPt: geometry.widthPt,
      align: geometry.align,
      fontSizePt: node.fontSize ?? profile.fontSizePt,
      heightPt: profile.lineHeightPt,
      spaceBeforePt: index === 0 ? geometry.spaceBeforePt : 0,
      fontFamily,
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
      fontFamily,
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
    marginTopPt: profile.marginTopPt,
    marginBottomPt: profile.marginBottomPt,
    pages,
  };
}
