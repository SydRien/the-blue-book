import { truncateText } from "@/lib/companion/context/projectContext";
import type { JonFocusBlock } from "@/lib/companion/context/types";
import type { BlueBookDocument, DocumentBlock } from "@/types/document";

const SCENE_CONTENT_MAX = 80;
const BLOCK_CONTENT_MAX = 120;
const FOCUS_CONTENT_MAX = 400;
const NEARBY_BLOCK_LIMIT = 12;
const DOCUMENT_SECTION_SOFT_CAP = 2500;

function formatBlockLine(block: DocumentBlock, contentMax: number): string {
  return `- [${block.type}] ${truncateText(block.content || "", contentMax)}`;
}

function pickNearbyBlocks(
  blocks: DocumentBlock[],
  focusId: string | undefined,
  limit: number,
): DocumentBlock[] {
  const nonHeading = blocks.filter((block) => block.type !== "scene_heading");
  if (nonHeading.length === 0) {
    return [];
  }
  if (!focusId) {
    return nonHeading.slice(0, limit);
  }
  const focusIndex = blocks.findIndex((block) => block.id === focusId);
  if (focusIndex < 0) {
    return nonHeading.slice(0, limit);
  }

  const nearby: DocumentBlock[] = [];
  // Walk outward from focus within full block list, collecting non-headings.
  let left = focusIndex;
  let right = focusIndex;
  const seen = new Set<string>();

  while (nearby.length < limit && (left >= 0 || right < blocks.length)) {
    for (const index of [left, right]) {
      if (index < 0 || index >= blocks.length) {
        continue;
      }
      const block = blocks[index]!;
      if (block.type === "scene_heading" || seen.has(block.id)) {
        continue;
      }
      seen.add(block.id);
      nearby.push(block);
      if (nearby.length >= limit) {
        break;
      }
    }
    left -= 1;
    right += 1;
  }

  return nearby;
}

export function buildFocusBlockSection(
  activeBlock: JonFocusBlock | null | undefined,
): string | null {
  if (!activeBlock?.id) {
    return null;
  }
  return [
    "Current focus (what Jenny is looking at):",
    `- [${activeBlock.type}] ${truncateText(activeBlock.content || "", FOCUS_CONTENT_MAX)}`,
  ].join("\n");
}

export function buildDocumentContextSection(
  document: BlueBookDocument,
  activeBlock?: JonFocusBlock | null,
): string {
  const title = truncateText(document.title || "Untitled", 80);
  const lines: string[] = [`Document: ${title}`];

  const scenes = document.blocks.filter(
    (block) => block.type === "scene_heading",
  );
  if (scenes.length > 0) {
    lines.push("Scenes:");
    for (const scene of scenes) {
      lines.push(formatBlockLine(scene, SCENE_CONTENT_MAX));
    }
  }

  const nearby = pickNearbyBlocks(
    document.blocks,
    activeBlock?.id,
    NEARBY_BLOCK_LIMIT,
  );
  if (nearby.length > 0) {
    lines.push("Nearby beats:");
    for (const block of nearby) {
      lines.push(formatBlockLine(block, BLOCK_CONTENT_MAX));
    }
  }

  let text = lines.join("\n");
  if (text.length > DOCUMENT_SECTION_SOFT_CAP) {
    text = `${text.slice(0, DOCUMENT_SECTION_SOFT_CAP - 1)}…`;
  }
  return text;
}
