import type { DocumentBlock } from "@/types/document";
import type { PageEstimate } from "@/lib/statistics/types";

/**
 * US Letter screenplay assumptions (aligned with export layout):
 * - Action / scene: ~60 chars per line (6" × 10 cpi)
 * - Dialogue: ~40 chars per line (4" × 10 cpi)
 * - CJK roughly 2× Latin width → treat as 2 units per char
 * - ~55 lines of content per page (industry rule of thumb)
 * - 1 page ≈ 1 minute
 */
const ACTION_CHARS_PER_LINE = 60;
const DIALOGUE_CHARS_PER_LINE = 40;
const LINES_PER_PAGE = 55;
const CJK_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;

function visualUnits(text: string): number {
  let units = 0;
  for (const char of text) {
    units += CJK_PATTERN.test(char) ? 2 : 1;
  }
  return units;
}

function wrappedLines(text: string, charsPerLine: number): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 1;
  }
  const paragraphs = trimmed.split(/\r?\n/);
  let lines = 0;
  for (const paragraph of paragraphs) {
    const units = visualUnits(paragraph);
    lines += Math.max(1, Math.ceil(units / charsPerLine));
  }
  return lines;
}

/**
 * Estimates screenplay pages from block structure + wrap assumptions.
 * Does not parse PDF or LayoutDocument.
 */
export function estimateScreenplayPages(blocks: DocumentBlock[]): PageEstimate {
  let estimatedLines = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]!;

    switch (block.type) {
      case "scene_heading":
        // Cue + blank line after
        estimatedLines += 1 + 1;
        break;
      case "action":
        estimatedLines += wrappedLines(block.content, ACTION_CHARS_PER_LINE) + 1;
        break;
      case "character":
        estimatedLines += 1;
        break;
      case "dialogue":
        estimatedLines += wrappedLines(block.content, DIALOGUE_CHARS_PER_LINE);
        // Blank after dialogue unless another dialogue follows same beat
        if (blocks[i + 1]?.type !== "dialogue") {
          estimatedLines += 1;
        }
        break;
    }
  }

  const estimatedPages = Math.max(1, Math.ceil(estimatedLines / LINES_PER_PAGE));

  return {
    estimatedPages,
    estimatedMinutes: estimatedPages,
    estimatedLines,
  };
}
